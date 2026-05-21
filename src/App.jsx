import React, { useState } from "react";

export default function App() {
  const [step, setStep] = useState(0);
  const [downloadLink, setDownloadLink] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // ⚠️ 테스트할 Nginx 백엔드 서버의 실제 도메인 또는 IP 주소로 변경하세요.
  const BACKEND_URL = "http://3.36.49.183";

  const handleFileUpload = async (file) => {
    if (!file) return;

    setStep(1); // 1단계: 업로드 중 화면 전환

    const formData = new FormData();
    // Nginx/백엔드가 수신할 폼 데이터 키 이름 (필요시 백엔드 스펙에 맞게 변경)
    formData.append("shared_file", file);

    try {
      const response = await fetch(`${BACKEND_URL}/upload`, {
        method: "POST",
        body: formData,
        // 📌 순수 FormData 전송 시 Content-Type 헤더는 브라우저가 자동 설정하도록 비워둡니다.
      });

      if (!response.ok) {
        throw new Error(`서버 응답 에러: ${response.status}`);
      }

      const data = await response.json();

      // Nginx/백엔드 가 반환하는 JSON 스펙에 맞게 매핑
      if (data.status === "success" || data.download_url) {
        setDownloadLink(data.download_url);
        setStep(2); // 2단계: 완료 화면 전환
      } else {
        alert("업로드 실패: 서버에서 올바른 응답을 받지 못했습니다.");
        setStep(0);
      }
    } catch (error) {
      console.error("통신 실패:", error);
      alert(
        `백엔드 서버와 통신 실패!\nNginx의 CORS 설정이나 IP 주소, 파일 용량 제한을 확인하세요.`,
      );
      setStep(0);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // 드래그 앤 드롭 핸들러 (UX 편의용)
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#F8FAFC",
        minHeight: "100vh",
        fontFamily: "sans-serif",
        padding: "80px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "450px",
          margin: "0 auto",
          background: "white",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)",
        }}
      >
        <h2
          style={{
            color: "#2563EB",
            marginBottom: "10px",
            textAlign: "center",
          }}
        >
          🌐 GlobalShare MVP Test
        </h2>
        <p
          style={{
            fontSize: "13px",
            color: "#64748B",
            marginBottom: "30px",
            textAlign: "center",
          }}
        >
          Nginx 백엔드 연동 테스트 (인증 없음)
        </p>

        {/* 0단계: 업로드 대기 상태 */}
        {step === 0 && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              padding: "40px 20px",
              border: isDragging ? "2px dashed #1D4ED8" : "2px dashed #3B82F6",
              borderRadius: "12px",
              backgroundColor: isDragging ? "#DBEAFE" : "#EFF6FF",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onClick={() => document.getElementById("fileInput").click()}
          >
            <span
              style={{
                color: "#1D4ED8",
                fontWeight: "600",
                display: "block",
                marginBottom: "5px",
              }}
            >
              {isDragging
                ? "여기에 파일을 놓으세요!"
                : "클릭하거나 파일을 드래그하세요"}
            </span>
            <span style={{ fontSize: "12px", color: "#60A5FA" }}>
              파일 업로드 및 다운로드 즉시 테스트
            </span>
            <input
              id="fileInput"
              type="file"
              onChange={handleInputChange}
              style={{ display: "none" }}
            />
          </div>
        )}

        {/* 1단계: 업로드 중 상태 */}
        {step === 1 && (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <p
              style={{
                fontWeight: "bold",
                color: "#2563EB",
                marginBottom: "10px",
              }}
            >
              ⏳ Nginx 서버로 파일 전송 중...
            </p>
            <div style={{ fontSize: "12px", color: "#94A3B8" }}>
              네트워크 환경에 따라 수 초가 걸릴 수 있습니다.
            </div>
          </div>
        )}

        {/* 2단계: 업로드 완료 및 다운로드 링크 제공 상태 */}
        {step === 2 && (
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                color: "#10B981",
                fontWeight: "bold",
                marginBottom: "15px",
              }}
            >
              ✅ 파일 업로드 성공!
            </p>

            <div
              style={{
                padding: "15px",
                background: "#F1F5F9",
                borderRadius: "8px",
                wordBreak: "break-all",
                marginBottom: "25px",
                textAlign: "left",
              }}
            >
              <label
                style={{
                  fontSize: "11px",
                  color: "#64748B",
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                생성된 다운로드 링크:
              </label>
              <a
                href={downloadLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "#2563EB",
                  textDecoration: "underline",
                  fontSize: "13px",
                  lineHeight: "1.5",
                }}
              >
                {downloadLink}
              </a>
            </div>

            <button
              onClick={() => setStep(0)}
              style={{
                padding: "12px 20px",
                background: "#64748B",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                width: "100%",
                fontWeight: "600",
              }}
            >
              새로운 파일 테스트
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
