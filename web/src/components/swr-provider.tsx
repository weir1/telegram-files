"use client";
import { SWRConfig } from "swr";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { request, RequestParsedError } from "@/lib/api";

export const SWRProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  return (
    <SWRConfig
      value={{
        // provider: localStorageProvider,
        refreshInterval: 0,
        errorRetryCount: 1,
        fetcher: request,
        onError: (err: Error, key: string) => {
          let message;
          if (err instanceof RequestParsedError) {
            const responseText = err.responseText;
            if (/<\/?[a-z][\s\S]*>/i.test(responseText)) {
              message = (
                <div dangerouslySetInnerHTML={{ __html: responseText }}></div>
              );
            } else {
              message = responseText;
            }
          } else {
            message = err.message;
          }

          if (key.startsWith("http")) {
            key = new URL(key).pathname;
          }

          toast({
            description: (
              <div className="w-full flex flex-col space-y-2 overflow-hidden">
                <div className="flex items-center space-x-1 text-nowrap">
                  <span className="text-xs text-muted-foreground">
                    Request Failed
                  </span>
                  <p className="rounded-md bg-gray-100 p-1 text-xs text-muted-foreground dark:bg-gray-800">
                    {key}
                  </p>
                </div>
                <div className="line-clamp-3 text-wrap">{message}</div>
              </div>
            ),
          });
        },
      }}
    >
      {children}
    </SWRConfig>
  );
};
