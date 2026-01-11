import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    TextField,
    Button,
    Card,
    CardContent,
    CardHeader,
    Slider,
    Divider,
    Alert,
    Snackbar,
    useTheme
} from '@mui/material';
import { ChromePicker } from 'react-color';
import axios from 'axios';
import { IconPalette, IconCheck, IconDeviceFloppy } from '@tabler/icons-react';

const ThemeManager = () => {
    const theme = useTheme();
    const [selectedRole, setSelectedRole] = useState('admin');
    const [roleTheme, setRoleTheme] = useState({
        primary_color: '#1976d2',
        secondary_color: '#42a5f5',
        background_color: '#f4f6f8',
        font_family: 'Roboto',
        card_style: 'glass'
    });
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const roles = [
        'admin',
        'Inženjer sigurnosti',
        'Menadžer inventara',
        'Finansijski analitičar',
        'Koordinator stanica'
    ];

    useEffect(() => {
        fetchTheme(selectedRole);
    }, [selectedRole]);

    const fetchTheme = async (role) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/ui/themes/${role}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data) {
                setRoleTheme(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch theme:", error);
        }
    };

    const handleColorChange = (color, type) => {
        setRoleTheme(prev => ({ ...prev, [type]: color.hex }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/ui/themes/${selectedRole}`, roleTheme, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSnackbar({ open: true, message: 'Tema uspješno spremljena!', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: 'Greška pri spremanju teme.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconPalette size={40} color={theme.palette.primary.main} />
                <Typography variant="h4" fontWeight="bold">
                    Upravljanje Dizajnom
                </Typography>
            </Box>

            <Grid container spacing={4}>
                {/* SETTINGS PANEL */}
                <Grid item xs={12} md={5}>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 4 }}>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Odaberi Ulogu</InputLabel>
                            <Select
                                value={selectedRole}
                                label="Odaberi Ulogu"
                                onChange={(e) => setSelectedRole(e.target.value)}
                            >
                                {roles.map(role => (
                                    <MenuItem key={role} value={role}>{role}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Divider sx={{ my: 2 }}>Boje Sučelja</Divider>

                        <Box sx={{ mb: 3 }}>
                            <Typography gutterBottom>Primarna Boja</Typography>
                            <div style={{ padding: '10px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                <input
                                    type="color"
                                    value={roleTheme.primary_color}
                                    onChange={(e) => handleColorChange({ hex: e.target.value }, 'primary_color')}
                                    style={{ width: '100%', height: '40px', border: 'none', cursor: 'pointer' }}
                                />
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                                    {roleTheme.primary_color}
                                </Typography>
                            </div>
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <Typography gutterBottom>Sekundarna Boja</Typography>
                            <div style={{ padding: '10px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                <input
                                    type="color"
                                    value={roleTheme.secondary_color}
                                    onChange={(e) => handleColorChange({ hex: e.target.value }, 'secondary_color')}
                                    style={{ width: '100%', height: '40px', border: 'none', cursor: 'pointer' }}
                                />
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                                    {roleTheme.secondary_color}
                                </Typography>
                            </div>
                        </Box>

                        <Divider sx={{ my: 2 }}>Stil Kartica</Divider>

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Stil Kartica</InputLabel>
                            <Select
                                value={roleTheme.card_style}
                                label="Stil Kartica"
                                onChange={(e) => setRoleTheme({ ...roleTheme, card_style: e.target.value })}
                            >
                                <MenuItem value="glass">Glassmorphism (Prozirno)</MenuItem>
                                <MenuItem value="solid">Solid (Puno)</MenuItem>
                                <MenuItem value="minimal">Minimal (Bez sjene)</MenuItem>
                            </Select>
                        </FormControl>

                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<IconDeviceFloppy />}
                            onClick={handleSave}
                            disabled={loading}
                            sx={{ mt: 2, borderRadius: 3, py: 1.5 }}
                        >
                            {loading ? 'Spremanje...' : 'Spremi Promjene'}
                        </Button>
                    </Paper>
                </Grid>

                {/* PREVIEW PANEL */}
                <Grid item xs={12} md={7}>
                    <Typography variant="h6" gutterBottom sx={{ ml: 1, opacity: 0.7 }}>
                        Prikaz uživo (Preview)
                    </Typography>

                    <Paper
                        sx={{
                            p: 4,
                            borderRadius: 4,
                            backgroundColor: roleTheme.background_color,
                            minHeight: '600px',
                            border: '2px dashed #e0e0e0',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Fake Navbar */}
                        <Paper sx={{
                            p: 2,
                            mb: 3,
                            borderRadius: 2,
                            bgcolor: '#fff',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <Box sx={{ width: 120, height: 24, bgcolor: '#e0e0e0', borderRadius: 1 }} />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: roleTheme.primary_color, opacity: 0.2 }} />
                                <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: roleTheme.primary_color }} />
                            </Box>
                        </Paper>

                        {/* Fake Header */}
                        <Card
                            sx={{
                                mb: 3,
                                background: `linear-gradient(135deg, ${roleTheme.primary_color} 0%, ${roleTheme.secondary_color} 100%)`,
                                color: '#fff',
                                borderRadius: 3
                            }}
                        >
                            <CardContent>
                                <Typography variant="h5" fontWeight="bold">Dobrodošli, {selectedRole}!</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>Ovo je pregled vaše nove teme.</Typography>
                            </CardContent>
                        </Card>

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Card sx={{
                                    height: 150,
                                    borderRadius: 3,
                                    ...(roleTheme.card_style === 'glass' ? {
                                        background: 'rgba(255, 255, 255, 0.7)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)'
                                    } : {})
                                }}>
                                    <CardContent>
                                        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: `${roleTheme.primary_color}20`, color: roleTheme.primary_color, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                                            <IconCheck />
                                        </Box>
                                        <Typography variant="h6">Statistika</Typography>
                                        <Typography variant="h4" sx={{ color: roleTheme.primary_color }}>85%</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6}>
                                <Card sx={{
                                    height: 150,
                                    borderRadius: 3,
                                    ...(roleTheme.card_style === 'glass' ? {
                                        background: 'rgba(255, 255, 255, 0.7)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)'
                                    } : {})
                                }}>
                                    <CardContent>
                                        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: `${roleTheme.secondary_color}20`, color: roleTheme.secondary_color, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                                            <IconCheck />
                                        </Box>
                                        <Typography variant="h6">Zadaci</Typography>
                                        <Typography variant="h4" sx={{ color: roleTheme.secondary_color }}>12</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                    </Paper>
                </Grid>
            </Grid>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ThemeManager;
