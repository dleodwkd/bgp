import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ImageUploader from "./ImageUploader";
import FileDownloader from "./FileDownloader";
import "../App.css";

// 환경 변수 기반 S3 베이스 주소 조합
const S3_BASE_URL = `https://${import.meta.env.VITE_S3_BUCKET_NAME}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com`;

export default function FileList() {
  const navigate = useNavigate();
  const [fileList, setFileList] = useState([]); // S3 파일 목록 저장
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState(null);

  // LocalStorage에서 로그인한 유저 정보 가져오기 (없으면 기본값)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser
      ? JSON.parse(savedUser)
      : { nickname: "게스트", email: "guest@example.com" };
  });

  // S3 버킷의 모든 파일 목록을 가져오는 함수 (XML 파싱)
  const fetchS3Files = async () => {
    setLoadingList(true);
    setError(null);
    try {
      const response = await fetch(S3_BASE_URL);
      if (!response.ok)
        throw new Error(
          "파일 목록을 불러오지 못했습니다. S3 CORS 설정을 확인하세요.",
        );

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      const contents = xmlDoc.getElementsByTagName("Contents");
      const files = [];

      for (let i = 0; i < contents.length; i++) {
        const key = contents[i].getElementsByTagName("Key")[0].textContent;
        const size = contents[i].getElementsByTagName("Size")[0].textContent;
        const lastModified =
          contents[i].getElementsByTagName("LastModified")[0].textContent;

        files.push({
          name: key,
          key: key,
          url: `${S3_BASE_URL}/${key}`,
          size: (parseInt(size) / 1024).toFixed(2) + " KB",
          date: new Date(lastModified).toLocaleString(),
        });
      }

      setFileList(files);
    } catch (error) {
      console.error("S3 List Error:", error);
      setError(error.message);
    } finally {
      setLoadingList(false);
    }
  };

  // 컴포넌트 로드 시 S3 파일 목록 조회
  useEffect(() => {
    fetchS3Files();
  }, []);

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.removeItem("user");
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
          <div className="nav-section">Storage</div>
          <div className="nav-item active">📁 내 파일</div>
          <div className="nav-item">🔗 공유된 파일</div>
          <div className="nav-item">⭐ 즐겨찾기</div>
          <div className="nav-item">🕐 최근 항목</div>
          <div className="nav-section">관리</div>
          <div className="nav-item">⚙️ 설정</div>
          <div className="nav-item">🗑 휴지통</div>
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
          <ImageUploader onUploadSuccess={fetchS3Files} />
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
            <FileDownloader files={fileList} />
          )}
        </div>
      </main>
    </div>
  );
}
