import { useWebsocket } from "@/hooks/use-websocket";
import { useEffect, useState } from "react";
import { WebSocketMessageType } from "@/lib/websocket-types";
import type { TDFile } from "@/lib/types";
import { env } from "@/env";
import { useDebounce } from "use-debounce";

export function useFileSpeed(fileId: number) {
  const { lastJsonMessage } = useWebsocket();
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState({
    speed: 0,
    lastDownloadedSize: 0,
    lastTimestamp: 0,
  });

  const [debounceSpeed] = useDebounce(downloadSpeed.speed, 1000, {
    leading: true,
    maxWait: 2000,
  });

  useEffect(() => {
    if (
      lastJsonMessage !== null &&
      lastJsonMessage.type === WebSocketMessageType.FILE_UPDATE
    ) {
      const { file } = lastJsonMessage.data as { file: TDFile };
      if (file.id !== fileId || !file.local) {
        return;
      }

      const timestamp = lastJsonMessage.timestamp;
      const size = file.size === 0 ? file.expectedSize : file.size;
      const downloadedSize = file.local.downloadedSize;

      setDownloadProgress((prev) => {
        return Math.max(Math.min((downloadedSize / size) * 100, 100), prev);
      });

      setDownloadSpeed((prev) => {
        const state = {
          lastTimestamp: timestamp,
          lastDownloadedSize: downloadedSize,
        };
        if (prev.lastTimestamp === 0) {
          return { ...state, speed: 0 };
        }
        const timeDiff = (timestamp - prev.lastTimestamp) / 1000;
        if (timeDiff <= 0 || downloadedSize <= prev.lastDownloadedSize) {
          return prev;
        }

        const speed = (downloadedSize - prev.lastDownloadedSize) / timeDiff;
        return {
          speed,
          lastTimestamp: timestamp,
          lastDownloadedSize: downloadedSize,
        };
      });
    }

    const interval = setInterval(() => {
      setDownloadSpeed((prev) => ({
        ...prev,
        speed: 0,
      }));
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [fileId, lastJsonMessage]);

  useEffect(() => {
    // Mock data
    if (env.NEXT_PUBLIC_MOCK_DATA) {
      const interval = setInterval(() => {
        setDownloadProgress((prev) => {
          return Math.min(prev + Math.random() * 10, 100);
        });
        setDownloadSpeed((_prev) => {
          return {
            speed: Math.random() * 1024 * 1024 * 10,
            lastDownloadedSize: 0,
            lastTimestamp: 0,
          };
        });
      }, 100);

      return () => {
        clearInterval(interval);
      };
    }
  }, []);

  return {
    downloadProgress,
    downloadSpeed: debounceSpeed,
  };
}
