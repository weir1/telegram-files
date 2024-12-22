"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ellipsis, LoaderCircle } from "lucide-react";
import { useWebsocket } from "@/hooks/use-websocket";
import {
  TelegramConstructor,
  type TelegramObject,
  WebSocketMessageType,
} from "@/lib/websocket-types";
import { useToast } from "@/hooks/use-toast";
import useSWRMutation from "swr/mutation";
import { request, telegramApi, type TelegramApiArg } from "@/lib/api";
import { useTelegramAccount } from "@/hooks/use-telegram-account";
import { cn } from "@/lib/utils";
import { type TelegramApiResult } from "@/lib/types";
import { useSWRConfig } from "swr";
import { useDebounce } from "use-debounce";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import ProxysDialog from "@/components/proxys-dialog";

export function AccountDialog({
  children,
  isAdd,
}: {
  children: React.ReactNode;
  isAdd?: boolean;
}) {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const [proxyName, setProxyName] = useState<string | undefined>();
  const {
    data: createData,
    trigger: triggerCreate,
    isMutating: isCreateMutating,
    error: createError,
  } = useSWRMutation<{ id: string }, Error>(
    "/telegram/create",
    async (key: string) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return await request(key, {
        method: "POST",
        body: JSON.stringify({
          proxyName: proxyName,
        }),
      });
    },
  );
  const { trigger: triggerMethod, isMutating: isMethodMutating } =
    useSWRMutation<TelegramApiResult, Error, string, TelegramApiArg>(
      "/telegram/api",
      telegramApi,
      {
        onSuccess: (data) => {
          setMethodCodes((prev) => [...prev, data.code]);
        },
      },
    );
  const { account, resetAccount } = useTelegramAccount();
  const [initSuccessfully, setInitSuccessfully] = useState(false);
  const [open, setOpen] = useState(false);

  const [authState, setAuthState] = useState<number | undefined>(undefined);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const { lastJsonMessage } = useWebsocket();

  const [methodCodes, setMethodCodes] = useState<string[]>([]);
  const [methodCompleteCodes, setMethodCompleteCodes] = useState<string[]>([]);

  const [debounceIsCreateMutating] = useDebounce(isCreateMutating, 1000, {
    leading: true,
  });

  const handleAuthState = useCallback(
    (state: TelegramObject) => {
      switch (state.constructor) {
        case TelegramConstructor.WAIT_PHONE_NUMBER:
        case TelegramConstructor.WAIT_CODE:
        case TelegramConstructor.WAIT_PASSWORD:
          setAuthState(state.constructor);
          break;
        case TelegramConstructor.STATE_READY:
          toast({
            title: "Success",
            description: "Account added successfully",
          });
          setTimeout(() => {
            void mutate("/telegrams");
            setOpen(false);
            setPhoneNumber("");
            setCode("");
            setPassword("");
          }, 1000);
          break;
        default:
          console.log("Unknown telegram constructor:", state.constructor);
      }
    },
    [mutate, toast],
  );

  useEffect(() => {
    if (account) {
      if (
        !isAdd &&
        account.status === "inactive" &&
        account.lastAuthorizationState
      ) {
        setInitSuccessfully(true);
        handleAuthState(account.lastAuthorizationState);
        return;
      }
    }

    if (open && isAdd && !initSuccessfully) {
      resetAccount();
    }
  }, [account, handleAuthState, initSuccessfully, isAdd, open, resetAccount]);

  useEffect(() => {
    if (phoneNumber) {
      setPhoneNumber((prev) => prev.replaceAll(/\D/g, ""));
    }
  }, [phoneNumber]);

  useEffect(() => {
    if (!lastJsonMessage) return;
    if (lastJsonMessage.code) {
      setMethodCompleteCodes((prev) => [...prev, lastJsonMessage.code]);
    }

    if (lastJsonMessage.type === WebSocketMessageType.AUTHORIZATION) {
      handleAuthState(lastJsonMessage.data as TelegramObject);
    }
  }, [handleAuthState, lastJsonMessage, toast]);

  const isMethodExecuting = useMemo(() => {
    if (isMethodMutating) return true;
    const lastCode = methodCodes[methodCodes.length - 1];
    if (!lastCode) return false;
    return !methodCompleteCodes.includes(lastCode);
  }, [isMethodMutating, methodCodes, methodCompleteCodes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authState === TelegramConstructor.WAIT_PHONE_NUMBER) {
      await triggerMethod({
        data: {
          phoneNumber: phoneNumber,
          settings: null,
        },
        method: "SetAuthenticationPhoneNumber",
      });
    } else if (authState === TelegramConstructor.WAIT_CODE) {
      await triggerMethod({
        data: {
          code: code,
        },
        method: "CheckAuthenticationCode",
      });
    } else if (authState === TelegramConstructor.WAIT_PASSWORD) {
      await triggerMethod({
        data: {
          password: password,
        },
        method: "CheckAuthenticationPassword",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        aria-describedby={undefined}
        className="relative h-full w-full pb-10 md:h-auto md:min-h-40 md:min-w-[550px]"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Add Telegram Account
            <p className="rounded-md bg-gray-100 p-1 text-xs text-muted-foreground">
              {account ? account.id : createData?.id}
            </p>
          </DialogTitle>
        </DialogHeader>
        {!debounceIsCreateMutating && !initSuccessfully && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Button
              className={cn(
                "w-full",
                debounceIsCreateMutating ? "opacity-50" : "",
              )}
              disabled={debounceIsCreateMutating}
              onClick={async () => {
                await triggerCreate().then(() => {
                  void mutate("/telegrams");
                  setInitSuccessfully(true);
                });
              }}
            >
              {debounceIsCreateMutating ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                "Start Initialization"
              )}
            </Button>
          </div>
        )}
        {debounceIsCreateMutating && (
          <div className="flex items-center justify-center space-x-2 text-xl">
            <span>Initializing account, please wait</span>
            <Ellipsis className="h-4 w-4 animate-pulse" />
          </div>
        )}
        {!debounceIsCreateMutating && createError && (
          <div className="text-center text-xl">
            <span className="mr-3 text-3xl">😲</span>
            Initializing account failed, please try again later.
          </div>
        )}
        {!debounceIsCreateMutating && initSuccessfully && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {authState === TelegramConstructor.WAIT_PHONE_NUMBER && (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <p className="text-xs text-gray-500">
                  Should with country code like: 8613712345678
                </p>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isMethodExecuting}
                  required
                />
              </div>
            )}
            {authState === TelegramConstructor.WAIT_CODE && (
              <div className="space-y-2">
                <Label htmlFor="code">Authentication Code</Label>
                <p className="text-xs text-gray-500">
                  Please enter the code sent to your telegram account.
                </p>
                <InputOTP
                  id="code"
                  maxLength={5}
                  value={code}
                  disabled={isMethodExecuting}
                  required
                  onChange={(value) => setCode(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            )}
            {authState === TelegramConstructor.WAIT_PASSWORD && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <p className="text-xs text-gray-500">
                  You have enabled two-step verification, please enter your
                  password.
                </p>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isMethodExecuting}
                  required
                />
              </div>
            )}
            {authState && (
              <Button
                type="submit"
                className={cn("w-full", isMethodExecuting ? "opacity-50" : "")}
                disabled={isMethodExecuting}
              >
                {isMethodExecuting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  "🚀 Submit"
                )}
              </Button>
            )}
          </form>
        )}
        <ProxysDialog
          telegramId={createData?.id}
          proxyName={proxyName}
          onProxyNameChange={setProxyName}
          enableSelect={true}
          className="absolute bottom-1 right-1"
        />
      </DialogContent>
    </Dialog>
  );
}
