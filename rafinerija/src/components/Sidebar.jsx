import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Collapse, Divider, Typography, Box, useTheme } from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { Link, useLocation } from "react-router-dom";
import { IconKey, IconDashboard, IconList, IconReport, IconFileTypeDoc, IconUserCheck, IconSettings, IconPlanet, IconShieldHalf, IconUserScan, IconBuilding, IconChartLine, IconGasStation, IconLock, IconUsers, IconChartBar, IconPalette } from '@tabler/icons-react';

// Boje iz Berry dashboard-a
const PRIMARY_COLOR = "#673ab7";
const HOVER_COLOR = "#ede7f6";
const TEXT_COLOR = "#364152";
const HEADER_COLOR = "#364152";

// Navigacija po ulogama
// Navigacija po ulogama
const getRoleNavigation = () => ({
    admin: [

        { kind: "header", title: "dashboard" },
        { title: "my_space", path: "/dashboard", icon: <IconUserScan stroke={1.5} /> },
        { title: "admin_dashboard", path: "/admin-dashboard", icon: <IconDashboard stroke={1.5} /> },
        { title: "inventory", path: "/inventory", icon: <IconList stroke={1.5} /> },
        { title: "reports", path: "/reports", icon: <IconReport stroke={1.5} /> },
        { title: "ina_world", path: "/world", icon: <IconPlanet stroke={1.5} /> },
        { title: "themes_design", path: "/admin/themes", icon: <IconPalette stroke={1.5} /> },
        { kind: "divider" },
        { kind: "header", title: "human_resources" },
        { title: "users", path: "/users", icon: <IconUsers stroke={1.5} /> },
        { title: "tasks", path: "/tasks", icon: <IconList stroke={1.5} /> },
        { kind: "divider" },
        { kind: "header", title: "operations" },
        { title: "gas_stations", path: "/gas-stations", icon: <IconGasStation stroke={1.5} /> },
        { title: "fuel_production", path: "/fuel-production", icon: <IconChartBar stroke={1.5} /> },
        { title: "fuel_forecast", path: "/fuel-forecast", icon: <IconChartLine stroke={1.5} /> },
        { kind: "divider" },
        { kind: "header", title: "security" },
        { title: "security_scan", path: "/security", icon: <IconShieldHalf stroke={1.5} /> },
        { title: "logs", path: "/security/logs", icon: <IconList stroke={1.5} /> },
        { title: "blocked_ips", path: "/security/blocked-ips", icon: <IconLock stroke={1.5} /> },
        { title: "locked_users", path: "/security/locked-users", icon: <IconUserCheck stroke={1.5} /> },
        { kind: "divider" },
        { title: "documentation", path: "http://localhost:3000/docs", icon: <IconFileTypeDoc stroke={1.5} />, external: true },
    ],
    // ... update other roles similarly or just update the mechanism to translate key if found
    'Inženjer sigurnosti': [
        { kind: "header", title: "overview" },
        { title: "my_space", path: "/dashboard", icon: <IconUserScan stroke={1.5} /> },
        { title: "security_scan", path: "/security", icon: <IconShieldHalf stroke={1.5} /> },
        { kind: "divider" },
        { kind: "header", title: "security" },
        { title: "security_logs", path: "/security/logs", icon: <IconList stroke={1.5} /> },
        { title: "blocked_ips", path: "/security/blocked-ips", icon: <IconLock stroke={1.5} /> },
        { title: "locked_users", path: "/security/locked-users", icon: <IconUserCheck stroke={1.5} /> },
        { title: "security_stats", path: "/security/stats", icon: <IconChartBar stroke={1.5} /> },
        { kind: "divider" },
        { kind: "header", title: "other" },
        { title: "reports", path: "/reports", icon: <IconReport stroke={1.5} /> },
        { title: "tasks", path: "/tasks", icon: <IconList stroke={1.5} /> },
        { title: "users", path: "/users", icon: <IconUsers stroke={1.5} /> },
        { title: "documentation", path: "http://localhost:3000/docs", icon: <IconFileTypeDoc stroke={1.5} />, external: true },
    ],

    'Menadžer inventara': [
        { kind: "header", title: "overview" },
        { title: "my_space", path: "/dashboard", icon: <IconUserScan stroke={1.5} /> },
        { title: "inventory", path: "/inventory", icon: <IconList stroke={1.5} /> },
        { kind: "divider" },
        { kind: "header", title: "production" },
        { title: "fuel_production", path: "/fuel-production", icon: <IconChartBar stroke={1.5} /> },
        { title: "fuel_forecast", path: "/fuel-forecast", icon: <IconChartLine stroke={1.5} /> },
        { kind: "divider" },
        { kind: "header", title: "other" },
        { title: "reports", path: "/reports", icon: <IconReport stroke={1.5} /> },
        { title: "tasks", path: "/tasks", icon: <IconList stroke={1.5} /> },
        { title: "documentation", path: "http://localhost:3000/docs", icon: <IconFileTypeDoc stroke={1.5} />, external: true },
    ],

    'Finansijski analitičar': [
        { kind: "header", title: "overview" },
        { title: "my_space", path: "/dashboard", icon: <IconUserScan stroke={1.5} /> },
        { title: "financial_reports", path: "/reports", icon: <IconReport stroke={1.5} /> },
        { kind: "divider" },
        { kind: "header", title: "analysis" },
        { title: "revenue_yearly", path: "/revenue-analysis", icon: <IconChartBar stroke={1.5} /> },
        { title: "capex_investments", path: "/capex-analysis", icon: <IconChartLine stroke={1.5} /> },
        { title: "fuel_profitability", path: "/fuel-profitability", icon: <IconChartBar stroke={1.5} /> },
        { kind: "divider" },
        { title: "fuel_production", path: "/fuel-production", icon: <IconChartBar stroke={1.5} /> },
        { title: "tasks", path: "/tasks", icon: <IconList stroke={1.5} /> },
        { title: "documentation", path: "http://localhost:3000/docs", icon: <IconFileTypeDoc stroke={1.5} />, external: true },
    ],

    'Koordinator stanica': [
        { kind: "header", title: "overview" },
        { title: "my_space", path: "/dashboard", icon: <IconUserScan stroke={1.5} /> },
        { title: "gas_stations", path: "/gas-stations", icon: <IconGasStation stroke={1.5} /> },
        { kind: "divider" },
        { kind: "header", title: "operations" },
        { title: "stations_map", path: "/stations-map", icon: <IconPlanet stroke={1.5} /> },
        { title: "inventory", path: "/inventory", icon: <IconList stroke={1.5} /> },
        { kind: "divider" },
        { title: "reports", path: "/reports", icon: <IconReport stroke={1.5} /> },
        { title: "tasks", path: "/tasks", icon: <IconList stroke={1.5} /> },
        { title: "documentation", path: "http://localhost:3000/docs", icon: <IconFileTypeDoc stroke={1.5} />, external: true },
    ],

});

