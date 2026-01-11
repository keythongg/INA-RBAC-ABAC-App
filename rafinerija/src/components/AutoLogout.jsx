import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box
} from '@mui/material';
import { Logout, AccessTime } from '@mui/icons-material';

const AutoLogout = () => {
    const [showWarning, setShowWarning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    const inactivityTimerRef = useRef(null);
    const logoutTimerRef = useRef(null);
    const isTrackingRef = useRef(true);

    const WARNING_TIME = 60;
    const TOTAL_INACTIVITY_TIME = 360;
    const CHECK_INTERVAL = 1000;

    const stopTracking = useCallback(() => {
        isTrackingRef.current = false;
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }
    }, []);

    const resetTimer = useCallback(() => {
        if (!isTrackingRef.current) return;

        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }
        if (logoutTimerRef.current) {
            clearInterval(logoutTimerRef.current);
            logoutTimerRef.current = null;
        }

        setShowWarning(false);
        setTimeLeft(0);

        inactivityTimerRef.current = setTimeout(() => {
            setShowWarning(true);
            setTimeLeft(WARNING_TIME);
            stopTracking();

            logoutTimerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleLogout();
                        return 0;
                    }
                    return prev - 1;
                });
            }, CHECK_INTERVAL);

        }, (TOTAL_INACTIVITY_TIME - WARNING_TIME) * 1000);

    }, [WARNING_TIME, TOTAL_INACTIVITY_TIME, CHECK_INTERVAL, stopTracking]);

    const handleStayLoggedIn = useCallback(() => {
        if (logoutTimerRef.current) {
            clearInterval(logoutTimerRef.current);
            logoutTimerRef.current = null;
        }

        setShowWarning(false);
        setTimeLeft(0);
        startTracking();
    }, []);

    const startTracking = useCallback(() => {
        isTrackingRef.current = true;
        resetTimer();
    }, [resetTimer]);

    const handleLogout = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }
        if (logoutTimerRef.current) {
            clearInterval(logoutTimerRef.current);
            logoutTimerRef.current = null;
        }

        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }, []);

    const handleActivity = useCallback(() => {
        if (isTrackingRef.current) {
            resetTimer();
        }
    }, [resetTimer]);

    useEffect(() => {
        const events = [
            'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart',
            'click', 'keydown', 'wheel', 'resize', 'mousemove'
        ];

        const eventHandlers = events.map(event => {
            const handler = () => {
                if (isTrackingRef.current) {
                    handleActivity();
                }
            };
            document.addEventListener(event, handler, { passive: true });
            return { event, handler };
        });

        startTracking();

        return () => {
            eventHandlers.forEach(({ event, handler }) => {
                document.removeEventListener(event, handler);
            });

            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            if (logoutTimerRef.current) clearInterval(logoutTimerRef.current);
        };
    }, [handleActivity, startTracking]);

    const minutesUntilWarning = Math.floor((TOTAL_INACTIVITY_TIME - WARNING_TIME) / 60);
    const secondsUntilWarning = (TOTAL_INACTIVITY_TIME - WARNING_TIME) % 60;

    return (
        <Dialog
            open={showWarning}
            maxWidth="xs"
            fullWidth
            onClose={(event, reason) => {
                if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
            }}
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    overflow: 'hidden'
                }
            }}
        >
            {/* Header */}
            <DialogTitle sx={{
                textAlign: 'center',
                pb: 2,
                pt: 3,
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                borderBottom: '1px solid #334155'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: timeLeft <= 10
                            ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
                            : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: timeLeft <= 10
                            ? '0 0 20px rgba(220, 38, 38, 0.4)'
                            : '0 0 20px rgba(59, 130, 246, 0.4)'
                    }}>
                        <AccessTime sx={{ color: '#fff', fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" sx={{
                        color: '#f8fafc',
                        fontWeight: 700,
                        fontSize: '1.25rem'
                    }}>
                        SESSION TIMEOUT
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ py: 4, textAlign: 'center' }}>
                {/* Countdown Display */}
                <Box sx={{
                    position: 'relative',
                    width: 120,
                    height: 120,
                    margin: '0 auto 24px',
                    background: `conic-gradient(
                        ${timeLeft <= 10 ? '#dc2626' : '#3b82f6'} 
                        ${(timeLeft / WARNING_TIME) * 360}deg, 
                        #334155 ${(timeLeft / WARNING_TIME) * 360}deg
                    )`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        width: 100,
                        height: 100,
                        background: '#0f172a',
                        borderRadius: '50%',
                        border: '2px solid #334155'
                    }
                }}>
                    <Typography variant="h3" sx={{
                        color: '#f8fafc',
                        fontWeight: 700,
                        position: 'relative',
                        zIndex: 1
                    }}>
                        {timeLeft}
                    </Typography>
                </Box>

                {/* Message */}
                <Typography variant="body1" sx={{
                    color: '#cbd5e1',
                    mb: 2,
                    lineHeight: 1.6
                }}>
                    Inactive for {minutesUntilWarning}m {secondsUntilWarning}s
                </Typography>

                <Typography variant="body2" sx={{
                    color: timeLeft <= 10 ? '#ef4444' : '#94a3b8',
                    fontWeight: timeLeft <= 10 ? 600 : 400,
                    fontSize: '0.875rem'
                }}>
                    {timeLeft <= 10
                        ? 'Final warning - session will expire'
                        : 'Confirm to continue your session'
                    }
                </Typography>
            </DialogContent>

            <DialogActions sx={{
                justifyContent: 'center',
                pb: 3,
                gap: 2,
                px: 3,
                background: '#1e293b',
                borderTop: '1px solid #334155'
            }}>
                <Button
                    variant="outlined"
                    onClick={handleLogout}
                    sx={{
                        borderRadius: '8px',
                        textTransform: 'none',
                        borderColor: '#475569',
                        color: '#cbd5e1',
                        px: 3,
                        py: 1,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        '&:hover': {
                            borderColor: '#dc2626',
                            color: '#dc2626',
                            background: 'rgba(220, 38, 38, 0.1)'
                        }
                    }}
                >
                    Logout
                </Button>

                <Button
                    variant="contained"
                    onClick={handleStayLoggedIn}
                    sx={{
                        borderRadius: '8px',
                        textTransform: 'none',
                        background: timeLeft <= 10
                            ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: '#fff',
                        px: 3,
                        py: 1,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        boxShadow: timeLeft <= 10
                            ? '0 4px 12px rgba(220, 38, 38, 0.3)'
                            : '0 4px 12px rgba(59, 130, 246, 0.3)',
                        '&:hover': {
                            background: timeLeft <= 10
                                ? 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)'
                                : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            boxShadow: timeLeft <= 10
                                ? '0 6px 16px rgba(220, 38, 38, 0.4)'
                                : '0 6px 16px rgba(59, 130, 246, 0.4)'
                        }
                    }}
                >
                    Continue
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AutoLogout;