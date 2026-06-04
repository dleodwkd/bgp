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

  const buildUrl = (mode) => {
    const base = `${API_BASE}/api/files`;
    const q = `email=${encodeURIComponent(user.email)}`;
    if (mode === "mine") return `${base}/mine?${q}`;
    if (mode === "favorites") return `${base}/favorites?${q}`;
    if (mode === "recent") return `${base}/recent?${q}`;
    if (mode === "trash") return `${base}/trash?${q}`;
    return `${base}?${q}`;
  };

  const parseFiles = (data) =>
    data
      .filter((f) => f.file_name !== "__folder__")
      .map((f) => ({
        id: f.id,
        name: f.file_name,
        key: f.s3_key,
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

  // 로그아웃 처리
  const handleLogout = () => {
    sessionStorage.removeItem("user");
    alert("로그아웃 되었습니다.");
    navigate("/"); // 로그인 페이지로 이동
  };

  // ── 검색 state 추가 ──────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");

  // ── 검색 필터링 (프론트에서 처리) ────────────────────────
  const filteredFiles = fileList.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
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
        <div className="storage-info">
          <div className="storage-label">
            <span>저장 공간</span>
            <span>{userFileList.length} 개 파일</span>
          </div>
          <div className="storage-bar">
            <div
              className="storage-fill"
              style={{ width: userFileList.length > 0 ? "45%" : "0%" }}
            />
          </div>
        </div>

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
        <div style={{ marginTop: "16px" }}>
          <ImageUploader onUploadSuccess={fetchFiles} />
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
            />
          )}
        </div>
      </main>
    </div>
  );
}
