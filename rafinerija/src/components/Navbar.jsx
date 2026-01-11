import React, { useState, useEffect } from "react";
import { AppBar, Toolbar, IconButton, Menu, MenuItem, Box, InputBase, List, ListItem, ListItemText, Paper } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import SearchIcon from "@mui/icons-material/Search";
import { styled } from "@mui/material/styles";
import { fetchInventory } from "../services/api"; // API poziv za podatke
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/inapurple.svg";
import NotificationBell from "./NotificationBell";
import FullscreenButton from "./FullscreenButton"; // Dodajte ovu liniju
import Language from "./Language"; // Dodajte ovu liniju
import UserAvatar from "./UserAvatar";
import { useTranslation } from "react-i18next";

// Stilovi
/**
 * `SearchContainer` is a styled `div` component designed to serve as a container
 * for search-related UI elements. It features a flexible layout, customizable
 * alignment, and a visually appealing design with a light background, rounded
 * corners, and a responsive border color on hover.
 *
 * Styling attributes:
 * - Positioned relatively within its parent container.
 * - Flexbox display for aligning child elements horizontally.
 * - Center-aligns child elements vertically.
 * - Light grey background color (#f5f5f5).
 * - Rounded corners with a 12px border radius.
 * - Padding of 6px vertically and 12px horizontally.
 * - Fixed width of 280px for consistent sizing.
 * - Slight left margin to add spacing if placed next to other elements.
 * - Light grey border by default (#e0e0e0), changing to a darker grey (#4b5565) on hover.
 * - Smooth transition effect on border color when hovered over.
 */
const SearchContainer = styled("div")(() => ({
    position: "relative",
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: "12px",
    padding: "6px 12px",
    width: "280px",
    marginLeft: "16px",
    border: "1px solid #e0e0e0",
    transition: "border-color 0.2s ease-in-out",
    "&:hover": { borderColor: "#4b5565" },
}));

/**
 * `SearchInput` is a styled component based on `InputBase` that is used
 * as an input field for search functionality. It provides custom styles
 * such as margin and flex properties to adjust its appearance and layout.
 *
 * Styles applied:
 * - `marginLeft: "6px"`: Adds a left margin of 6px.
 * - `flex: 1`: Allows the input to grow and occupy available space.
 */
const SearchInput = styled(InputBase)(() => ({
    marginLeft: "6px",
    flex: 1,
}));

/**
 * ResultsContainer is a styled component that serves as a container for displaying results.
 * It is styled using MUI's `styled` API and extends the `Paper` component.
 *
 * Features:
 * - Positioned absolutely with respect to its parent element.
 * - Occupies the full width of its parent element.
 * - Renders with a white background and a subtle box shadow for visual distinction.
 * - Ensures a high z-index for display above other content.
 * - Limits the maximum height to 200px and enables vertical scrolling when content exceeds this height.
 */
const ResultsContainer = styled(Paper)(() => ({
    position: "absolute",
    top: "100%",
    left: 0,
    width: "100%",
    backgroundColor: "#fff",
    boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
    zIndex: 1000,
    maxHeight: "200px",
    overflowY: "auto",
}));

/**
 * Navbar is a functional React component that represents the application's top navigation bar.
 * It includes functionalities such as toggling the sidebar, searching through inventory and pages,
 * displaying notifications, and managing user-related actions like logout and profile access.
 *
 * Props:
 * - `toggleSidebar` (function): Callback function to toggle the visibility of the application's sidebar.
 *
 * State Management:
 * - Manages the state for search query and results, inventory data, user menu, and notifications.
 *
 * Hooks Used:
 * - `useNavigate`: React Router hook for navigating programmatically between pages.
 * - `useState`: React hook for managing component-specific state.
 * - `useEffect`: React hook for executing tasks after component renders, used here for fetching inventory data and setting notifications.
 *
 * Key Functionalities:
 * - Inventory Search: Filters results based on user input and matches against inventory items and defined page keywords.
 * - Navigation: Allows navigation to a specific page or item when a search result is selected.
 * - Notifications: Displays notifications generated from inventory data (e.g., low stock alerts).
 * - User Menu: Provides options like profile access and logout.
 *
 * Rendered Elements:
 * - Logo and navigation hamburger located on the left side.
 * - Search bar with dynamic result display.
 * - Notification icon with a list of notifications.
 * - User profile icon with a dropdown menu for actions like profile access and logout.
 */
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeContext } from "../contexts/ThemeContext";

