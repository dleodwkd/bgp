import React, { useState } from "react";

export default function ImageUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  // 1. 파일 선택 감지
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // 2. 업로드 실행 버튼 클릭 시
  const handleUpload = async () => {
    if (!file) {
      alert("먼저 파일을 선택해 주세요!");
      return;
    }

    setUploading(true);

    try {
      // ──────────────────────────────────────────────────────────
      // [STEP 1] 내 EC2 백엔드(Nginx)에게 일회용 S3 주소 요청하기
      // ──────────────────────────────────────────────────────────
      // 💡 팁: 현재 도메인이 연동 전이라면 'http://<당신의_EC2_IP>/api/upload/presigned-url' 주소를 적습니다.
      // 💡 대괄호<>는 지우고 IP를 적으셔야 합니다. (예: http://13.125.xx.xx/api/...)
      const backendUrl = `http://${import.meta.env.VITE_EC2_IP}/api/upload/presigned-url`;

      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
        }),
      });

      if (!response.ok) {
        throw new Error("백엔드에서 Presigned URL을 가져오지 못했습니다.");
      }

      // 백엔드가 계산해서 보내준 일회용 주소(url)와 S3 저장 경로(key) 꺼내기
      const { url, key } = await response.json();

      // ──────────────────────────────────────────────────────────
      // [STEP 2] 발급받은 일회용 주소(Presigned URL)로 S3에 직접 업로드
      // ──────────────────────────────────────────────────────────
      const uploadToS3 = await fetch(url, {
        method: "PUT", // ⚠️ S3 Presigned URL 업로드는 무조건 PUT 방식을 사용합니다.
        headers: {
          "Content-Type": file.type, // 파일 종류 (예: image/png)를 헤더에 명시
        },
        body: file, // 실제 파일 바이너리 데이터 전송
      });

      if (uploadToS3.ok) {
        alert("S3에 이미지 업로드 성공! 🎉");

        const s3BucketName = import.meta.env.VITE_S3_BUCKET_NAME; // ⭕ 이것도 환경변수로 처리하면 훌륭합니다!
        // 💡 리전까지 환경 변수로 처리한 가장 안전한 형태
        const finalUrl = `https://${s3BucketName}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${key}`;
        setImageUrl(finalUrl);

        // ⭕ 업로드 성공 후 상단 App.jsx의 리스트를 새로고침하라고 신호 주기
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        throw new Error("S3 버킷으로 파일 전송 중 에러가 발생했습니다.");
      }
    } catch (error) {
      console.error("업로드 실패:", error);
      alert(`업로드 중 오류 발생: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}
    >
      <h3>S3 이미지 업로드 테스트 (Amplify ➔ EC2 ➔ S3)</h3>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        disabled={uploading}
        style={{ marginLeft: "10px" }}
      >
        {uploading ? "업로드 중..." : "S3로 전송"}
      </button>

      {/* 업로드 성공 시 화면에 이미지 띄우기 */}
      {imageUrl && (
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
