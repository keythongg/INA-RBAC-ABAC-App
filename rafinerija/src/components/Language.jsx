import React from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { IconLanguage } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

const Language = () => {
    const { i18n } = useTranslation();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
        handleClose();
    };

    return (
        <>
            <Tooltip title="Promijeni jezik" arrow>
                <IconButton
                    onClick={handleClick}
                    sx={{
                        backgroundColor: "action.hover",
                        color: "primary.main",
                        borderRadius: "8px",
                        padding: "8px",
                        width: 40,
                        height: 40,
                        "&:hover": { backgroundColor: "primary.main", color: "background.paper" },
                    }}
                >
                    <IconLanguage size={24} />
                </IconButton>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: { mt: 1.5, borderRadius: 3, minWidth: 150 }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={() => changeLanguage('bs')}>🇧🇦 Bosanski</MenuItem>
                <MenuItem onClick={() => changeLanguage('hr')}>🇭🇷 Hrvatski</MenuItem>
                <MenuItem onClick={() => changeLanguage('sr')}>🇷🇸 Srpski</MenuItem>
                <MenuItem onClick={() => changeLanguage('en')}>🇺🇸 English</MenuItem>
                <MenuItem onClick={() => changeLanguage('de')}>🇩🇪 Deutch</MenuItem>
            </Menu>
        </>
    );
};

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

export default Language;
