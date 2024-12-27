import { type DownloadStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import React from "react";
import { cn } from "@/lib/utils";

export default function FileStatus({ status }: { status: DownloadStatus }) {
  const STATUS = {
    idle: {
      className: "bg-gray-100 text-gray-600",
      text: "Idle",
    },
    downloading: {
      className: "bg-blue-100 text-blue-600",
      text: "Downloading",
    },
    paused: {
      className: "bg-yellow-100 text-yellow-600",
      text: "Paused",
    },
    completed: {
      className: "bg-green-100 text-green-600",
      text: "Completed",
    },
    error: {
      className: "bg-red-100 text-red-600",
      text: "Error",
    },
  };

  return <Badge className={cn("text-xs", STATUS[status].className)}>
    {STATUS[status].text}
  </Badge>;
}
