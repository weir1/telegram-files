import { MessageSquare, UserPlus } from "lucide-react";
import { AccountList } from "./account-list";
import { type TelegramAccount } from "@/lib/types";
import TelegramIcon from "@/components/telegram-icon";
import { AccountDialog } from "@/components/account-dialog";
import React from "react";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/ui/border-beam";
import ProxysDialog from "@/components/proxys-dialog";

interface EmptyStateProps {
  hasAccounts: boolean;
  accounts?: TelegramAccount[];
  message?: string;
  onSelectAccount?: (accountId: string) => void;
}

export function EmptyState({
  hasAccounts,
  accounts = [],
  message,
  onSelectAccount,
}: EmptyStateProps) {
  if (message) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <MessageSquare className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 text-2xl font-semibold">{message}</h2>
        <p className="text-muted-foreground">
          Choose a chat from the dropdown menu above to view and manage its
          files.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8 flex flex-col items-center text-center">
        {hasAccounts ? (
          <>
            <TelegramIcon className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-2xl font-semibold">Select an Account</h2>
            <p className="mb-4 max-w-md text-muted-foreground">
              Choose a Telegram account to view and manage your files. You can
              add more accounts using the button below.
            </p>
          </>
        ) : (
          <>
            <TelegramIcon className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-2xl font-semibold">No Accounts Found</h2>
            <p className="mb-4 max-w-md text-muted-foreground">
              Add a Telegram account to start managing your files. You can add
              multiple accounts and switch between them.
            </p>
          </>
        )}
        <div className="flex items-center justify-center space-x-4">
          <AccountDialog isAdd={true}>
            <div className="relative rounded-md">
              <BorderBeam size={60} duration={12} delay={9} />
              <Button variant="outline">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </div>
          </AccountDialog>

          <ProxysDialog />
        </div>
      </div>

      {hasAccounts && accounts.length > 0 && onSelectAccount && (
        <AccountList accounts={accounts} onSelectAccount={onSelectAccount} />
      )}
    </div>
  );
}
