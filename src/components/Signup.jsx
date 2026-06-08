import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authStyles } from "./Login"; // 스타일 재사용

// 환경 변수 기반 엔드포인트 조합
const API_BASE = `${import.meta.env.VITE_EC2_IP}/api/register`;

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password_hash: "",
    nickname: "",
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password_hash || !form.nickname) {
      setStatus({ type: "error", msg: "모든 항목을 입력해주세요." });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${API_BASE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", msg: data.message || "회원가입 완료!" });
        setForm({ email: "", password_hash: "", nickname: "" });

        // 1.5초 후 성공 메시지 보여주고 자동으로 로그인 창으로 라우팅
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        setStatus({ type: "error", msg: data.error || "오류가 발생했습니다." });
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
            <button className="tab" onClick={() => navigate("/")}>
              로그인
            </button>
            <button className="tab active">회원가입</button>
          </div>

          <form onSubmit={submit}>
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
                name="password_hash"
                type="password"
                placeholder="비밀번호 입력"
                value={form.password_hash}
                onChange={handle}
              />
            </div>
            <div className="field">
              <label>닉네임</label>
              <input
                name="nickname"
                type="text"
                placeholder="사용할 닉네임"
                value={form.nickname}
                onChange={handle}
              />
            </div>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "처리 중..." : "회원가입"}
            </button>
          </form>

          {status && (
            <div
              className={`msg ${status.type}`}
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
