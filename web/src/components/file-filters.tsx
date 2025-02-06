import { type DownloadStatus, type FileFilter } from "@/lib/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TableColumnFilter, {
  type Column,
} from "@/components/table-column-filter";
import { type RowHeight } from "@/components/table-row-height-switch";
import FileTypeFilter from "@/components/file-type-filter";
import dynamic from "next/dynamic";
import { useDebouncedCallback } from "use-debounce";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";

interface FileFiltersProps {
  telegramId: string;
  chatId: string;
  filters: FileFilter;
  onFiltersChange: (filters: FileFilter) => void;
  columns: Column[];
  onColumnConfigChange: (config: Column[]) => void;
  rowHeight: RowHeight;
  setRowHeight: (e: RowHeight) => void;
}

const TableRowHeightSwitch = dynamic(
  () =>
    import("@/components/table-row-height-switch").then(
      (mod) => mod.TableRowHeightSwitch,
    ),
  { ssr: false },
);

export function FileFilters({
  telegramId,
  chatId,
  filters,
  onFiltersChange,
  columns,
  onColumnConfigChange,
  rowHeight,
  setRowHeight,
}: FileFiltersProps) {
  const [search, setSearch] = useState(filters.search);

  const handleSearchChange = useDebouncedCallback((search: string) => {
    onFiltersChange({ ...filters, search });
  }, 500);

  useEffect(() => {
    handleSearchChange(search);
  }, [search, handleSearchChange]);

  return (
    <div className="mb-6 flex flex-col justify-between md:flex-row">
      <div className="grid grid-cols-2 gap-4 md:flex md:flex-row">
        <div className="relative">
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="relative col-span-2 md:w-[300px]"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full text-gray-500 transition-all duration-200 hover:scale-110 hover:bg-gray-100 hover:text-gray-800"
              onClick={() => setSearch("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <FileTypeFilter
          telegramId={telegramId}
          chatId={chatId}
          type={filters.type}
          onTypeChange={(type) => onFiltersChange({ ...filters, type })}
        />

        <Select
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              status: value as DownloadStatus | "all",
            })
          }
        >
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Download status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="idle">Not downloaded</SelectItem>
            <SelectItem value="downloading">Downloading</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="hidden gap-4 md:flex">
        <TableColumnFilter
          columns={columns}
          onColumnConfigChange={onColumnConfigChange}
        />
        <TableRowHeightSwitch
          rowHeight={rowHeight}
          setRowHeightAction={setRowHeight}
        />
      </div>
    </div>
  );
}
