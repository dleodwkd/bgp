import React, { useState, useEffect } from "react";
import { UserAuth } from "./components/UserAuth";
import ImageUploader from "./components/ImageUploader";

// ⚠️ 본인의 S3 버킷 정보로 꼭 변경해 주세요!
const S3_BASE_URL = `https://${import.meta.env.VITE_S3_BUCKET_NAME}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com`;
console.log("현재 요청 주소:", S3_BASE_URL);

function App() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]); // S3 파일 목록 저장용 state
  const [loadingList, setLoadingList] = useState(false);

  // 1. S3 버킷의 모든 파일 목록을 가져오는 함수 (XML 파싱)
  const fetchS3Files = async () => {
    setLoadingList(true);
    try {
      // S3 버킷 루트 주소로 GET 요청을 보내면 파일 목록 XML을 줍니다.
      const response = await fetch(S3_BASE_URL);
      if (!response.ok) throw new Error("파일 목록을 불러오지 못했습니다.");

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      // XML 내부의 <Contents> 태그들을 찾아 파일명(Key) 추출
      const contents = xmlDoc.getElementsByTagName("Contents");
      const files = [];

      for (let i = 0; i < contents.length; i++) {
        const key = contents[i].getElementsByTagName("Key")[0].textContent;
        const size = contents[i].getElementsByTagName("Size")[0].textContent;
        const lastModified =
          contents[i].getElementsByTagName("LastModified")[0].textContent;

        files.push({
          name: key,
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

  // 컴포넌트가 처음 켜질 때 파일 목록 로드
  useEffect(() => {
    fetchS3Files();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // 2. 파일 업로드 함수
  const handleFileUpload = async () => {
    if (!file) {
      alert("파일을 선택해 주세요!");
      return;
    }

    setUploading(true);
    const S3_URL = `${S3_BASE_URL}/${file.name}`;

    try {
      const response = await fetch(S3_URL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (response.ok) {
        alert("🎉 AWS S3에 파일 업로드 성공!");
        setFile(null);
        // 업로드 성공 후 목록을 자동으로 새로고침합니다.
        fetchS3Files();
      } else {
        throw new Error("S3 업로드 응답 실패");
      }
    } catch (error) {
      console.error(error);
      alert("업로드 실패! S3 권한이나 설정을 확인하세요.");
    } finally {
      setUploading(false);
    }
  };

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
      <ImageUploader />
      <UserAuth />
    </div>
  );
}

export default App;
