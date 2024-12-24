"use client";
import { type TelegramFile } from "@/lib/types";
import { FileCard } from "./file-card";
import React, {
  memo,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileAudioIcon,
  FileIcon,
  ImageIcon,
  LoaderPinwheel,
  VideoIcon,
} from "lucide-react";
import { useFiles } from "@/hooks/use-files";
import { FileFilters } from "@/components/file-filters";
import {
  getRowHeightTailwindClass,
  type RowHeight,
} from "@/components/table-row-height-switch";
import { type Column } from "@/components/table-column-filter";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PhotoPreview from "@/components/photo-preview";
import SpoiledWrapper from "@/components/spoiled-wrapper";
import Image from "next/image";
import FileControl from "@/components/file-control";
import prettyBytes from "pretty-bytes";
import FileProgress from "@/components/file-progress";
import FileNotFount from "@/components/file-not-found";
import FileExtra from "@/components/file-extra";
import useIsMobile from "@/hooks/use-is-mobile";

interface FileListProps {
  accountId: string;
  chatId: string;
}

const COLUMNS: Column[] = [
  { id: "content", label: "Content", isVisible: true },
  { id: "type", label: "Type", isVisible: true, className: "w-16 text-center" },
  {
    id: "size",
    label: "Size",
    isVisible: true,
    className: "w-20 max-w-20 text-center",
  },
  {
    id: "status",
    label: "Status",
    isVisible: true,
    className: "w-16 text-center",
  },
  { id: "extra", label: "Extra", isVisible: true },
  {
    id: "actions",
    label: "Actions",
    isVisible: true,
    className: "text-center w-40 min-w-40",
  },
];

const PhotoColumnImage = memo(function PhotoColumnImage({
  thumbnail,
  name,
  wh,
}: {
  thumbnail: string;
  name: string;
  wh: string;
}) {
  return (
    <Image
      src={`data:image/jpeg;base64,${thumbnail}`}
      alt={name ?? "File thumbnail"}
      width={32}
      height={32}
      className={cn(wh, "rounded object-cover")}
    />
  );
});

