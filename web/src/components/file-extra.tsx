import { Captions, Clock, ClockArrowDown, Copy, FileCheck } from "lucide-react";
import SpoiledWrapper from "@/components/spoiled-wrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React from "react";
import { type TelegramFile } from "@/lib/types";
import { type RowHeight } from "@/components/table-row-height-switch";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { formatDistanceToNow } from "date-fns";

interface FileExtraProps {
  file: TelegramFile;
  rowHeight: RowHeight;
}

export default function FileExtra({ file, rowHeight }: FileExtraProps) {
  const [, copyToClipboard] = useCopyToClipboard();

  return (
    <div className="relative flex flex-col space-y-1 overflow-hidden">
      <TooltipProvider>
        {rowHeight !== "s" && file.caption && (
          <SpoiledWrapper hasSensitiveContent={file.hasSensitiveContent}>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-2">
                  <Captions className="h-4 w-4 flex-shrink-0" />
                  <p className="line-clamp-2 overflow-hidden truncate text-ellipsis text-wrap text-sm">
                    {file.caption}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent asChild>
                <div className="max-w-80 text-wrap rounded p-2">
                  {file.caption}
                </div>
              </TooltipContent>
            </Tooltip>
          </SpoiledWrapper>
        )}
        {rowHeight !== "s" && file.localPath && (
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-2 text-sm">
                <FileCheck className="h-4 w-4 flex-shrink-0" />
                <p
                  className="group line-clamp-1 cursor-pointer overflow-hidden truncate text-ellipsis text-wrap rounded px-1 hover:bg-gray-100"
                  onClick={() => copyToClipboard(file.localPath)}
                >
                  {file.localPath.split("/").pop()}
                  <Copy className="ml-1 inline-flex h-4 w-4 opacity-0 group-hover:opacity-100" />
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-80 text-wrap rounded p-2">
                {file.localPath}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="rounded px-1 text-sm text-muted-foreground hover:bg-gray-100">
                  {formatDistanceToNow(new Date(file.date * 1000), {
                    addSuffix: true,
                  })}
                </span>
              </p>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-80 text-wrap rounded p-2">
                {`Message received at ${file.formatDate}`}
              </div>
            </TooltipContent>
          </Tooltip>
          {file.completionDate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="flex items-center gap-2">
                  <ClockArrowDown className="h-4 w-4" />
                  <span className="rounded px-1 text-sm text-muted-foreground hover:bg-gray-100">
                    {formatDistanceToNow(new Date(file.completionDate), {
                      addSuffix: true,
                    })}
                  </span>
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-80 text-wrap rounded p-2">
                  {`File downloaded at ${new Date(file.completionDate).toLocaleString()}`}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}
