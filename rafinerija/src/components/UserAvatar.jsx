import React, { useEffect, useState } from "react";
import { Avatar, IconButton, Menu, MenuItem, Tooltip, Typography, Box, Divider, useTheme } from "@mui/material";
import { fetchUserProfile } from "../services/api";
import { IconSettings, IconUser, IconBell, IconLogout, IconShield, IconMoon, IconNotification } from '@tabler/icons-react';

const UserAvatar = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const getUser = async () => {
            try {
                const userData = await fetchUserProfile();
                console.log('User Data:', userData);  // Logiranje podataka da provjeriš što se vraća
                setUser(userData);
            } catch (error) {
                console.error("Greška pri dohvaćanju korisničkog profila:", error);
            }
        };

        getUser();
    }, []);




    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);


    const ime = localStorage.getItem("ime");
    const prezime = localStorage.getItem("prezime");

    const theme = useTheme();

    return (
        <Tooltip title="Korisnički izbornik" arrow>
            <IconButton
                onClick={handleMenuOpen}
                sx={{
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : "#e3f2fd",
                    color: theme.palette.primary.main,
                    borderRadius: "88px",
                    padding: "6px",
                    width: "auto",
                    height: "auto",
                    display: "flex",
                    alignItems: "center",
                    "&:hover": {
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.common.white
                    },
                }}
            >
                {user?.profile_image ? (
                    <Avatar
                        src={`http://localhost:5000${user.profile_image}`}
                        alt={user.username}
                        sx={{
                            marginLeft: '3px',
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            border: `2px solid ${theme.palette.background.paper}`
                        }}
                    />
                ) : (
                    <Avatar sx={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        bgcolor: 'primary.dark'
                    }}>
                        <IconSettings size={18} />
                    </Avatar>
                )}
                <IconSettings stroke={1.5} style={{ marginLeft: '12px', marginRight: '4px' }} size={20} />
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        width: 250,
                        borderRadius: "12px",
                        boxShadow: theme.shadows[10],
                        padding: "8px",
                        backgroundColor: theme.palette.background.paper,
                        backgroundImage: 'none'
                    },
                }}
            >
                {/* Zaglavlje menija */}
                <Box sx={{ textAlign: "center", mb: 2, mt: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                        {user?.username || "Korisnik"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {user?.role || "Korisnik"}
                    </Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Opcije menija */}
                <MenuItem onClick={handleMenuClose} sx={{ py: 1, borderRadius: "8px", color: 'text.primary' }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <IconUser stroke={1.5} size={18} />
                        <Typography variant="body2">Profil</Typography>
                    </Box>
                </MenuItem>

                <MenuItem onClick={handleMenuClose} sx={{ py: 1, borderRadius: "8px", color: 'text.primary' }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <IconSettings stroke={1.5} size={18} />
                        <Typography variant="body2">Postavke</Typography>
                    </Box>
                </MenuItem>

                <Divider sx={{ my: 1 }} />

                <MenuItem onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("role");
                    localStorage.removeItem("userRole");
                    window.location.href = "/";
                }} sx={{ py: 1, borderRadius: "8px", color: 'error.main' }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <IconLogout stroke={1.5} size={18} />
                        <Typography variant="body2">Odjava</Typography>
                    </Box>
                </MenuItem>
            </Menu>
        </Tooltip>
    );
};

export default UserAvatar;