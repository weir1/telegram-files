"use client";
import { Header } from "@/components/header";
import { EmptyState } from "@/components/empty-state";
import { useSearchParams } from "next/navigation";
import Files from "@/components/files";

export default function AccountPage() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get("id");
  const chatId = searchParams.get("chatId");

  return (
    <div className="container mx-auto px-4 py-6">
      <Header />
      {accountId && chatId ? (
        <Files accountId={accountId} chatId={chatId} />
      ) : (
        <EmptyState hasAccounts={true} message="Select a chat to view files" />
      )}
    </div>
  );
}