const Sidebar = ({ open }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const [authOpen, setAuthOpen] = useState(false);
    const [userRole, setUserRole] = useState("admin"); // Početna vrijednost
    const location = useLocation();

    // Get navigation config
    const ROLE_NAVIGATION = getRoleNavigation();

    useEffect(() => {
        // Dohvati ulogu korisnika iz localStorage ili tokena
        const token = localStorage.getItem("token");
        if (token) {
            try {
                // Dekodiraj JWT token da dobiješ ulogu
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const decoded = JSON.parse(jsonPayload);
                setUserRole(decoded.role || "admin");
            } catch (error) {
                console.error("Greška pri dekodiranju tokena:", error);
                setUserRole("admin");
            }
        }
    }, []);

    // Dohvati navigaciju za trenutnu ulogu ili admin kao fallback
    const navigation = ROLE_NAVIGATION[userRole] || ROLE_NAVIGATION.admin;

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: open ? 260 : 80,
                flexShrink: 0,
                "& .MuiDrawer-paper": {
                    width: open ? 260 : 80,
                    transition: "width 0.3s",
                    overflowX: "hidden",
                    backgroundColor: "background.paper", // Koristi temu
                    borderRight: "1px solid",
                    borderColor: "divider", // Koristi temu
                    "&::-webkit-scrollbar": {
                        width: "6px"
                    },
                    "&::-webkit-scrollbar-thumb": {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                        borderRadius: "4px"
                    },
                    "&::-webkit-scrollbar-track": {
                        backgroundColor: "transparent"
                    }
                },
            }}
        >
            <Toolbar />

            {/* Prikaz uloge u sidebar-u kada je otvoren */}
            {open && userRole && (
                <Box sx={{ px: 2, py: 1, mb: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Typography
                        variant="caption"
                        sx={{
                            display: "block",
                            color: PRIMARY_COLOR,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            fontSize: "0.7rem",
                            letterSpacing: "0.5px"
                        }}
                    >
                        {userRole}
                    </Typography>
                </Box>
            )}

            <List>
                {navigation.map((item, index) => {
                    if (item.kind === "divider") {
                        return <Divider key={index} sx={{ my: 1, mx: 2 }} />;
                    }

                    if (item.kind === "header") {
                        return (
                            <Typography
                                key={index}
                                variant="body2"
                                sx={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    pl: open ? 2 : 0,
                                    pr: 2,
                                    pt: 1,
                                    pb: 1,
                                    color: "text.secondary",
                                    display: open ? "block" : "none",
                                }}
                            >
                                {open && t(item.title)}
                            </Typography>
                        );
                    }

                    if (item.children) {
                        return (
                            <React.Fragment key={index}>
                                <ListItemButton
                                    onClick={() => setAuthOpen(!authOpen)}
                                    sx={{
                                        borderRadius: 2,
                                        mx: 1,
                                        py: 1,
                                        px: 2,
                                        my: 0.5,
                                        color: TEXT_COLOR,
                                        "&:hover": { backgroundColor: HOVER_COLOR, color: PRIMARY_COLOR },
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: open ? 40 : "100%",
                                            color: "inherit",
                                            fontSize: open ? 20 : 24,
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    {open && (
                                        <ListItemText
                                            primary={t(item.title)}
                                            primaryTypographyProps={{
                                                variant: "subtitle1",
                                                sx: {
                                                    fontSize: 14,
                                                    fontWeight: location.pathname === item.path ? 500 : 400,
                                                    lineHeight: "19px",
                                                    display: "block",
                                                    textRendering: "optimizeLegibility",
                                                    letterSpacing: "0.15px",
                                                },
                                            }}
                                        />
                                    )}
                                    {open && (authOpen ? <ExpandLess /> : <ExpandMore />)}
                                </ListItemButton>
                                <Collapse in={authOpen} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        {item.children.map((subItem, subIndex) => (
                                            <ListItemButton
                                                key={subIndex}
                                                component={Link}
                                                to={subItem.path}
                                                sx={{
                                                    pl: open ? 4 : 2,
                                                    py: 0.75,
                                                    color: TEXT_COLOR,
                                                    "&:hover": { color: PRIMARY_COLOR },
                                                }}
                                            >
                                                <ListItemText
                                                    primary={t(subItem.title)}
                                                    sx={{
                                                        fontSize: 14,
                                                        "& .MuiTypography-root": {
                                                            fontSize: "0.875rem"
                                                        }
                                                    }}
                                                />
                                            </ListItemButton>
                                        ))}
                                    </List>
                                </Collapse>
                            </React.Fragment>
                        );
                    }

                    return (
                        <ListItemButton
                            key={index}
                            component={item.external ? "a" : Link}
                            to={!item.external ? item.path : undefined}
                            href={item.external ? item.path : undefined}
                            target={item.external ? "_blank" : "_self"}
                            rel={item.external ? "noopener noreferrer" : undefined}
                            selected={location.pathname === item.path}
                            sx={{
                                borderRadius: 2,
                                mx: 1,
                                py: 1.5,
                                px: 2,
                                my: 0.5,
                                color: location.pathname === item.path ? "primary.main" : "text.primary",
                                backgroundColor: location.pathname === item.path ? "action.hover" : "transparent",
                                "&.Mui-selected": { backgroundColor: "action.selected", color: "primary.main" },
                                "&:hover": { backgroundColor: "action.hover", color: "primary.main" },
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: open ? 40 : "100%",
                                    color: "inherit",
                                    fontSize: open ? 20 : 24,
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            {open && (
                                <ListItemText
                                    primary={t(item.title)}
                                    primaryTypographyProps={{
                                        variant: "subtitle1",
                                        sx: {
                                            fontSize: 14,
                                            fontWeight: location.pathname === item.path ? 500 : 400,
                                            lineHeight: "19px",
                                            display: "block",
                                            textRendering: "optimizeLegibility",
                                            letterSpacing: "0.15px",
                                        },
                                    }}
                                />
                            )}
                        </ListItemButton>
                    );
                })}
            </List>

            {open && (
                <Box sx={{ p: 2, textAlign: "center", mt: "auto" }}>
                    <Typography
                        variant="caption"
                        sx={{
                            backgroundColor: "action.hover",
                            color: "text.secondary",
                            px: 2,
                            py: 0.5,
                            borderRadius: "12px",
                            fontSize: "0.7rem"
                        }}
                    >
                        v2.0.0
                    </Typography>
                </Box>
            )}
        </Drawer>
    );
};

export default Sidebar;