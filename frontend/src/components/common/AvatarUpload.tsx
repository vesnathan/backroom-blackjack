"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Button, Spinner } from "@nextui-org/react";
import { uploadAvatar } from "@/lib/api/uploads";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  username: string;
  onAvatarChange?: (newUrl: string) => void;
  size?: number;
}

export default function AvatarUpload({
  currentAvatarUrl,
  username,
  onAvatarChange,
  size = 100,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setError("Invalid file type. Only JPEG, PNG, and WebP are allowed.");
        return;
      }

      // Validate file size (2MB)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("File too large. Maximum size is 2MB.");
        return;
      }

      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      setIsUploading(true);
      setError(null);

      try {
        const newAvatarUrl = await uploadAvatar(file);
        onAvatarChange?.(newAvatarUrl);
        setPreviewUrl(null); // Clear preview, use actual URL
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setPreviewUrl(null); // Revert to original
      } finally {
        setIsUploading(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [onAvatarChange],
  );

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      triggerFileSelect();
    }
  };

  // Determine which image to show
  const displayUrl = previewUrl || currentAvatarUrl;

  // Generate initials from username
  const initials = username
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar display */}
      <div
        className="relative group cursor-pointer"
        onClick={triggerFileSelect}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Upload avatar"
        style={{ width: size, height: size }}
      >
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt={username}
            width={size}
            height={size}
            className="rounded-full object-cover border-2 border-yellow-500"
            unoptimized // External URLs from S3
          />
        ) : (
          <div
            className="rounded-full bg-gray-700 flex items-center justify-center text-white font-bold border-2 border-yellow-500"
            style={{ width: size, height: size, fontSize: size * 0.4 }}
          >
            {initials}
          </div>
        )}

        {/* Upload overlay */}
        <div
          className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          {isUploading ? (
            <Spinner size="sm" color="warning" />
          ) : (
            <span className="text-white text-xs text-center px-2">
              Change Photo
            </span>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Upload button */}
      <Button
        size="sm"
        variant="flat"
        color="warning"
        onClick={triggerFileSelect}
        isLoading={isUploading}
        isDisabled={isUploading}
      >
        {isUploading ? "Uploading..." : "Upload Photo"}
      </Button>

      {/* Error message */}
      {error && <p className="text-red-500 text-xs text-center">{error}</p>}

      {/* Hint text */}
      <p className="text-gray-500 text-xs text-center">
        JPEG, PNG, or WebP. Max 2MB.
      </p>
    </div>
  );
}
