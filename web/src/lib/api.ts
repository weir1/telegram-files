import { env } from "@/env";
import { toast } from "@/hooks/use-toast";

export function getApiUrl(): string {
  const url = env.NEXT_PUBLIC_API_URL;
  if (url.startsWith("http")) {
    return url;
  }
  if (typeof window === "undefined") {
    return url;
  }
  return `${window.location.protocol}//${window.location.host}${url}`;
}

export function getWsUrl(): string {
  const url = env.NEXT_PUBLIC_WS_URL;
  if (url.startsWith("ws")) {
    return url;
  }
  if (typeof window === "undefined") {
    return url;
  }
  return `${window.location.protocol === "https:" ? "wss" : "ws"}://${
    window.location.host
  }${url}`;
}

/* eslint-disable */
export async function request(
  api: string,
  requestInit?: RequestInit,
): Promise<any> {
  return fetch(`${getApiUrl()}${api}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    ...requestInit,
  }).then(async (res) => {
    let responseText = "Failed to fetch";
    try {
      responseText = await res.text();
      if (!responseText || responseText === "") {
        return;
      }
      const data = JSON.parse(responseText);
      if (res.ok) {
        return data;
      }
      throw new Error(data.error ?? responseText);
    } catch (err: Error | any) {
      toast({ title: "Error", description: err.message });
      throw err;
    }
  });
}

export function localStorageProvider() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const map = new Map<string, any>(
    JSON.parse(localStorage.getItem("telegram-files") ?? "[]"),
  );

  window.addEventListener("beforeunload", () => {
    const appCache = JSON.stringify(Array.from(map.entries()));
    localStorage.setItem("telegram-files", appCache);
  });

  return map;
}

export async function POST(api: string, data?: any): Promise<any> {
  return await request(api, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type TelegramApiArg = {
  data: any;
  method: string;
};

export async function telegramApi(
  api: string,
  {
    arg,
  }: {
    arg: TelegramApiArg;
  },
): Promise<any> {
  return await request(`${api}/${arg.method}`, {
    method: "POST",
    body: arg.data ? JSON.stringify(arg.data) : undefined,
  });
}
