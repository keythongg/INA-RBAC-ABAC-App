import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip, Button, TextField, IconButton, Modal, Typography, Box, Divider, InputBase, Avatar, useTheme } from '@mui/material';
import { fetchUsers, addUser, deleteUser, updateUser } from '../../services/api.js';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import Fab from '@mui/material/Fab';
import bcrypt from 'bcryptjs'; // Importuj bcryptjs za hashiranje
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: '8px',
};

const UsersPage = () => {
    const theme = useTheme();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [newUser, setNewUser] = useState({
        ime: '',
        prezime: '',
        username: '',
        password: '',
        email: '',
        role: 'user',
        profile_image: ''
    });
    const [editUser, setEditUser] = useState({
        ime: '',
        prezime: '',
        username: '',
        password: '',
        email: '',
        role: 'user',
        profile_image: ''
    });
    const [openAddModal, setOpenAddModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    useEffect(() => {
        fetchUsers().then(data => {
            setUsers(data);
            setFilteredUsers(data);
        });
    }, []);

    useEffect(() => {
        const results = users.filter(user =>
            user.ime.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.prezime.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredUsers(results);
    }, [searchTerm, users]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleOpenDeleteModal = (user) => {
        setUserToDelete(user);
        setOpenDeleteModal(true);
    };

    const handleCloseDeleteModal = () => {
        setUserToDelete(null);
        setOpenDeleteModal(false);
    };

    const handleConfirmDelete = async () => {
        if (userToDelete) {
            try {
                const response = await deleteUser(userToDelete.id);
                if (!response.ok) {
                    console.error(`Brisanje korisnika nije uspelo: ${response.statusText}`);
                    return;
                }
                setUsers(users.filter(user => user.id !== userToDelete.id));
            } catch (error) {
                console.error('Greška pri brisanju korisnika:', error);
            } finally {
                handleCloseDeleteModal();
            }
        }
    };

    const handleAddUser = async () => {
        try {
            let imagePath = newUser.profile_image; // Proveri da li već ima sliku
            if (selectedFile) {
                imagePath = await handleUpload(selectedFile); // Prvo uploaduj sliku
            }

            // Hashiraj lozinku pre nego što je pošalješ na server
            const hashedPassword = await bcrypt.hash(newUser.password, 10);

            const addedUser = await addUser({
                ...newUser,
                password: hashedPassword, // Koristi hashiranu lozinku
                profile_image: imagePath || ""
            });

            if (!addedUser.id) {
                console.error('Dodavanje korisnika nije uspelo:', addedUser);
                return;
            }

            const updatedUsers = await fetchUsers();
            setUsers(updatedUsers);
            setNewUser({ ime: '', prezime: '', username: '', password: '', email: '', role: 'user', profile_image: '' });
            setSelectedFile(null);
            setOpenAddModal(false);
        } catch (error) {
            console.error('Greška pri dodavanju korisnika:', error);
        }
    };


    const handleEditUser = async () => {
        try {
            const updatedUser = { ...editUser, profile_image: editUser.profile_image || "" };
            await updateUser(updatedUser);

            setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
            setOpenEditModal(false);
        } catch (error) {
            console.error('Greška pri ažuriranju korisnika:', error);
        }
    };

    const handleDeleteUser = async (id) => {
        try {
            const response = await deleteUser(id);

            if (!response.ok) {
                console.error(`Brisanje korisnika nije uspelo: ${response.statusText}`);
                return;
            }

            setUsers(users.filter(user => user.id !== id));
        } catch (error) {
            console.error('Greška pri brisanju korisnika:', error);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file); // Postavi odabranu datoteku

        // Odmah pozovi upload funkciju i ažuriraj state
        handleUpload(file).then(imagePath => {
            if (imagePath) {
                setNewUser(prevUser => ({ ...prevUser, profile_image: imagePath }));
                setEditUser(prevUser => ({ ...prevUser, profile_image: imagePath }));
            }
        }).catch(error => console.error("Greška pri uploadu slike:", error));
    };

    const handleUpload = async (file) => {
        if (!file) return ""; // Umesto null, vrati prazan string

        const formData = new FormData();
        formData.append('profileImage', file);

        try {
            const response = await fetch('http://localhost:5000/upload-profile-image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Greška pri uploadu slike');
            }

            const data = await response.json();
            setSelectedFile(null); // Resetuj selektovani fajl nakon upload-a
            return data.imagePath; // Vraćamo putanju slike
        } catch (error) {
            console.error('Greška pri uploadu slike:', error);
            return "";
        }
    };

    const handleOpenAddModal = () => setOpenAddModal(true);
    const handleCloseAddModal = () => setOpenAddModal(false);

    const handleOpenEditModal = (user) => {
        setEditUser(user);
        setOpenEditModal(true);
    };
    const handleCloseEditModal = () => setOpenEditModal(false);

    return (
        <Paper sx={{}} elevation={0}>
            <Box sx={{ padding: '20px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '20px', lineHeight: '23px', color: theme.palette.text.primary }}>
                        List
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Box sx={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.action.hover : '#f5f5f5',
                            borderRadius: '12px',
                            padding: '6px 12px',
                            width: '200px',
                            border: `1px solid ${theme.palette.divider}`
                        }}>
                            <SearchIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
                            <InputBase
                                placeholder="Pretraži..."
                                sx={{ marginLeft: '6px', flex: 1, fontSize: '14px' }}
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </Box>
                        <Tooltip title="Dodaj korisnika" arrow>
                            <Fab
                                color="primary"
                                onClick={handleOpenAddModal}
                                sx={{
                                    backgroundColor: '#2196f3', // Plava boja
                                    '&:hover': {
                                        backgroundColor: '#1976d2', // Tamnija plava boja prilikom hovera
                                    },
                                    fontSize: '6px',
                                    width: 36, // Veličina kruga
                                    height: 36, // Veličina kruga
                                    boxShadow: 'none', // Uklanja sjenu
                                }}
                            >
                                <AddIcon sx={{ color: 'white' }} /> {/* Bijeli + znak */}
                            </Fab>
                        </Tooltip>
                    </Box>
                </Box>
            </Box>

            <Divider />

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ height: '56px', padding: '8px', verticalAlign: 'middle', fontWeight: 600, paddingLeft: '20px' }}>
                                #
                            </TableCell>
                            <TableCell sx={{ height: '56px', padding: '8px', verticalAlign: 'middle', fontWeight: 600, paddingLeft: '20px' }}>
                                Korisnik
                            </TableCell>
                            <TableCell sx={{ height: '56px', padding: '8px', verticalAlign: 'middle', fontWeight: 600, paddingLeft: '20px' }}>
                                Korisničko ime
                            </TableCell>
                            <TableCell sx={{ height: '56px', padding: '8px', verticalAlign: 'middle', fontWeight: 600, paddingLeft: '20px' }}>
                                Uloga
                            </TableCell>
                            <TableCell sx={{ height: '56px', padding: '8px', verticalAlign: 'middle', fontWeight: 600, paddingLeft: '20px' }}>
                                Akcije
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {filteredUsers.map(user => (
                            <TableRow
                                key={user.id}
                                sx={{
                                    height: '70px',
                                    transition: 'background-color 0.3s ease-in-out',
                                    '&:hover': { backgroundColor: theme.palette.action.hover },
                                }}
                            >
                                <TableCell sx={{ padding: '8px', verticalAlign: 'middle', paddingLeft: '20px' }}>
                                    {user.id}
                                </TableCell>
                                <TableCell sx={{ padding: '8px', verticalAlign: 'middle', paddingLeft: '20px' }}>
                                    <Box display="flex" alignItems="center" gap="10px">
                                        <Avatar src={user.profile_image || ''} alt={`${user.ime} ${user.prezime}`} sx={{ width: 40, height: 40 }}>
                                            {user.ime?.charAt(0)}{user.prezime?.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography sx={{ fontWeight: 600, fontSize: '14px', lineHeight: '20px', color: theme.palette.text.primary }}>
                                                {user.ime} {user.prezime}
                                            </Typography>
                                            <Typography sx={{ fontSize: '12px', fontWeight: 500, lineHeight: '16px', color: theme.palette.text.secondary }}>
                                                {user.email}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ padding: '8px', verticalAlign: 'middle', paddingLeft: '20px' }}>
                                    {user.username}
                                </TableCell>
                                <TableCell sx={{ padding: '8px', verticalAlign: 'middle', paddingLeft: '20px' }}>
                                    {user.role}
                                </TableCell>
                                <TableCell sx={{ padding: '8px', verticalAlign: 'middle', paddingLeft: '20px' }}>
                                    <Tooltip title="Uredi informacije korisnika">
                                        <IconButton
                                            onClick={() => handleOpenEditModal(user)}
                                            sx={{
                                                color: '#2196f3',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(144, 202, 249, 0.3)',
                                                },
                                                width: 40,
                                                height: 40,
                                            }}
                                        >
                                            <EditIcon sx={{ fontSize: 20 }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Ukloni korisnika">
                                        <IconButton
                                            onClick={() => handleOpenDeleteModal(user)}
                                            sx={{
                                                color: '#f44336',
                                                '&:hover': { backgroundColor: 'rgba(251, 233, 231, 0.8)' },
                                                width: 40,
                                                height: 40,
                                            }}
                                        >
                                            <BlockIcon sx={{ fontSize: 20 }} />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Modal za potvrdu brisanja */}
            <Modal open={openDeleteModal} onClose={handleCloseDeleteModal}>
                <Box sx={modalStyle}>
                    <Typography variant="h6" sx={{ fontWeight: 700, marginBottom: '20px' }}>
                        Potvrda brisanja
                    </Typography>
                    <Typography sx={{ marginBottom: '20px' }}>
                        Da li ste sigurni da želite da obrišete korisnika <b>{userToDelete?.ime} {userToDelete?.prezime}</b>?
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <Button variant="contained" color="error" onClick={handleConfirmDelete}>
                            Obriši
                        </Button>
                        <Button variant="outlined" onClick={handleCloseDeleteModal}>
                            Otkaži
                        </Button>
                    </Box>
                </Box>
            </Modal>

            {/* Modal za dodavanje korisnika */}
            <Modal
                open={openAddModal}
                onClose={handleCloseAddModal}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={modalStyle}>
                    <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ fontWeight: 700, fontSize: '24px', lineHeight: '28px', color: theme.palette.text.primary, marginBottom: '20px' }}>
                        Dodaj novog korisnika
                    </Typography>

                    {/* Prikaz slike ili inicijala */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <Avatar
                            src={newUser.profile_image || ""}
                            alt={`${newUser.ime} ${newUser.prezime}`}
                            sx={{ width: 80, height: 80 }}
                        >
                            {(!newUser.profile_image && newUser.ime && newUser.prezime)
                                ? `${newUser.ime.charAt(0)}${newUser.prezime.charAt(0)}`
                                : ''}
                        </Avatar>
                        <Box>
                            <Typography variant="body2" sx={{ marginBottom: '5px' }}>
                                Trenutna profilna slika
                            </Typography>
                            <Button variant="outlined" component="label">
                                Upload New Photo
                                <input type="file" hidden onChange={handleFileChange} />
                            </Button>
                        </Box>
                    </Box>

                    <TextField
                        label="Ime"
                        value={newUser.ime}
                        onChange={e => setNewUser({ ...newUser, ime: e.target.value })}
                        fullWidth
                        sx={{ marginBottom: '15px' }}
                    />
                    <TextField
                        label="Prezime"
                        value={newUser.prezime}
                        onChange={e => setNewUser({ ...newUser, prezime: e.target.value })}
                        fullWidth
                        sx={{ marginBottom: '15px' }}
                    />
                    <TextField
                        label="Korisničko ime"
                        value={newUser.username}
                        onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                        fullWidth
                        sx={{ marginBottom: '15px' }}
                    />
                    <TextField
                        label="Email"
                        value={newUser.email}
                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                        fullWidth
                        sx={{ marginBottom: '15px' }}
                    />
                    <TextField
                        label="Lozinka"
                        type="password"
                        value={newUser.password}
                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                        fullWidth
                        sx={{ marginBottom: '15px' }}
                    />
                    {/* Dropdown za uloge */}
                    <FormControl fullWidth sx={{ marginBottom: '20px' }}>
                        <InputLabel>Uloga</InputLabel>
                        <Select
                            value={newUser.role}
                            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                            label="Uloga"
                        >
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="Inženjer sigurnosti">Inženjer sigurnosti</MenuItem>
                            <MenuItem value="Menadžer inventara">Menadžer inventara</MenuItem>
                            <MenuItem value="Finansijski analitičar">Finansijski analitičar</MenuItem>
                            <MenuItem value="Koordinator stanica">Koordinator stanica</MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        onClick={handleAddUser}
                        fullWidth
                        sx={{
                            padding: '10px', fontSize: '16px', fontWeight: 600, backgroundColor: '#2196f3', // Postavljamo boju na #2196f3
                            '&:hover': {
                                backgroundColor: '#1976d2', // Opcionalno: promjena boje prilikom hovera
                            }
                        }}
                    >
                        Dodaj korisnika
                    </Button>
                </Box>
            </Modal>

            {/* Modal za uređivanje korisnika */}
            <Modal
                open={openEditModal}
                onClose={handleCloseEditModal}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={modalStyle}>
                    <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ fontWeight: 700, fontSize: '24px', lineHeight: '28px', color: theme.palette.text.primary, marginBottom: '20px' }}>
                        Edit User
                    </Typography>
                    {editUser && (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <Avatar src={editUser.profile_image || ''} alt={`${editUser.ime} ${editUser.prezime}`} sx={{ width: 80, height: 80 }}>
                                    {editUser.ime?.charAt(0)}{editUser.prezime?.charAt(0)}
                                </Avatar>
                                <Box>
                                    <Typography variant="body2" sx={{ marginBottom: '5px' }}>
                                        Current Profile Picture
                                    </Typography>
                                    <Button variant="outlined" component="label">
                                        Upload New Photo
                                        <input type="file" hidden onChange={handleFileChange} />
                                    </Button>
                                </Box>
                            </Box>
                            <TextField
                                label="First Name"
                                value={editUser.ime}
                                onChange={e => setEditUser({ ...editUser, ime: e.target.value })}
                                fullWidth
                                sx={{ marginBottom: '15px' }}
                            />
                            <TextField
                                label="Last Name"
                                value={editUser.prezime}
                                onChange={e => setEditUser({ ...editUser, prezime: e.target.value })}
                                fullWidth
                                sx={{ marginBottom: '15px' }}
                            />
                            <TextField
                                label="Username"
                                value={editUser.username}
                                onChange={e => setEditUser({ ...editUser, username: e.target.value })}
                                fullWidth
                                sx={{ marginBottom: '15px' }}
                            />
                            <TextField
                                label="Email"
                                value={editUser.email}
                                onChange={e => setEditUser({ ...editUser, email: e.target.value })}
                                fullWidth
                                sx={{ marginBottom: '15px' }}
                            />
                            {/* Dropdown za uloge */}
                            <FormControl fullWidth sx={{ marginBottom: '20px' }}>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    value={editUser.role}
                                    onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                                    label="Role"
                                >
                                    <MenuItem value="admin">Admin</MenuItem>
                                    <MenuItem value="Inženjer sigurnosti">Inženjer sigurnosti</MenuItem>
                                    <MenuItem value="Menadžer inventara">Menadžer inventara</MenuItem>
                                    <MenuItem value="Finansijski analitičar">Finansijski analitičar</MenuItem>
                                    <MenuItem value="Koordinator stanica">Koordinator stanica</MenuItem>
                                </Select>
                            </FormControl>
                            <Button
                                variant="contained"
                                onClick={handleEditUser}
                                fullWidth
                                sx={{
                                    padding: '10px', fontSize: '16px', fontWeight: 600, backgroundColor: '#2196f3',
                                    '&:hover': {
                                        backgroundColor: '#1976d2',
                                    }
                                }}
                            >
                                Save Changes
                            </Button>
                        </>
                    )}
                </Box>
            </Modal>
        </Paper>
    );
};

export default UsersPage;