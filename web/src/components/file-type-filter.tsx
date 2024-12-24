import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FileType } from "@/lib/types";
import useSWR from "swr";
import { Ellipsis } from "lucide-react";

interface FileTypeFilterProps {
  telegramId: string;
  chatId: string;
  type: FileType;
  onTypeChange: (type: FileType) => void;
}

export default function FileTypeFilter({
  telegramId,
  chatId,
  type,
  onTypeChange,
}: FileTypeFilterProps) {
  const { data: counts, isLoading } = useSWR<Record<FileType, number>>(
    `/telegram/${telegramId}/chat/${chatId}/files/count`,
  );

  const FileTypeSelectItem = ({ value }: { value: FileType }) => {
    return (
      <SelectItem value={value}>
        <div className="flex w-20 items-center justify-between">
          <span>{value.charAt(0).toUpperCase() + value.slice(1)}</span>
          {isLoading ? (
            <Ellipsis className="h-4 w-4 animate-pulse" />
          ) : (
            <span className="text-xs text-gray-400">
              {counts?.[value] ? `(${counts[value]})` : "(0)"}
            </span>
          )}
        </div>
      </SelectItem>
    );
  };

  return (
    <Select
      value={type}
      onValueChange={(value) => onTypeChange(value as FileType)}
    >
      <SelectTrigger className="w-full md:w-[150px]">
        <SelectValue placeholder="File type" />
      </SelectTrigger>
      <SelectContent>
        <FileTypeSelectItem value="media" />
        <FileTypeSelectItem value="photo" />
        <FileTypeSelectItem value="video" />
        <FileTypeSelectItem value="audio" />
        <FileTypeSelectItem value="file" />
      </SelectContent>
    </Select>
  );
}
