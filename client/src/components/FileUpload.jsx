import React, { useState } from "react";
import { SOCKET_URL } from "../socket/socket";

export default function FileUpload({ onUpload, disabled }) {
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${SOCKET_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data && data.url && onUpload) {
        onUpload({
          fileUrl: data.url,
          fileName: file.name,
          fileType: file.type,
        });
      }
    } catch (err) {
      alert("File upload failed");
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <label className="inline-flex items-center gap-2 w-full sm:w-auto">
      <input
        type="file"
        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleChange}
        disabled={uploading || disabled}
        className="hidden"
      />
      <span className="inline-flex items-center gap-2 bg-gray-100 border border-gray-300 px-3 py-1 rounded cursor-pointer hover:bg-gray-200 text-sm w-full sm:w-auto justify-center">
        Upload
      </span>
      {uploading && <span className="text-gray-500">Uploading...</span>}
    </label>
  );
}
