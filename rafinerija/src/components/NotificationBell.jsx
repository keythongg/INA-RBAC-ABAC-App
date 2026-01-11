import React, { useState, useEffect } from "react";
import {
    IconButton,
    Badge,
    Menu,
    MenuItem,
    Typography,
    Box,
    Divider,
    Button,
    Avatar,
} from "@mui/material";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import FireExtinguisherIcon from "@mui/icons-material/FireExtinguisher";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import InventoryIcon from "@mui/icons-material/Inventory";
import { useSocket } from "../contexts/SocketContext";

const NotificationBell = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [taskNotifications, setTaskNotifications] = useState([]);
    const [activeInventoryAlerts, setActiveInventoryAlerts] = useState(new Set());
    const { on, off } = useSocket();

    useEffect(() => {
        console.log(' NotificationBell - Setting up listeners');

        // Task notifikacije
        const handleNewTask = (taskData) => {
            console.log('📝 PRIMLJENA TASK NOTIFIKACIJA u NotificationBell:', taskData);

            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const userId = userData.id;
            const userRole = userData.role;

            console.log('👤 My info - ID:', userId, 'Role:', userRole);
            console.log('🎯 Task assignment - User:', taskData.assignedTo, 'Role:', taskData.assignedRole);

            let isForMe = false;

            // 1. Admin vidi sve
            if (userRole === 'admin') {
                isForMe = true;
                console.log('✅ Admin - vidim sve zadatke');
            }

            // 2. Javni zadaci (za sve)
            else if (!taskData.assignedTo && !taskData.assignedRole) {
                isForMe = true;
                console.log('✅ Public task - za sve');
            }

            // 3. Dodijeljen konkretnom korisniku
            else if (taskData.assignedTo && taskData.assignedTo.toString() === userId?.toString()) {
                isForMe = true;
                console.log('✅ Assigned to me specifically');
            }

            // 4. Dodijeljen ulozi
            else if (taskData.assignedRole && taskData.assignedRole === userRole) {
                isForMe = true;
                console.log('✅ Assigned to my role');
            }

            console.log('🎯 Final decision - Is for me?', isForMe);

            if (isForMe) {
                const newTaskNotification = {
                    id: `task_${taskData.task?.id || Date.now()}_${Date.now()}`,
                    taskId: taskData.task?.id,
                    type: 'task',
                    title: "Novi zadatak",
                    message: `${taskData.assignedByName ? `Od ${taskData.assignedByName}: ` : ''}${taskData.task?.title || 'Novi zadatak'}`,
                    userImage: taskData.createdByImage, // Add user image from payload
                    icon: <AssignmentIcon color="primary" />,
                    timestamp: new Date(),
                    isRead: false
                };

                setTaskNotifications(prev => {
                    const exists = prev.some(n => n.taskId === taskData.task?.id);
                    if (!exists) {
                        console.log('Dodajem novu task notifikaciju');
                        return [newTaskNotification, ...prev].slice(0, 20);
                    }
                    console.log('Task notifikacija već postoji');
                    return prev;
                });

                // 🔵 DODANO: Play zvuk za notifikaciju (opcionalno)
                playNotificationSound();
            }
        };

        // Inventory notifikacije
        const handleInventoryUpdate = (data) => {
            console.log('📦 Nova inventory notifikacija:', data);

            if (!data || data.length === 0) {
                setActiveInventoryAlerts(new Set());
                return;
            }

            const newAlerts = new Set();
            const newNotifications = [];

            data.forEach((item) => {
                const alertKey = `inv_${item.id}`;
                newAlerts.add(alertKey);

                if (!activeInventoryAlerts.has(alertKey)) {
                    newNotifications.push({
                        id: `${alertKey}_${Date.now()}`,
                        alertKey,
                        itemId: item.id,
                        type: 'inventory',
                        title: getAlertTitle(item.quantity),
                        message: `${item.type} stock is at ${item.quantity}L!`,
                        icon: getAlertIcon(item.quantity),
                        timestamp: new Date(),
                        isRead: false,
                        quantity: item.quantity
                    });
                }
            });

            setActiveInventoryAlerts(newAlerts);

            if (newNotifications.length > 0) {
                setNotifications(prev => {
                    const filteredPrev = prev.filter(n =>
                        n.type !== 'inventory' || newAlerts.has(n.alertKey)
                    );
                    return [...newNotifications, ...filteredPrev].slice(0, 20);
                });

                // 🔵 DODANO: Play zvuk za inventory alert
                playNotificationSound();
            }
        };

        // Registruj handlere
        on('new_task', handleNewTask);
        on('updateNotifications', handleInventoryUpdate);

        // Cleanup
        return () => {
            off('new_task', handleNewTask);
            off('updateNotifications', handleInventoryUpdate);
        };
    }, [on, off]);

    const getAlertTitle = (quantity) => {
        if (quantity < 200) return "🚨 Kritično niska zaliha";
        if (quantity < 500) return "🔥 Niska zaliha";
        return "⚠️ Zalihe su niske";
    };

    const getAlertIcon = (quantity) => {
        if (quantity < 200) return <ErrorOutlineIcon color="error" />;
        if (quantity < 500) return <FireExtinguisherIcon color="warning" />;
        return <WarningAmberIcon color="warning" />;
    };

    // 🔵 DODANO: Funkcija za zvuk notifikacije
    const playNotificationSound = () => {

        try {
            // Ako imate audio fajl u public folderu
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (error) {
            console.log('Sound error:', error);
        }
    };

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
        markAllAsRead();
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = (notification) => {
        if (notification.type === 'task' && notification.taskId) {
            window.location.href = `/dashboard#task-${notification.taskId}`;
        } else if (notification.type === 'inventory') {
            window.location.href = '/inventory';
        }
        markAsRead(notification.id);
        handleClose();
    };

    const markAsRead = (notificationId) => {
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setTaskNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setTaskNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const clearAllNotifications = () => {
        setNotifications([]);
        setTaskNotifications([]);
        setActiveInventoryAlerts(new Set());
        handleClose();
    };

    const clearInventoryNotifications = () => {
        setNotifications(prev => prev.filter(n => n.type !== 'inventory'));
        setActiveInventoryAlerts(new Set());
    };

    const allNotifications = [...taskNotifications, ...notifications];
    const unreadCount = allNotifications.filter(n => !n.isRead).length;
    const inventoryAlertsCount = notifications.filter(n => n.type === 'inventory').length;

    return (
        <>
            <IconButton
                onClick={handleOpen}
                sx={{
                    backgroundColor: "#ede7f6",
                    borderRadius: "8px",
                    padding: "8px",
                    color: "#673ab7",
                    "&:hover": { backgroundColor: "#5e35b1", color: "#ede7f6" },
                    position: 'relative'
                }}
            >
                <Badge
                    badgeContent={unreadCount}
                    color="error"
                    sx={{
                        '& .MuiBadge-badge': {
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                        }
                    }}
                >
                    <NotificationsOutlinedIcon />
                </Badge>

                {/* Pulsirajuća tačka kada ima novih notifikacija */}
                {unreadCount > 0 && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: 'error.main',
                            animation: 'pulse 1.5s infinite',
                            '@keyframes pulse': {
                                '0%': { transform: 'scale(1)', opacity: 1 },
                                '50%': { transform: 'scale(1.2)', opacity: 0.7 },
                                '100%': { transform: 'scale(1)', opacity: 1 }
                            }
                        }}
                    />
                )}
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                sx={{ mt: 1 }}
                PaperProps={{
                    sx: {
                        width: 400,
                        borderRadius: 2,
                        boxShadow: 3,
                        p: 1,
                        maxHeight: 500,
                        '& .MuiMenuItem-root': {
                            py: 1.5
                        }
                    }
                }}
            >
                <Box sx={{
                    px: 2,
                    py: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: 'primary.main',
                    borderRadius: 1,
                    mb: 1
                }}>
                    <Typography variant="h6" fontWeight={600} color="white">
                        Notifikacije {unreadCount > 0 && `(${unreadCount})`}
                    </Typography>
                    {allNotifications.length > 0 && (
                        <Box>
                            {inventoryAlertsCount > 0 && (
                                <Button
                                    size="small"
                                    onClick={clearInventoryNotifications}
                                    sx={{
                                        fontSize: '0.75rem',
                                        mr: 1,
                                        color: 'white',
                                        bgcolor: 'error.main',
                                        '&:hover': { bgcolor: 'error.dark' }
                                    }}
                                >
                                    <InventoryIcon fontSize="small" sx={{ mr: 0.5 }} />
                                    Obriši inventory
                                </Button>
                            )}
                            <Button
                                size="small"
                                startIcon={<ClearAllIcon />}
                                onClick={clearAllNotifications}
                                sx={{
                                    fontSize: '0.75rem',
                                    color: 'white',
                                    bgcolor: 'secondary.main',
                                    '&:hover': { bgcolor: 'secondary.dark' }
                                }}
                            >
                                Obriši sve
                            </Button>
                        </Box>
                    )}
                </Box>

                <Divider sx={{ mb: 1 }} />

                {allNotifications.length > 0 ? (
                    <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
                        {allNotifications.map((notification) => (
                            <MenuItem
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                sx={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 1,
                                    mb: 1,
                                    p: 1.5,
                                    borderLeft: notification.type === 'task' ? '3px solid #1976d2' : '3px solid #f57c00',
                                    bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                                    '&:hover': {
                                        bgcolor: notification.type === 'task' ? 'primary.light' : 'warning.light',
                                        transform: 'translateX(2px)',
                                        transition: 'all 0.2s'
                                    },
                                    borderRadius: 1,
                                    borderBottom: '1px solid',
                                    borderBottomColor: 'divider'
                                }}
                            >
                                <Box sx={{
                                    mt: 0.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    // Use transparent if image exists, else fallback color
                                    bgcolor: notification.userImage ? 'transparent' : (notification.type === 'task' ? 'primary.main' : 'warning.main'),
                                    color: 'white'
                                }}>
                                    {notification.userImage ? (
                                        <Avatar
                                            src={`http://localhost:5000${notification.userImage}`}
                                            alt="User"
                                            sx={{ width: 32, height: 32 }}
                                        />
                                    ) : (
                                        notification.icon
                                    )}
                                </Box>
                                <Box flex={1}>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                            {notification.title}
                                        </Typography>
                                        {!notification.isRead && (
                                            <Box sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                bgcolor: 'error.main',
                                                ml: 1
                                            }} />
                                        )}
                                    </Box>
                                    <Typography variant="body2" sx={{
                                        color: "text.secondary",
                                        fontSize: '0.875rem',
                                        lineHeight: 1.3
                                    }}>
                                        {notification.message}
                                    </Typography>
                                    <Typography variant="caption" sx={{
                                        color: "text.disabled",
                                        display: 'block',
                                        mt: 0.5,
                                        fontSize: '0.7rem'
                                    }}>
                                        {notification.timestamp.toLocaleTimeString('hr-HR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                        })}
                                    </Typography>
                                </Box>
                            </MenuItem>
                        ))}
                    </Box>
                ) : (
                    <MenuItem onClick={handleClose} sx={{
                        textAlign: "center",
                        py: 3,
                        flexDirection: 'column'
                    }}>
                        <Box sx={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            bgcolor: 'grey.100',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2
                        }}>
                            <NotificationsOutlinedIcon sx={{
                                fontSize: 30,
                                color: 'grey.400'
                            }} />
                        </Box>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                            Nema novih notifikacija
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                            Novi zadaci i alarmi će se pojaviti ovdje
                        </Typography>
                    </MenuItem>
                )}

                {allNotifications.length > 0 && (
                    <>
                        <Divider sx={{ mt: 1, mb: 1 }} />
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            px: 1
                        }}>
                            <Button
                                variant="text"
                                size="small"
                                onClick={markAllAsRead}
                                sx={{
                                    fontSize: '0.75rem',
                                    color: 'primary.main'
                                }}
                            >
                                Označi sve kao pročitano
                            </Button>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: "primary.main",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    display: 'inline-block',
                                    '&:hover': {
                                        textDecoration: 'underline',
                                        color: 'primary.dark'
                                    }
                                }}
                                onClick={() => {
                                    window.open('/notifications', '_blank');
                                    handleClose();
                                }}
                            >
                                Prikaži sve →
                            </Typography>
                        </Box>
                    </>
                )}
            </Menu>
        </>
    );
};

export default NotificationBell;