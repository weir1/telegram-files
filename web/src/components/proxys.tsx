"use client";
import React, { useState } from "react";
import { useSettings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { type Proxy } from "@/lib/types";
import { BorderBeam } from "@/components/ui/border-beam";
import { cn } from "@/lib/utils";
import useSWRMutation from "swr/mutation";
import { request } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import ProxyPing from "@/components/proxy-ping";

export interface ProxysProps {
  enableSelect?: boolean;
  telegramId?: string;
  proxyName?: string;
  onProxyNameChange?: (name: string) => void;
}

export default function Proxys({
  enableSelect,
  telegramId,
  proxyName,
  onProxyNameChange,
}: ProxysProps) {
  const { settings, updateSettings } = useSettings();
  const [innerProxyName, setInnerProxyName] = useState("");
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingProxy, setEditingProxy] = useState<Proxy | null>(null);
  const [formState, setFormState] = useState<Proxy>({
    name: "",
    server: "",
    port: 0,
    username: "",
    password: "",
    type: "http",
  });
  const { trigger: triggerProxy, isMutating: isToggleProxyMutating } =
    useSWRMutation<{ id: string }, Error>(
      telegramId ? `/telegram/${telegramId}/toggle-proxy` : undefined,
      async (key: string) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return await request(key, {
          method: "POST",
          body: JSON.stringify({
            proxyName: innerProxyName,
          }),
        });
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: innerProxyName
              ? `Proxy is set to ${innerProxyName}`
              : "Proxy is disabled",
          });
        },
      },
    );

  // Parse proxy settings
  const proxys = (
    (settings?.proxys
      ? JSON.parse(settings.proxys)
      : {
          items: [],
        }) as {
      items: Proxy[];
    }
  ).items;

  // Open dialog for adding or editing proxy
  const handleOpenDialog = (proxy: Proxy | null = null): void => {
    setEditingProxy(proxy);
    setFormState(
      proxy ?? {
        name: "",
        server: "",
        port: 0,
        username: "",
        password: "",
        type: "http",
      },
    );
    setDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = (): void => {
    setDialogOpen(false);
    setEditingProxy(null);
  };

  // Delete proxy with confirmation
  const handleDeleteProxy = (proxy: Proxy): void => {
    if (confirm(`Are you sure you want to delete the proxy ${proxy.name}?`)) {
      const updatedProxys = proxys.filter((p) => p.name !== proxy.name);
      void updateSettings({
        proxys: JSON.stringify({
          items: updatedProxys,
        }),
      });
    }
  };

  // Save proxy (either add or edit)
  const handleSaveProxy = (): void => {
    const updatedProxys = editingProxy
      ? proxys.map((p) => (p.name === editingProxy.name ? formState : p))
      : [...proxys, formState];
    void updateSettings({ proxys: JSON.stringify({ items: updatedProxys }) }); // Submit to server
    handleCloseDialog();
  };

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: name === "port" ? parseInt(value, 10) : value,
    }));
  };

  const handleProxySubmit = async () => {
    if (telegramId) {
      await triggerProxy();
    } else {
      onProxyNameChange?.(innerProxyName);
    }
  };

  return (
    <div className="relative h-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold">Proxys</h1>
          {telegramId && <ProxyPing accountId={telegramId} />}
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-5 w-5" /> Add Proxy
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {proxys.map((proxy) => (
          <Card
            key={proxy.name}
            className={cn("relative hover:shadow-lg", {
              "cursor-pointer": enableSelect,
              "border border-primary":
                enableSelect && proxy.name === innerProxyName,
            })}
            onClick={() => {
              if (innerProxyName === proxy.name) {
                setInnerProxyName("");
              } else {
                setInnerProxyName(proxy.name);
              }
            }}
          >
            {proxyName && proxy.name === proxyName && (
              <BorderBeam size={100} duration={12} delay={9} />
            )}
            <CardHeader className="p-2 px-3">
              <CardTitle className="text-xl font-semibold">
                {proxy.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 px-3">
              <div className="flex items-baseline space-x-2">
                <p className="text-lg text-gray-700">
                  {proxy.type.toUpperCase()}
                </p>
                <p className="text-sm text-gray-400">{`${proxy.server}:${proxy.port}`}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2 p-1">
              <Button
                size="xs"
                variant="ghost"
                onClick={() => handleOpenDialog(proxy)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => handleDeleteProxy(proxy)}
              >
                <Trash2 className="h-3 w-3 text-red-600" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {enableSelect && (
        <Button
          className="absolute bottom-4 right-4"
          disabled={isToggleProxyMutating}
          onClick={() => handleProxySubmit()}
        >
          Submit
        </Button>
      )}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProxy ? "Edit Proxy" : "Add Proxy"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Radio buttons for proxy type */}
            <div>
              <label className="mb-1 block text-lg text-gray-700">Type</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="type"
                    value="http"
                    checked={formState.type === "http"}
                    onChange={handleInputChange}
                  />
                  <span>HTTP</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="type"
                    value="socks5"
                    checked={formState.type === "socks5"}
                    onChange={handleInputChange}
                  />
                  <span>SOCKS5</span>
                </label>
              </div>
            </div>

            {/* Other input fields */}
            <div>
              <label className="mb-1 block text-lg text-gray-700">Name</label>
              <Input
                name="name"
                value={formState.name}
                onChange={handleInputChange}
                placeholder="Enter proxy name"
              />
            </div>
            <div>
              <p className="mb-1 text-lg text-gray-700">
                Proxy server address and port number
              </p>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Server
                  </label>
                  <Input
                    name="server"
                    value={formState.server}
                    onChange={handleInputChange}
                    placeholder="Enter server address"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-500">
                    Port
                  </label>
                  <Input
                    name="port"
                    type="number"
                    value={formState.port}
                    onChange={handleInputChange}
                    placeholder="Enter port number"
                  />
                </div>
              </div>
            </div>
            <p className="mb-1 text-lg text-gray-700">
              Authentication (optional)
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Username
              </label>
              <Input
                name="username"
                value={formState.username}
                onChange={handleInputChange}
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Password
              </label>
              <Input
                name="password"
                type="password"
                value={formState.password}
                onChange={handleInputChange}
                placeholder="Enter password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseDialog} variant="ghost">
              Cancel
            </Button>
            <Button onClick={handleSaveProxy}>
              {editingProxy ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
