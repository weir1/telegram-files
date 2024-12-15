"use client";

import { EmptyState } from "@/components/empty-state";
import { useTelegramAccount } from "@/hooks/use-telegram-account";

export default function Home() {
  const { getAccounts, handleAccountChange } = useTelegramAccount();
  const accounts = getAccounts();
  return (
    <EmptyState
      hasAccounts={(accounts ?? []).length > 0}
      accounts={accounts}
      onSelectAccount={handleAccountChange}
    />
  );
}
