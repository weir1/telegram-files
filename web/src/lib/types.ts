import { type TelegramObject } from "@/lib/websocket-types";

export type TelegramAccount = {
  id: string;
  name: string;
  phoneNumber: string;
  avatar?: string;
  status: "active" | "inactive";
  lastAuthorizationState?: TelegramObject;
  proxy?: string;
};

export type TelegramChat = {
  id: string;
  name: string;
  type: "private" | "group" | "channel";
  avatar?: string;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
  autoEnabled: boolean;
};

export type FileType = "media" | "photo" | "video" | "audio" | "file";
export type DownloadStatus =
  | "idle"
  | "downloading"
  | "paused"
  | "completed"
  | "error";

export type TelegramFile = {
  id: number;
  uniqueId: string;
  messageId: number;
  chatId: number;
  name: string;
  type: FileType;
  size: number;
  downloadedSize: number;
  thumbnail?: string;
  downloadStatus: DownloadStatus;
  date: number;
  formatDate: string;
  caption: string;
  localPath: string;
  hasSensitiveContent: boolean;
  startDate: number;
  completionDate: number;
};

export type TDFile = {
  id: number;
  size: number;
  expectedSize: number;
  local?: {
    path: string;
    canBeDownloaded: boolean;
    canBeDeleted: boolean;
    isDownloadingActive: boolean;
    isDownloadingCompleted: boolean;
    downloadOffset: number;
    downloadedPrefixSize: number;
    downloadedSize: number;
  };
  remote: {
    id: number;
    uniqueId: string;
    isUploadingActive: boolean;
    isUploadingCompleted: boolean;
    uploadedSize: number;
  };
};

export type FileFilter = {
  search: string;
  type: FileType;
  status: DownloadStatus | "all";
};

export type TelegramApiResult = {
  code: string;
};

export const SettingKeys = [
  "uniqueOnly",
  "needToLoadImages",
  "imageLoadSize",
  "alwaysHide",
  "showSensitiveContent",
  "autoDownloadLimit",
  "proxys",
] as const;

export type SettingKey = (typeof SettingKeys)[number];

export type Settings = Record<SettingKey, string>;

export type Proxy = {
  id?: string;
  name: string;
  server: string;
  port: number;
  username: string;
  password: string;
  type: "http" | "socks5";
  isEnabled?: boolean;
}
