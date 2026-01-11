import React, { useState } from "react";
import { TextField, Button, Card, CardContent, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../services/api"; // API poziv za registraciju

const RegisterPage = () => {
    const [credentials, setCredentials] = useState({
        username: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleRegister = async () => {
        try {
            const response = await registerUser(credentials);
            if (response.success) {
                navigate("/login"); // Preusmjeravanje na login nakon registracije
            } else {
                setError(response.message || "Registracija nije uspjela.");
            }
        } catch (err) {
            setError("Greška prilikom registracije.");
        }
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
            <Card sx={{ width: 320 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Registracija
                    </Typography>
                    <TextField
                        label="Korisničko ime"
                        fullWidth
                        margin="dense"
                        value={credentials.username}
                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    />
                    <TextField
                        label="Lozinka"
                        type="password"
                        fullWidth
                        margin="dense"
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    />
                    {error && <Typography color="error">{error}</Typography>}
                    <Button variant="contained" color="primary" fullWidth onClick={handleRegister} sx={{ mt: 2 }}>
                        Registruj se
                    </Button>
                    <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                        Već imate nalog? <Button onClick={() => navigate("/login")}>Prijavi se</Button>
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};

export default RegisterPage;
