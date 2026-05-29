import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login.jsx"; // 로그인 컴포넌트 (이름 유지)
import SignupForm from "./components/Signup.jsx"; // 회원가입 컴포넌트 (새로 생성 필요)
import FileListView from "./components/FileList.jsx"; // S3 리스트 뷰 (메인 스토리지)

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 1. 첫 화면: 로그인 페이지 (주소: http://localhost:5173/) */}
        <Route path="/" element={<Login />} />

        {/* 2. 회원가입 페이지 (주소: http://localhost:5173/signup) */}
        <Route path="/signup" element={<SignupForm />} />

        {/* 3. 메인 스토리지 리스트 뷰 페이지 (주소: http://localhost:5173/dashboard) */}
        <Route path="/dashboard" element={<FileListView />} />

        {/* 4. 잘못된 주소로 들어왔을 때 자동으로 로그인 페이지로 리다이렉트 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
