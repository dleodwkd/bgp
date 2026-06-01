import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const authStyles = `/* 기존 스타일 그대로 */`;

// 백엔드 주소 (Signup.jsx와 동일한 방식)
const API_BASE = `${import.meta.env.VITE_EC2_IP}/api/login`;

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // handleLoginSubmit 전체 교체
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setStatus({ type: "error", msg: "이메일과 비밀번호를 입력해주세요." });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form), // { email, password }
      });

      const data = await res.json();

      if (res.ok) {
        sessionStorage.setItem("user", JSON.stringify(data.user));
        setStatus({ type: "success", msg: data.message });
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        setStatus({ type: "error", msg: data.error || "로그인 실패" });
      }
    } catch {
      setStatus({ type: "error", msg: "서버에 연결할 수 없습니다." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{authStyles}</style>
      <div className="app">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="card">
          <div className="logo">
            Global<span>Share</span>
          </div>
          <div className="subtitle">파일 공유 플랫폼</div>

          <div className="tab-row">
            <button className="tab active">로그인</button>
            <button className="tab" onClick={() => navigate("/signup")}>
              회원가입
            </button>
          </div>

          <form onSubmit={handleLoginSubmit}>
            <div className="field">
              <label>이메일</label>
              <input
                name="email"
                type="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={handle}
              />
            </div>
            <div className="field">
              <label>비밀번호</label>
              <input
                name="password"
                type="password"
                placeholder="비밀번호 입력"
                value={form.password}
                onChange={handle}
              />
            </div>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {status && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                fontSize: "0.88rem",
                textAlign: "center",
                background:
                  status.type === "success"
                    ? "rgba(74,222,128,0.1)"
                    : "rgba(248,113,113,0.1)",
                color: status.type === "success" ? "#4ade80" : "#f87171",
              }}
            >
              {status.msg}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
