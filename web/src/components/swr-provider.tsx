"use client";
import { SWRConfig } from "swr";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { request } from "@/lib/api";

export const SWRProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  return (
    <SWRConfig
      value={{
        // provider: localStorageProvider,
        refreshInterval: 0,
        errorRetryCount: 1,
        fetcher: request,
        onError: (err: Error) => {
          toast({ title: "Error", description: err.message });
        },
      }}
    >
      {children}
    </SWRConfig>
  );
};