const Navbar = ({ toggleSidebar }) => {
    const { t } = useTranslation();
    const { toggleColorMode, mode } = useThemeContext();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [searchQuery, setSearchQuery] = useState(""); // Unos pretrage
    const [searchResults, setSearchResults] = useState([]); // Rezultati pretrage
    const [inventory, setInventory] = useState([]); // Svi podaci iz inventara

    useEffect(() => {
        fetchInventory().then((data) => {
            setInventory(data);
            const lowStock = data
                .filter((item) => item.quantity < 1000)
                .map((item) => ({
                    title: "Upozorenje o zalihama",
                    message: `Zaliha ${item.type} je ispod 1000L!`,
                }));
            setNotifications(lowStock);
        });
    }, []);

    // Definicija ključnih riječi za navigaciju po stranicama
    const pageRoutes = [
        { keyword: "earnings", path: "/admin-dashboard" },
        { keyword: "potrošnja", path: "/reports" },
        { keyword: "proizvodnja", path: "/reports" },
        { keyword: "dashboard", path: "/admin-dashboard" },
        { keyword: "inventory", path: "/inventory" },
        { keyword: "settings", path: "/security" },
        { keyword: "authentication", path: "/authentication" },
    ];

    // Funkcija za pretragu u inventaru i stranicama
    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);

        if (query.trim() === "") {
            setSearchResults([]);
        } else {
            // Pretraga u inventaru
            const filteredInventory = inventory.filter((item) =>
                item.type.toLowerCase().includes(query)
            );

            // Pretraga u ključnim riječima stranica
            const filteredPages = pageRoutes.filter((page) =>
                page.keyword.includes(query)
            );

            setSearchResults([...filteredInventory, ...filteredPages]);
        }
    };

    // Funkcija kada korisnik pritisne ENTER
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && searchResults.length > 0) {
            const firstResult = searchResults[0];
            if (firstResult.path) {
                navigate(firstResult.path); // Ako je stranica, navigiraj
            } else {
                navigate(`/inventory`); // Ako je proizvod, otvori njegovu stranicu
            }
            setSearchQuery("");
            setSearchResults([]);
        }
    };

    const handleUserMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleUserMenuClose = () => setAnchorEl(null);

    return (
        <AppBar position="fixed" sx={{
            backgroundColor: "background.paper", // Koristi temu
            zIndex: 1201,
            boxShadow: "none",
            borderBottom: "1px solid",
            borderColor: "divider" // Koristi temu
        }}>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between", paddingX: 2 }}>
                {/* Lijeva strana - Logo & Hamburger */}
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Link to="/admin-dashboard">
                        <Box component="img" src={logo} alt="Logo" sx={{ height: 42, mr: 2 }} />
                    </Link>

                    <IconButton onClick={toggleSidebar} sx={{
                        ml: 9,
                        backgroundColor: "action.hover", // Koristi temu
                        borderRadius: "8px",
                        padding: "8px",
                        color: "primary.main",
                        "&:hover": { backgroundColor: "action.selected", color: "primary.dark" }
                    }}>
                        <MenuIcon />
                    </IconButton>

                    {/* Search bar */}
                    <Box sx={{ position: "relative" }}>
                        <SearchContainer sx={{
                            backgroundColor: "background.default",
                            border: "1px solid",
                            borderColor: "divider"
                        }}>
                            <SearchIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                            <SearchInput
                                placeholder={t('search') + "..."}
                                value={searchQuery}
                                onChange={handleSearch}
                                onKeyDown={handleKeyDown}
                                sx={{ color: "text.primary" }}
                            />
                        </SearchContainer>

                        {/* Prikaz rezultata pretrage */}
                        {searchResults.length > 0 && (
                            <ResultsContainer>
                                <List>
                                    {searchResults.map((result, index) => (
                                        <ListItem
                                            key={index}
                                            button
                                            component={Link}
                                            to={result.path ? result.path : `/inventory/${result.id}`}
                                        >
                                            <ListItemText
                                                primary={result.keyword ? ` ${result.keyword}` : result.type}
                                                secondary={result.quantity ? `Količina: ${result.quantity}L` : "Navigacija"}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </ResultsContainer>
                        )}
                    </Box>
                </Box>

                {/* Desna strana - Notifikacije & Profil */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>

                    <Language />
                    <IconButton onClick={toggleColorMode} color="inherit">
                        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon sx={{ color: '#757575' }} />}
                    </IconButton>
                    <FullscreenButton />
                    <NotificationBell notifications={notifications} />
                    <UserAvatar />

                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
