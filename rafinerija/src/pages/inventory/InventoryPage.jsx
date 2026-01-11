import React, { useState, useEffect } from "react";
import {
    Card, CardContent, Typography, Box, TextField, Button, Dialog,
    DialogActions, DialogContent, DialogTitle, Chip, CircularProgress,
    Grid, IconButton, Tooltip, useTheme, Avatar, Zoom, Fade, InputAdornment
} from "@mui/material";
import {
    Add, Edit, Delete, Search, Inventory as InventoryIcon,
    Analytics, TrendingUp, TrendingDown, AttachMoney,
    LocalGasStation
} from "@mui/icons-material";
import { fetchInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } from "../../services/api";
import ReactApexChart from "react-apexcharts";
import GlassCard from "../../components/ui/GlassCard";
import { useThemeContext } from "../../contexts/ThemeContext";
import { alpha } from "@mui/material/styles";

const InventoryPage = () => {
    const theme = useTheme();
    const { roleTheme } = useThemeContext();
    const [rows, setRows] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [newItem, setNewItem] = useState({ type: "", quantity: "", price: "" });
    const [userRole, setUserRole] = useState(localStorage.getItem("role") || "");

    useEffect(() => {
        fetchInventoryData();
        setUserRole(localStorage.getItem('role'));
    }, []);

    const fetchInventoryData = () => {
        setLoading(true);
        fetchInventory().then((data) => {
            const updatedData = data.map((item) => ({
                ...item,
                status: determineStatus(item.quantity),
            }));
            setRows(updatedData);
            setLoading(false);
        }).catch(error => {
            console.error('❌ Greška pri učitavanju:', error);
            setLoading(false);
        });
    };

    const determineStatus = (quantity) => {
        if (quantity > 500) return "Optimalno";
        if (quantity > 250) return "Dostupno";
        if (quantity > 150) return "Nizak nivo";
        if (quantity > 50) return "Kritično";
        return "Nedostupno";
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Dostupno": return "primary";
            case "Optimalno": return "success";
            case "Nizak nivo": return "warning";
            case "Kritično": return "error";
            default: return "info";
        }
    };

    const handleSave = async () => {
        newItem.status = determineStatus(newItem.quantity);
        if (editItem) {
            await updateInventoryItem(editItem.id, newItem);
            setRows(rows.map((row) => (row.id === editItem.id ? { ...editItem, ...newItem } : row)));
            setEditItem(null);
        } else {
            const savedItem = await addInventoryItem(newItem);
            setRows([...rows, { ...savedItem, status: determineStatus(savedItem.quantity) }]);
        }
        setNewItem({ type: "", quantity: "", price: "" });
        setOpen(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Jeste li sigurni da želite obrisati ovu stavku?")) {
            await deleteInventoryItem(id);
            setRows(rows.filter((row) => row.id !== id));
        }
    };

    const handleEdit = (item) => {
        setEditItem(item);
        setNewItem(item);
        setOpen(true);
    };

    const handleAddNew = () => {
        setEditItem(null);
        setNewItem({ type: "", quantity: "", price: "" });
        setOpen(true);
    };

    const filteredRows = rows.filter((row) =>
        row.type.toLowerCase().includes(search.toLowerCase())
    );

    // Chart Options
    const chartData = {
        series: [{ name: "Količina (kt)", data: rows.map((row) => row.quantity) }],
        options: {
            chart: { type: "bar", height: 350, toolbar: { show: false }, background: 'transparent' },
            plotOptions: { bar: { borderRadius: 4, columnWidth: "50%", distributed: true } },
            dataLabels: { enabled: false },
            xaxis: {
                categories: rows.map((row) => row.type),
                labels: { style: { colors: theme.palette.text.secondary, fontSize: '12px' } }
            },
            yaxis: { labels: { style: { colors: theme.palette.text.secondary } } },
            grid: { borderColor: theme.palette.divider, strokeDashArray: 4 },
            colors: [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.info.main],
            theme: { mode: theme.palette.mode }
        }
    };

    // Calculate Totals
    const totalQuantity = rows.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
    const totalValue = rows.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.price || 0)), 0);

    return (
        <Box sx={{ p: 3, minHeight: '100vh', pb: 8 }}>
            {/* HEADER */}
            <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                    <Typography variant="h3" fontWeight="800" gutterBottom sx={{
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        textShadow: '0px 2px 10px rgba(0,0,0,0.1)'
                    }}>
                        Inventar Rafinerije
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Praćenje zaliha goriva, cijena i dostupnosti u realnom vremenu
                    </Typography>
                </Box>
                {(userRole === "admin" || userRole === "Menadžer inventara") && (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleAddNew}
                        sx={{
                            borderRadius: 3,
                            textTransform: 'none',
                            px: 3,
                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                        }}
                    >
                        Nova Stavka
                    </Button>
                )}
            </Box>

            {/* STATS OVERVIEW */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} md={4}>
                    <GlassCard sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="body2" color="textSecondary" fontWeight={600}>UKUPNE ZALIHE</Typography>
                            <Typography variant="h3" fontWeight={800} sx={{ color: theme.palette.primary.main, my: 1 }}>
                                {totalQuantity.toLocaleString()} <span style={{ fontSize: '1rem' }}>kt</span>
                            </Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, width: 56, height: 56 }}>
                            <InventoryIcon />
                        </Avatar>
                    </GlassCard>
                </Grid>
                <Grid item xs={12} md={4}>
                    <GlassCard sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="body2" color="textSecondary" fontWeight={600}>PROCIJENJENA VRIJEDNOST</Typography>
                            <Typography variant="h3" fontWeight={800} sx={{ color: theme.palette.success.main, my: 1 }}>
                                ${(totalValue / 1000000).toFixed(1)}M
                            </Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, width: 56, height: 56 }}>
                            <AttachMoney />
                        </Avatar>
                    </GlassCard>
                </Grid>
                <Grid item xs={12} md={4}>
                    <GlassCard sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="body2" color="textSecondary" fontWeight={600}>KRITIČNE STAVKE</Typography>
                            <Typography variant="h3" fontWeight={800} sx={{ color: theme.palette.error.main, my: 1 }}>
                                {rows.filter(r => r.status === 'Kritično' || r.status === 'Nedostupno').length}
                            </Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main, width: 56, height: 56 }}>
                            <TrendingDown />
                        </Avatar>
                    </GlassCard>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* SEARCH & FILTER */}
                <Grid item xs={12}>
                    <GlassCard sx={{ p: 2 }}>
                        <TextField
                            fullWidth
                            placeholder="Pretraži goriva..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (<InputAdornment position="start"><Search color="action" /></InputAdornment>),
                                sx: { borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.5) }
                            }}
                            variant="outlined"
                            size="small"
                        />
                    </GlassCard>
                </Grid>

                {/* INVENTORY LIST - GRID OF CARDS */}
                <Grid item xs={12} lg={8}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
                    ) : (
                        <Grid container spacing={3}>
                            {filteredRows.map((item, index) => (
                                <Grid item xs={12} sm={6} key={item.id}>
                                    <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }}>
                                        <Box>
                                            <GlassCard sx={{
                                                p: 3,
                                                borderLeft: `6px solid ${theme.palette[getStatusColor(item.status)].main}`,
                                                transition: 'transform 0.2s',
                                                '&:hover': { transform: 'translateY(-5px)' }
                                            }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                                                    <Box display="flex" gap={2} alignItems="center">
                                                        <Avatar sx={{ bgcolor: alpha(theme.palette[getStatusColor(item.status)].main, 0.1), color: theme.palette[getStatusColor(item.status)].main }}>
                                                            <LocalGasStation />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="h6" fontWeight={700}>{item.type}</Typography>
                                                            <Typography variant="caption" color="text.secondary">ID: {item.id}</Typography>
                                                        </Box>
                                                    </Box>
                                                    <Chip
                                                        label={item.status}
                                                        color={getStatusColor(item.status)}
                                                        size="small"
                                                        sx={{ fontWeight: 700, borderRadius: 1 }}
                                                    />
                                                </Box>

                                                <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={2}>
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary">Količina</Typography>
                                                        <Typography variant="h4" fontWeight={800}>{item.quantity} <span style={{ fontSize: '14px', color: theme.palette.text.secondary }}>kt</span></Typography>
                                                    </Box>
                                                    <Box textAlign="right">
                                                        <Typography variant="caption" color="text.secondary">Cijena (USD/kt)</Typography>
                                                        <Typography variant="h6" fontWeight={600} color="success.main">${item.price}</Typography>
                                                    </Box>
                                                </Box>

                                                {(userRole === "admin" || userRole === "Menadžer inventara") && (
                                                    <Box display="flex" justifyContent="flex-end" gap={1} mt={2} pt={2} borderTop={`1px dashed ${theme.palette.divider}`}>
                                                        <Button size="small" startIcon={<Edit />} onClick={() => handleEdit(item)} sx={{ color: theme.palette.text.secondary }}>
                                                            Uredi
                                                        </Button>
                                                        <Button size="small" startIcon={<Delete />} color="error" onClick={() => handleDelete(item.id)}>
                                                            Obriši
                                                        </Button>
                                                    </Box>
                                                )}
                                            </GlassCard>
                                        </Box>
                                    </Zoom>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Grid>

                {/* CHARTS SECTION */}
                <Grid item xs={12} lg={4}>
                    <GlassCard sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" fontWeight={700} gutterBottom display="flex" alignItems="center" gap={1}>
                            <Analytics /> Analiza Zaliha
                        </Typography>
                        <ReactApexChart
                            options={chartData.options}
                            series={chartData.series}
                            type="bar"
                            height={350}
                        />
                        <Box mt={3}>
                            <Typography variant="subtitle2" gutterBottom>Legenda statusa:</Typography>
                            <Box display="flex" flexDirection="column" gap={1}>
                                <Box display="flex" justifyContent="space-between"><Chip label="> 500 kt" size="small" color="success" /> <Typography variant="caption">Optimalno</Typography></Box>
                                <Box display="flex" justifyContent="space-between"><Chip label="250 - 500 kt" size="small" color="primary" /> <Typography variant="caption">Dostupno</Typography></Box>
                                <Box display="flex" justifyContent="space-between"><Chip label="150 - 250 kt" size="small" color="warning" /> <Typography variant="caption">Nizak nivo</Typography></Box>
                                <Box display="flex" justifyContent="space-between"><Chip label="< 150 kt" size="small" color="error" /> <Typography variant="caption">Kritično</Typography></Box>
                            </Box>
                        </Box>
                    </GlassCard>
                </Grid>
            </Grid>

            {/* DIALOG */}
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                PaperProps={{
                    sx: { borderRadius: 4, backdropFilter: 'blur(10px)', bgcolor: alpha(theme.palette.background.paper, 0.9) }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>{editItem ? "Uredi zalihu" : "Dodaj zalihe"}</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1} minWidth={300}>
                        <TextField
                            label="Tip goriva"
                            fullWidth
                            size="small"
                            value={newItem.type}
                            onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                        />
                        <TextField
                            label="Količina (kt)"
                            fullWidth
                            type="number"
                            size="small"
                            value={newItem.quantity}
                            onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                        />
                        <TextField
                            label="Cijena (USD/kt)"
                            fullWidth
                            size="small"
                            value={newItem.price}
                            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>Otkaži</Button>
                    <Button onClick={handleSave} variant="contained" sx={{ borderRadius: 2 }}>{editItem ? "Spremi" : "Dodaj"}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default InventoryPage;