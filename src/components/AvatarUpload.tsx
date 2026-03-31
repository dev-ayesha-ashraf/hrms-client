"use client";

import { useState, useRef } from "react";
import { uploadAvatar } from "@/lib/api";

interface AvatarUploadProps {
  employeeId: number;
  currentAvatarUrl: string | null;
  employeeName: string;
  onUploadSuccess: (newAvatarUrl: string) => void;
}

export default function AvatarUpload({
  employeeId,
  currentAvatarUrl,
  employeeName,
  onUploadSuccess,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl);

  // ref to trigger the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // client-side validation before even hitting the API
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images allowed");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("File must be under 2MB");
      return;
    }

    setError("");

    // show a preview immediately using a local object URL
    // this is instant — no upload needed to show the preview
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    // now upload
    handleUpload(file);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const updated = await uploadAvatar(employeeId, file);
      // tell the parent component the new URL
      onUploadSuccess(updated.avatar_url);
    } catch (err: any) {
      setError(err.message);
      // revert preview if upload failed
      setPreview(currentAvatarUrl);
    } finally {
      setUploading(false);
    }
  }

  // get initials for the fallback avatar
  const initials = employeeName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="surface-card surface-card-soft" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "20px" }}>

      {/* avatar circle */}
      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          width: "96px",
          height: "96px",
          borderRadius: "50%",
          overflow: "hidden",
          cursor: "pointer",
          background: "linear-gradient(135deg, rgba(14, 43, 105, 0.92), rgba(20, 216, 196, 0.82))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          fontWeight: "bold",
          color: "#fff",
          border: "2px dashed rgba(255,255,255,0.85)",
          position: "relative",
          boxShadow: "0 16px 34px rgba(13, 35, 64, 0.16)",
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt={employeeName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          initials
        )}

        {/* overlay while uploading */}
        {uploading && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "11px",
          }}>
            Uploading...
          </div>
        )}
      </div>

      <span className="muted-text" style={{ fontSize: "12px" }}>
        Click to {preview ? "change" : "upload"} photo
      </span>

      {error && <span className="form-error">{error}</span>}

      {/* hidden file input — triggered by clicking the avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
    </div>
  );
}