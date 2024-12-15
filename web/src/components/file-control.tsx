import { type TelegramFile } from "@/lib/types";
import { useFileControl } from "@/hooks/use-file-control";
import { Button } from "@/components/ui/button";
import { ArrowDown, Loader2, Pause, SquareX, StepForward } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function FileControl({ file }: { file: TelegramFile }) {
  const { start, starting, togglePause, togglingPause, cancel, cancelling } =
    useFileControl(file);

  if (file.downloadStatus === "completed") {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex w-full justify-end md:justify-around">
        {(file.downloadStatus === "idle" ||
          file.downloadStatus === "error") && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="xs" onClick={() => start(file.id)}>
                {starting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowDown className="h-4 w-4 stroke-1" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {file.downloadStatus === "idle"
                  ? "Start Download"
                  : file.downloadStatus === "error"
                    ? "Retry"
                    : "Downloading"}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
        {(file.downloadStatus === "downloading" ||
          file.downloadStatus === "paused") && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => togglePause(file.id)}
                >
                  {togglingPause ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : file.downloadStatus === "downloading" ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <StepForward className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {file.downloadStatus === "downloading"
                    ? "Pause"
                    : file.downloadStatus === "paused"
                      ? "Resume"
                      : "Paused"}
                </p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => cancel(file.id)}
                >
                  {cancelling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SquareX className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {file.downloadStatus === "downloading" ||
                  file.downloadStatus === "paused" ||
                  file.downloadStatus === "error"
                    ? "Cancel"
                    : "Cancelled"}
                </p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
