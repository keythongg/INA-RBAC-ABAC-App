import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CssBaseline, ThemeProvider } from "@mui/material";
import theme from "./theme";
import "./i18n"; // Import i18n config

ReactDOM.createRoot(document.getElementById("root")).render(
    <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
    </ThemeProvider>
);
