import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_EC2_IP;

export default function FileDownloader({ files, onRefresh }) {
  const [downloading, setDownloading] = useState({});

  // ── 다운로드 ──────────────────────────────────────────────
  const handleDownload = async (fileKey, fileName, fileId) => {
    setDownloading((prev) => ({ ...prev, [fileKey]: true }));
    try {
      const response = await fetch(`${API_BASE}/api/download/presigned-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileKey,
          fileId, // ✅ downloaded_at 업데이트용
        }),
      });

      if (!response.ok) throw new Error("다운로드 URL 발급 실패");

      const { url } = await response.json();

      const fileResponse = await fetch(url);
      if (!fileResponse.ok) throw new Error("S3 파일 가져오기 실패");

      const blob = await fileResponse.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName || fileKey.split("/").pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      alert(`다운로드 오류: ${error.message}`);
    } finally {
      setDownloading((prev) => ({ ...prev, [fileKey]: false }));
    }
  };

  // ── 즐겨찾기 토글 ─────────────────────────────────────────
  const handleFavorite = async (fileId) => {
    await fetch(`${API_BASE}/api/files/${fileId}/favorite`, {
      method: "PATCH",
    });
    if (onRefresh) onRefresh(); // 목록 새로고침
  };

  // ── 휴지통으로 이동 ───────────────────────────────────────
  const handleTrash = async (fileId) => {
    if (!confirm("휴지통으로 이동하시겠습니까?")) return;
    await fetch(`${API_BASE}/api/files/${fileId}/trash`, {
      method: "PATCH",
    });
    if (onRefresh) onRefresh();
  };

  // ── 휴지통에서 복원 ───────────────────────────────────────
  const handleRestore = async (fileId) => {
    await fetch(`${API_BASE}/api/files/${fileId}/restore`, {
      method: "PATCH",
    });
    if (onRefresh) onRefresh();
  };

  return (
    <div style={{ marginTop: "10px" }}>
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
              {/* 파일 정보 */}
              <span style={{ flex: 1 }}>
                {file.is_favorite ? "⭐ " : ""}
                {file.name}
                <span
                  style={{ color: "#999", fontSize: "12px", marginLeft: "8px" }}
                >
                  {file.size} · {file.date}
                </span>
              </span>

              {/* 액션 버튼 */}
              <div style={{ display: "flex", gap: "6px" }}>
                {/* 다운로드 */}
                <button
                  onClick={() => handleDownload(file.key, file.name, file.id)}
                  disabled={downloading[file.key]}
                  style={btnStyle("#007bff")}
                >
                  {downloading[file.key] ? "..." : "⬇ 다운로드"}
                </button>

                {/* 즐겨찾기 (휴지통 탭에선 숨김) */}
                {!file.is_deleted && (
                  <button
                    onClick={() => handleFavorite(file.id)}
                    style={btnStyle(file.is_favorite ? "#f59e0b" : "#6b7280")}
                  >
                    {file.is_favorite ? "★ 해제" : "☆ 즐겨찾기"}
                  </button>
                )}

                {/* 휴지통 이동 / 복원 */}
                {file.is_deleted ? (
                  <button
                    onClick={() => handleRestore(file.id)}
                    style={btnStyle("#10b981")}
                  >
                    ↩ 복원
                  </button>
                ) : (
                  <button
                    onClick={() => handleTrash(file.id)}
                    style={btnStyle("#ef4444")}
                  >
                    🗑 삭제
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "#666" }}>조회된 파일이 없습니다.</p>
      )}
    </div>
  );
}

// 버튼 공통 스타일 함수
const btnStyle = (bg) => ({
  padding: "5px 10px",
  backgroundColor: bg,
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
});
