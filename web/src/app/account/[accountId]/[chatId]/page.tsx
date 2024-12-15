import { Header } from "@/components/header";
import { FileList } from "@/components/file-list";

export default async function ChatFilesPage({
  params,
}: {
  params: Promise<{ accountId: string; chatId: string }>;
}) {
  const { accountId, chatId } = await params;

  return (
    <div className="container mx-auto px-4 py-6">
      <Header />
      <FileList accountId={accountId} chatId={chatId} />
    </div>
  );
}
