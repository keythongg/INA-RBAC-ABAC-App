import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Container,
    Typography,
    Grid,
    Chip,
    IconButton,
    Button,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress,
    Tooltip,
    useTheme,
    Fade,
    Zoom,
    CircularProgress,
    alpha
} from '@mui/material';
import {
    Search as SearchIcon,
    Clear as ClearIcon,
    Assignment as AssignmentIcon,
    AccessTime as AccessTimeIcon,
    CheckCircle as CheckCircleIcon,
    Pending as PendingIcon,
    Refresh as RefreshIcon,
    PriorityHigh as PriorityHighIcon,
    LowPriority as LowPriorityIcon,
    ArrowUpward as ArrowUpwardIcon,
    TrendingUp as TrendingUpIcon,
    Cancel as CancelIcon,
    Add as AddIcon,
    Person as PersonIcon,
    Work as WorkIcon,
    CalendarToday as CalendarIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Done as DoneIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { hr } from 'date-fns/locale';
import GlassCard from '../../components/ui/GlassCard';
import { useThemeContext } from '../../contexts/ThemeContext';
import { createTask, fetchUsers, updateTask, deleteTask, completeTask } from '../../services/api';

// Teme za prioritete
const PRIORITY_THEMES = {
    critical: { color: '#ef5350', icon: <PriorityHighIcon /> },
    high: { color: '#ff9800', icon: <ArrowUpwardIcon /> },
    medium: { color: '#29b6f6', icon: <TrendingUpIcon /> },
    low: { color: '#66bb6a', icon: <LowPriorityIcon /> }
};

// Teme za statuse
const STATUS_THEMES = {
    pending: { color: '#ffa726', icon: <PendingIcon />, label: 'Na čekanju' },
    in_progress: { color: '#29b6f6', icon: <AccessTimeIcon />, label: 'U toku' },
    completed: { color: '#66bb6a', icon: <CheckCircleIcon />, label: 'Završeno' },
    cancelled: { color: '#ef5350', icon: <CancelIcon />, label: 'Otkazano' }
};

const AllTasksPage = () => {
    const theme = useTheme();
    const { roleTheme } = useThemeContext();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [users, setUsers] = useState([]); // Za assignment
    const [isAdmin, setIsAdmin] = useState(false);

    // Filteri
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');

    // Create/Edit Task Modal
    const [openCreateModal, setOpenCreateModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: '', // User ID ili 'role:RoleName'
        due_date: ''
    });

    // Stats
    const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, completed: 0 });

    useEffect(() => {
        const userRole = localStorage.getItem('userRole') || localStorage.getItem('role');
        setIsAdmin(userRole === 'admin');
        fetchAllTasks();
        if (userRole === 'admin') {
            loadUsers();
        }
    }, []);

    useEffect(() => {
        applyFilters();
        calculateStats();
    }, [tasks, searchTerm, statusFilter, priorityFilter]);

    const fetchAllTasks = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/tasks/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(response.data);
            setFilteredTasks(response.data);
        } catch (error) {
            console.error('Greška pri dohvaćanju zadataka:', error);
            // Fallback
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/tasks/my-tasks', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTasks(response.data);
                setFilteredTasks(response.data);
            } catch (fallbackError) {
                console.error('Fallback greška:', fallbackError);
            }
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const data = await fetchUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to load users", error);
        }
    };

    const handleOpenCreate = () => {
        setIsEditing(false);
        setEditingTaskId(null);
        setNewTask({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' });
        setOpenCreateModal(true);
    };

    const handleOpenEdit = (task) => {
        setIsEditing(true);
        setEditingTaskId(task.id);

        // Determine assigned_to value
        let assignedTo = '';
        if (task.assigned_to_role) {
            assignedTo = `role:${task.assigned_to_role}`;
        } else if (task.assigned_to_user_id) {
            assignedTo = task.assigned_to_user_id;
        }

        setNewTask({
            title: task.title,
            description: task.description,
            priority: task.priority,
            assigned_to: assignedTo,
            due_date: task.due_date ? task.due_date.split('T')[0] : ''
        });
        setOpenCreateModal(true);
    };

    const handleSubmitTask = async () => {
        if (!newTask.title || !newTask.description) return;

        try {
            const payload = {
                ...newTask,
                assigned_to_user_id: newTask.assigned_to.toString().startsWith('role:') ? null : newTask.assigned_to,
                assigned_to_role: newTask.assigned_to.toString().startsWith('role:') ? newTask.assigned_to.replace('role:', '') : null
            };

            if (isEditing) {
                await updateTask(editingTaskId, payload);
            } else {
                await createTask(payload);
            }

            setOpenCreateModal(false);
            setNewTask({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' });
            fetchAllTasks(); // Refresh list
        } catch (error) {
            console.error("Error saving task:", error);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm("Jeste li sigurni da želite obrisati ovaj zadatak?")) {
            try {
                await deleteTask(taskId);
                fetchAllTasks();
            } catch (error) {
                console.error("Error deleting task:", error);
            }
        }
    };

    const handleCompleteTask = async (taskId) => {
        try {
            await completeTask(taskId);
            fetchAllTasks();
        } catch (error) {
            console.error("Error completing task:", error);
        }
    };

    const applyFilters = () => {
        let result = [...tasks];
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(t => t.title.toLowerCase().includes(term) || t.description.toLowerCase().includes(term));
        }
        if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
        if (priorityFilter !== 'all') result = result.filter(t => t.priority === priorityFilter);
        setFilteredTasks(result);
    };

    const calculateStats = () => {
        setStats({
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'pending').length,
            in_progress: tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length
        });
    };

    return (
        <Box sx={{ minHeight: '100vh', pb: 4, pt: 2 }}>
            <Container maxWidth="xl">
                {/* Header Section */}
                <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="h3" fontWeight="800" gutterBottom sx={{
                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            textShadow: '0px 2px 10px rgba(0,0,0,0.1)'
                        }}>
                            Pregled Zadataka
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Upravljanje i praćenje svih operativnih zadataka
                        </Typography>
                    </Box>
                    <Box display="flex" gap={2}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={fetchAllTasks}
                            sx={{ borderRadius: 3, textTransform: 'none', borderWidth: 2 }}
                        >
                            Osvježi
                        </Button>
                        {isAdmin && (
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleOpenCreate}
                                sx={{
                                    borderRadius: 3,
                                    textTransform: 'none',
                                    boxShadow: `0 8px 20px -4px ${alpha(theme.palette.primary.main, 0.5)}`,
                                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                                }}
                            >
                                Novi Zadatak
                            </Button>
                        )}
                    </Box>
                </Box>

                {/* Stats Cards */}
                <Grid container spacing={3} mb={4}>
                    {[
                        { title: 'Ukupno', value: stats.total, color: theme.palette.info.main, icon: <WorkIcon /> },
                        { title: 'Aktivni', value: stats.pending + stats.in_progress, color: theme.palette.warning.main, icon: <AccessTimeIcon /> },
                        { title: 'Završeni', value: stats.completed, color: theme.palette.success.main, icon: <CheckCircleIcon /> }
                    ].map((stat, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                                <Box>
                                    <GlassCard sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography variant="body2" color="textSecondary" fontWeight={600}>{stat.title}</Typography>
                                            <Typography variant="h3" fontWeight={800} sx={{ color: stat.color, my: 1 }}>{stat.value}</Typography>
                                        </Box>
                                        <Avatar sx={{ bgcolor: alpha(stat.color, 0.1), color: stat.color, width: 56, height: 56, borderRadius: 4 }}>
                                            {stat.icon}
                                        </Avatar>
                                    </GlassCard>
                                </Box>
                            </Zoom>
                        </Grid>
                    ))}
                </Grid>

                {/* Filters & Content */}
                <GlassCard sx={{ p: 3, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                placeholder="Pretraži zadatke..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
                                    sx: { borderRadius: 3, bgcolor: theme.palette.background.paper }
                                }}
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    displayEmpty
                                    sx={{ borderRadius: 3, bgcolor: theme.palette.background.paper }}
                                >
                                    <MenuItem value="all">Svi statusi</MenuItem>
                                    <MenuItem value="pending">Na čekanju</MenuItem>
                                    <MenuItem value="in_progress">U toku</MenuItem>
                                    <MenuItem value="completed">Završeno</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                    displayEmpty
                                    sx={{ borderRadius: 3, bgcolor: theme.palette.background.paper }}
                                >
                                    <MenuItem value="all">Svi prioriteti</MenuItem>
                                    <MenuItem value="critical">Kritični</MenuItem>
                                    <MenuItem value="high">Visoki</MenuItem>
                                    <MenuItem value="medium">Srednji</MenuItem>
                                    <MenuItem value="low">Niski</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </GlassCard>

                {/* Task List (Cards) */}
                <Grid container spacing={3}>
                    {loading ? (
                        <Box width="100%" display="flex" justifyContent="center" py={10}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        filteredTasks.map((task, index) => (
                            <Grid item xs={12} md={6} lg={4} key={task.id}>
                                <Fade in={true} timeout={500 + (index * 50)}>
                                    <Box height="100%">
                                        <GlassCard sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transition: 'transform 0.2s',
                                            '&:hover': { transform: 'translateY(-5px)' },
                                            borderLeft: `6px solid ${PRIORITY_THEMES[task.priority]?.color || theme.palette.divider}`
                                        }}>
                                            <Box display="flex" justifyContent="space-between" mb={2} alignItems="center">
                                                <Chip
                                                    label={STATUS_THEMES[task.status]?.label || task.status}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: alpha(STATUS_THEMES[task.status]?.color || '#999', 0.1),
                                                        color: STATUS_THEMES[task.status]?.color || '#999',
                                                        fontWeight: 700,
                                                        borderRadius: 2
                                                    }}
                                                />
                                                <Box display="flex" gap={1}>
                                                    {isAdmin && (
                                                        <>
                                                            {task.status !== 'completed' && (
                                                                <Tooltip title="Završi zadatak">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleCompleteTask(task.id)}
                                                                        sx={{ color: theme.palette.success.main }}
                                                                    >
                                                                        <DoneIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                            <Tooltip title="Uredi">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleOpenEdit(task)}
                                                                    sx={{ color: theme.palette.info.main }}
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Obriši">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleDeleteTask(task.id)}
                                                                    sx={{ color: theme.palette.error.main }}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                    <Tooltip title={`Prioritet: ${task.priority}`}>
                                                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'transparent', color: PRIORITY_THEMES[task.priority]?.color }}>
                                                            {PRIORITY_THEMES[task.priority]?.icon}
                                                        </Avatar>
                                                    </Tooltip>
                                                </Box>
                                            </Box>

                                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                                {task.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                                {task.description}
                                            </Typography>

                                            <Box mt={2} pt={2} borderTop={`1px dashed ${theme.palette.divider}`} display="flex" justifyContent="space-between" alignItems="center">
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                                                        {task.assigned_to_name ? task.assigned_to_name[0] : <PersonIcon />}
                                                    </Avatar>
                                                    <Typography variant="caption" fontWeight={600}>
                                                        {task.assigned_to_name || 'Nedodijeljeno'}
                                                    </Typography>
                                                </Box>
                                                {task.due_date && (
                                                    <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
                                                        <CalendarIcon fontSize="small" />
                                                        <Typography variant="caption">{format(new Date(task.due_date), 'dd.MM.')}</Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </GlassCard>
                                    </Box>
                                </Fade>
                            </Grid>
                        ))
                    )}
                </Grid>
            </Container>

            {/* Create/Edit Task Modal */}
            <Dialog
                open={openCreateModal}
                onClose={() => setOpenCreateModal(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 4, backdropFilter: 'blur(10px)', bgcolor: alpha(theme.palette.background.paper, 0.9) }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>{isEditing ? 'Uredi Zadatak' : 'Novi Zadatak'}</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={3} mt={1}>
                        <TextField
                            label="Naslov zadatka"
                            fullWidth
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        />
                        <TextField
                            label="Opis"
                            fullWidth
                            multiline
                            rows={3}
                            value={newTask.description}
                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        />

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Prioritet</InputLabel>
                                    <Select
                                        value={newTask.priority}
                                        label="Prioritet"
                                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                    >
                                        <MenuItem value="low">Nizak</MenuItem>
                                        <MenuItem value="medium">Srednji</MenuItem>
                                        <MenuItem value="high">Visok</MenuItem>
                                        <MenuItem value="critical">Kritičan</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Dodijeli</InputLabel>
                                    <Select
                                        value={newTask.assigned_to}
                                        label="Dodijeli"
                                        onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                                    >
                                        <MenuItem value=""><em>Nitko</em></MenuItem>
                                        <MenuItem disabled>--- Uloge ---</MenuItem>
                                        {['Inženjer sigurnosti', 'Menadžer inventara', 'Finansijski analitičar', 'Koordinator stanica'].map(role => (
                                            <MenuItem value={`role:${role}`} key={role}>{role} (Tim)</MenuItem>
                                        ))}
                                        <MenuItem disabled>--- Zaposlenici ---</MenuItem>
                                        {users.map(user => (
                                            <MenuItem value={user.id} key={user.id}>{user.ime} {user.prezime} ({user.role})</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <TextField
                            label="Rok izvršenja"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={newTask.due_date}
                            onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenCreateModal(false)} color="inherit" sx={{ borderRadius: 3 }}>
                        Odustani
                    </Button>
                    <Button
                        onClick={handleSubmitTask}
                        variant="contained"
                        disabled={!newTask.title || !newTask.description}
                        sx={{ borderRadius: 3, px: 4, background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})` }}
                    >
                        {isEditing ? 'Spremi Promjene' : 'Kreiraj Zadatak'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AllTasksPage;