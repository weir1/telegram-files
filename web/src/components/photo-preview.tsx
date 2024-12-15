"use client";
import Image from "next/image";
import useSWR from "swr";
import { CloudAlert, Loader } from "lucide-react";
import { useWebsocket } from "@/hooks/use-websocket";
import { useEffect, useState } from "react";
import { WebSocketMessageType } from "@/lib/websocket-types";
import { toast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { type TDFile } from "@/lib/types";
import { getApiUrl } from "@/lib/api";

interface PhotoPreviewProps {
  thumbnail: string;
  name: string;
  chatId: number;
  messageId: number;
}

export default function PhotoPreview({
  thumbnail,
  name,
  chatId,
  messageId,
}: PhotoPreviewProps) {
  const url = `${getApiUrl()}/file/preview?chatId=${chatId}&messageId=${messageId}`;
  const { settings } = useSettings();
  const [isReady, setIsReady] = useState(false);
  const [fileStatus, setFileStatus] = useState<{
    fileId: number | null;
    readyFileIds: number[];
  }>({
    fileId: null,
    readyFileIds: [],
  });
  const { lastJsonMessage } = useWebsocket();

  const { error } = useSWR<void, Error>(
    settings?.needToLoadImages === "true" ? url : null,
    (url: string) =>
      fetch(url, { credentials: "include" }).then(async (res) => {
        if (!res.ok) {
          let message = "Failed to fetch, status: " + res.status;
          try {
            const { error } = await res.json() as { error: string };
            if (error) {
              message = error;
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e) {
            // do nothing
          }
          toast({
            title: "Error",
            description: message,
            variant: "destructive",
          });
          throw new Error(message);
        }
        if (res.headers.get("Content-Type") === "application/json") {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const json: { fileId: number } = await res.json();
          if (json.fileId) {
            setFileStatus((prev) => ({
              ...prev,
              fileId: json.fileId,
            }));
          }
        } else {
          setIsReady(true);
        }
      }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: true,
    },
  );

  useEffect(() => {
    if (
      lastJsonMessage !== null &&
      lastJsonMessage.type === WebSocketMessageType.FILE_UPDATE
    ) {
      const { file } = lastJsonMessage.data as { file: TDFile };
      if (file.local?.isDownloadingCompleted) {
        setFileStatus((prev) => ({
          ...prev,
          readyFileIds: [...prev.readyFileIds, file.id],
        }));
      }
    }
  }, [lastJsonMessage]);

  useEffect(() => {
    const { fileId, readyFileIds } = fileStatus;
    if (fileId !== null && readyFileIds.includes(fileId)) {
      setIsReady(true);
    }
  }, [fileStatus]);

  const ThumbnailImage = (
    <div className="rounded-lg border border-gray-300 bg-white p-2 shadow-lg">
      <Image
        src={`data:image/jpeg;base64,${thumbnail}`}
        alt={name ?? "Photo Thumbnail"}
        width={32}
        height={32}
        className="h-[200px] w-full"
      />
    </div>
  );

  if (settings?.needToLoadImages !== "true") {
    return ThumbnailImage;
  }

  if (!isReady || error) {
    return (
      <div className="relative rounded-lg border border-gray-300 bg-white p-2 shadow-lg">
        {ThumbnailImage}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
          {error ? (
            <CloudAlert className="h-8 w-8" />
          ) : (
            !isReady && <Loader className="h-8 w-8 animate-spin text-white" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-2 shadow-lg">
      <Image
        src={url}
        unoptimized={true}
        blurDataURL={`data:image/jpeg;base64,${thumbnail}`}
        alt={name ?? "Photo"}
        width={32}
        height={32}
        className="h-[200px] w-full"
      />
    </div>
  );
}
