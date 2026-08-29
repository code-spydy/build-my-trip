import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";

import App from "./App";
import themeConfig from "./config/theme";

import "./styles/globals.css";
import "./styles/variables.css";
import "./styles/app.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConfigProvider theme={themeConfig}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
