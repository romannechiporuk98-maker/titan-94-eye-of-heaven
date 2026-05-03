import React, { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { LangProvider } from "@/lib/ui-prefs";
import { initTelegram } from "@/lib/telegram";
import { ErrorBoundary } from "@/components/error-boundary";
import { ModuleNav } from "@/components/module-nav";
import NotFound from "@/pages/not-found";
import CommandCenter from "@/pages/command-center";
import Home from "@/pages/home";
import Jobs from "@/pages/jobs";
import JobDetail from "@/pages/job-detail";
import CreateJob from "@/pages/create-job";
import EarnPage from "@/pages/earn";
import StatusPage from "@/pages/status";
import ThreatsPage from "@/pages/threats";
import AnalyzePage from "@/pages/analyze";
import ContractsPage from "@/pages/contracts";
import ImmunePage from "@/pages/immune";
import EvolutionPage from "@/pages/evolution";
import AnalyticsPage from "@/pages/analytics";
import NexusPage from "@/pages/nexus";
import CreatorPage from "@/pages/creator";
import DeveloperPage from "@/pages/developer";
import BuilderPage from "@/pages/builder";
import AutoTradePage from "@/pages/autotrade";
import SettingsPage from "@/pages/settings";
import Protocol94Page from "@/pages/protocol-94";
import VaultPage from "@/pages/vault";
import AccessPage from "@/pages/access";
import AboutPage from "@/pages/about";
import PrivacyPage from "@/pages/privacy";
import TonNetworkPage from "@/pages/ton-network";
import GrantPage from "@/pages/grant";
import ChartsPage from "@/pages/charts";
import TonWalletPage from "@/pages/ton-wallet";
import { Splash } from "@/components/splash";
import { DevModeOverlay } from "@/components/dev-mode";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function Wrap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <ErrorBoundary label={label}>
      {children}
      <ModuleNav />
    </ErrorBoundary>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/"            component={() => <Wrap label="COMMAND CENTER"><CommandCenter /></Wrap>} />
        <Route path="/contracts"   component={() => <Wrap label="CONTRACTS"><ContractsPage /></Wrap>} />
        <Route path="/immune"      component={() => <Wrap label="IMMUNE SYSTEM"><ImmunePage /></Wrap>} />
        <Route path="/evolution"   component={() => <Wrap label="EVOLUTION"><EvolutionPage /></Wrap>} />
        <Route path="/analytics"   component={() => <Wrap label="ANALYTICS"><AnalyticsPage /></Wrap>} />
        <Route path="/nexus"       component={() => <Wrap label="NEURAL HUB"><NexusPage /></Wrap>} />
        <Route path="/status"      component={() => <Wrap label="STATUS"><StatusPage /></Wrap>} />
        <Route path="/threats"     component={() => <Wrap label="THREATS"><ThreatsPage /></Wrap>} />
        <Route path="/analyze"     component={() => <Wrap label="ANALYZE"><AnalyzePage /></Wrap>} />
        <Route path="/earn"        component={() => <Wrap label="EARNINGS"><EarnPage /></Wrap>} />
        <Route path="/developer"   component={() => <Wrap label="DEVELOPER"><DeveloperPage /></Wrap>} />
        <Route path="/creator"     component={() => <ErrorBoundary label="CREATOR"><CreatorPage /></ErrorBoundary>} />
        <Route path="/builder"     component={() => <Wrap label="AGENT FORGE"><BuilderPage /></Wrap>} />
        <Route path="/autotrade"   component={() => <Wrap label="AUTOTRADE"><AutoTradePage /></Wrap>} />
        <Route path="/settings"    component={() => <ErrorBoundary label="SETTINGS"><SettingsPage /></ErrorBoundary>} />
        <Route path="/protocol-94" component={() => <ErrorBoundary label="PROTOCOL-94"><Protocol94Page /></ErrorBoundary>} />
        <Route path="/vault"       component={() => <Wrap label="VAULT"><VaultPage /></Wrap>} />
        <Route path="/access"      component={() => <Wrap label="ACCESS"><AccessPage /></Wrap>} />
        <Route path="/about"       component={() => <Wrap label="ABOUT"><AboutPage /></Wrap>} />
        <Route path="/privacy"     component={() => <Wrap label="PRIVACY"><PrivacyPage /></Wrap>} />
        <Route path="/ton-network" component={() => <Wrap label="TON NETWORK"><TonNetworkPage /></Wrap>} />
        <Route path="/grant"       component={() => <Wrap label="TON GRANT"><GrantPage /></Wrap>} />
        <Route path="/charts"     component={() => <Wrap label="CHARTS"><ChartsPage /></Wrap>} />
        <Route path="/ton-wallet" component={() => <Wrap label="TON WALLET"><TonWalletPage /></Wrap>} />
        <Route path="/enact"       component={() => <Wrap label="ENACT"><Home /></Wrap>} />
        <Route path="/jobs"        component={() => <Wrap label="JOBS"><Jobs /></Wrap>} />
        <Route path="/jobs/:address" component={() => <Wrap label="JOB DETAIL"><JobDetail /></Wrap>} />
        <Route path="/create"      component={() => <Wrap label="CREATE JOB"><CreateJob /></Wrap>} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  useEffect(() => {
    const u = initTelegram();
    // Auto-register on backend so balance/referrals immediately work
    const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
    fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegram_id: u.id,
        username: u.username || u.name,
        ref: u.startParam,
      }),
    }).catch(() => {});
  }, []);

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  // Manifest must be a fully-qualified absolute URL — TON Connect rejects relative paths
  const manifestUrl = typeof window !== "undefined"
    ? `${window.location.origin}${base}/tonconnect-manifest.json`
    : "/tonconnect-manifest.json";

  return (
    <LangProvider>
      <TonConnectUIProvider manifestUrl={manifestUrl}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={base}>
              <Router />
            </WouterRouter>
            <Splash />
            <Toaster />
            <DevModeOverlay />
          </TooltipProvider>
        </QueryClientProvider>
      </TonConnectUIProvider>
    </LangProvider>
  );
}
