"use client";

import { Card, CardContent } from "@/components/ui/card";
import { type TelegramFile } from "@/lib/types";
import {
  Calendar,
  Clock10,
  ClockArrowDown,
  Download,
  FileAudio2Icon,
  FileIcon,
  HardDrive,
  ImageIcon,
  Type,
  VideoIcon,
} from "lucide-react";
import SpoiledWrapper from "@/components/spoiled-wrapper";
import Image from "next/image";
import prettyBytes from "pretty-bytes";
import FileProgress from "@/components/file-progress";
import FileControl, { MobileFileControl } from "@/components/file-control";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import PhotoPreview from "@/components/photo-preview";
import React from "react";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { formatDistanceToNow } from "date-fns";
import FileStatus from "@/components/file-status";
import { cn } from "@/lib/utils";
import { useFileSpeed } from "@/hooks/use-file-speed";

interface FileCardProps {
  file: TelegramFile;
}

export function FileCard({ file }: FileCardProps) {
  const { downloadProgress, downloadSpeed } = useFileSpeed(file.id);
  return (
    <FileDrawer file={file} downloadProgress={downloadProgress}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <FileAvatar file={file} />
            <div className="flex-1">
              <h3 className="max-w-40 truncate font-medium">{file.fileName}</h3>
              <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {prettyBytes(file.size)} • {file.type}
                </span>
                <FileStatus file={file} />
              </div>
              <div
                className={cn(
                  "mb-2 w-full overflow-hidden",
                  file.downloadStatus === "idle" && "hidden",
                )}
              >
                <FileProgress file={file} downloadProgress={downloadProgress} />
              </div>
              <div className="flex items-center justify-end">
                <FileControl
                  file={file}
                  downloadSpeed={downloadSpeed}
                  isMobile={true}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </FileDrawer>
  );
}

function FileAvatar({
  file,
  loadPreview,
}: {
  file: TelegramFile;
  loadPreview?: boolean;
}) {
  const getIcon = () => {
    switch (file.type) {
      case "photo":
        return <ImageIcon className="h-6 w-6" />;
      case "video":
        return <VideoIcon className="h-6 w-6" />;
      case "audio":
        return <FileAudio2Icon className="h-6 w-6" />;
      default:
        return <FileIcon className="h-6 w-6" />;
    }
  };

  return (
    <>
      {file.type === "photo" || file.type === "video" ? (
        file.thumbnail ? (
          <SpoiledWrapper hasSensitiveContent={file.hasSensitiveContent}>
            {loadPreview ? (
              <PhotoPreview
                thumbnail={file.thumbnail}
                name={file.fileName}
                chatId={file.chatId}
                messageId={file.messageId}
              />
            ) : (
              <Image
                src={`data:image/jpeg;base64,${file.thumbnail}`}
                alt={file.fileName ?? "File thumbnail"}
                width={32}
                height={32}
                className="inline-block h-16 w-16 rounded object-cover"
              />
            )}
          </SpoiledWrapper>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded bg-muted">
            {getIcon()}
          </div>
        )
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded bg-muted">
          {getIcon()}
        </div>
      )}
    </>
  );
}

function FileDrawer({
  file,
  downloadProgress,
  children,
}: {
  file: TelegramFile;
  downloadProgress: number;
  children: React.ReactNode;
}) {
  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent
        className="max-h-[96vh] focus:outline-none"
        aria-describedby={undefined}
      >
        <DrawerHeader className="text-center">
          <DrawerTitle className="flex flex-col items-center justify-center gap-2">
            <FileAvatar file={file} loadPreview={true} />
            <span className="max-w-64 truncate">{file.fileName}</span>
          </DrawerTitle>
          <div className="py-1">
            <FileStatus file={file} />
          </div>
          {file.caption && (
            <SpoiledWrapper hasSensitiveContent={file.hasSensitiveContent}>
              <DrawerDescription
                className="mx-auto mt-2 max-h-48 max-w-md overflow-y-auto text-start"
                dangerouslySetInnerHTML={{
                  __html: file.caption.replaceAll("\n", "<br />"),
                }}
              ></DrawerDescription>
            </SpoiledWrapper>
          )}
          <FileProgress file={file} downloadProgress={downloadProgress} />
        </DrawerHeader>

        <div className="px-2">
          <Separator className="my-2" />
        </div>

        <div className="space-y-6 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Type className="h-4 w-4" />
                <span>Type</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {file.type}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HardDrive className="h-4 w-4" />
                <span>Size</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {prettyBytes(file.size)}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Received At</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {formatDistanceToNow(new Date(file.date * 1000), {
                  addSuffix: true,
                })}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Download className="h-4 w-4" />
                <span>Downloaded Size</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {prettyBytes(file.downloadedSize)}
              </Badge>
            </div>

            {file.downloadStatus !== "idle" && file.startDate !== 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock10 className="h-4 w-4" />
                  <span>Download At</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {formatDistanceToNow(new Date(file.startDate), {
                    addSuffix: true,
                  })}
                </Badge>
              </div>
            )}

            {file.completionDate && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ClockArrowDown className="h-4 w-4" />
                  <span>Completion At</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {formatDistanceToNow(new Date(file.completionDate), {
                    addSuffix: true,
                  })}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <DrawerFooter>
          <MobileFileControl file={file} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
