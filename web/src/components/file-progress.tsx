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
      {/*<div className="hidden min-w-20 md:flex">*/}
      {/*  <div className="group flex items-center gap-1 px-1">*/}
      {/*    <AnimatePresence mode="wait">*/}
      {/*      <motion.div*/}
      {/*        key="content"*/}
      {/*        className="flex items-center gap-1"*/}
      {/*        initial={{ opacity: 1 }}*/}
      {/*        exit={{ opacity: 0 }}*/}
      {/*      >*/}
      {/*        <Zap className="h-3 w-3 group-hover:hidden" />*/}
      {/*        <ClockArrowDown className="hidden h-3 w-3 group-hover:block" />*/}
      {/*        <span className="text-nowrap text-xs">*/}
      {/*          <span className="group-hover:hidden">*/}
      {/*            {`${prettyBytes(downloadSpeed, { bits: true })}/s`}*/}
      {/*          </span>*/}
      {/*          <span className="hidden group-hover:inline">*/}
      {/*            {prettyBytes(file.downloadedSize)}*/}
      {/*          </span>*/}
      {/*        </span>*/}
      {/*      </motion.div>*/}
      {/*    </AnimatePresence>*/}
      {/*  </div>*/}
      {/*</div>*/}

      <Progress value={progress} className="flex-1 rounded-none md:w-32" />
    </div>
  );
}
