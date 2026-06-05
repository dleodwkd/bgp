import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ImageUploader from "./ImageUploader";
import FileDownloader from "./FileDownloader";
import "../App.css";

function SkeletonList({ rows = 5 }) {
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="skeleton-row">
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div className="skeleton skeleton-text" style={{ width: "55%" }} />
            <div className="skeleton skeleton-text" style={{ width: "30%" }} />
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <div className="skeleton skeleton-btn" style={{ width: "80px" }} />
            <div className="skeleton skeleton-btn" style={{ width: "80px" }} />
            <div className="skeleton skeleton-btn" style={{ width: "70px" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function FileList() {
  const API_BASE = import.meta.env.VITE_EC2_IP;

  const navigate = useNavigate();
  const [fileList, setFileList] = useState([]); // S3 파일 목록 저장
  const [userFileList, setUserFileList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState(null);

  // LocalStorage에서 로그인한 유저 정보 가져오기 (없으면 기본값)
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("user");
    return savedUser
      ? JSON.parse(savedUser)
      : { nickname: "게스트", email: "guest@example.com" };
  });

  const [activeMenu, setActiveMenu] = useState("shared");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null);

  const buildUrl = (mode) => {
    const base = `${API_BASE}/api/files`;
    const q = `email=${encodeURIComponent(user.email)}`;
    if (mode === "mine") return `${base}/mine?${q}`;
    if (mode === "favorites") return `${base}/favorites?${q}`;
    if (mode === "recent") return `${base}/recent?${q}`;
    if (mode === "trash") return `${base}/trash?${q}`;
    return `${base}?${q}`;
  };

  const STORAGE_LIMIT = 1 * 1024 * 1024 * 1024; // 1 GB

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  const parseFiles = (data) =>
    data.map((f) => ({
      id: f.id,
      isFolder: f.file_name === "__folder__",
      name: f.file_name === "__folder__" ? f.folder_path : f.file_name,
      folder_path: f.folder_path || null,
      key: f.s3_key,
      rawSize: f.file_size || 0,
      size: f.file_size ? (f.file_size / 1024).toFixed(2) + " KB" : "-",
      date: new Date(f.created_at).toLocaleString(),
      uploader_email: f.user_email,
      is_favorite: f.is_favorite === 1 || f.is_favorite === true,
      is_shared: f.is_shared === 1 || f.is_shared === true,
      is_deleted: f.is_deleted === 1 || f.is_deleted === true,
    }));

  // activeMenu 또는 refreshKey가 바뀔 때마다 실행
  // AbortController로 이전 요청을 취소해 race condition 방지
  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoadingList(true);
      setError(null);
      try {
        const res = await fetch(buildUrl(activeMenu), {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const parsed = parseFiles(data);
        setFileList(parsed);

        // 프로그레스바
        const mineRes = await fetch(
          `${API_BASE}/api/files/mine?email=${encodeURIComponent(user.email)}`,
          { signal: controller.signal },
        );
        if (!mineRes.ok) throw new Error(`HTTP ${mineRes.status}`);
        const mineData = await mineRes.json();
        setUserFileList(parseFiles(mineData));
      } catch (err) {
        if (err.name === "AbortError") return;
        setError("파일 목록을 불러오지 못했습니다.");
      } finally {
        if (!controller.signal.aborted) setLoadingList(false);
      }
    };

    load();
    return () => controller.abort();
  }, [activeMenu, refreshKey]);

  // 업로드 완료·즐겨찾기·공유 등 조작 후 목록 새로고침
  const fetchFiles = () => setRefreshKey((k) => k + 1);

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    setCreatingFolder(true);
    try {
      const res = await fetch(`${API_BASE}/api/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: user.email, folder_path: folderName.trim() }),
      });
      if (!res.ok) throw new Error("폴더 생성에 실패했습니다.");
      setFolderName("");
      setShowFolderModal(false);
      fetchFiles();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingFolder(false);
    }
  };

  // 로그아웃 처리
  const handleLogout = () => {
    sessionStorage.removeItem("user");
    alert("로그아웃 되었습니다.");
    navigate("/"); // 로그인 페이지로 이동
  };

  // ── 검색 state 추가 ──────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");

  // ── 검색 필터링 (프론트에서 처리) ────────────────────────
  const filteredFiles = fileList
    .filter((f) => {
      if (!f.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (currentFolder === null) {
        // 루트: 폴더 항목 전체 + folder_path 없는 파일만 표시
        return f.isFolder || !f.folder_path;
      }
      // 폴더 내부: 해당 folder_path 가진 파일만 표시
      return !f.isFolder && f.folder_path === currentFolder;
    })
    .sort((a, b) => (b.isFolder ? 1 : 0) - (a.isFolder ? 1 : 0));
  const menuTitle = {
    shared: "공유된 파일",
    mine: "내 파일",
    favorites: "즐겨찾기",
    recent: "최근 항목",
    trash: "휴지통",
  };

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
    setSidebarOpen(false);
    setCurrentFolder(null);
  };

  return (
    <div className="app-layout">
      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── 사이드바 (Sidebar) ────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="logo">
          <span className="logo-icon">☁</span>
          <div>
            <div className="logo-name">GlobalShare</div>
            <div className="logo-sub">Cloud Storage</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div
            className={`nav-item ${activeMenu === "shared" ? "active" : ""}`}
            onClick={() => handleMenuClick("shared")}
          >
            🔗 공유된 파일
          </div>

          <div
            className={`nav-item ${activeMenu === "mine" ? "active" : ""}`}
            onClick={() => handleMenuClick("mine")}
          >
            📁 내 파일
          </div>

          <div
            className={`nav-item ${activeMenu === "favorites" ? "active" : ""}`}
            onClick={() => handleMenuClick("favorites")}
          >
            ⭐ 즐겨찾기
          </div>

          <div
            className={`nav-item ${activeMenu === "recent" ? "active" : ""}`}
            onClick={() => handleMenuClick("recent")}
          >
            🕐 최근 항목
          </div>

          <div
            className={`nav-item ${activeMenu === "trash" ? "active" : ""}`}
            onClick={() => handleMenuClick("trash")}
          >
            🗑 휴지통
          </div>
        </nav>

        {/* 스토리지 사용량 바 */}
        {(() => {
          const totalUsed = userFileList.reduce((sum, f) => sum + f.rawSize, 0);
          const pct = Math.min((totalUsed / STORAGE_LIMIT) * 100, 100);
          const barColor =
            pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#4a72b2";
          return (
            <div className="storage-info">
              <div className="storage-label">
                <span>저장 공간</span>
                <span className="storage-pct">{pct.toFixed(1)}%</span>
              </div>
              <div className="storage-bar">
                <div
                  className="storage-fill"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
              <div className="storage-usage-text">
                <span>{formatBytes(totalUsed)}</span>
                <span>/ 1 GB</span>
              </div>
            </div>
          );
        })()}

        {/* 로그인한 유저 영역 */}
        <div className="user-area">
          <div className="avatar">{user.nickname ? user.nickname[0] : "U"}</div>
          <div className="user-info">
            <div className="user-name">{user.nickname}</div>
            <div className="user-email">{user.email}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </aside>

      {/* ── 메인 콘텐츠 (Main Content) ─────────────────────────── */}
      <main className="main-content">
        {/* 상단바 */}
        <header className="topbar">
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="메뉴 열기"
          >
            ☰
          </button>
          <h1 className="topbar-title">{menuTitle[activeMenu]}</h1>
          {activeMenu !== "trash" && currentFolder === null && (
            <button
              className="btn-outline"
              onClick={() => setShowFolderModal(true)}
            >
              📁 새 폴더
            </button>
          )}
        </header>
        <div className="search-wrap">
          <span>🔍</span>
          <input
            type="text"
            placeholder="파일 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {currentFolder && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
            <span
              style={{ cursor: "pointer", color: "#1a73e8" }}
              onClick={() => setCurrentFolder(null)}
            >
              홈
            </span>
            <span style={{ color: "#a0aec0" }}>/</span>
            <span style={{ color: "#222", fontWeight: 600 }}>📁 {currentFolder}</span>
          </div>
        )}

        <div style={{ marginTop: "16px" }}>
          <ImageUploader onUploadSuccess={fetchFiles} folderPath={currentFolder} />
        </div>

        {/* 통계 카드 행 */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">전체 파일 개수</div>
            <div className="stat-value">
              {loadingList ? "..." : fileList.length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">스토리지 상태</div>
            <div
              className="stat-value"
              style={{
                fontSize: "16px",
                marginTop: "8px",
                color: "#4ade80",
                fontWeight: "600",
              }}
            >
              {loadingList ? "동기화 중..." : "AWS S3 연결됨"}
            </div>
          </div>
        </div>

        {/* 에러 발생 시 안내 배너 */}
        {error && <div className="error-banner">⚠ {error}</div>}

        {/* 📁 S3 파일 리스트 영역 */}
        <div style={{ marginTop: "10px" }}>
          <h3
            style={{
              marginBottom: "16px",
              color: "#222",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            📁 S3 버킷 파일 목록
          </h3>

          {loadingList ? (
            <SkeletonList />
          ) : filteredFiles.length === 0 ? (
            <div className="drop-zone-inline">
              <span>☁️</span>
              <span>
                {searchQuery ? "검색 결과가 없습니다." : "버킷이 비어있습니다."}
              </span>
            </div>
          ) : (
            <FileDownloader
              files={filteredFiles}
              onRefresh={fetchFiles}
              activeMenu={activeMenu}
              currentUserEmail={user.email}
              onFolderClick={setCurrentFolder}
            />
          )}
        </div>
      </main>

      {showFolderModal && (
        <div
          className="modal-backdrop"
          onClick={() => { setShowFolderModal(false); setFolderName(""); }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "28px",
              width: "360px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
              새 폴더 만들기
            </h2>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              placeholder="폴더 이름"
              autoFocus
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "14px",
                outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                className="btn-outline"
                onClick={() => { setShowFolderModal(false); setFolderName(""); }}
              >
                취소
              </button>
              <button
                className="btn-primary"
                onClick={handleCreateFolder}
                disabled={!folderName.trim() || creatingFolder}
              >
                {creatingFolder ? "생성 중..." : "만들기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
