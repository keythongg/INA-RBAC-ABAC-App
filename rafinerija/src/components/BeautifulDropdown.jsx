import React from 'react';
import {
    FormControl,
    Select,
    MenuItem,
    InputLabel,
    styled
} from '@mui/material';
import { KeyboardArrowDown } from '@mui/icons-material';

// Stilizovani komponenti koji će se bolje uklopiti u vaš dizajn
const StyledFormControl = styled(FormControl)(({ theme }) => ({
    minWidth: 120,
    '& .MuiInputLabel-root': {
        color: '#a0a0a0',
        fontSize: '12px',
        transform: 'translate(0, -20px) scale(1)',
    },
    '& .MuiInputLabel-shrink': {
        transform: 'translate(0, -30px) scale(0.75)',
    },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    borderRadius: '8px',
    border: `1px solid ${theme.palette.divider}`,
    padding: '8px 12px',
    fontSize: '14px',
    transition: 'all 0.3s ease',

    '&:before, &:after': {
        display: 'none',
    },

    '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
        borderColor: theme.palette.primary.main,
    },

    '&.Mui-focused': {
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
        boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
    },

    '& .MuiSelect-icon': {
        color: theme.palette.text.secondary,
        right: '8px',
    },

    '& .MuiOutlinedInput-notchedOutline': {
        border: 'none',
    },
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
    color: '#333',
    fontSize: '14px',
    padding: '8px 16px',

    '&:hover': {
        backgroundColor: 'rgba(156, 39, 176, 0)', // Svijetlo ljubičasta
    },

    '&.Mui-selected': {
        backgroundColor: 'rgba(76, 175, 80, 0.1)', // Svijetlo zelena
        color: '#4caf50', // Zelena boja
    },

    '&.Mui-selected:hover': {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
    },
}));

// Glavna komponenta
const BeautifulDropdown = ({
    value,
    onChange,
    options = [],
    label = "Izaberi godinu",
    sx = {}
}) => {
    return (
        <StyledFormControl variant="standard" sx={sx}>
            <InputLabel>{label}</InputLabel>
            <StyledSelect
                value={value}
                onChange={onChange}
                label={label}
                IconComponent={KeyboardArrowDown}
                MenuProps={{
                    PaperProps: {
                        sx: {
                            borderRadius: '8px',
                            marginTop: '8px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                            '& .MuiMenuItem-root': {
                                fontSize: '14px',
                            },
                        },
                    },
                }}
            >
                {options.map((option, index) => (
                    <StyledMenuItem key={index} value={option}>
                        {option}
                    </StyledMenuItem>
                ))}
            </StyledSelect>
        </StyledFormControl>
    );
};

export default BeautifulDropdown;