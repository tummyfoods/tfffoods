import { useState } from "react";
import { toast } from "react-hot-toast";
import { CloudinaryUploadResult, isCloudinaryUploadResult } from "@/types";
import type { CloudinaryUploadWidgetOptions } from "next-cloudinary";

interface UseCloudinaryUploadOptions {
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
  maxFiles?: number;
  folder?: string;
  allowedFormats?: string[];
  maxFileSize?: number;
  multiple?: boolean;
}

export function useCloudinaryUpload(options: UseCloudinaryUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (result: unknown) => {
    setIsUploading(true);
    try {
      if (isCloudinaryUploadResult(result)) {
        const url = result.info.secure_url;
        options.onSuccess?.(url);
        toast.success("Upload successful");
      } else {
        throw new Error("Invalid upload result");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed. Please try again.");
      options.onError?.(error as Error);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadOptions: CloudinaryUploadWidgetOptions = {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    maxFiles: options.maxFiles || 1,
    sources: ["local", "url", "camera"] as const,
    clientAllowedFormats: options.allowedFormats || [
      "jpg",
      "jpeg",
      "png",
      "webp",
    ],
    maxFileSize: options.maxFileSize || 10000000,
    multiple: options.multiple || false,
    folder: options.folder,
  };

  return {
    handleUpload,
    isUploading,
    uploadOptions,
  };
}
