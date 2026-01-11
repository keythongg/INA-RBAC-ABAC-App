import React, { useState, useEffect } from "react";
import {
    TextField,
    Button,
    Card,
    CardContent,
    Typography,
    Box,
    Checkbox,
    FormControlLabel,
    Link,
    IconButton,
    InputAdornment,
    Divider,
    useTheme
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../services/api";
import { Eye, EyeOff } from "lucide-react";
import Logo from "../../assets/inapurple.svg";
import { fetchUserProfile } from "../../services/api"; // dodaj fetchUserProfile
import { useThemeContext } from "../../contexts/ThemeContext";

const LoginPage = () => {
    const { t } = useTranslation();
    const [credentials, setCredentials] = useState({ username: "enis", password: "123" });
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { updateUserRole } = useThemeContext();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (token) {
            navigate(role === "admin" ? "/admin-dashboard" : "/dashboard");
        }
    }, [navigate]);

    const handleLogin = async () => {
        try {
            const response = await loginUser(credentials);
            localStorage.setItem("token", response.token);
            localStorage.setItem("role", response.role);
            localStorage.setItem("userRole", response.role); // Fix for ThemeContext

            const userData = await fetchUserProfile();
            localStorage.setItem("ime", userData.ime);
            localStorage.setItem("prezime", userData.prezime);

            // Ažuriraj temu odmah
            updateUserRole(response.role);

            navigate(response.role === "admin" ? "/admin-dashboard" : "/dashboard");
        } catch (err) {
            setError(t('login_error'));
        }
    };



    const theme = useTheme();

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100vh"
            sx={{ backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : "#eef2f6" }}
        >
            <Card sx={{
                width: 475,
                p: 3,
                borderRadius: 3,
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : "#fff",
                boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.4)' : 'none'
            }} elevation={0}>
                <CardContent>
                    <Box display="flex" justifyContent="center" mb={3}>
                        <img src={Logo} alt="INA Logo" style={{ height: 50 }} />
                    </Box>
                    <Typography variant="h5" align="center" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 0.5, pt: 5 }}>
                        {t('login_title')}
                    </Typography>
                    <Typography align="center" sx={{ fontWeight: 400, color: theme.palette.text.secondary, mb: 2, }}>
                        {t('login_subtitle')}
                    </Typography>
                    <TextField
                        label={t('username')}
                        fullWidth
                        margin="normal"
                        value={credentials.username}
                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                        sx={{
                            mb: 0,
                            "& .MuiInputBase-root": {
                                paddingTop: "12px",
                                borderRadius: "10px",
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'transparent'
                            },
                            "& input": {
                                backgroundColor: theme.palette.mode === 'dark' ? 'transparent !important' : "white !important",
                                color: theme.palette.text.primary,
                                WebkitBoxShadow: theme.palette.mode === 'dark' ? '0 0 0 1000px rgba(0,0,0,0) inset' : "0 0 0 1000px white inset",
                                WebkitTextFillColor: theme.palette.mode === 'dark' ? '#fff !important' : 'inherit',
                                height: "31px",
                                padding: "12px 14px",
                                display: "flex",
                                alignItems: "center",
                            },
                            "&:-webkit-autofill": {
                                WebkitBoxShadow: theme.palette.mode === 'dark' ? '0 0 0 1000px #1e1e1e inset' : "0 0 0 1000px white inset",
                                WebkitTextFillColor: theme.palette.mode === 'dark' ? '#fff !important' : 'inherit',
                            },
                            "& .MuiInputLabel-outlined": {
                                color: theme.palette.text.secondary,
                                mt: -0.5,
                                "&.Mui-focused": {
                                    color: theme.palette.primary.main,
                                },
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                            }
                        }}
                        InputLabelProps={{
                            shrink: false,
                            style: { fontSize: "12px" },
                        }}
                        InputProps={{
                            style: { fontSize: "14px", color: theme.palette.text.primary, fontWeight: 600 },
                        }}
                    />
                    <TextField
                        label={t('password')}
                        type={showPassword ? "text" : "password"}
                        fullWidth
                        margin="normal"
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                        sx={{
                            mb: 2,
                            "& .MuiInputBase-root": {
                                paddingTop: "12px",
                                borderRadius: "10px",
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'transparent'
                            },
                            "& input": {
                                backgroundColor: theme.palette.mode === 'dark' ? 'transparent !important' : "white !important",
                                color: theme.palette.text.primary,
                                WebkitBoxShadow: theme.palette.mode === 'dark' ? '0 0 0 1000px rgba(0,0,0,0) inset' : "0 0 0 1000px white inset",
                                WebkitTextFillColor: theme.palette.mode === 'dark' ? '#fff !important' : 'inherit',
                                height: "31px",
                                padding: "12px 14px",
                                display: "flex",
                                alignItems: "center",
                            },
                            "&:-webkit-autofill": {
                                WebkitBoxShadow: theme.palette.mode === 'dark' ? '0 0 0 1000px #1e1e1e inset' : "0 0 0 1000px white inset",
                                WebkitTextFillColor: theme.palette.mode === 'dark' ? '#fff !important' : 'inherit',
                            },
                            "& .MuiInputLabel-outlined": {
                                color: theme.palette.text.secondary,
                                mt: -0.5,
                                "&.Mui-focused": {
                                    color: theme.palette.primary.main,
                                },
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                            }
                        }}
                        InputLabelProps={{
                            shrink: false,
                            style: { fontSize: "12px" },
                        }}
                        InputProps={{
                            style: { fontSize: "14px", color: theme.palette.text.primary, fontWeight: 600 },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                        sx={{ backgroundColor: "transparent", mt: -1, color: theme.palette.text.secondary }}
                                    >
                                        {showPassword ? <EyeOff /> : <Eye />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />


                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <FormControlLabel
                            control={<Checkbox defaultChecked sx={{ color: theme.palette.primary.main }} />}
                            label={t('remember_me')}
                            componentsProps={{
                                typography: {
                                    sx: {
                                        fontSize: "14px",
                                        lineHeight: "19px",
                                        color: theme.palette.text.secondary,
                                        fontWeight: 400,
                                    },
                                },
                            }}
                        />
                        <Link href="#" underline="hover" sx={{ fontSize: "14px", lineHeight: "21px", color: theme.palette.primary.main, fontWeight: 500 }}>
                            {t('forgot_password')}
                        </Link>
                    </Box>
                    {error && <Typography color="error" align="center" sx={{ mb: 2 }}>{error}</Typography>}
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{
                            fontSize: 15,
                            height: 42,
                            mb: 2,
                            backgroundColor: theme.palette.primary.main,
                            fontWeight: "600",
                            letterSpacing: "0.7px",
                            textTransform: "none",
                            "&:hover": { backgroundColor: theme.palette.primary.dark }
                        }}
                        onClick={handleLogin}
                    >
                        {t('login_button')}
                    </Button>
                </CardContent>
            </Card>
        </Box>
    );
};

export default LoginPage;