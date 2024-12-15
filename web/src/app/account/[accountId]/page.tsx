import { Header } from "@/components/header";
import { EmptyState } from "@/components/empty-state";

export default function AccountPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Header />
      <EmptyState hasAccounts={true} message="Select a chat to view files" />
    </div>
  );
}
