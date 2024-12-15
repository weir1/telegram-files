import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import useSWRMutation from "swr/mutation";
import { POST } from "@/lib/api";
import { useDebounce } from "use-debounce";
import { useToast } from "@/hooks/use-toast";
import { AutoDownloadButton } from "@/components/auto-download-button";
import { useTelegramChat } from "@/hooks/use-telegram-chat";
import { useTelegramAccount } from "@/hooks/use-telegram-account";

export default function AutoDownloadDialog() {
  const { accountId } = useTelegramAccount();
  const { isLoading, chat, reload } = useTelegramChat();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { trigger: triggerAuto, isMutating: isAutoMutating } = useSWRMutation(
    !accountId || !chat
      ? undefined
      : `/file/auto-download?telegramId=${accountId}&chatId=${chat?.id}`,
    POST,
    {
      onSuccess: () => {
        toast({
          title: chat?.autoEnabled
            ? "Auto download disabled for this chat!"
            : "Auto download enabled for this chat!",
        });
        void reload();
        setTimeout(() => {
          setOpen(false);
        }, 1000);
      },
    },
  );

  const [debounceIsAutoMutating] = useDebounce(isAutoMutating, 500, {
    leading: true,
  });

  if (isLoading) {
    return <div className="h-8 w-32 animate-pulse bg-gray-200"></div>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        asChild
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        {chat && <AutoDownloadButton autoEnabled={chat.autoEnabled} />}
      </DialogTrigger>
      <DialogContent
        aria-describedby={undefined}
        onPointerDownOutside={() => setOpen(false)}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>
            {chat?.autoEnabled
              ? "Disable Auto Download"
              : "Enable auto download for this chat?"}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription></DialogDescription>
        {chat?.autoEnabled ? (
          <div className="space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start">
              <span className="mr-3 mt-1.5 h-3 w-2 flex-shrink-0 rounded-full bg-cyan-400"></span>
              <p className="text-sm leading-6 text-gray-700">
                This will disable auto download for this chat. You can always
                enable it later.
              </p>
            </div>
            <div className="flex items-start">
              <span className="mr-3 mt-1.5 h-3 w-2 flex-shrink-0 rounded-full bg-cyan-400"></span>
              <p className="text-sm leading-6 text-gray-700">
                Files that are being downloaded will be paused and you can
                enable automatic downloading again later.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start">
              <span className="mr-3 mt-1.5 h-3 w-2 flex-shrink-0 rounded-full bg-cyan-400"></span>
              <p className="text-sm leading-6 text-gray-700">
                This will enable auto download for this chat. Files will be
                downloaded automatically.
              </p>
            </div>
            <div className="flex items-start">
              <span className="mr-3 mt-1.5 h-3 w-2 flex-shrink-0 rounded-full bg-cyan-400"></span>
              <p className="text-sm leading-6 text-gray-700">
                Files in historical messages will be downloaded first, and then
                files in new messages will be downloaded automatically.
              </p>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => triggerAuto()}
            variant={chat?.autoEnabled ? "destructive" : "default"}
            disabled={debounceIsAutoMutating}
          >
            {debounceIsAutoMutating ? "Submitting..." : "Submit"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={debounceIsAutoMutating}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
