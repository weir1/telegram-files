import React from "react";
import useSWR from "swr";
import {
  AlertTriangle,
  CheckCircle, CloudDownload,
  Download,
  File,
  FileText,
  Image,
  Music,
  PauseCircle,
  Video,
} from "lucide-react";
import { request } from "@/lib/api"; // Define a fetcher function to handle the API request

// Interface defining the structure of the data returned from the API
interface StatisticsData {
  total: number;
  downloading: number;
  paused: number;
  completed: number;
  error: number;
  photo: number;
  video: number;
  audio: number;
  file: number;
}

// Props interface for the component, expecting a telegramId as input
interface FileStatisticsProps {
  telegramId: string;
}

const FileStatistics: React.FC<FileStatisticsProps> = ({ telegramId }) => {
  // Use SWR for data fetching and caching
  const { data, error } = useSWR<StatisticsData, Error>(
    `/telegram/${telegramId}/download-statistics`,
    request,
  );

  // Render an error message if the API call fails
  if (error) {
    return (
      <div className="flex items-center space-x-2 rounded-lg bg-white p-4 text-red-600 shadow-md">
        <AlertTriangle className="h-5 w-5" />
        <span>Failed to load data.</span>
      </div>
    );
  }

  // Render a loading indicator while the data is being fetched
  if (!data) {
    return (
      <div className="flex items-center space-x-2 rounded-lg bg-white p-4 text-gray-600 shadow-md">
        <Download className="h-5 w-5 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  // Destructure the fetched data for easier usage
  const {
    total,
    downloading,
    paused,
    completed,
    error: errorCount,
    photo,
    video,
    audio,
    file,
  } = data;

  // Prepare an array of completed file types with their respective icons
  const completedTypes = [
    {
      label: "Photo",
      value: photo,
      // eslint-disable-next-line jsx-a11y/alt-text
      icon: <Image className="h-5 w-5 text-blue-500" />,
    },
    {
      label: "Video",
      value: video,
      icon: <Video className="h-5 w-5 text-green-500" />,
    },
    {
      label: "Audio",
      value: audio,
      icon: <Music className="h-5 w-5 text-purple-500" />,
    },
    {
      label: "File",
      value: file,
      icon: <File className="h-5 w-5 text-gray-500" />,
    },
  ];

  return (
    <div className="space-y-6 rounded-lg bg-gray-50 p-6">
      <div className="flex-1 rounded-lg bg-white p-4 shadow-md">
        <div className="flex items-center space-x-3 border-gray-200">
          <CloudDownload className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Download Statistics</h2>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-lg bg-gray-50 p-4 shadow-sm">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-600">Total Files</span>
            </div>
            <div className="mt-2 text-lg text-center font-semibold text-gray-800">
              {total}
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 shadow-sm">
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">Downloading</span>
            </div>
            <div className="mt-2 text-lg text-center font-semibold text-gray-800">
              {downloading}
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 shadow-sm">
            <div className="flex items-center space-x-2">
              <PauseCircle className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-gray-600">Paused</span>
            </div>
            <div className="mt-2 text-lg text-center font-semibold text-gray-800">
              {paused}
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 shadow-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">Completed</span>
            </div>
            <div className="mt-2 text-lg text-center font-semibold text-gray-800">
              {completed}
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 shadow-sm">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-gray-600">Error</span>
            </div>
            <div className="mt-2 text-lg text-center font-semibold text-gray-800">
              {errorCount}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-lg bg-white p-4 shadow-md">
        <h3 className="text-md flex items-center space-x-2 font-semibold text-gray-700">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span>Completed by Type</span>
        </h3>
        <ul className="mt-4 grid grid-cols-2 gap-4">
          {completedTypes.map((type) => (
            <li
              key={type.label}
              className="rounded-lg bg-gray-50 p-3 shadow-sm"
            >
              <div className="flex items-center space-x-2">
                {type.icon}
                <span className="text-sm text-gray-600">{type.label}</span>
              </div>
              <div className="mt-2 text-lg font-semibold text-gray-800">
                {type.value}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FileStatistics;
