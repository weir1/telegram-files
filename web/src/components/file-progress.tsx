import { Progress } from "@/components/ui/progress";
import prettyBytes from "pretty-bytes";
import { type TelegramFile } from "@/lib/types";
import { useFileSpeed } from "@/hooks/use-file-speed";
import { useMemo } from "react";
import { ClockArrowDown, Zap } from "lucide-react";

export default function FileProgress({ file }: { file: TelegramFile }) {
  const { downloadProgress, downloadSpeed } = useFileSpeed(file.id);
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

  if (file.downloadStatus === "idle" || file.downloadStatus === "completed" || file.size === 0) {
    return null;
  }

  return (
    <div className="flex items-end justify-between gap-2">
      {file.downloadedSize > 0 && (
        <div className="flex min-w-32 items-center gap-1 bg-gray-100 px-1">
          <ClockArrowDown className="h-3 w-3" />
          <span className="text-nowrap text-xs">
            {prettyBytes(file.downloadedSize)}
          </span>
        </div>
      )}
      <div className="flex min-w-32 items-center gap-1 bg-gray-100 px-1">
        <Zap className="h-3 w-3" />
        <span className="text-nowrap text-xs">
          {file.downloadStatus === "downloading"
            ? `${prettyBytes(downloadSpeed, { bits: true })}/s`
            : "0/s"}
        </span>
      </div>
      <Progress value={progress} className="flex-1 rounded-none md:w-32" />
    </div>
  );
}
