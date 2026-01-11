import { createTheme } from "@mui/material/styles";
import "@fontsource/roboto"; // Ovo mora biti na vrhu!

const theme = createTheme({
    palette: {
        primary: {
            main: "#1976d2", // Tamnoplava
        },
        secondary: {
            main: "#FF6F61", // Crvena
        },
        background: {
            default: "#eef2f6",
        },
    },
    typography: {
        fontFamily: "Roboto,sans-serif",
    },
});




export default theme;
