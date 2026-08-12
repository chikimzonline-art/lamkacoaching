"use client";

import { useState } from "react";
import { User, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AvatarUploadProps {
  studentId: string;
  initialAvatar?: string | null;
}

export function AvatarUpload({ studentId, initialAvatar }: AvatarUploadProps) {
  const [avatar, setAvatar] = useState(initialAvatar);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large. Maximum size: 2MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "avatar");

      // 1. Upload to ImageKit via our API
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to upload");

      const newAvatarUrl = json.url;
      setAvatar(newAvatarUrl);

      // 2. Update Student Record
      const updateRes = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: studentId,
          avatar: newAvatarUrl,
        }),
      });

      if (!updateRes.ok) {
        throw new Error("Failed to save avatar to profile");
      }

      toast.success("Profile picture updated");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="relative mx-auto h-24 w-24 mb-4 group">
      <div className="h-full w-full rounded-full overflow-hidden bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm">
        {avatar ? (
          <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <User className="h-12 w-12 text-blue-600" />
        )}
      </div>
      
      <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <>
            <Camera className="h-6 w-6 mb-1" />
            <span className="text-[10px] font-medium">Upload</span>
          </>
        )}
        <input 
          type="file" 
          accept="image/png,image/jpeg,image/jpg,image/webp" 
          className="hidden" 
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>
    </div>
  );
}
