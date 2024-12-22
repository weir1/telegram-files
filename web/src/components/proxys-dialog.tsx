import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EarthLock } from "lucide-react";
import Proxys, { type ProxysProps } from "@/components/proxys";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import React from "react";
import { cn } from "@/lib/utils";

type ProxysDialogProps = {
  className?: string;
} & ProxysProps;

export default function ProxysDialog({
  className,
  ...proxyProps
}: ProxysDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-auto rounded-full bg-primary px-2 text-accent hover:bg-primary/90 hover:text-accent",
            className,
          )}
        >
          <EarthLock className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="md:max-w-2/3 h-full w-full max-w-full md:h-3/4 md:w-2/3"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>Proxys</DialogTitle>
        </VisuallyHidden>
        <div className="mt-3">
          <Proxys {...proxyProps} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
