import { useState } from "react";

// ⚠️ ALB DNS 주소로 교체하세요
const API_BASE = "http://YOUR_ALB_DNS";

const styles = `
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
    color: var(--text);
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
  .bg-orb-1 {
    width: 500px; height: 500px;
    background: var(--accent);
    top: -100px; left: -100px;
  }
  .bg-orb-2 {
    width: 400px; height: 400px;
    background: var(--accent2);
    bottom: -80px; right: -80px;
  }

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

  .logo {
    font-family: 'Syne', sans-serif;
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin-bottom: 0.3rem;
  }
  .logo span { color: var(--accent); }

  .subtitle {
    color: var(--muted);
    font-size: 0.85rem;
    margin-bottom: 2rem;
  }

  .tab-row {
    display: flex;
    background: var(--bg);
    border-radius: 10px;
    padding: 4px;
    margin-bottom: 2rem;
    gap: 4px;
  }

  .tab {
    flex: 1;
    padding: 0.6rem;
    border: none;
    border-radius: 7px;
    background: transparent;
    color: var(--muted);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .tab.active {
    background: var(--accent);
    color: #fff;
  }

  .field {
    margin-bottom: 1.1rem;
  }

  .field label {
    display: block;
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--muted);
    margin-bottom: 0.4rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .field input {
    width: 100%;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.2s;
  }
  .field input:focus {
    border-color: var(--accent);
  }
  .field input::placeholder { color: var(--muted); }

  .btn {
    width: 100%;
    padding: 0.85rem;
    background: var(--accent);
    border: none;
    border-radius: 10px;
    color: #fff;
    font-family: 'Syne', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 0.5rem;
    transition: opacity 0.2s, transform 0.1s;
  }
  .btn:hover { opacity: 0.88; }
  .btn:active { transform: scale(0.98); }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .msg {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.88rem;
    text-align: center;
  }
  .msg.success { background: rgba(74,222,128,0.1); color: var(--success); border: 1px solid rgba(74,222,128,0.2); }
  .msg.error   { background: rgba(248,113,113,0.1); color: var(--error);   border: 1px solid rgba(248,113,113,0.2); }

  .notice {
    margin-top: 1.2rem;
    padding: 0.7rem 1rem;
    background: rgba(108,99,255,0.08);
    border: 1px solid rgba(108,99,255,0.2);
    border-radius: 8px;
    font-size: 0.82rem;
    color: var(--muted);
    text-align: center;
  }

  .divider {
    height: 1px;
    background: var(--border);
    margin: 1.5rem 0;
  }

  .home {
    text-align: center;
    z-index: 1;
    position: relative;
  }
  .home h1 {
    font-family: 'Syne', sans-serif;
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
  }
  .home h1 span { color: var(--accent); }
  .home p { color: var(--muted); margin-bottom: 2rem; }
  .home .btn { max-width: 200px; margin: 0 auto; }
`;

export function RegisterForm() {
  const [form, setForm] = useState({
    email: "",
    password_hash: "",
    nickname: "",
  });
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg }
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    if (!form.email || !form.password_hash || !form.nickname) {
      setStatus({ type: "error", msg: "모든 항목을 입력해주세요." });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", msg: data.message || "회원가입 완료!" });
        setForm({ email: "", password_hash: "", nickname: "" });
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
      <button className="btn" onClick={submit} disabled={loading}>
        {loading ? "처리 중..." : "회원가입"}
      </button>
      {status && <div className={`msg ${status.type}`}>{status.msg}</div>}
    </>
  );
}

function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <>
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
      <button className="btn" disabled>
        로그인
      </button>
      <div className="notice">
        ⚠️ 로그인 API가 아직 백엔드에 없습니다.
        <br />
        /api/login 구현 후 연동 예정
      </div>
    </>
  );
}

export default function App() {
  const [tab, setTab] = useState("login");
  const [page, setPage] = useState("auth"); // 'home' | 'auth'

  if (page === "home") {
    return (
      <>
        <style>{styles}</style>
        <div className="app">
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
          <div className="home">
            <h1>
              Global<span>Share</span>
            </h1>
            <p>파일을 안전하게 업로드하고 공유하세요</p>
            <button className="btn" onClick={() => setPage("auth")}>
              시작하기
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="card">
          <div className="logo">
            Global<span>Share</span>
          </div>
          <div className="subtitle">파일 공유 플랫폼</div>

          <div className="tab-row">
            <button
              className={`tab ${tab === "login" ? "active" : ""}`}
              onClick={() => setTab("login")}
            >
              로그인
            </button>
            <button
              className={`tab ${tab === "register" ? "active" : ""}`}
              onClick={() => setTab("register")}
            >
              회원가입
            </button>
          </div>

          {tab === "login" ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </>
  );
}
