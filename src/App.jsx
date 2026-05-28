import React, { useState, useEffect } from "react";
// ⚠️ UserAuth 대신 프로젝트 구조에 맞는 Authenticator가 필요하다면 변경하셔도 됩니다.
import { UserAuth } from "./components/UserAuth";
import ImageUploader from "./components/ImageUploader";
import FileDownloader from "./components/FileDownloader";
import RegisterForm from "./components/Login";

// 환경 변수 기반 S3 베이스 주소 조합
const S3_BASE_URL = `https://${import.meta.env.VITE_S3_BUCKET_NAME}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com`;

function App() {
  const [fileList, setFileList] = useState([]); // S3 파일 목록 저장
  const [loadingList, setLoadingList] = useState(false);

  // 1. S3 버킷의 모든 파일 목록을 가져오는 함수 (XML 파싱)
  const fetchS3Files = async () => {
    setLoadingList(true);
    try {
      const response = await fetch(S3_BASE_URL);
      if (!response.ok) throw new Error("파일 목록을 불러오지 못했습니다.");

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
          name: key, // 화면 표시용 이름 (그대로)
          key: key, // ✅ 이것만 추가! S3 key = 다운로드에 사용
          url: `${S3_BASE_URL}/${key}`,
          size: (parseInt(size) / 1024).toFixed(2) + " KB",
          date: new Date(lastModified).toLocaleString(),
        });
      }

      setFileList(files);
    } catch (error) {
      console.error("S3 List Error:", error);
    } finally {
      setLoadingList(false);
    }
  };

  // 컴포넌트 로드 시 실행
  useEffect(() => {
    fetchS3Files();
  }, []);

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h2>☁️ AWS S3 버킷 다이렉트 연동 테스트</h2>

      {/* 로그인, 회원가입*/}
      <RegisterForm />

      <hr
        style={{
          margin: "30px 0",
          border: "0",
          height: "1px",
          background: "#ccc",
        }}
      />

      {/* 🚀 이미지 업로더 부품 블록 장착! */}
      {/* 업로드가 성공하면 목록이 갱신되도록 함수를 전달합니다. */}
      <ImageUploader onUploadSuccess={fetchS3Files} />
      <FileDownloader files={fileList} />

      <hr
        style={{
          margin: "30px 0",
          border: "0",
          height: "1px",
          background: "#ccc",
        }}
      />

      {/* 📁 S3 파일 리스트 출력 영역 */}
      <h3>📁 S3 버킷 파일 목록</h3>
      {loadingList ? (
        <p>목록을 불러오는 중...</p>
      ) : fileList.length === 0 ? (
        <p style={{ color: "#999" }}>
          버킷이 비어있거나 권한 설정(CORS) 확인이 필요합니다.
        </p>
      ) : (
        <ul style={{ paddingLeft: "20px" }}>
          {fileList.map((file, idx) => (
            <li key={idx} style={{ marginBottom: "10px" }}>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontWeight: "bold", color: "#0066cc" }}
              >
                {file.name}
              </a>
              <span
                style={{ fontSize: "12px", color: "#666", marginLeft: "10px" }}
              >
                ({file.size}) - {file.date}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
