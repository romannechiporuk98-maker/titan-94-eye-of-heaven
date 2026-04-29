
def detect_new_token(tx):
    text = str(tx).lower()
    return "jetton" in text and "mint" in text
