import React from "react";
import AppRoutes from "./routes/AppRoutes";
import { CustomThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext.jsx';

function App() {
    return (
        <SocketProvider>
            <CustomThemeProvider>
                <AppRoutes />
            </CustomThemeProvider>
        </SocketProvider>
    );
}

export default App;