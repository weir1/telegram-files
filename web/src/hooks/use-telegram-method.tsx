import useSWRMutation from "swr/mutation";
import type { TelegramApiResult } from "@/lib/types";
import { telegramApi, type TelegramApiArg } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useWebsocket } from "@/hooks/use-websocket";

export function useTelegramMethod() {
  const [methodCodes, setMethodCodes] = useState<string[]>([]);
  const [methodCompleteCodes, setMethodCompleteCodes] = useState<string[]>([]);
  const { lastJsonMessage } = useWebsocket();

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

  useEffect(() => {
    if (!lastJsonMessage) return;
    if (lastJsonMessage.code) {
      setMethodCompleteCodes((prev) => [...prev, lastJsonMessage.code]);
    }
  }, [lastJsonMessage]);

  const isMethodExecuting = useMemo(() => {
    if (isMethodMutating) return true;
    const lastCode = methodCodes[methodCodes.length - 1];
    if (!lastCode) return false;
    return !methodCompleteCodes.includes(lastCode);
  }, [isMethodMutating, methodCodes, methodCompleteCodes]);

  return {
    triggerMethod,
    isMethodExecuting,
  };
}
