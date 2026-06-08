import React from "react";
import { useNavigate } from "react-router-dom";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lp {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f7f7fb;
    font-family: 'DM Sans', sans-serif;
    overflow: hidden;
  }

  /* nav */
  .lp-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 2.5rem;
    background: #fff;
    border-bottom: 1px solid #ebebf3;
  }
  .lp-logo {
    font-family: 'Syne', sans-serif;
    font-size: 1.2rem;
    font-weight: 800;
    color: #1a1a2e;
  }
  .lp-logo span { color: #6c63ff; }

  /* main */
  .lp-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
    gap: 1.5rem;
  }

  .lp-tag {
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 500;
    color: #6c63ff;
    background: rgba(108,99,255,0.08);
    border: 1px solid rgba(108,99,255,0.18);
    border-radius: 100px;
    padding: 0.3rem 0.85rem;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .lp-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(2rem, 4.5vw, 3.2rem);
    font-weight: 800;
    color: #1a1a2e;
    line-height: 1.15;
    letter-spacing: -1px;
  }
  .lp-title span { color: #6c63ff; }

  .lp-desc {
    font-size: 0.95rem;
    color: #888;
    font-weight: 300;
    line-height: 1.7;
    max-width: 400px;
  }

  .lp-btns {
    display: flex;
    gap: 0.75rem;
  }
  .btn-fill {
    padding: 0.75rem 1.8rem;
    background: #6c63ff;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-family: 'Syne', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
  }
  .btn-fill:hover { opacity: 0.88; }
  .btn-fill:active { transform: scale(0.97); }
  .btn-outline {
    padding: 0.75rem 1.8rem;
    background: transparent;
    color: #1a1a2e;
    border: 1px solid #d8d8e8;
    border-radius: 10px;
    font-family: 'Syne', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: border-color 0.2s;
  }
  .btn-outline:hover { border-color: #6c63ff; color: #6c63ff; }

  /* chips */
  .lp-chips {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    justify-content: center;
  }
  .chip {
    font-size: 0.75rem;
    color: #555;
    background: #fff;
    border: 1px solid #e4e4ef;
    border-radius: 8px;
    padding: 0.35rem 0.75rem;
    font-weight: 400;
  }

  /* footer */
  .lp-footer {
    text-align: center;
    padding: 1rem;
    font-size: 0.75rem;
    color: #bbb;
    border-top: 1px solid #ebebf3;
    background: #fff;
  }
`;

export default function Landing() {
  const navigate = useNavigate();

  return (
    <>
      <style>{styles}</style>
      <div className="lp">
        <nav className="lp-nav">
          <div className="lp-logo">
            <span>BGP</span> Share
          </div>
        </nav>

        <main className="lp-main">
          <span className="lp-tag">Multi-Region · AWS</span>

          <h1 className="lp-title">
            파일을 <span>간편하게</span>
            <br />전 세계와 공유하세요
          </h1>

          <p className="lp-desc">
            서울 · 상파울루 리전 기반의
            <br />
            빠르고 안전한 글로벌 파일 공유 플랫폼
          </p>

          <div className="lp-btns">
            <button className="btn-fill" onClick={() => navigate("/signup")}>
              무료로 시작하기 →
            </button>
            <button className="btn-outline" onClick={() => navigate("/login")}>
              로그인
            </button>
          </div>

          <div className="lp-chips">
            <span className="chip">🇰🇷 ap-northeast-2</span>
            <span className="chip">🇧🇷 sa-east-1</span>
            <span className="chip">⚡ CloudFront CDN</span>
            <span className="chip">🔒 S3 Presigned URL</span>
            <span className="chip">🔄 Auto Failover</span>
          </div>
        </main>

        <footer className="lp-footer">© 2026 BGP Share</footer>
      </div>
    </>
  );
}
