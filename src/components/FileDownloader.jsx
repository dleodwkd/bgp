import React, { useState } from "react";

export default function FileDownloader({ files }) {
  const [downloading, setDownloading] = useState({});

  const handleDownload = async (fileKey, fileName) => {
    setDownloading((prev) => ({ ...prev, [fileKey]: true }));

    try {
      // [STEP 1] 내 EC2 백엔드에게 일회용 다운로드(S3 Presigned URL) 주소 요청하기
      // 백엔드 엔드포인트(예: /api/download/presigned-url)는 본인의 백엔드 설계에 맞게 수정하세요.
      const backendUrl = `http://${import.meta.env.VITE_EC2_IP}:5000/api/download/presigned-url`;

      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileKey: fileKey, // S3에 저장된 파일 경로/이름
        }),
      });

      if (!response.ok) {
        throw new Error("백엔드에서 다운로드 URL을 가져오지 못했습니다.");
      }

      // 백엔드가 발급해 준 일회용 다운로드 주소 꺼내기
      const { url } = await response.json();

      // [STEP 2] 발급받은 URL로 브라우저에서 직접 강제 다운로드 처리
      const fileResponse = await fetch(url);
      if (!fileResponse.ok)
        throw new Error("S3에서 파일을 가져오는데 실패했습니다.");

      const blob = await fileResponse.blob(); // 파일 바이너리 데이터 가져오기
      const downloadUrl = window.URL.createObjectURL(blob);

      // 가상 <a> 태그를 만들어 브라우저 다운로드 트리거
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName || fileKey.split("/").pop(); // 다운로드될 파일명 지정
      document.body.appendChild(link);
      link.click();

      // 다운로드 완료 후 링크 및 오브젝트 메모리 해제
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("다운로드 실패:", error);
      alert(`다운로드 중 오류 발생: ${error.message}`);
    } finally {
      setDownloading((prev) => ({ ...prev, [fileKey]: false }));
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        marginTop: "20px",
      }}
    >
      <h3>S3 파일 다운로드 목록</h3>
      {files && files.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {files.map((file) => (
            <li
              key={file.key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px",
                borderBottom: "1px solid #eee",
              }}
            >
              <span>
                {file.name} ({file.type})
              </span>
              <button
                onClick={() => handleDownload(file.key, file.name)}
                disabled={downloading[file.key]}
                style={{
                  padding: "5px 10px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {downloading[file.key] ? "다운로드 중..." : "다운로드"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "#666" }}>조회된 파일이 없습니다.</p>
      )}
    </div>
  );
}
