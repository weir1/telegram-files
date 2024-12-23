import React from "react";
import useSWR from "swr";
import { Github, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { request } from "@/lib/api";
import Link from "next/link";

interface VersionData {
  version: string;
}

interface GitHubReleaseData {
  tag_name: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function About() {
  const { data: apiData, error: apiError } = useSWR<VersionData, Error>(
    "/version",
    request,
  );
  const { data: githubData, error: githubError } = useSWR<
    GitHubReleaseData,
    Error
  >(
    "https://api.github.com/repos/jarvis2f/telegram-files/releases/latest",
    fetcher,
  );

  const projectInfo = {
    repository: "https://github.com/jarvis2f/telegram-files",
    author: "Jarvis2f",
  };

  const currentVersion = apiData?.version ?? "Unknown";
  const isNewVersionAvailable =
    githubData && githubData.tag_name !== currentVersion;

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#7900ff] via-[#548cff] to-[#93ffd8] md:w-1/2">
        <CardHeader>
          <CardTitle className="text-white">About This Project</CardTitle>
          <CardDescription className="text-white">
            A simple telegram file downloader.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center">
              <p className="text-sm font-medium text-white">Author</p>
              <p>{projectInfo.author}</p>
            </div>

            <div className="flex flex-col items-center justify-center">
              <p className="mb-1 text-sm font-medium text-white">
                Current Version
              </p>
              {apiError ? (
                <p className="text-red-500">Failed to load current version</p>
              ) : !apiData ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="animate-spin text-white" size={16} />
                  <span>Loading...</span>
                </div>
              ) : (
                <p className="rounded bg-gray-100 px-3">{currentVersion}</p>
              )}
            </div>

            <div className="flex flex-col items-center justify-center">
              <p className="mb-1 text-sm font-medium text-white">
                Latest Version
              </p>
              {githubError ? (
                <p className="text-red-500">Failed to load release data</p>
              ) : !githubData ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="animate-spin text-white" size={16} />
                  <span>Loading...</span>
                </div>
              ) : (
                <p className="rounded bg-gray-100 px-3">
                  {githubData.tag_name}
                </p>
              )}
            </div>

            {isNewVersionAvailable && (
              <div className="border-l-4 border-gray-700 bg-white px-4 py-2">
                <p className="text-gray-800">
                  A new version ({githubData?.tag_name}) is available! Update
                  now.
                </p>
              </div>
            )}

            <div className="flex items-center justify-center space-x-2">
              <Link
                href={projectInfo.repository}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
