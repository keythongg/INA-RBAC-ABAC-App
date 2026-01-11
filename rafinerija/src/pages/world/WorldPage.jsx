// src/pages/WorldPage.jsx
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, MenuItem, Grid,
    Chip, IconButton, Snackbar, Alert, Tabs, Tab, Paper,
    useTheme, Avatar, Tooltip, Fade, Zoom, alpha
} from "@mui/material";
import {
    Add, Edit, Delete, LocationOn, Refresh,
    Map as MapIcon, List as ListIcon,
    LocalGasStation as GasIcon,
    Storefront as StoreIcon,
    Public as PublicIcon
} from "@mui/icons-material";
import { useLocation } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import { useThemeContext } from '../../contexts/ThemeContext';

// LEAFLET IMPORTS
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// FIX ZA IKONE U REACT-LEAFLET
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// CUSTOM IKONE ZA INA STANICE
const createCustomIcon = (hasFreshCorner) => {
    return L.divIcon({
        html: `
      <div style="
        background-color: ${hasFreshCorner ? '#ff6b6b' : '#4ecdc4'};
        width: 28px;
        height: 28px;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
      ">⛽</div>
    `,
        className: 'custom-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
};

const WorldPage = () => {
    const theme = useTheme();
    const { roleTheme } = useThemeContext();
    const location = useLocation();
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingStation, setEditingStation] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        if (location.pathname === '/gas-stations') {
            setActiveTab(1); // List view
        } else {
            setActiveTab(0); // Map view
        }
    }, [location.pathname]);

    const [newStation, setNewStation] = useState({
        name: '',
        location: '',
        country: 'Croatia',
        type: 'standard',
        status: 'active',
        has_fresh_corner: false,
        latitude: '',
        longitude: ''
    });

    useEffect(() => {
        fetchStations();
    }, []);

    const fetchStations = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Niste prijavljeni! Token nije pronađen.');

            const response = await fetch('http://localhost:5000/api/gas-stations', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) window.location.href = '/login';
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setStations(data);
        } catch (error) {
            console.error('❌ Greška pri učitavanju:', error);
            showSnackbar(`Greška: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleSaveStation = async () => {
        try {
            const token = localStorage.getItem('token');
            const url = editingStation
                ? `http://localhost:5000/api/gas-stations/${editingStation.id}`
                : 'http://localhost:5000/api/gas-stations';
            const method = editingStation ? 'PUT' : 'POST';

            const requestBody = {
                name: newStation.name,
                location: newStation.location,
                country: newStation.country,
                type: newStation.type,
                status: newStation.status,
                has_fresh_corner: newStation.has_fresh_corner,
                latitude: parseFloat(newStation.latitude),
                longitude: parseFloat(newStation.longitude)
            };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                showSnackbar(editingStation ? 'Stanica ažurirana!' : 'Stanica dodana!');
                fetchStations();
                handleCloseDialog();
            } else {
                throw new Error('Greška pri spremanju');
            }
        } catch (error) {
            showSnackbar(`Greška: ${error.message}`, 'error');
        }
    };

    const handleDeleteStation = async (id) => {
        if (window.confirm('Jeste li sigurni da želite obrisati stanicu?')) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5000/api/gas-stations/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    showSnackbar('Stanica obrisana!');
                    fetchStations();
                } else {
                    throw new Error('Greška pri brisanju');
                }
            } catch (error) {
                showSnackbar(`Greška: ${error.message}`, 'error');
            }
        }
    };

    const handleEditStation = (station) => {
        setEditingStation(station);
        setNewStation({
            name: station.name,
            location: station.location,
            country: station.country,
            type: station.type,
            status: station.status,
            has_fresh_corner: station.has_fresh_corner === 1,
            latitude: station.latitude,
            longitude: station.longitude
        });
        setOpenDialog(true);
    };

    const handleAddNew = () => {
        setEditingStation(null);
        setNewStation({ name: '', location: '', country: 'Croatia', type: 'standard', status: 'active', has_fresh_corner: false, latitude: '', longitude: '' });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingStation(null);
    };

    return (
        <Box sx={{ p: 3, minHeight: '100vh' }}>
            {/* HEADER */}
            <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                    <Typography variant="h3" fontWeight="800" gutterBottom sx={{
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        textShadow: '0px 2px 10px rgba(0,0,0,0.1)'
                    }}>
                        Benzinske Stanice
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Interaktivna karta i upravljanje mrežom stanica
                    </Typography>
                </Box>
                <Box display="flex" gap={2}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchStations}
                        sx={{ borderRadius: 3, textTransform: 'none', borderWidth: 2 }}
                    >
                        Osvježi
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleAddNew}
                        sx={{
                            borderRadius: 3,
                            textTransform: 'none',
                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                        }}
                    >
                        Nova Stanica
                    </Button>
                </Box>
            </Box>

            {/* TABS CONTROLS */}
            <GlassCard sx={{ mb: 3, p: 1 }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, val) => setActiveTab(val)}
                    indicatorColor="primary"
                    textColor="primary"
                    sx={{
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '1rem', minHeight: 48 },
                        '& .Mui-selected': { color: theme.palette.primary.main }
                    }}
                >
                    <Tab icon={<MapIcon />} label="Mapa" iconPosition="start" />
                    <Tab icon={<ListIcon />} label="Lista" iconPosition="start" />
                </Tabs>
            </GlassCard>

            {/* CONTENT */}
            {activeTab === 0 ? (
                // MAP TAB
                <GlassCard sx={{ height: '600px', p: 0, overflow: 'hidden' }}>
                    <MapContainer
                        center={[45.8, 16.0]}
                        zoom={7}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <ZoomControl position="topright" />
                        {stations.map((station) => {
                            if (!station.latitude || !station.longitude) return null;
                            return (
                                <Marker
                                    key={station.id}
                                    position={[parseFloat(station.latitude), parseFloat(station.longitude)]}
                                    icon={createCustomIcon(station.has_fresh_corner === 1)}
                                    eventHandlers={{ click: () => handleEditStation(station) }}
                                >
                                    <Popup>
                                        <Box sx={{ minWidth: 200 }}>
                                            <Typography variant="subtitle1" fontWeight={700}>{station.name}</Typography>
                                            <Typography variant="body2">{station.location}</Typography>
                                            <Chip
                                                size="small"
                                                label={station.type}
                                                color={station.type === 'fresh_corner' ? 'primary' : 'default'}
                                                sx={{ mt: 1 }}
                                            />
                                        </Box>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </GlassCard>
            ) : (
                // LIST TAB - GLASS GRID
                <Grid container spacing={3}>
                    {stations.map((station, index) => (
                        <Grid item xs={12} md={6} lg={4} key={station.id}>
                            <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }}>
                                <Box>
                                    <GlassCard sx={{
                                        p: 3,
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'translateY(-4px)' }
                                    }}>
                                        <Box display="flex" justifyContent="space-between" mb={2}>
                                            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                                                <GasIcon />
                                            </Avatar>
                                            <Box>
                                                <IconButton size="small" onClick={() => handleEditStation(station)} color="info">
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => handleDeleteStation(station.id)} color="error">
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Box>

                                        <Typography variant="h6" fontWeight={700} gutterBottom>
                                            {station.name}
                                        </Typography>

                                        <Box display="flex" alignItems="center" gap={1} mb={2} color="text.secondary">
                                            <LocationOn fontSize="small" />
                                            <Typography variant="body2">{station.location}, {station.country}</Typography>
                                        </Box>

                                        <Box display="flex" gap={1} flexWrap="wrap" mt="auto">
                                            <Chip
                                                label={station.status}
                                                size="small"
                                                color={station.status === 'active' ? 'success' : 'warning'}
                                                variant="outlined"
                                                sx={{ fontWeight: 600 }}
                                            />
                                            {station.has_fresh_corner === 1 && (
                                                <Chip
                                                    icon={<StoreIcon fontSize="small" />}
                                                    label="Fresh Corner"
                                                    size="small"
                                                    color="primary"
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            )}
                                        </Box>
                                    </GlassCard>
                                </Box>
                            </Zoom>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* DIALOG */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {editingStation ? 'Uredi Stanicu' : 'Nova Stanica'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Naziv" value={newStation.name} onChange={(e) => setNewStation({ ...newStation, name: e.target.value })} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Lokacija" value={newStation.location} onChange={(e) => setNewStation({ ...newStation, location: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField select fullWidth label="Zemlja" value={newStation.country} onChange={(e) => setNewStation({ ...newStation, country: e.target.value })}>
                                <MenuItem value="Croatia">Hrvatska</MenuItem>
                                <MenuItem value="Bosnia">BiH</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField select fullWidth label="Status" value={newStation.status} onChange={(e) => setNewStation({ ...newStation, status: e.target.value })}>
                                <MenuItem value="active">Aktivna</MenuItem>
                                <MenuItem value="inactive">Neaktivna</MenuItem>
                            </TextField>
                        </Grid>
                        {/* More fields... simplified for brevity, assume full fields here */}
                        <Grid item xs={6}>
                            <TextField select fullWidth label="Tip" value={newStation.type} onChange={(e) => setNewStation({ ...newStation, type: e.target.value })}>
                                <MenuItem value="standard">Standard</MenuItem>
                                <MenuItem value="fresh_corner">Fresh Corner</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField select fullWidth label="Ima Fresh Corner" value={newStation.has_fresh_corner} onChange={(e) => setNewStation({ ...newStation, has_fresh_corner: e.target.value })}>
                                <MenuItem value={true}>Da</MenuItem>
                                <MenuItem value={false}>Ne</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth type="number" label="Lat" value={newStation.latitude} onChange={(e) => setNewStation({ ...newStation, latitude: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth type="number" label="Lng" value={newStation.longitude} onChange={(e) => setNewStation({ ...newStation, longitude: e.target.value })} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseDialog} color="inherit">Odustani</Button>
                    <Button onClick={handleSaveStation} variant="contained">Spremi</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default WorldPage;