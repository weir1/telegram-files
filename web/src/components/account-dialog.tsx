"use client";

import { type ReactNode, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTelegramAccount } from "@/hooks/use-telegram-account";
import ProxysDialog from "@/components/proxys-dialog";
import AccountCreator from "@/components/account-creator";

export function AccountDialog({
  children,
  isAdd,
}: {
  children: ReactNode;
  isAdd?: boolean;
}) {
  const [proxyName, setProxyName] = useState<string | undefined>();
  const { account } = useTelegramAccount();
  const [newAccountId, setNewAccountId] = useState<string | undefined>();
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (isAdd) {
          setNewAccountId(undefined);
          setProxyName(undefined);
        }
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        aria-describedby={undefined}
        className="h-full w-full pb-16 md:h-auto md:min-h-40 md:min-w-[550px]"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Add Telegram Account
            {(account ?? newAccountId) && (
              <p className="rounded-md bg-gray-100 p-1 text-xs text-muted-foreground">
                {account ? account.id : newAccountId}
              </p>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="relative h-full w-full">
          <AccountCreator
            isAdd={isAdd}
            proxyName={proxyName}
            onCreated={setNewAccountId}
            onLoginSuccess={() => setOpen(false)}
          />
          <ProxysDialog
            telegramId={newAccountId}
            proxyName={proxyName}
            onProxyNameChange={setProxyName}
            enableSelect={true}
            className="absolute bottom-1 right-1 md:-bottom-14 md:-right-4"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
