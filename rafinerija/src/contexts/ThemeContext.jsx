import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import axios from 'axios';

const ThemeContext = createContext();

export const useThemeContext = () => useContext(ThemeContext);

export const CustomThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(localStorage.getItem('themeMode') || 'light');
    const [roleTheme, setRoleTheme] = useState(null);
    // Standardize: check 'userRole' first, then 'role', then default to 'admin'
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || localStorage.getItem('role') || 'admin');

    // 1. Fetch role theme from backend
    useEffect(() => {
        const fetchRoleTheme = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                // Decode role from token if needed, or stick with localStorage
                const response = await axios.get(`http://localhost:5000/api/ui/themes/${userRole}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data) {
                    setRoleTheme(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch role theme:", error);
            }
        };

        fetchRoleTheme();
    }, [userRole]);

    // 2. Create MUI Theme
    const theme = useMemo(() => {
        const primaryMain = roleTheme?.primary_color || '#1976d2'; // Default Blue
        const secondaryMain = roleTheme?.secondary_color || '#42a5f5';
        const fontFamily = roleTheme?.font_family || 'Roboto, sans-serif';
        const cardStyle = roleTheme?.card_style || 'glass';

        return createTheme({
            palette: {
                mode,
                primary: {
                    main: primaryMain,
                },
                secondary: {
                    main: secondaryMain,
                },
                background: {
                    default: mode === 'dark' ? '#0f172a' : (roleTheme?.background_color || '#f4f6f8'),
                    paper: mode === 'dark' ? '#1e293b' : '#ffffff',
                },
            },
            typography: {
                fontFamily: fontFamily,
            },
            components: {
                MuiCard: {
                    styleOverrides: {
                        root: {
                            borderRadius: 16,
                            ...(cardStyle === 'glass' && mode === 'dark' ? {
                                background: 'rgba(30, 41, 59, 0.7)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            } : {
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                            })
                        }
                    }
                },
                MuiPaper: {
                    styleOverrides: {
                        root: {
                            ...(cardStyle === 'glass' && mode === 'dark' ? {
                                backgroundImage: 'none'
                            } : {})
                        }
                    }
                }
            }
        });
    }, [mode, roleTheme]);

    // 3. Toggle Mode Function
    const toggleColorMode = () => {
        setMode((prevMode) => {
            const newMode = prevMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('themeMode', newMode);
            return newMode;
        });
    };

    // Update role helper
    const updateUserRole = (role) => {
        setUserRole(role);
        localStorage.setItem('userRole', role);
        localStorage.setItem('role', role); // Sync both just in case
    };

    return (
        <ThemeContext.Provider value={{ toggleColorMode, mode, roleTheme, updateUserRole }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};
