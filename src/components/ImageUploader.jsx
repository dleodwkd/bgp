import React, { useState, useRef } from "react";

export default function ImageUploader({ onUploadSuccess, folderPath = null }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);

    try {
      const savedUser = sessionStorage.getItem("user");
      const user = savedUser ? JSON.parse(savedUser) : null;
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
          userEmail,
          folder_path: folderPath,
        }),
      });

      const data = await response.json(); // 먼저 한 번만 읽기

      if (!response.ok) {
        throw new Error(data.error || "Presigned URL 발급 실패");
      }

      const { url, key } = data; // 정상이면 여기서 꺼내기

      // XMLHttpRequest로 progress 추적
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () =>
          xhr.status === 200 ? resolve() : reject(new Error("S3 전송 실패"));
        xhr.onerror = () => reject(new Error("네트워크 오류"));
        xhr.open("PUT", url);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });
      const finalUrl = `https://${import.meta.env.VITE_S3_BUCKET_NAME}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${key}`;

      if (user?.id) {
        const recordRes = await fetch(
          `${import.meta.env.VITE_EC2_IP}/api/files/upload-success`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              fileName: file.name,
              s3Url: finalUrl,
              fileSize: file.size,
              folder_path: folderPath,
            }),
          },
        );

        if (!recordRes.ok) {
          const err = await recordRes.json();
          console.log(recordRes);
          throw new Error(err.error); // "개인 저장 공간이 부족하여..." 그대로 alert 뜸
        }
      }

      setImageUrl(finalUrl);
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error("업로드 실패:", error);
      alert(`업로드 오류: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        width: "100%",
      }}
    >
      {/* 드래그 앤 드롭 존 */}
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `1.5px dashed ${dragOver ? "var(--color-border-info)" : "var(--color-border-secondary)"}`,
          borderRadius: "var(--border-radius-lg)",
          padding: "20px 16px",
          textAlign: "center",
          cursor: "pointer",
          background: dragOver
            ? "var(--color-background-info)"
            : "var(--color-background-secondary)",
          transition: "all 0.15s ease",
          userSelect: "none",
        }}
      >
        <i
          className="ti ti-cloud-upload"
          style={{
            fontSize: "28px",
            color: "var(--color-text-secondary)",
            display: "block",
            marginBottom: "6px",
          }}
          aria-hidden="true"
        />
        {file ? (
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--color-text-primary)",
              }}
            >
              {file.name}
            </p>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "12px",
                color: "var(--color-text-secondary)",
              }}
            >
              {formatSize(file.size)}
            </p>
          </div>
        ) : (
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "var(--color-text-secondary)",
              }}
            >
              파일을 드래그하거나 클릭해서 선택
            </p>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "12px",
                color: "var(--color-text-tertiary)",
              }}
            >
              모든 파일 형식 지원
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      {/* 업로드 버튼 */}
      {file && !uploading && (
        <button
          onClick={handleUpload}
          style={{
            padding: "8px 16px",
            background: "var(--color-background-info)",
            color: "var(--color-text-info)",
            border: "0.5px solid var(--color-border-info)",
            borderRadius: "var(--border-radius-md)",
            fontSize: "14px",
            cursor: "pointer",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            justifyContent: "center",
          }}
        >
          <i className="ti ti-upload" aria-hidden="true" />
          S3로 전송
        </button>
      )}

      {/* 업로드 진행 바 */}
      {uploading && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "12px",
              color: "var(--color-text-secondary)",
              marginBottom: "6px",
            }}
          >
            <span>업로드 중...</span>
            <span>{progress}%</span>
          </div>
          <div
            style={{
              height: "4px",
              background: "var(--color-border-tertiary)",
              borderRadius: "9999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "var(--color-text-info)",
                borderRadius: "9999px",
                transition: "width 0.2s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* 이미지 미리보기 */}
      {imageUrl && file?.type.startsWith("image/") && (
        <div
          style={{
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: "var(--border-radius-lg)",
            overflow: "hidden",
          }}
        >
          <p
            style={{
              margin: 0,
              padding: "8px 12px",
              fontSize: "12px",
              color: "var(--color-text-secondary)",
              borderBottom: "0.5px solid var(--color-border-tertiary)",
            }}
          >
            업로드 완료
          </p>
          <img
            src={imageUrl}
            alt="업로드된 이미지"
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: "200px",
              objectFit: "contain",
            }}
          />
        </div>
      )}
    </div>
  );
}
