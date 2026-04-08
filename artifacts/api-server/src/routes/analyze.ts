import { Router, type IRouter } from "express";
import https from "https";
import { activityLog, knowledgeBase } from "../services/heartbeat";

const router: IRouter = Router();
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
let analyzeCount = 0;

async function gemini(prompt: string): Promise<string | null> {
  if (!GEMINI_KEY) return null;
  return new Promise((resolve) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 600, temperature: 0.15 },
    });
    const req = https.request({
      hostname: "generativelanguage.googleapis.com",
      path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, (res) => {
      let d = ""; res.on("data", c => d += c);
      res.on("end", () => {
        try { resolve(JSON.parse(d)?.candidates?.[0]?.content?.parts?.[0]?.text || null); }
        catch { resolve(null); }
      });
    });
    req.on("error", () => resolve(null));
    req.setTimeout(15000, () => { req.destroy(); resolve(null); });
    req.write(body); req.end();
  });
}

function keywordScan(code: string) {
  const lower = code.toLowerCase();
  const vulns: any[] = [];
  if (lower.includes("send(") && !lower.includes("require(")) vulns.push({ type: "Unchecked Send", severity: "high", impact: "Funds loss" });
  if (!lower.includes("require(sender()") && !lower.includes("require(msg.sender")) vulns.push({ type: "Missing Auth", severity: "high", impact: "Unauthorized access" });
  if (lower.includes("self.balance") && lower.includes("send(")) vulns.push({ type: "Balance Drain", severity: "medium", impact: "Partial fund loss" });
  if (lower.includes("while") || lower.includes("loop")) vulns.push({ type: "Potential Gas Loop", severity: "low", impact: "DOS risk" });
  const severity = vulns.some(v => v.severity === "high") ? "high" : vulns.length > 0 ? "medium" : "none";
  const score = Math.max(10, 95 - vulns.length * 18);
  return { severity, vulnerabilities: vulns, score, summary: `Keyword scan: ${vulns.length} potential issue(s) found`, recommendation: "Manual audit recommended", model: "keyword-v2" };
}

// POST /api/analyze
router.post("/analyze", async (req, res) => {
  const { address, code, source } = req.body;
  if (!address && !code) return res.status(400).json({ error: "address or code required" });

  analyzeCount++;
  const contractCode = code || `// Contract at ${address}\n// Source not provided — pattern analysis only`;

  let result: any;
  if (GEMINI_KEY) {
    const prompt = `You are TITAN-94, an expert TON blockchain security auditor.
Analyze this smart contract for vulnerabilities:
Address: ${address || "unknown"}
Code:
\`\`\`
${contractCode.slice(0, 4000)}
\`\`\`

Known vulnerability patterns from knowledge base:
${knowledgeBase.slice(0, 5).map(k => `- ${k.category}: ${k.pattern}`).join("\n")}

Return JSON only:
{
  "severity": "critical|high|medium|low|none",
  "score": 0-100,
  "vulnerabilities": [{"type":"...","severity":"...","description":"...","impact":"..."}],
  "summary": "2 sentences",
  "recommendation": "1 sentence fix",
  "honeypot_risk": "low|medium|high",
  "model": "gemini-2.0-flash"
}`;

    const raw = await gemini(prompt);
    if (raw) {
      try {
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        result = JSON.parse(cleaned);
      } catch { result = keywordScan(contractCode); }
    } else {
      result = keywordScan(contractCode);
    }
  } else {
    result = keywordScan(contractCode);
  }

  activityLog.unshift({
    id: activityLog.length + 200, type: "ANALYZE",
    title: `Contract analyzed: ${(address || "unknown").slice(0, 16)}...`,
    message: `Severity: ${result.severity} | Score: ${result.score}/100 | ${result.vulnerabilities?.length || 0} issues`,
    severity: result.severity === "none" ? "info" : result.severity,
    createdAt: new Date().toISOString(),
  });

  res.json({ address, ...result, analyzedAt: new Date().toISOString(), totalAnalyzed: analyzeCount });
});

// POST /api/analyze/honeypot
router.post("/analyze/honeypot", async (req, res) => {
  const { address, code } = req.body;
  if (!address) return res.status(400).json({ error: "address required" });

  const contractCode = code || "";
  let result: any;

  if (GEMINI_KEY) {
    const prompt = `You are TITAN-94 HoneyPot Detector for TON blockchain.
Analyze if this contract is a honeypot:
Address: ${address}
Code: ${contractCode.slice(0, 2000) || "(not provided — use address pattern analysis)"}

Check for: owner-only withdrawal, blacklist functions, transfer blocks, mint without limit, fake liquidity.

Return JSON only:
{
  "is_honeypot": true|false,
  "confidence": 0.0-1.0,
  "risk_level": "safe|low|medium|high|critical",
  "red_flags": ["flag1", "flag2"],
  "verdict": "1 sentence verdict",
  "safe_to_interact": true|false
}`;

    const raw = await gemini(prompt);
    if (raw) {
      try {
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        result = JSON.parse(cleaned);
      } catch {
        result = { is_honeypot: false, confidence: 0.5, risk_level: "medium", red_flags: ["Analysis failed"], verdict: "Could not determine — manual review needed", safe_to_interact: false };
      }
    } else {
      // Keyword honeypot detection
      const lower = contractCode.toLowerCase();
      const flags: string[] = [];
      if (lower.includes("blacklist")) flags.push("Blacklist function detected");
      if (lower.includes("only_owner") && lower.includes("withdraw")) flags.push("Owner-only withdrawal");
      if (lower.includes("mint") && !lower.includes("maxsupply")) flags.push("Unlimited mint risk");
      result = {
        is_honeypot: flags.length >= 2,
        confidence: flags.length >= 2 ? 0.78 : 0.35,
        risk_level: flags.length >= 2 ? "high" : flags.length === 1 ? "medium" : "low",
        red_flags: flags.length ? flags : ["No obvious flags — keyword scan only"],
        verdict: flags.length >= 2 ? "Likely honeypot — do not interact" : "No clear honeypot signals detected",
        safe_to_interact: flags.length < 2,
      };
    }
  } else {
    result = { is_honeypot: false, confidence: 0.4, risk_level: "low", red_flags: [], verdict: "Keyword-only scan — set GEMINI_API_KEY for deep analysis", safe_to_interact: true };
  }

  res.json({ address, ...result, checkedAt: new Date().toISOString() });
});

export default router;
