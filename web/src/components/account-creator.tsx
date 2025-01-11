import { useTelegramMethod } from "@/hooks/use-telegram-method";
import useSWRMutation from "swr/mutation";
import { request } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useSWRConfig } from "swr";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { Ellipsis, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TelegramConstructor,
  type TelegramObject,
  WebSocketMessageType,
} from "@/lib/websocket-types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useWebsocket } from "@/hooks/use-websocket";
import { useTelegramAccount } from "@/hooks/use-telegram-account";

interface AccountCreatorProps {
  isAdd?: boolean;
  proxyName: string | undefined;
  onCreated?: (id: string) => void;
  onLoginSuccess?: () => void;
}

export default function AccountCreator({
  isAdd,
  proxyName,
  onCreated,
  onLoginSuccess,
}: AccountCreatorProps) {
  const { triggerMethod, isMethodExecuting } = useTelegramMethod();
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const { lastJsonMessage } = useWebsocket();
  const { account, resetAccount } = useTelegramAccount();
  const [initSuccessfully, setInitSuccessfully] = useState(false);
  const [authState, setAuthState] = useState<number | undefined>(undefined);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const {
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
    {
      onSuccess: (data) => {
        onCreated?.(data.id);
      },
    },
  );
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
            onLoginSuccess?.();
            setPhoneNumber("");
            setCode("");
            setPassword("");
          }, 1000);
          break;
        default:
          console.log("Unknown telegram constructor:", state.constructor);
      }
    },
    [mutate, onLoginSuccess, toast],
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

    if (isAdd && !initSuccessfully) {
      resetAccount();
    }
  }, [account, handleAuthState, initSuccessfully, isAdd, resetAccount]);

  useEffect(() => {
    if (!lastJsonMessage) return;

    if (lastJsonMessage.type === WebSocketMessageType.AUTHORIZATION) {
      handleAuthState(lastJsonMessage.data as TelegramObject);
    }
  }, [handleAuthState, lastJsonMessage]);

  useEffect(() => {
    if (phoneNumber) {
      setPhoneNumber((prev) => prev.replaceAll(/\D/g, ""));
    }
  }, [phoneNumber]);

  if (debounceIsCreateMutating) {
    return (
      <div className="flex items-center justify-center space-x-2 text-xl">
        <span>Initializing account, please wait</span>
        <Ellipsis className="h-4 w-4 animate-pulse" />
      </div>
    );
  }

  if (createError) {
    return (
      <div className="text-center text-xl">
        <span className="mr-3 text-3xl">😲</span>
        Initializing account failed, please try again later.
      </div>
    );
  }

  if (!initSuccessfully) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <Button
          className={cn("w-full", debounceIsCreateMutating ? "opacity-50" : "")}
          disabled={debounceIsCreateMutating}
          onClick={async () => {
            await triggerCreate().then(() => {
              void mutate("/telegrams");
              setInitSuccessfully(true);
            });
          }}
        >
          Start Initialization
        </Button>
      </div>
    );
  }

  if (!authState && !isMethodExecuting) {
    return (
      <div className="flex items-center justify-center space-x-2 text-xl">
        <p>Waiting for the telegram account to be initialized, please wait</p>
        <p>If it takes too long, please refresh the page or try again later.</p>
        <Ellipsis className="h-4 w-4 animate-pulse" />
      </div>
    );
  }

  const authStateFormFields = {
    [TelegramConstructor.WAIT_PHONE_NUMBER]: (
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
    ),
    [TelegramConstructor.WAIT_CODE]: (
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
    ),
    [TelegramConstructor.WAIT_PASSWORD]: (
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <p className="text-xs text-gray-500">
          You have enabled two-step verification, please enter your password.
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
    ),
  };

  const handleSubmit = async (e: FormEvent) => {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {authState && (
        <>
          {authStateFormFields[authState]}
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
        </>
      )}
    </form>
  );
}
