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
    <>
      <span>
        <input
          type="file"
          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleChange}
          disabled={uploading || disabled}
        />
        {uploading && <span style={{ color: "#888" }}>Uploading...</span>}
      </span>
    </>
  );
}
