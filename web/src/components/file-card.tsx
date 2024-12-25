"use client";

import { Card, CardContent } from "@/components/ui/card";
import { type TelegramFile } from "@/lib/types";
import { FileAudio2Icon, FileIcon, ImageIcon, VideoIcon } from "lucide-react";
import SpoiledWrapper from "@/components/spoiled-wrapper";
import Image from "next/image";
import prettyBytes from "pretty-bytes";
import FileProgress from "@/components/file-progress";
import FileControl from "@/components/file-control";

interface FileCardProps {
  file: TelegramFile;
}

export function FileCard({ file }: FileCardProps) {
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
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {file.type === "photo" || file.type === "video" ? (
            file.thumbnail ? (
              <SpoiledWrapper hasSensitiveContent={file.hasSensitiveContent}>
                <Image
                  src={`data:image/jpeg;base64,${file.thumbnail}`}
                  alt={file.name ?? "File thumbnail"}
                  width={32}
                  height={32}
                  className="h-16 w-16 rounded object-cover"
                />
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

          <div className="flex-1">
            <h3 className="mb-1 font-medium">{file.name}</h3>
            <div className="mb-2 flex justify-between items-center text-sm text-muted-foreground">
              <span>{prettyBytes(file.size)} • {file.type}</span>
              <span>{file.downloadStatus}</span>
            </div>
            <div className="mb-2 w-full overflow-hidden">
              <FileProgress file={file} />
            </div>
            <div className="flex items-center justify-end">
              <FileControl file={file} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
