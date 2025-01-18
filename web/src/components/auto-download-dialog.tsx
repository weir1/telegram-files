import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import useSWRMutation from "swr/mutation";
import { POST } from "@/lib/api";
import { useDebounce } from "use-debounce";
import { useToast } from "@/hooks/use-toast";
import { AutoDownloadButton } from "@/components/auto-download-button";
import { useTelegramChat } from "@/hooks/use-telegram-chat";
import { useTelegramAccount } from "@/hooks/use-telegram-account";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { type AutoDownloadRule, type FileType } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "./ui/badge";
import { X } from "lucide-react";

export default function AutoDownloadDialog() {
  const { accountId } = useTelegramAccount();
  const { isLoading, chat, reload } = useTelegramChat();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rule, setRule] = useState<AutoDownloadRule>({
    query: "",
    fileTypes: [],
  });
  const { trigger: triggerAuto, isMutating: isAutoMutating } = useSWRMutation(
    !accountId || !chat
      ? undefined
      : `/file/auto-download?telegramId=${accountId}&chatId=${chat?.id}`,
    (key, { arg }: { arg: { rule: AutoDownloadRule } }) => {
      return POST(key, arg);
    },
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
    return (
      <div className="h-8 w-32 animate-pulse bg-gray-200 dark:bg-gray-700"></div>
    );
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
          <div className="space-y-4">
            {chat.autoRule && (
              <div className="space-y-4">
                <div className="flex items-center">
                  <Label className="text-sm font-semibold text-gray-900 dark:text-gray-300">
                    Current Rule
                  </Label>
                  <Badge
                    variant="outline"
                    className="ml-2 border-none bg-green-500 px-2 py-0.5 text-xs text-white dark:bg-green-800 dark:text-green-200"
                  >
                    Active
                  </Badge>
                </div>

                <div className="space-y-3">
                  {/* Filter Keyword Section */}
                  <div className="rounded-lg bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs font-medium text-gray-500">
                        Filter Keyword
                      </span>
                      <span className="text-sm text-gray-900 dark:text-gray-300">
                        {chat.autoRule.query || "No keyword specified"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-300">
                      File Types
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {chat.autoRule.fileTypes.length > 0 ? (
                        chat.autoRule.fileTypes.map((type) => (
                          <Badge
                            key={type}
                            variant="secondary"
                            className="flex items-center gap-1 border-gray-200 bg-white px-3 py-1 capitalize text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          >
                            {type}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-300">
                          No file types selected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start">
                <span className="mr-3 mt-1.5 h-3 w-2 flex-shrink-0 rounded-full bg-yellow-400"></span>
                <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                  This will disable auto download for this chat. You can always
                  enable it later.
                </p>
              </div>
              <div className="flex items-start">
                <span className="mr-3 mt-1.5 h-3 w-2 flex-shrink-0 rounded-full bg-yellow-400"></span>
                <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                  Files that are being downloaded will be paused and you can
                  enable automatic downloading again later.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start">
                <span className="mr-3 mt-1.5 h-3 w-2 flex-shrink-0 rounded-full bg-cyan-400"></span>
                <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                  This will enable auto download for this chat. Files will be
                  downloaded automatically.
                </p>
              </div>
              <div className="flex items-start">
                <span className="mr-3 mt-1.5 h-3 w-2 flex-shrink-0 rounded-full bg-cyan-400"></span>
                <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                  Files in historical messages will be downloaded first, and
                  then files in new messages will be downloaded automatically.
                </p>
              </div>
              <div className="flex items-start">
                <span className="mr-3 mt-1.5 h-3 w-2 flex-shrink-0 rounded-full bg-cyan-400"></span>
                <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                  Download Order:
                  <span className="ml-1 rounded bg-blue-100 px-2 text-blue-700 dark:bg-blue-800 dark:text-blue-200">
                    {"Photo -> Video -> Audio -> File"}
                  </span>
                </p>
              </div>
            </div>
            <AutoDownloadRule value={rule} onChange={setRule} />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => triggerAuto({ rule })}
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

interface AutoDownloadRuleProps {
  value: AutoDownloadRule;
  onChange: (value: AutoDownloadRule) => void;
}

function AutoDownloadRule({ value, onChange }: AutoDownloadRuleProps) {
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      query: e.target.value,
    });
  };

  const handleFileTypeSelect = (type: string) => {
    if (value.fileTypes.includes(type as Exclude<FileType, "media">)) {
      return;
    }

    onChange({
      ...value,
      fileTypes: [...value.fileTypes, type as Exclude<FileType, "media">],
    });
  };

  const removeFileType = (typeToRemove: string) => {
    onChange({
      ...value,
      fileTypes: value.fileTypes.filter((type) => type !== typeToRemove),
    });
  };

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="advanced">
        <AccordionTrigger className="hover:no-underline">
          Advanced
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col space-y-4 rounded-md border p-4 shadow">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="filter-keyword">Filter Keyword</Label>
              <Input
                id="filter-keyword"
                type="text"
                className="w-full"
                placeholder="Enter a keyword to filter files"
                value={value.query}
                onChange={handleQueryChange}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="fileTypes">Filter File Types</Label>
              <Select onValueChange={handleFileTypeSelect}>
                <SelectTrigger id="fileTypes">
                  <SelectValue placeholder="Select File Types" />
                </SelectTrigger>
                <SelectContent>
                  {["photo", "video", "audio", "file"].map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mt-2 flex flex-wrap gap-2">
                {value.fileTypes.map((type) => (
                  <Badge
                    key={type}
                    className="flex items-center gap-1 px-2 py-1"
                    variant="secondary"
                  >
                    {type}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFileType(type)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
