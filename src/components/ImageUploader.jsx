import React, { useState } from "react";

export default function ImageUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(""); // ✅ 추가

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("먼저 파일을 선택해 주세요!");
      return;
    }

    setUploading(true);

    try {
      const savedUser = sessionStorage.getItem("user");
      const userEmail = savedUser
        ? JSON.parse(savedUser).email
        : "guest@example.com";

      const backendUrl = `${import.meta.env.VITE_EC2_IP}/api/upload/presigned-url`;

      const response = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          userEmail: userEmail,
        }),
      });

      if (!response.ok) throw new Error("Presigned URL 발급 실패");

      const { url, key } = await response.json();

      const uploadToS3 = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (uploadToS3.ok) {
        alert("업로드 성공! 🎉");

        // ✅ 업로드된 이미지 URL 생성 및 저장
        const finalUrl = `https://${import.meta.env.VITE_S3_BUCKET_NAME}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${key}`;
        setImageUrl(finalUrl);

        if (onUploadSuccess) onUploadSuccess();
      } else {
        throw new Error("S3 전송 실패");
      }
    } catch (error) {
      console.error("업로드 실패:", error);
      alert(`업로드 오류: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={uploading}>
          {uploading ? "업로드 중..." : "S3로 전송"}
        </button>
      </div>

      {/* ✅ 업로드 성공 시 이미지 미리보기 */}
      {imageUrl && file?.type.startsWith("image/") && (
        <div style={{ marginTop: "20px" }}>
          <p>업로드된 이미지 미리보기:</p>
          <img
            src={imageUrl}
            alt="S3 업로드 이미지"
            style={{ maxWidth: "300px", borderRadius: "4px" }}
          />
        </div>
      )}
    </div>
  );
}
