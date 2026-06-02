import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
// import { Amplify } from "aws-amplify";
// import outputs from "../amplify_outputs.json";

// Amplify.configure(outputs);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <h1>GIT ACTION 적용 완료</h1>
    <App />
  </StrictMode>,
);
