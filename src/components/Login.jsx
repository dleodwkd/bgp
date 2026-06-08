import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// 공통 네온 다크 스타일 테마 적용
export const authStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --border: #1e1e2e;
    --accent: #6c63ff;
    --accent2: #ff6584;
    --text: #e8e8f0;
    --muted: #6b6b80;
    --success: #4ade80;
    --error: #f87171;
  }
  body {
    background: var(--bg);
    // color: var(--text);
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
  }
  .app {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }
  .bg-orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.15;
    pointer-events: none;
    z-index: 0;
  }
  .bg-orb-1 { width: 500px; height: 500px; background: var(--accent); top: -100px; left: -100px; }
  .bg-orb-2 { width: 400px; height: 400px; background: var(--accent2); bottom: -80px; right: -80px; }
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 2.5rem;
    width: 100%;
    max-width: 420px;
    position: relative;
    z-index: 1;
    box-shadow: 0 0 60px rgba(108,99,255,0.08);
  }
  .logo { font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 0.3rem; }
  .logo span { color: var(--accent); }
  .subtitle { color: var(--muted); font-size: 0.85rem; margin-bottom: 2rem; }
  .tab-row { display: flex; background: var(--bg); border-radius: 10px; padding: 4px; margin-bottom: 2rem; gap: 4px; }
  .tab { flex: 1; padding: 0.6rem; border: none; border-radius: 7px; background: transparent; color: var(--muted); font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
  .tab.active { background: var(--accent); color: #fff; }
  .field { margin-bottom: 1.1rem; }
  .field label { display: block; font-size: 0.78rem; font-weight: 500; color: var(--muted); margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.5px; }
  .field input { width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 0.75rem 1rem; color: #2f4f4f; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
  .field input:focus { border-color: var(--accent); }
  .field input::-webkit-input-placeholder{color: #e8e8f0;}
  .btn { width: 100%; padding: 0.85rem; background: var(--accent); border: none; border-radius: 10px; color: #fff; font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 0.5rem; transition: opacity 0.2s, transform 0.1s; }
  .btn:hover { opacity: 0.88; }
  .btn:active { transform: scale(0.98); }
  .notice { margin-top: 1.2rem; padding: 0.7rem 1rem; background: rgba(108,99,255,0.08); border: 1px solid rgba(108,99,255,0.2); border-radius: 8px; font-size: 0.82rem; color: var(--muted); text-align: center; }
`;

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
            <span>BGP Share</span>
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
