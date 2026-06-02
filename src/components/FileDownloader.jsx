import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_EC2_IP;

export default function FileDownloader({ files, onRefresh, activeMenu, currentUserEmail }) {
  const [downloading, setDownloading] = useState({});

  // ── 다운로드 ──────────────────────────────────────────
  const handleDownload = async (fileKey, fileName, fileId) => {
    setDownloading((prev) => ({ ...prev, [fileKey]: true }));
    try {
      const response = await fetch(`${API_BASE}/api/download/presigned-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileKey, fileId }),
      });
      if (!response.ok) throw new Error("다운로드 URL 발급 실패");
      const { url } = await response.json();

      const fileResponse = await fetch(url);
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

  // ── 즐겨찾기 토글 ────────────────────────────────────
  const handleFavorite = async (fileId) => {
    await fetch(`${API_BASE}/api/files/${fileId}/favorite`, {
      method: "PATCH",
    });
    if (onRefresh) onRefresh();
  };

  // ── 공유하기 토글 ────────────────────────────────────
  const handleShare = async (fileId) => {
    await fetch(`${API_BASE}/api/files/${fileId}/share`, { method: "PATCH" });
    if (onRefresh) onRefresh();
  };

  // ── 휴지통으로 이동 ──────────────────────────────────
  const handleTrash = async (fileId) => {
    if (!confirm("휴지통으로 이동하시겠습니까?")) return;
    await fetch(`${API_BASE}/api/files/${fileId}/trash`, { method: "PATCH" });
    if (onRefresh) onRefresh();
  };

  // ── 실제 영구 삭제 ────────────────────────────────────
  const handleDelete = async (fileId, fileName) => {
    if (
      !confirm(`"${fileName}" 을 영구 삭제하시겠습니까?\n복구가 불가능합니다.`)
    )
      return;
    await fetch(`${API_BASE}/api/files/${fileId}`, { method: "DELETE" });
    if (onRefresh) onRefresh();
  };

  // ── 복원 ─────────────────────────────────────────────
  const handleRestore = async (fileId) => {
    await fetch(`${API_BASE}/api/files/${fileId}/restore`, { method: "PATCH" });
    if (onRefresh) onRefresh();
  };

  const isOwner = (file) => currentUserEmail && currentUserEmail === file.uploader_email;

  return (
    <div style={{ marginTop: "10px" }}>
      {files && files.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {files.map((file) => (
            <li key={file.key || file.id} className="file-item">
              {/* 파일 정보 */}
              <span className="file-info">
                {file.is_favorite ? "⭐ " : ""}
                {file.is_shared ? "🔗 " : ""}
                {file.name}
                <span className="file-meta">
                  {file.size} · {file.date}
                </span>
              </span>

              {/* 액션 버튼 */}
              <div className="file-actions">
                {/* 다운로드 */}
                <button
                  onClick={() => handleDownload(file.key, file.name, file.id)}
                  disabled={downloading[file.key]}
                  style={btnStyle("#007bff")}
                >
                  {downloading[file.key] ? "..." : "⬇ 다운로드"}
                </button>

                {/* 휴지통이 아닐 때만 표시 */}
                {!file.is_deleted && (
                  <>
                    {/* 즐겨찾기 */}
                    <button
                      onClick={() => handleFavorite(file.id)}
                      style={btnStyle(file.is_favorite ? "#f59e0b" : "#6b7280")}
                    >
                      {file.is_favorite ? "★ 해제" : "☆ 즐겨찾기"}
                    </button>

                    {/* 공유 토글 — 업로드한 사람만 가능 */}
                    {isOwner(file) && (
                      <button
                        onClick={() => handleShare(file.id)}
                        style={btnStyle(file.is_shared ? "#8b5cf6" : "#6b7280")}
                      >
                        {file.is_shared ? "🔗 공유해제" : "🔗 공유하기"}
                      </button>
                    )}

                    {/* 휴지통으로 */}
                    {isOwner(file) && (
                      <button
                        onClick={() => handleTrash(file.id)}
                        style={btnStyle("#ef4444")}
                      >
                        🗑 삭제
                      </button>
                    )}
                  </>
                )}

                {/* 휴지통 탭 — 복원/영구삭제도 업로드한 사람만 */}
                {file.is_deleted && isOwner(file) && (
                  <>
                    <button
                      onClick={() => handleRestore(file.id)}
                      style={btnStyle("#10b981")}
                    >
                      ↩ 복원
                    </button>
                    <button
                      onClick={() => handleDelete(file.id, file.name)}
                      style={btnStyle("#dc2626")}
                    >
                      💀 영구삭제
                    </button>
                  </>
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

const btnStyle = (bg) => ({
  padding: "5px 10px",
  backgroundColor: bg,
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
});
