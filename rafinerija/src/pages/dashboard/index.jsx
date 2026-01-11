import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Container,
    Grid,
    Typography,
    Avatar,
    Chip,
    Button,
    IconButton,
    Paper,
    LinearProgress,
    useTheme,
    Grow,
    Fade
} from '@mui/material';
import {
    IconClock,
    IconChecklist, IconShieldCheck, IconAlertTriangle, IconActivity,
    IconCalendarStats, IconUserCheck, IconArrowUpRight, IconArrowDownRight, IconBriefcase,
    IconDotsVertical, IconArrowRight
} from '@tabler/icons-react';
import { useTranslation } from "react-i18next";
import ReactApexChart from 'react-apexcharts';
import { useSocket } from '../../contexts/SocketContext.jsx';
import { useThemeContext } from '../../contexts/ThemeContext';

import GlassCard from '../../components/ui/GlassCard';

const Dashboard = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const { roleTheme } = useThemeContext();
    const { socket, joinRooms, on, off } = useSocket();

    const [userData, setUserData] = useState(null);
    const [stats, setStats] = useState({
        pendingTasks: 0,
        completedTasks: 0,
        totalTasks: 0,
        lastLogin: null
    });
    const [tasks, setTasks] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [activityData, setActivityData] = useState({ categories: [], series: [] });

    // --- DATA FETCHING ---
    useEffect(() => {
        const initData = async () => {
            const token = localStorage.getItem('token');
            if (!token) { window.location.href = '/login'; return; }

            try {
                const headers = { Authorization: `Bearer ${token}` };

                // 1. Profile
                const userRes = await axios.get('http://localhost:5000/users/profile', { headers });
                setUserData(userRes.data);
                if (userRes.data.role) localStorage.setItem('userRole', userRes.data.role);

                // 2. Tasks (with History)
                const tasksRes = await axios.get('http://localhost:5000/api/tasks/my-tasks?include_completed=true', { headers });


                // 3. Stats calculation (Filter strictly for "My Work")
                const userId = userRes.data.id;
                const userRole = userRes.data.role;

                const relevantTasks = tasksRes.data.filter(t =>
                    t.assigned_to_user_id === userId ||
                    (t.assigned_to_role === userRole && !t.assigned_to_user_id) ||
                    (userRole === 'admin' && t.assigned_to_user_id === userId) // Admin sees only their own execution tasks in "My Space" logic
                );

                // Active tasks for the list (Status based)
                const activeTasks = relevantTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
                setTasks(activeTasks);

                const pending = activeTasks.length;
                const completed = relevantTasks.filter(t => t.status === 'completed').length;

                let lastLoginDate = null;
                let securityStatus = 'N/A';
                let securityThreats = 0;

                // 4. Last login (Allowed for all users usually, but let's be safe)
                try {
                    const loginRes = await axios.get('http://localhost:5000/api/security/last-login', { headers });
                    if (loginRes.data.lastLogin) {
                        lastLoginDate = new Date(loginRes.data.lastLogin.replace(' ', 'T') + 'Z');
                    }
                } catch (e) {
                    console.warn("Could not fetch last login:", e);
                }

                // 5. Security Stats (Check permission or try-catch)
                // Only 'admin' and 'Inženjer sigurnosti' have security.stats.read usually.
                // Or check permissions generally. We'll try-catch it.
                if (userRes.data.role === 'admin' || userRes.data.role === 'Inženjer sigurnosti') {
                    try {
                        const securityRes = await axios.get('http://localhost:5000/api/security/stats', { headers });
                        const highSeverity = securityRes.data.highSeverity || 0;
                        securityStatus = highSeverity === 0 ? 'Secure' : 'Warning';
                        securityThreats = highSeverity;
                    } catch (e) {
                        console.warn("Could not fetch security stats:", e);
                    }
                } else {
                    // For other roles, we might just show "Secure" or hide the widget logic.
                    // Let's assume 'Secure' or 'Unknown' for non-security staff.
                    securityStatus = 'Secure';
                }

                setStats({
                    pendingTasks: pending,
                    completedTasks: completed,
                    totalTasks: relevantTasks.length,
                    lastLogin: lastLoginDate,
                    securityStatus: securityStatus,
                    securityThreats: securityThreats
                });

                // 5. Activity Chart Data (Last 7 Days) - Using relevantTasks
                const last7Days = [...Array(7)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return d;
                });

                const categories = last7Days.map(d => d.toLocaleDateString('hr-HR', { weekday: 'short' }));

                // Count completed tasks per day (using completed_at if available, else updated_at)
                const completedCounts = last7Days.map(date => {
                    const dateStr = date.toISOString().split('T')[0];
                    return relevantTasks.filter(t =>
                        t.status === 'completed' &&
                        (t.completed_at || t.updated_at || t.created_at).startsWith(dateStr)
                    ).length;
                });

                // Count new tasks per day
                const createdCounts = last7Days.map(date => {
                    const dateStr = date.toISOString().split('T')[0];
                    return relevantTasks.filter(t =>
                        t.created_at.startsWith(dateStr)
                    ).length;
                });

                setActivityData({
                    categories,
                    series: [
                        { name: t('completed_tasks'), data: completedCounts },
                        { name: t('new_tasks'), data: createdCounts }
                    ]
                });

                // 6. Geolocation
                if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(async (position) => {
                        try {
                            const { latitude, longitude } = position.coords;
                            const geoRes = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                            if (geoRes.data && geoRes.data.address) {
                                const city = geoRes.data.address.city || geoRes.data.address.town || geoRes.data.address.village;
                                const country = geoRes.data.address.country_code.toUpperCase();
                                setLocationText(`${city}, ${country}`);
                            }
                        } catch (e) {
                            console.error("Geo error:", e);
                        }
                    });
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
            }
        };

        initData();

        // Clock timer
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const [locationText, setLocationText] = useState("Učitavanje...");

    // Socket join
    useEffect(() => {
        if (socket?.connected && userData?.id) {
            joinRooms(userData.id, userData.role);
        }
    }, [socket, userData]);

    // --- CHART CONFIG ---
    const chartOptions = {
        chart: { type: 'area', toolbar: { show: false }, background: 'transparent' },
        colors: [theme.palette.success.main, theme.palette.primary.main],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.6, opacityTo: 0.1 } },
        xaxis: {
            categories: activityData.categories.length > 0 ? activityData.categories : ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'],
            labels: { style: { colors: theme.palette.text.secondary } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: { labels: { style: { colors: theme.palette.text.secondary } } },
        grid: { borderColor: theme.palette.divider, strokeDashArray: 4 },
        theme: { mode: theme.palette.mode },
        tooltip: { theme: theme.palette.mode }
    };

    const chartSeries = activityData.series.length > 0
        ? activityData.series
        : [{ name: t('productivity'), data: [0, 0, 0, 0, 0, 0, 0] }];

    // --- RENDER ---
    return (
        <Box sx={{ minHeight: '100vh', pb: 4 }}>
            {/* HEADER SECTION */}
            <Box sx={{
                position: 'relative',
                height: { xs: 200, md: 280 },
                background: `linear-gradient(120deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                color: '#fff',
                mb: -8,
                pt: 4,
                px: { xs: 2, md: 6 },
                borderRadius: '0 0 40px 40px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                overflow: 'hidden'
            }}>
                {/* Background Pattern */}
                <Box sx={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                <Box sx={{ position: 'absolute', bottom: -30, left: 50, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />

                <Container maxWidth="xl">
                    <Grid container alignItems="center" justifyContent="space-between">
                        <Grid item>
                            <Fade in={true} timeout={800}>
                                <Box>
                                    <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 2 }}>
                                        {currentTime.toLocaleDateString('hr-HR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Zagreb' })}
                                    </Typography>
                                    <Typography variant="h3" fontWeight="800" sx={{ mb: 1, textShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                                        {t('welcome')}, {userData?.ime || 'Korisnik'} 👋
                                    </Typography>
                                    <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600 }}>
                                        {t('personal_space_intro')} {userData?.role}.
                                        {stats.pendingTasks > 0 ? ` ${t('pending_tasks_msg', { count: stats.pendingTasks })}` : ` ${t('no_pending_tasks')}`}
                                    </Typography>
                                </Box>
                            </Fade>
                        </Grid>
                        <Grid item sx={{ display: { xs: 'none', md: 'block' } }}>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="h2" fontWeight="700">
                                    {currentTime.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zagreb' })}
                                </Typography>
                                <Chip
                                    icon={<IconClock size={16} color="#fff" />}
                                    label={locationText}
                                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', backdropFilter: 'blur(5px)' }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            <Container maxWidth="xl" sx={{ mt: 0 }}>
                {/* BENTO GRID LAYOUT */}
                <Grid container spacing={3}>

                    {/* 1. STATS ROW */}
                    <Grid item xs={12} md={3}>
                        <Grow in={true} timeout={1000}>
                            <Box height="100%">
                                <GlassCard>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                        <Box>
                                            <Typography variant="subtitle2" color="textSecondary">{t('active_tasks')}</Typography>
                                            <Typography variant="h3" fontWeight="bold" sx={{ color: theme.palette.primary.main, my: 1 }}>
                                                {stats.pendingTasks}
                                            </Typography>
                                        </Box>
                                        <Avatar sx={{ bgcolor: `${theme.palette.primary.main}20`, color: theme.palette.primary.main, borderRadius: 3 }}>
                                            <IconChecklist />
                                        </Avatar>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(stats.completedTasks / (stats.totalTasks || 1)) * 100}
                                        sx={{ height: 6, borderRadius: 3, bgcolor: theme.palette.action.hover }}
                                    />
                                    <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
                                        {stats.completedTasks} završenih od {stats.totalTasks} ukupno
                                    </Typography>
                                </GlassCard>
                            </Box>
                        </Grow>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Grow in={true} timeout={1200}>
                            <Box height="100%">
                                <GlassCard>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                        <Box>
                                            <Typography variant="subtitle2" color="textSecondary">{t('security')}</Typography>
                                            <Typography variant="h4" fontWeight="bold" sx={{
                                                color: stats.securityStatus === 'Secure' ? theme.palette.success.main : theme.palette.warning.main,
                                                my: 1
                                            }}>
                                                {stats.securityStatus === 'Secure' ? t('secure') : t('at_risk')}
                                            </Typography>
                                        </Box>
                                        <Avatar sx={{
                                            bgcolor: stats.securityStatus === 'Secure' ? `${theme.palette.success.main}20` : `${theme.palette.warning.main}20`,
                                            color: stats.securityStatus === 'Secure' ? theme.palette.success.main : theme.palette.warning.main,
                                            borderRadius: 3
                                        }}>
                                            <IconShieldCheck />
                                        </Avatar>
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={1} mt={2}>
                                        <Chip
                                            label={stats.securityStatus === 'Secure' ? t('no_threats') : `${stats.securityThreats} ${t('threats')}`}
                                            size="small"
                                            color={stats.securityStatus === 'Secure' ? "success" : "warning"}
                                            variant="outlined"
                                        />
                                        <Typography variant="caption" color="textSecondary">{t('last_check_now')}</Typography>
                                    </Box>
                                </GlassCard>
                            </Box>
                        </Grow>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Grow in={true} timeout={1400}>
                            <Box height="100%">
                                <GlassCard>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                        <Box>
                                            <Typography variant="subtitle2" color="textSecondary">{t('last_login')}</Typography>
                                            <Typography variant="h5" fontWeight="bold" sx={{ my: 1 }}>
                                                {stats.lastLogin ? new Date(stats.lastLogin).toLocaleString('hr-HR') : "N/A"}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                {stats.lastLogin ? stats.lastLogin.toLocaleDateString('hr-HR', { timeZone: 'Europe/Zagreb' }) : 'Prva prijava'}
                                            </Typography>
                                        </Box>
                                        <Avatar sx={{ bgcolor: `${theme.palette.info.main}20`, color: theme.palette.info.main, borderRadius: 3 }}>
                                            <IconClock />
                                        </Avatar>
                                    </Box>
                                </GlassCard>
                            </Box>
                        </Grow>
                    </Grid>

                    {/* 2. ACTIVITY CHART */}
                    <Grid item xs={12} md={8}>
                        <GlassCard>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                <Typography variant="h6" fontWeight="bold">{t('activity_overview')}</Typography>
                                <IconButton size="small"><IconDotsVertical /></IconButton>
                            </Box>
                            <Box height={300}>
                                <ReactApexChart options={chartOptions} series={chartSeries} type="area" height="100%" />
                            </Box>
                        </GlassCard>
                    </Grid>

                    {/* 3. TASK LIST */}
                    <Grid item xs={12} md={4}>
                        <GlassCard sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6" fontWeight="bold">{t('my_tasks')}</Typography>
                                <IconButton size="small" color="primary"><IconArrowRight /></IconButton>
                            </Box>

                            <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                                {tasks.length === 0 ? (
                                    <Box textAlign="center" py={4} color="text.secondary">
                                        <IconChecklist size={48} style={{ opacity: 0.2 }} />
                                        <Typography>{t('no_tasks_enjoy')}</Typography>
                                    </Box>
                                ) : (
                                    tasks.slice(0, 5).map((task) => (
                                        <Paper
                                            key={task.id}
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                mb: 2,
                                                borderRadius: 2,
                                                bgcolor: theme.palette.background.default,
                                                borderLeft: `4px solid ${task.priority === 'high' ? theme.palette.error.main :
                                                    task.priority === 'medium' ? theme.palette.warning.main :
                                                        theme.palette.success.main
                                                    }`
                                            }}
                                        >
                                            <Typography variant="subtitle2" fontWeight="600">{task.title}</Typography>
                                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                                                <Chip
                                                    label={task.status}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: task.status === 'completed' ? `${theme.palette.success.main}20` : `${theme.palette.warning.main}20`,
                                                        color: task.status === 'completed' ? theme.palette.success.main : theme.palette.warning.main,
                                                        fontWeight: 'bold',
                                                        fontSize: '0.7rem'
                                                    }}
                                                />
                                                <Typography variant="caption" color="textSecondary">
                                                    {new Date(task.created_at).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    ))
                                )}
                            </Box>
                        </GlassCard>
                    </Grid>

                </Grid>
            </Container>
        </Box>
    );
};

export default Dashboard;