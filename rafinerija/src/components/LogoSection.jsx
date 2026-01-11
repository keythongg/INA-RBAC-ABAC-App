import React from "react";
import { Box, Typography } from "@mui/material";

const LogoSection = () => {
    return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
            <img src="/assets/react.svg" alt="logo" width={32} height={32} />
            <Typography variant="h6" sx={{ ml: 1, fontWeight: "bold", color: "#6C5DD3" }}>
                BERRY
            </Typography>
        </Box>
    );
};

export default LogoSection;
