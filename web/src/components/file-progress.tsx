import { Progress } from "@/components/ui/progress";
import { type TelegramFile } from "@/lib/types";
import { useMemo } from "react";

export default function FileProgress({
  file,
  downloadProgress,
}: {
  file: TelegramFile;
  downloadProgress: number;
}) {
  const progress = useMemo(() => {
    const fileDownloadProgress =
      file.size > 0
        ? Math.min((file.downloadedSize / file.size) * 100, 100)
        : 0;
    if (file.downloadStatus === "downloading") {
      return downloadProgress > 0 ? downloadProgress : fileDownloadProgress;
    }
    if (file.downloadStatus === "paused") {
      return fileDownloadProgress;
    }
    return file.downloadStatus === "completed" ? 100 : 0;
  }, [file.downloadStatus, file.downloadedSize, file.size, downloadProgress]);

  if (
    file.downloadStatus === "idle" ||
    file.downloadStatus === "completed" ||
    file.size === 0
  ) {
    return null;
  }

  return (
    <div className="flex items-end justify-between gap-2">
      <Progress value={progress} className="flex-1 rounded-none md:w-32" />
    </div>
  );
}
