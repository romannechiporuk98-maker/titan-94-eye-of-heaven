
def check_scam(tx):
    text = str(tx).lower()
    if "honeypot" in text:
        return {"risk": 90}
    if "no liquidity" in text:
        return {"risk": 80}
    return {"risk": 10}
