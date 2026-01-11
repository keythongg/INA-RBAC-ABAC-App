import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Tabs,
    Tab,
    InputBase,
    IconButton,
    useTheme,
    Fade,
    Avatar
} from '@mui/material';
import {
    IconShield,
    IconLock,
    IconBan,
    IconAlertTriangle,
    IconSearch,
    IconPlus,
    IconTerminal2,
    IconMap,
    IconActivity
} from '@tabler/icons-react';
import { useLocation } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import { useThemeContext } from '../../contexts/ThemeContext';

// Helper for Timezone Formatting (Europe/Zagreb)
const formatDate = (dateString, isPermanent = false) => {
    if (isPermanent) return 'PERMANENT';
    if (!dateString) return 'N/A';
    try {
        return new Intl.DateTimeFormat('hr-HR', {
            timeZone: 'Europe/Zagreb',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(new Date(dateString));
    } catch (e) {
        return dateString;
    }
};

// Tab panel komponenta
function TabPanel({ children, value, index, ...other }) {
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

const Security = () => {
    const theme = useTheme();
    const { roleTheme } = useThemeContext();
    const location = useLocation();
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        if (location.pathname.includes('blocked-ips')) {
            setTabValue(1);
        } else if (location.pathname.includes('locked-users')) {
            setTabValue(2);
        } else {
            setTabValue(0);
        }
    }, [location.pathname]);

    const [logs, setLogs] = useState([]);
    const [blockedIps, setBlockedIps] = useState([]);
    const [lockouts, setLockouts] = useState([]);
    const [stats, setStats] = useState({});
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [blockIpDialog, setBlockIpDialog] = useState(false);
    const [blockIpData, setBlockIpData] = useState({ ip_address: '', reason: '', duration_hours: 24 });
    const [searchTerm, setSearchTerm] = useState('');

    // Formatiranje action type
    const formatActionType = (action) => {
        const actionMap = {
            'login_success': 'LOGIN SUCCESS',
            'login_failed': 'LOGIN FAILED',
            'brute_force_detected': 'BRUTE FORCE',
            'sql_injection_attempt': 'SQL INJECTION',
            'user_lockout': 'USER LOCKOUT',
            'ip_manual_block': 'IP BLOCKED',
            'ip_manual_unblock': 'IP UNBLOCKED',
        };
        return actionMap[action] || action.toUpperCase();
    };

    const severityColors = { low: 'success', medium: 'warning', high: 'error', critical: 'error' };

    // Učitaj podatke
    useEffect(() => { loadSecurityData(); loadStats(); }, [tabValue]);

    const loadSecurityData = async () => {
        try {
            const token = localStorage.getItem('token');
            let endpoint = '';
            switch (tabValue) {
                case 0: endpoint = '/api/security/logs'; break;
                case 1: endpoint = '/api/security/blocked-ips'; break;
                case 2: endpoint = '/api/security/user-lockouts'; break;
            }
            const response = await fetch(`http://localhost:5000${endpoint}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const data = await response.json();
                switch (tabValue) {
                    case 0: setLogs(data); break;
                    case 1: setBlockedIps(data); break;
                    case 2: setLockouts(data); break;
                }
            }
        } catch (error) { console.error(error); }
    };

    const loadStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/security/stats', { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) { setStats(await response.json()); }
        } catch (error) { console.error(error); }
    };

    const handleBlockIpSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/security/block-ip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(blockIpData)
            });
            if (response.ok) {
                setBlockIpDialog(false);
                setBlockIpData({ ip_address: '', reason: '', duration_hours: 24 });
                loadSecurityData(); loadStats();
            }
        } catch (error) { console.error(error); }
    };

    const handleUnblockIp = async (ip) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5000/api/security/unblock-ip/${ip}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            loadSecurityData(); loadStats();
        } catch (error) { console.error(error); }
    };

    const handleUnlockUser = async (username) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5000/api/security/unlock-user/${username}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            loadSecurityData(); loadStats();
        } catch (error) { console.error(error); }
    };

    const filteredLogs = logs.filter(log =>
        log.ip_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* HEADER */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: theme.palette.error.main, width: 56, height: 56 }}>
                        <IconShield size={32} />
                    </Avatar>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: theme.palette.text.primary }}>
                            CENTAR MREŽNE SIGURNOSTI
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ letterSpacing: 1 }}>
                            STATUS SISTEMA: <span style={{ color: theme.palette.success.main, fontWeight: 'bold' }}>SIGURAN</span>
                        </Typography>
                    </Box>
                </Box>

                {/* Search Bar - Sci-Fi Style */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: theme.palette.background.paper,
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <IconSearch size={20} color={theme.palette.text.secondary} />
                    <InputBase
                        placeholder="PRETRAŽI PROTOKOLE..."
                        sx={{ ml: 1, flex: 1, fontFamily: 'monospace' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Box>
            </Box>

            {/* STATS GRID */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                    { icon: <IconActivity />, label: 'UKUPNO ZAPISA', value: stats.totalLogs, color: theme.palette.primary.main },
                    { icon: <IconAlertTriangle />, label: 'PRIJETNJE DANAS', value: stats.todayLogs, color: theme.palette.warning.main },
                    { icon: <IconBan />, label: 'BLOKIRANI IP-OVI', value: stats.blockedIps, color: theme.palette.error.main },
                    { icon: <IconLock />, label: 'ZAKLJUČANI RAČUNI', value: stats.lockedUsers, color: theme.palette.warning.dark },
                ].map((stat, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <GlassCard sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4 }}>
                            <Avatar sx={{ bgcolor: `${stat.color}20`, color: stat.color, width: 48, height: 48, borderRadius: 3 }}>
                                {stat.icon}
                            </Avatar>
                            <Box>
                                <Typography variant="h4" fontWeight="bold" sx={{ color: stat.color, fontFamily: 'monospace' }}>
                                    {stat.value || 0}
                                </Typography>
                                <Typography variant="caption" sx={{ letterSpacing: 1, fontWeight: 'bold', opacity: 0.7 }}>
                                    {stat.label}
                                </Typography>
                            </Box>
                        </GlassCard>
                    </Grid>
                ))}
            </Grid>

            {/* MAIN CONTENT AREA */}
            <GlassCard>
                <Tabs
                    value={tabValue}
                    onChange={(e, val) => setTabValue(val)}
                    sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
                    textColor="secondary"
                    indicatorColor="secondary"
                >
                    <Tab icon={<IconTerminal2 size={18} />} label="SISTEMSKI ZAPISI" iconPosition="start" />
                    <Tab icon={<IconBan size={18} />} label="BLOKIRANI IP-OVI" iconPosition="start" />
                    <Tab icon={<IconLock size={18} />} label="ZAKLJUČANI KORISNICI" iconPosition="start" />
                </Tabs>

                {/* LOGS TAB - TERMINAL STYLE */}
                <TabPanel value={tabValue} index={0}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    {['VRIJEME', 'IP ADRESA', 'KORISNIK', 'AKCIJA', 'OPIS', 'OZBILJNOST'].map((head) => (
                                        <TableCell key={head} sx={{
                                            bgcolor: theme.palette.background.default,
                                            fontFamily: 'monospace',
                                            fontWeight: 'bold',
                                            color: theme.palette.text.secondary
                                        }}>
                                            {head}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody sx={{ fontFamily: 'monospace' }}>
                                {filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((log) => (
                                    <TableRow key={log.id} hover>
                                        <TableCell sx={{ fontFamily: 'monospace', color: theme.palette.secondary.main }}>
                                            {formatDate(log.timestamp)}
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{log.ip_address}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{log.username || 'SISTEM'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={formatActionType(log.action_type)}
                                                size="small"
                                                color={severityColors[log.severity] || 'default'}
                                                sx={{ borderRadius: 1, fontFamily: 'monospace', fontWeight: 'bold', height: 20 }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {log.description}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{
                                                width: 8, height: 8, borderRadius: '50%',
                                                bgcolor: theme.palette[severityColors[log.severity] || 'info'].main,
                                                boxShadow: `0 0 8px ${theme.palette[severityColors[log.severity] || 'info'].main}`
                                            }} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]}
                        component="div"
                        count={filteredLogs.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, p) => setPage(p)}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    />
                </TabPanel>

                {/* BLOCKED IPS TAB */}
                <TabPanel value={tabValue} index={1}>
                    <Box mb={2} display="flex" justifyContent="flex-end">
                        <Button variant="contained" color="error" startIcon={<IconBan />} onClick={() => setBlockIpDialog(true)}>
                            BLOKIRAJ IP
                        </Button>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>IP ADRESA</TableCell>
                                    <TableCell>DO</TableCell>
                                    <TableCell>RAZLOG</TableCell>
                                    <TableCell>AKCIJA</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {blockedIps.map((ip) => (
                                    <TableRow key={ip.id}>
                                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{ip.ip_address}</TableCell>
                                        <TableCell>{formatDate(ip.blocked_until, ip.is_permanent)}</TableCell>
                                        <TableCell>{ip.reason}</TableCell>
                                        <TableCell>
                                            <Button size="small" variant="outlined" color="success" onClick={() => handleUnblockIp(ip.ip_address)}>
                                                ODBLOKIRAJ
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>

                {/* USER LOCKOUTS TAB */}
                <TabPanel value={tabValue} index={2}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>KORISNIČKO IME</TableCell>
                                    <TableCell>ZAKLJUČAN DO</TableCell>
                                    <TableCell>POKUŠAJI</TableCell>
                                    <TableCell>AKCIJA</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {lockouts.map((lockout) => (
                                    <TableRow key={lockout.id}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{lockout.username}</TableCell>
                                        <TableCell>{formatDate(lockout.locked_until)}</TableCell>
                                        <TableCell>{lockout.failed_attempts}</TableCell>
                                        <TableCell>
                                            <Button size="small" variant="outlined" color="success" onClick={() => handleUnlockUser(lockout.username)}>
                                                OTKLJUČAJ
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>
            </GlassCard>

            {/* Block IP Dialog */}
            <Dialog open={blockIpDialog} onClose={() => setBlockIpDialog(false)}>
                <DialogTitle>BLOKIRANJE IP ADRESE</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus margin="dense" label="Ciljana IP adresa" fullWidth
                        value={blockIpData.ip_address}
                        onChange={(e) => setBlockIpData({ ...blockIpData, ip_address: e.target.value })}
                        sx={{ mb: 2, fontFamily: 'monospace' }}
                    />
                    <TextField
                        margin="dense" label="Razlog" fullWidth
                        value={blockIpData.reason}
                        onChange={(e) => setBlockIpData({ ...blockIpData, reason: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense" label="Trajanje (sati)" type="number" fullWidth
                        value={blockIpData.duration_hours}
                        onChange={(e) => setBlockIpData({ ...blockIpData, duration_hours: parseInt(e.target.value) })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBlockIpDialog(false)}>ODUSTANI</Button>
                    <Button onClick={handleBlockIpSubmit} variant="contained" color="error">IZVRŠI BLOKIRANJE</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Security;