import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { IconArrowsMaximize, IconArrowsMinimize } from "@tabler/icons-react";

const FullscreenButton = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setIsFullscreen(true);
            });
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false);
            });
        }
    };

    return (
        <Tooltip title={isFullscreen ? "Izađi iz full screen-a" : "Uđi u full screen"} arrow>
            <IconButton
                onClick={toggleFullscreen}
                sx={{
                    backgroundColor: "#e3f2fd",
                    color: "#2196f3",
                    borderRadius: "8px",
                    padding: "8px",
                    width: 40,
                    height: 40,
                    "&:hover": { backgroundColor: "#2196f3", color: "#e3f2fd" },
                }}
            >
                {isFullscreen ? <IconArrowsMinimize size={24} /> : <IconArrowsMaximize size={24} />}
            </IconButton>
        </Tooltip>
    );
};

export default FullscreenButton;
