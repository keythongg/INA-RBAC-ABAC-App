import React from 'react';
import { Paper, useTheme, Box } from '@mui/material';
import { useThemeContext } from '../../contexts/ThemeContext';

const GlassCard = ({ children, sx, ...props }) => {
    const theme = useTheme();
    const { roleTheme } = useThemeContext();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 4,
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: isDark ? '0 10px 40px -10px rgba(0,0,0,0.5)' : '0 10px 40px -10px rgba(0,0,0,0.1)'
                },
                background: isDark
                    ? 'rgba(30, 41, 59, 0.6)'
                    : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.3)',
                ...sx
            }}
            {...props}
        >
            {children}
            {/* Dekorativni sjaj */}
            <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                opacity: 0.8
            }} />
        </Paper>
    );
};

export default GlassCard;
