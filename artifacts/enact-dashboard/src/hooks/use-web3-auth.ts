/**
 * TITAN-94 — useWeb3Auth
 *
 * Autonomous Web3 registration hook. When a TON wallet connects via
 * TonConnect, this hook automatically registers/authenticates the user
 * in the TITAN-94 backend without requiring Telegram.
 *
 * Usage:
 *   const { isAuthenticated, address, subscriber, isLoading } = useWeb3Auth();
 */
import { useTonAddress } from "@tonconnect/ui-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");

export type Web3Subscriber = {
  id: string;
  plan: "free" | "pro" | "elite";
  tonAddress: string | null;
  username: string | null;
  createdAt: string;
};

export type Web3AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  isNew: boolean;
  address: string | null;
  subscriber: Web3Subscriber | null;
  error: string | null;
};

export function useWeb3Auth(): Web3AuthState {
  const address = useTonAddress();
  const { toast } = useToast();

  const [state, setState] = useState<Web3AuthState>({
    isAuthenticated: false,
    isLoading:       false,
    isNew:           false,
    address:         null,
    subscriber:      null,
    error:           null,
  });

  // Track last connected address to avoid duplicate calls
  const lastConnectedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!address) {
      // Wallet disconnected
      if (lastConnectedRef.current) {
        lastConnectedRef.current = null;
        setState({
          isAuthenticated: false,
          isLoading:       false,
          isNew:           false,
          address:         null,
          subscriber:      null,
          error:           null,
        });
      }
      return;
    }

    // Skip if same wallet already authenticated
    if (address === lastConnectedRef.current) return;
    lastConnectedRef.current = address;

    setState(prev => ({ ...prev, isLoading: true, error: null, address }));

    fetch(`${BASE}/api/auth/web3-connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: address }),
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { ok: boolean; isNew: boolean; subscriber: Web3Subscriber }) => {
        setState({
          isAuthenticated: true,
          isLoading:       false,
          isNew:           data.isNew,
          address,
          subscriber:      data.subscriber,
          error:           null,
        });

        const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
        if (data.isNew) {
          toast({
            title:       "✅ Гаманець підключено!",
            description: `Новий акаунт: ${short}`,
          });
        } else {
          toast({
            title:       `◈ ${short}`,
            description: `Тариф: ${data.subscriber.plan.toUpperCase()}`,
          });
        }
      })
      .catch(err => {
        const message = err instanceof Error ? err.message : "Unknown error";
        setState(prev => ({
          ...prev,
          isLoading: false,
          error:     message,
        }));
        console.error("[useWeb3Auth] connect error:", message);
      });
  }, [address, toast]);

  return state;
}
