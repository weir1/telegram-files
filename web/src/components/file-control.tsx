import { type DownloadStatus, type TelegramFile } from "@/lib/types";
import { useFileControl } from "@/hooks/use-file-control";
import { Button } from "@/components/ui/button";
import { ArrowDown, Loader2, Pause, SquareX, StepForward } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type ReactNode } from "react";
import prettyBytes from "pretty-bytes";
import { AnimatePresence, motion } from "framer-motion";

interface ActionButtonProps {
  tooltipText: string;
  icon: ReactNode;
  onClick: () => void;
  loading: boolean;
}

const ActionButton = ({
  tooltipText,
  icon,
  onClick,
  loading,
}: ActionButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="xs" onClick={onClick}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>{tooltipText}</p>
    </TooltipContent>
  </Tooltip>
);

export default function FileControl({
  file,
  downloadSpeed,
  hovered,
  isMobile,
}: {
  file: TelegramFile;
  downloadSpeed: number;
  hovered?: boolean;
  isMobile?: boolean;
}) {
  const showDownloadInfo =
    !hovered &&
    (file.downloadStatus === "downloading" || file.downloadStatus === "paused");

  const { start, starting, togglePause, togglingPause, cancel, cancelling } =
    useFileControl(file);

  if (file.downloadStatus === "completed") {
    return null;
  }

  const statusMapping: Record<DownloadStatus, ActionButtonProps[]> = {
    idle: [
      {
        onClick: () => start(file.id),
        tooltipText: "Start Download",
        icon: <ArrowDown className="h-4 w-4" />,
        loading: starting,
      },
    ],
    error: [
      {
        onClick: () => start(file.id),
        tooltipText: "Retry",
        icon: <ArrowDown className="h-4 w-4" />,
        loading: starting,
      },
    ],
    downloading: [
      {
        onClick: () => togglePause(file.id),
        tooltipText: "Pause",
        icon: <Pause className="h-4 w-4" />,
        loading: togglingPause,
      },
      {
        onClick: () => cancel(file.id),
        tooltipText: "Cancel",
        icon: <SquareX className="h-4 w-4" />,
        loading: cancelling,
      },
    ],
    paused: [
      {
        onClick: () => togglePause(file.id),
        tooltipText: "Resume",
        icon: <StepForward className="h-4 w-4" />,
        loading: togglingPause,
      },
      {
        onClick: () => cancel(file.id),
        tooltipText: "Cancel",
        icon: <SquareX className="h-4 w-4" />,
        loading: cancelling,
      },
    ],
    completed: [],
  };

  const actionButtons = (
    <div className="w-full">
      <div
        className="flex w-full items-center justify-end space-x-2 md:justify-around"
        onClick={(e) => e.preventDefault()}
      >
        {statusMapping[file.downloadStatus].map((btnProps, index) => (
          <ActionButton key={index} {...btnProps} />
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    return <TooltipProvider>{actionButtons}</TooltipProvider>;
  }

  return (
    <TooltipProvider>
      <div className="relative h-6 overflow-hidden">
        <AnimatePresence mode="wait">
          {showDownloadInfo ? (
            <motion.div
              key="downloadInfo"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute w-full"
            >
              <span className="text-nowrap text-xs">
                {file.downloadStatus === "downloading"
                  ? `${prettyBytes(downloadSpeed, { bits: true })}/s`
                  : prettyBytes(file.downloadedSize)}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="actionButtons"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute w-full"
            >
              {actionButtons}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}

export function MobileFileControl({ file }: { file: TelegramFile }) {
  const { start, starting, togglePause, togglingPause, cancel, cancelling } =
    useFileControl(file);

  if (file.downloadStatus === "completed") {
    return null;
  }

  return (
    <div className="flex w-full items-center justify-between space-x-2">
      {(file.downloadStatus === "idle" || file.downloadStatus === "error") && (
        <Button className="w-full" onClick={() => start(file.id)}>
          {starting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
        </Button>
      )}
      {(file.downloadStatus === "downloading" ||
        file.downloadStatus === "paused") && (
        <>
          <Button className="w-full" onClick={() => togglePause(file.id)}>
            {togglingPause ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : file.downloadStatus === "downloading" ? (
              <Pause className="h-4 w-4" />
            ) : (
              <StepForward className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => cancel(file.id)}
          >
            {cancelling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SquareX className="h-4 w-4" />
            )}
          </Button>
        </>
      )}
    </div>
  );
}
