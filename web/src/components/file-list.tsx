"use client";
import { FileCard } from "./file-card";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { Download, LoaderCircle, LoaderPinwheel } from "lucide-react";
import { useFiles } from "@/hooks/use-files";
import { FileFilters } from "@/components/file-filters";
import { useRowHeightLocalStorage } from "@/components/table-row-height-switch";
import { type Column } from "@/components/table-column-filter";
import { cn } from "@/lib/utils";
import FileNotFount from "@/components/file-not-found";
import useIsMobile from "@/hooks/use-is-mobile";
import useSWRMutation from "swr/mutation";
import { POST } from "@/lib/api";
import FileRow from "@/components/file-row";

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

export function FileList({ accountId, chatId }: FileListProps) {
  const isMobile = useIsMobile();
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const observerTarget = useRef(null);
  const [columns, setColumns] = useState<Column[]>(COLUMNS);
  const [rowHeight, setRowHeight] = useRowHeightLocalStorage(
    "telegramFileList",
    "m",
  );
  const { filters, handleFilterChange, isLoading, files, handleLoadMore } =
    useFiles(accountId, chatId);
  const {
    trigger: startDownloadMultiple,
    isMutating: startDownloadMultipleMutating,
  } = useSWRMutation(
    "/file/start-download-multiple",
    (
      key,
      {
        arg,
      }: {
        arg: {
          chatId: number;
          files: Array<{ messageId: number; fileId: number }>;
        };
      },
    ) => POST(key, arg),
    {
      onSuccess: () => {
        setSelectedFiles(new Set());
      },
    },
  );

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

  const dynamicClass = useMemo(() => {
    switch (rowHeight) {
      case "s":
        return {
          content: "h-6 w-6",
          contentCell: "w-4",
        };
      case "m":
        return {
          content: "h-20 w-20",
          contentCell: "w-24",
        };
      case "l":
        return {
          content: "h-60 w-60",
          contentCell: "w-64",
        };
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
        <div ref={observerTarget} className="h-4">
          {isLoading && (
            <div className="flex items-center justify-center">
              <LoaderPinwheel
                className="h-8 w-8 animate-spin"
                style={{ strokeWidth: "0.8px" }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(
        new Set(
          files
            .filter((file) => file.downloadStatus === "idle")
            .map((file) => file.id),
        ),
      );
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
                void startDownloadMultiple({
                  chatId: Number(chatId),
                  files: Array.from(selectedFiles).map((id) => {
                    const file = files.find((f) => f.id === id);
                    return {
                      messageId: file?.messageId ?? 0,
                      fileId: file?.id ?? 0,
                    };
                  }),
                });
              }}
              disabled={
                selectedFiles.size === 0 || startDownloadMultipleMutating
              }
            >
              {startDownloadMultipleMutating ? (
                <LoaderCircle
                  className="mr-2 h-4 w-4 animate-spin"
                  style={{ strokeWidth: "0.8px" }}
                />
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Selected
                </>
              )}
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
                      suppressHydrationWarning
                      className={cn(
                        col.className ?? "",
                        col.id === "content" ? dynamicClass.contentCell : "",
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
                <FileRow
                  file={file}
                  checked={selectedFiles.has(file.id)}
                  onCheckedChange={() => handleSelectFile(file.id)}
                  properties={{ rowHeight, dynamicClass, columns }}
                  key={`${file.messageId}-${file.uniqueId}-${index}`}
                />
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
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-accent bg-opacity-90">
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
