import React from "react";
import { TelegramChatProvider } from "@/hooks/use-telegram-chat";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TelegramChatProvider>{children}</TelegramChatProvider>;
}
