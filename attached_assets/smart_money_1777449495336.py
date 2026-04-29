
import statistics

def analyze_wallet(wallet, txs):
    profits = []

    for tx in txs:
        value = 0
        if "in_msg" in tx and "value" in tx["in_msg"]:
            value -= int(tx["in_msg"]["value"])

        if "out_msgs" in tx:
            for out in tx["out_msgs"]:
                if "value" in out:
                    value += int(out["value"])

        profits.append(value)

    if len(profits) < 5:
        return None

    avg = statistics.mean(profits)
    winrate = len([p for p in profits if p > 0]) / len(profits) * 100

    if winrate > 60 and avg > 0:
        return {
            "wallet": wallet,
            "winrate": round(winrate,2),
            "avg_profit": avg
        }

    return None
