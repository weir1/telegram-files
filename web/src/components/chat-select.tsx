import { Check, ChevronsUpDown, Ellipsis } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { useEffect, useState } from "react";
import { useTelegramChat } from "@/hooks/use-telegram-chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { CommandLoading } from "cmdk";

export default function ChatSelect({ disabled }: { disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const {
    isLoading,
    handleQueryChange,
    chats,
    chat: selectedChat,
    handleChatChange,
  } = useTelegramChat();

  useEffect(() => {
    handleQueryChange(search);
  }, [search, handleQueryChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between"
        >
          {selectedChat ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={`data:image/png;base64,${selectedChat.avatar}`}
                />
                <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
              </Avatar>
              <span className="max-w-[170px] overflow-hidden truncate">
                {selectedChat.name}
              </span>
            </div>
          ) : (
            "Select chat ..."
          )}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search chat..."
            className="h-9"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="relative">
            {isLoading && (
              <CommandLoading>
                <div className="absolute left-1/2 top-1/2 -translate-x-2 -translate-y-2 transform">
                  <Ellipsis className="h-4 w-4 animate-pulse" />
                </div>
              </CommandLoading>
            )}
            <CommandEmpty>{!isLoading && chats.length === 0 && "No chat found."}</CommandEmpty>
            <CommandGroup>
              {chats.map((chat) => (
                <CommandItem
                  key={chat.id}
                  value={chat.id}
                  onSelect={(currentValue) => {
                    handleChatChange(currentValue);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-3 w-1 rounded-md bg-green-500 opacity-0",
                        {
                          "opacity-100": chat.autoEnabled,
                        },
                      )}
                    />
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={`data:image/png;base64,${chat.avatar}`}
                      />
                      <AvatarFallback>{chat.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{chat.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {chat.type} • {chat.unreadCount ?? 0} unread
                      </span>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedChat?.id === chat.id
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
