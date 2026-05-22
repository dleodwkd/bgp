import React, { useState, useEffect } from "react";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import ImageUploader from "./ImageUploader";

export function UserAuth() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main style={{ padding: "20px", fontFamily: "sans-serif" }}>
          {/* 로그인 성공 시 상단에 환영 메시지 출력 */}
          <h3>안녕하세요, {user?.username}님! 👋</h3>
          <p style={{ color: "#4caf50", fontSize: "14px" }}>
            성공적으로 Cognito 로그인 연동이 완료되었습니다.
          </p>

          {/* ─────────────── [여기에 이미지 업로더 병합!] ─────────────── */}
          <div style={{ margin: "30px 0" }}>
            <ImageUploader />
          </div>
          {/* ────────────────────────────────────────────────────────── */}

          {/* 로그아웃 버튼 */}
          <button
            onClick={signOut}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ff4d4d",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              width: "100%", // 레이아웃을 위해 꽉 차게 변경
              marginTop: "10px",
            }}
          >
            로그아웃
          </button>
        </main>
      )}
    </Authenticator>
  );
}
