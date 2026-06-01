import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ImageUploader from "./ImageUploader";
import FileDownloader from "./FileDownloader";
import "../App.css";

export default function FileList() {
  const API_BASE = import.meta.env.VITE_EC2_IP;

  const navigate = useNavigate();
  const [fileList, setFileList] = useState([]); // S3 파일 목록 저장
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState(null);

  // LocalStorage에서 로그인한 유저 정보 가져오기 (없으면 기본값)
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("user");
    return savedUser
      ? JSON.parse(savedUser)
      : { nickname: "게스트", email: "guest@example.com" };
  });

  // fetchS3Files 함수 전체를 아래로 교체
  const fetchFiles = async (mode = "shared") => {
    setLoadingList(true);
    setError(null);
    try {
      let url;
      if (mode === "mine")
        url = `${API_BASE}/api/files/mine?email=${user.email}`;
      else if (mode === "favorites")
        url = `${API_BASE}/api/files/favorites?email=${user.email}`;
      else if (mode === "recent")
        url = `${API_BASE}/api/files/recent?email=${user.email}`;
      else if (mode === "trash")
        url = `${API_BASE}/api/files/trash?email=${user.email}`;
      else url = `${API_BASE}/api/files?email=${user.email}`;

      const res = await fetch(url);
      const data = await res.json();

      // DB 데이터를 기존 FileDownloader가 쓰는 형식으로 변환
      // FileList.jsx — fetchFiles 함수 안 이 부분
      const files = data
        .filter((f) => f.file_name !== "__folder__")
        .map((f) => ({
          id: f.id,
          name: f.file_name,
          key: f.s3_key,
          size: f.file_size ? (f.file_size / 1024).toFixed(2) + " KB" : "-",
          date: new Date(f.created_at).toLocaleString(),
          is_favorite: f.is_favorite === 1 || f.is_favorite === true, // ✅
          is_shared: f.is_shared === 1 || f.is_shared === true, // ✅
          is_deleted: f.is_deleted === 1 || f.is_deleted === true, // ✅
        }));

      setFileList(files);
    } catch (err) {
      setError("파일 목록을 불러오지 못했습니다.");
    } finally {
      setLoadingList(false);
    }
  };

  // activeMenu state 추가 (사이드바 메뉴 선택 상태)
  const [activeMenu, setActiveMenu] = useState("shared");

  // useEffect 수정
  useEffect(() => {
    fetchFiles(activeMenu);
  }, [activeMenu]);

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

  return (
    <div className="app-layout">
      {/* ── 사이드바 (Sidebar) ────────────────────────────── */}
      <aside className="sidebar">
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
            onClick={() => setActiveMenu("shared")}
          >
            🔗 공유된 파일
          </div>

          <div
            className={`nav-item ${activeMenu === "mine" ? "active" : ""}`}
            onClick={() => setActiveMenu("mine")}
          >
            📁 내 파일
          </div>

          <div
            className={`nav-item ${activeMenu === "favorites" ? "active" : ""}`}
            onClick={() => setActiveMenu("favorites")}
          >
            ⭐ 즐겨찾기
          </div>

          <div
            className={`nav-item ${activeMenu === "recent" ? "active" : ""}`}
            onClick={() => setActiveMenu("recent")}
          >
            🕐 최근 항목
          </div>

          <div
            className={`nav-item ${activeMenu === "trash" ? "active" : ""}`}
            onClick={() => setActiveMenu("trash")}
          >
            🗑 휴지통
          </div>
        </nav>

        {/* 스토리지 사용량 바 */}
        <div className="storage-info">
          <div className="storage-label">
            <span>저장 공간</span>
            <span>{fileList.length} 개 파일</span>
          </div>
          <div className="storage-bar">
            <div
              className="storage-fill"
              style={{ width: fileList.length > 0 ? "45%" : "0%" }}
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
          {/* topbar-title 부분 */}
          <h1 className="topbar-title">{menuTitle[activeMenu]}</h1>
          {/* ImageUploader 여기서 제거 */}
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
        {/* ✅ 검색바 바로 아래 */}
        <div style={{ marginTop: "16px" }}>
          <ImageUploader onUploadSuccess={() => fetchFiles(activeMenu)} />
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
            <p>목록을 불러오는 중...</p>
          ) : filteredFiles.length === 0 ? ( // ✅ fileList → filteredFiles
            <div className="drop-zone-inline">
              <span>☁️</span>
              <span>
                {searchQuery ? "검색 결과가 없습니다." : "버킷이 비어있습니다."}
              </span>
            </div>
          ) : (
            <FileDownloader
              files={filteredFiles}
              onRefresh={() => fetchFiles(activeMenu)}
              activeMenu={activeMenu}
            />
          )}
        </div>
      </main>
    </div>
  );
}
