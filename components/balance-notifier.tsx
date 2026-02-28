"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function BalanceNotifier() {
  useEffect(() => {
    const handler = (event: Event) => {
      const { amount } = (event as CustomEvent).detail;
      toast.success(`Your balance increased by ${amount} points!`, {
        duration: 4000,
      });
    };
    window.addEventListener("balance-increased", handler);
    return () => window.removeEventListener("balance-increased", handler);
  }, []);

  return null;
}
