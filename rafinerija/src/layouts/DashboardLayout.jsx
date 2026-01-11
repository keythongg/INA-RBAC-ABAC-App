import React, { useState } from "react";
import { Box, CssBaseline, Toolbar } from "@mui/material";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AutoLogout from '../components/AutoLogout';
import AiChatAssistant from "../components/AiChatAssistant";

const DashboardLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            <CssBaseline />

            {/* Navbar iznad sidebar-a */}
            <Navbar toggleSidebar={toggleSidebar} />

            <Box sx={{ display: "flex", flexGrow: 1 }}>
                {/* Sidebar koji se može otvarati i zatvarati */}
                <Sidebar open={sidebarOpen} />

                {/* Glavni sadržaj */}
                <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                    <Toolbar />
                    {children}
                </Box>
            </Box>
            <AutoLogout />
            <AiChatAssistant />
        </Box>
    );
};

export default DashboardLayout;
