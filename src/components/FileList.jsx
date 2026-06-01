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
      else url = `${API_BASE}/api/files`;

      const res = await fetch(url);
      const data = await res.json();

      // DB 데이터를 기존 FileDownloader가 쓰는 형식으로 변환
      const files = data
        .filter((f) => f.file_name !== "__folder__")
        .map((f) => ({
          id: f.id,
          name: f.file_name,
          key: f.s3_key,
          size: f.file_size ? (f.file_size / 1024).toFixed(2) + " KB" : "-",
          date: new Date(f.created_at).toLocaleString(),
          is_favorite: f.is_favorite,
          is_deleted: f.is_deleted,
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
        {/* 상단 툴바 */}
        <header className="topbar">
          <h1 className="topbar-title">내 파일</h1>
          <div className="search-wrap">
            <span>🔍</span>
            <input type="text" placeholder="파일 검색..." />
          </div>
          {/* 업로더 컴포넌트 장착 - 성공 시 리스트 갱신 */}
          <ImageUploader onUploadSuccess={() => fetchFiles(activeMenu)} />
        </header>

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
            <p style={{ color: "#666", fontSize: "14px" }}>
              목록을 불러오는 중...
            </p>
          ) : fileList.length === 0 ? (
            <div className="drop-zone-inline">
              <span>☁️</span>
              <span>
                버킷이 비어있습니다. <strong>상단의 업로드 버튼</strong>을
                이용해 파일을 추가해 보세요!
              </span>
            </div>
          ) : (
            /* 🚀 기존의 다운로더 부품에 가공된 S3 파일 리스트 주입 */
            <FileDownloader
              files={fileList}
              onRefresh={() => fetchFiles(activeMenu)} // ✅ 추가
            />
          )}
        </div>
      </main>
    </div>
  );
}