export function FileList({ accountId, chatId }: FileListProps) {
  const isMobile = useIsMobile();
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const observerTarget = useRef(null);
  const [columns, setColumns] = useState<Column[]>(COLUMNS);
  // const [rowHeight, setRowHeight] = useRowHeightLocalStorage("fileList", "m");
  const [rowHeight, setRowHeight] = useState<RowHeight>("m");

  const { filters, handleFilterChange, isLoading, files, handleLoadMore } =
    useFiles(accountId, chatId);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void handleLoadMore();
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [handleLoadMore]);

  const contentWH = useMemo(() => {
    switch (rowHeight) {
      case "s":
        return "h-6 w-6";
      case "m":
        return "h-20 w-20";
      case "l":
        return "h-60 w-60";
    }
  }, [rowHeight]);

  const contentCellWidth = useMemo(() => {
    switch (rowHeight) {
      case "s":
        return "w-6";
      case "m":
        return "w-24";
      case "l":
        return "w-64";
    }
  }, [rowHeight]);

  if (isMobile) {
    return (
      <div className="space-y-4">
        <FileFilters
          telegramId={accountId}
          chatId={chatId}
          filters={filters}
          onFiltersChange={handleFilterChange}
          columns={columns}
          onColumnConfigChange={setColumns}
          rowHeight={rowHeight}
          setRowHeight={setRowHeight}
        />
        <div className="grid grid-cols-1 gap-4">
          {files.map((file, index) => (
            <FileCard
              key={`${file.id}-${file.uniqueId}-${index}`}
              file={file}
            />
          ))}
        </div>
        <div ref={observerTarget} className="h-4" />
      </div>
    );
  }

  const handleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((file) => file.id)));
    }
  };

  const handleSelectFile = (fileId: number) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const getFileIcon = (type: TelegramFile["type"]) => {
    let icon;
    switch (type) {
      case "photo":
        icon = <ImageIcon className="h-4 w-4" />;
        break;
      case "video":
        icon = <VideoIcon className="h-4 w-4" />;
        break;
      case "audio":
        icon = <FileAudioIcon className="h-4 w-4" />;
        break;
      default:
        icon = <FileIcon className="h-4 w-4" />;
    }
    return (
      <div
        className={cn(
          contentWH,
          "flex items-center justify-center rounded bg-muted",
        )}
      >
        {icon}
      </div>
    );
  };

  const columnRenders: Record<
    string,
    (file: TelegramFile, index: number) => ReactNode
  > = {
    content: (file: TelegramFile) => (
      <div className="flex items-center gap-2">
        {file.type === "photo" || file.type === "video" ? (
          file.thumbnail ? (
            <SpoiledWrapper hasSensitiveContent={file.hasSensitiveContent}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <PhotoColumnImage
                      thumbnail={file.thumbnail}
                      name={file.name}
                      wh={contentWH}
                    />
                  </TooltipTrigger>
                  <TooltipContent asChild>
                    <PhotoPreview
                      thumbnail={file.thumbnail}
                      name={file.name}
                      chatId={file.chatId}
                      messageId={file.messageId}
                    />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </SpoiledWrapper>
          ) : (
            getFileIcon(file.type)
          )
        ) : (
          getFileIcon(file.type)
        )}
      </div>
    ),
    type: (file: TelegramFile) => (
      <div className="flex flex-col items-center">
        <span className="capitalize">{file.type}</span>
        <span className="text-xs">{file.id}</span>
      </div>
    ),
    size: (file: TelegramFile) => <span>{prettyBytes(file.size)}</span>,
    status: (file: TelegramFile) => (
      <span className="capitalize">{file.downloadStatus}</span>
    ),
    extra: (file: TelegramFile) => (
      <FileExtra file={file} rowHeight={rowHeight} />
    ),
    actions: (file: TelegramFile) => <FileControl file={file} />,
  };

  return (
    <>
      <FileFilters
        telegramId={accountId}
        chatId={chatId}
        filters={filters}
        onFiltersChange={handleFilterChange}
        columns={columns}
        onColumnConfigChange={setColumns}
        rowHeight={rowHeight}
        setRowHeight={setRowHeight}
      />
      <div className="space-y-4">
        {selectedFiles.size > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
            <span className="text-sm">
              {selectedFiles.size} {selectedFiles.size === 1 ? "file" : "files"}{" "}
              selected
            </span>
            <Button
              size="sm"
              onClick={() => {
                //TODO implement download selected
              }}
              disabled={Array.from(selectedFiles).every(
                (id) =>
                  files.find((f) => f.id === id)?.downloadStatus ===
                  "downloading",
              )}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Selected
            </Button>
          </div>
        )}

        <div className="relative min-h-[calc(100vh-14rem)] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px] text-center">
                  <Checkbox
                    checked={selectedFiles.size === files.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                {columns.map((col) =>
                  col.isVisible ? (
                    <TableHead
                      key={col.id}
                      className={cn(
                        col.className ?? "",
                        col.id === "content" ? contentCellWidth : "",
                      )}
                    >
                      {col.label}
                    </TableHead>
                  ) : null,
                )}
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr:last-child]:border-b">
              {files.map((file, index) => (
                <React.Fragment
                  key={`${file.messageId}-${file.uniqueId}-${index}`}
                >
                  <TableRow
                    className={cn(
                      getRowHeightTailwindClass(rowHeight),
                      "border-b-0",
                    )}
                  >
                    <TableCell className="text-center">
                      <Checkbox
                        checked={selectedFiles.has(file.id)}
                        onCheckedChange={() => handleSelectFile(file.id)}
                      />
                    </TableCell>
                    {columns.map((col) =>
                      col.isVisible ? (
                        <TableCell
                          key={col.id}
                          className={cn(
                            col.className ?? "",
                            col.id === "content" ? contentCellWidth : "",
                          )}
                        >
                          {columnRenders[col.id]!(file, index)}
                        </TableCell>
                      ) : null,
                    )}
                  </TableRow>
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 1}
                      className="h-px p-0"
                    >
                      <FileProgress file={file} />
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
              {!isLoading && files.length === 0 && (
                <TableRow className="border-b-0">
                  <TableCell colSpan={columns.length + 1}>
                    <FileNotFount />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-90">
              <LoaderPinwheel
                className="h-8 w-8 animate-spin"
                style={{ strokeWidth: "0.8px" }}
              />
            </div>
          )}
        </div>
        <div ref={observerTarget} className="h-4"></div>
      </div>
    </>
  );
}
