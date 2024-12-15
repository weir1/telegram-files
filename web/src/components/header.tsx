"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronsLeftRightEllipsisIcon,
  CloudDownloadIcon,
  Ellipsis,
  UnplugIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useWebsocket } from "@/hooks/use-websocket";
import { useTelegramAccount } from "@/hooks/use-telegram-account";
import { SettingsDialog } from "@/components/settings-dialog";
import prettyBytes from "pretty-bytes";
import ChatSelect from "@/components/chat-select";
import Link from "next/link";
import TelegramIcon from "@/components/telegram-icon";
import AutoDownloadDialog from "@/components/auto-download-dialog";

export function Header() {
  const { isLoading, getAccounts, accountId, account, handleAccountChange } =
    useTelegramAccount();
  const { connectionStatus, accountDownloadSpeed } = useWebsocket();
  const accounts = getAccounts("active");

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
            <Link href={"/"} className="hidden md:inline-flex">
              <TelegramIcon className="h-6 w-6" />
            </Link>

            <div className="flex items-center gap-2">
              <Select value={accountId} onValueChange={handleAccountChange}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Select account ...">
                    {account ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={`data:image/png;base64,${account.avatar}`}
                          />
                          <AvatarFallback>{account.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="max-w-[170px] overflow-hidden truncate">
                          {account.name}
                        </span>
                      </div>
                    ) : (
                      `Select account ...`
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {isLoading && (
                    <SelectItem
                      value="loading"
                      disabled
                      className="flex justify-center"
                    >
                      <Ellipsis className="h-4 w-4 animate-pulse" />
                    </SelectItem>
                  )}
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={`data:image/png;base64,${account.avatar}`}
                          />
                          <AvatarFallback>{account.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{account.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {account.phoneNumber}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ChatSelect disabled={!accountId} />

            <AutoDownloadDialog />
          </div>

          <div className="flex items-center gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      {`${prettyBytes(accountDownloadSpeed, { bits: true })}/s`}
                    </span>
                    <CloudDownloadIcon className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Current account download speed</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {connectionStatus && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant={
                        connectionStatus === "Open" ? "default" : "secondary"
                      }
                    >
                      {connectionStatus === "Open" ? (
                        <ChevronsLeftRightEllipsisIcon className="mr-1 h-4 w-4" />
                      ) : (
                        <UnplugIcon className="mr-1 h-4 w-4" />
                      )}
                      {connectionStatus}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>WebSocket connection status</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <SettingsDialog />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
