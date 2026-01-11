/**
 * The base URL for the API endpoints.
 *
 * This constant defines the root URL for making API requests within the application.
 * It is typically used as a base path for constructing full endpoint URLs.
 *
 * Default: "http://localhost:5000"
 *
 * Note: Ensure that this value points to the correct API during different environments
 * (e.g., development, testing, production) for seamless integration.
 */
const API_URL = "http://localhost:5000";

// 👇 OVA FUNKCIJA SE KORISTI U SVIH API POZIVA
const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) {
        console.warn("⚠️ Nema tokena u localStorage!");
        return { "Content-Type": "application/json" };
    }
    return {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };
};

// ========== AUTHENTICATION FUNCTIONS ==========

/**
 * Logs in a user by sending credentials to the authentication API.
 */
export const loginUser = async (credentials) => {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Neispravno korisničko ime ili lozinka");
    }

    const data = await response.json();

    // SPREMI TOKEN I KORISNIKA U LOCALSTORAGE
    if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        console.log("✅ Token spremljen u localStorage:", data.token.substring(0, 20) + "...");
    }

    return data;
};

/**
 * Asynchronously registers a new user by sending their data to the API.
 */
export const registerUser = async (userData) => {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            throw new Error("Neuspješna registracija");
        }

        return await response.json();
    } catch (error) {
        return { success: false, message: error.message };
    }
};

/**
 * Check if user is authenticated
 */
export const checkAuth = () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
        return null;
    }

    try {
        return {
            token,
            user: JSON.parse(user)
        };
    } catch (error) {
        console.error("Greška pri parsiranju user data:", error);
        return null;
    }
};

/**
 * Logout user
 */
export const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
};

// ========== INVENTORY FUNCTIONS ==========

export const fetchInventory = async () => {
    const response = await fetch(`${API_URL}/inventory`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
};

export const addInventoryItem = async (item) => {
    const response = await fetch(`${API_URL}/inventory`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(item),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Greška pri dodavanju');
    }

    return await response.json();
};

export const updateInventoryItem = async (id, item) => {
    const response = await fetch(`${API_URL}/inventory/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(item),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Greška pri ažuriranju');
    }

    return await response.json();
};

export const deleteInventoryItem = async (id) => {
    const response = await fetch(`${API_URL}/inventory/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Greška pri brisanju');
    }

    return await response.json();
};

// ========== FUEL PRODUCTION FUNCTIONS ==========

export const fetchFuelProduction = async (fuelType = "", refinery = "", year = "") => {
    const response = await fetch(`${API_URL}/api/fuel-production?fuelType=${fuelType}&refinery=${refinery}&year=${year}`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju podataka');
    }

    return await response.json();
};

export const fetchFuelTypes = async () => {
    const response = await fetch(`${API_URL}/api/fuel-types`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju vrsta goriva');
    }

    return await response.json();
};

export const fetchRefineries = async () => {
    const response = await fetch(`${API_URL}/api/refineries`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju rafinerija');
    }

    return await response.json();
};

export const fetchYears = async () => {
    const response = await fetch(`${API_URL}/api/years`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju godina');
    }

    return await response.json();
};

export const fetchFuelForecast = async () => {
    const response = await fetch(`${API_URL}/api/fuel-forecast`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju prognoza');
    }

    return await response.json();
};

// ========== REPORTS FUNCTIONS ==========

export const fetchReportsData = async (period) => {
    try {
        const response = await fetch(`${API_URL}/api/reports?period=${period}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Primljeni podaci:", result);
        return result;
    } catch (error) {
        console.error(`Greška pri dohvaćanju izvještaja (${period}):`, error);
        // Throw error to be handled by caller (UI) if needed, or return empty array but log it.
        // Better to rethrow if we want UI to show "Outside working hours"
        throw error;
    }
};

// ========== DASHBOARD DATA FUNCTIONS ==========

export const fetchRevenueByYear = async (year = "") => {
    const response = await fetch(`${API_URL}/api/revenue-by-year?year=${year}`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju prihoda');
    }

    return await response.json();
};

export const fetchLatestYear = async () => {
    const response = await fetch(`${API_URL}/api/latest-year`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju zadnje godine');
    }

    return await response.json();
};

export const fetchCapexByYear = async (year = "Sve") => {
    const response = await fetch(`${API_URL}/api/capex-by-year?year=${year}`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju CAPEX podataka');
    }

    return await response.json();
};

export const fetchTotalEmployees = async () => {
    const response = await fetch(`${API_URL}/api/total-employees`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju broja zaposlenih');
    }

    return await response.json();
};

export const fetchFuelProfitability = async () => {
    const response = await fetch(`${API_URL}/api/fuel-profitability`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju profitabilnosti');
    }

    return await response.json();
};

// ========== USERS MANAGEMENT FUNCTIONS ==========

export const fetchUsers = async () => {
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

export const addUser = async (user) => {
    const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(user),
    });

    return response.json();
};

export const updateUser = async (user) => {
    const response = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(user),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return await response.json();
};

export const deleteUser = async (id) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });

    return response;
};

// ========== USER PROFILE FUNCTIONS ==========

export const fetchUserProfile = async () => {
    const response = await fetch(`${API_URL}/users/profile`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error("Greška pri dohvaćanju korisničkog profila");

    const userData = await response.json();
    console.log('Dohvaćeni podaci:', userData);
    return userData;
};

export const getDashboardUserData = async () => {
    try {
        const token = localStorage.getItem("token");

        if (!token) {
            throw new Error("Nema tokena");
        }

        const response = await fetch(`${API_URL}/users/profile`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            localStorage.clear();
            window.location.href = "/login";
            return null;
        }

        if (!response.ok) {
            throw new Error("Greška pri dohvaćanju korisnika");
        }

        return await response.json();
    } catch (error) {
        console.error("Dashboard user fetch error:", error);
        throw error;
    }
};

// ========== GAS STATIONS FUNCTIONS ==========

export const fetchGasStations = async () => {
    const response = await fetch(`${API_URL}/api/gas-stations`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju stanica');
    }

    return await response.json();
};

export const addGasStation = async (station) => {
    const response = await fetch(`${API_URL}/api/gas-stations`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(station),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dodavanju stanice');
    }

    return await response.json();
};

export const updateGasStation = async (id, station) => {
    const response = await fetch(`${API_URL}/api/gas-stations/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(station),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri ažuriranju stanice');
    }

    return await response.json();
};

export const deleteGasStation = async (id) => {
    const response = await fetch(`${API_URL}/api/gas-stations/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri brisanju stanice');
    }

    return await response.json();
};

// ========== TASKS FUNCTIONS ==========

export const fetchMyTasks = async () => {
    const response = await fetch(`${API_URL}/api/tasks/my-tasks`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju zadataka');
    }

    return await response.json();
};

export const fetchPublicTasks = async () => {
    const response = await fetch(`${API_URL}/api/tasks/public`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju javnih zadataka');
    }

    return await response.json();
};

export const createTask = async (taskData) => {
    const response = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri kreiranju zadatka');
    }

    return await response.json();
};

export const updateTask = async (taskId, taskData) => {
    const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri ažuriranju zadatka');
    }

    return await response.json();
};

export const deleteTask = async (taskId) => {
    const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri brisanju zadatka');
    }

    return await response.json();
};

export const completeTask = async (taskId) => {
    const response = await fetch(`${API_URL}/api/tasks/${taskId}/complete`, {
        method: "PUT",
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri završavanju zadatka');
    }

    return await response.json();
};

export const fetchTaskUsers = async () => {
    const response = await fetch(`${API_URL}/api/tasks/users`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju korisnika');
    }

    return await response.json();
};

export const fetchTasksStats = async () => {
    const response = await fetch(`${API_URL}/api/tasks/stats`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju statistike');
    }

    return await response.json();
};

// ========== SECURITY FUNCTIONS ==========

export const fetchSecurityLogs = async (page = 1, limit = 50, severity = "", action_type = "") => {
    const response = await fetch(`${API_URL}/api/security/logs?page=${page}&limit=${limit}&severity=${severity}&action_type=${action_type}`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju security logova');
    }

    return await response.json();
};

export const fetchBlockedIps = async () => {
    const response = await fetch(`${API_URL}/api/security/blocked-ips`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju blokiranih IP-ova');
    }

    return await response.json();
};

export const fetchUserLockouts = async () => {
    const response = await fetch(`${API_URL}/api/security/user-lockouts`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju zaključanih korisnika');
    }

    return await response.json();
};

export const fetchSecurityStats = async () => {
    const response = await fetch(`${API_URL}/api/security/stats`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju security statistika');
    }

    return await response.json();
};

export const fetchLastLogin = async () => {
    const response = await fetch(`${API_URL}/api/security/last-login`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju zadnjeg logina');
    }

    return await response.json();
};

// ========== PROFILE IMAGE FUNCTIONS ==========

export const uploadProfileImage = async (imageFile) => {
    const formData = new FormData();
    formData.append('profileImage', imageFile);

    const response = await fetch(`${API_URL}/upload-profile-image`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Greška pri upload-u slike');
    }

    return await response.json();
};

export const updateProfileImage = async (userId, imagePath) => {
    const response = await fetch(`${API_URL}/users/${userId}/profile-image`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ imagePath }),
    });

    if (!response.ok) {
        throw new Error('Greška pri ažuriranju profilne slike');
    }

    return await response.json();
};

// ========== PROTECTED DATA FUNCTIONS ==========

export const getProtectedData = async () => {
    const response = await fetch(`${API_URL}/protected`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error("Neautorizovan pristup");
    return await response.json();
};

// ========== UTILITY FUNCTIONS ==========

export const searchUsers = async (searchTerm = '') => {
    const response = await fetch(`${API_URL}/api/users/search?searchTerm=${searchTerm}`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri pretrazi korisnika');
    }

    return await response.json();
};

export const fetchReportYears = async () => {
    const response = await fetch(`${API_URL}/api/reports/years`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Greška pri dohvaćanju godina izvještaja');
    }

    return await response.json();
};

// ========== ERROR HANDLER ==========

const handleApiError = async (response) => {
    if (response.status === 401) {
        // Token expired or invalid
        localStorage.clear();
        window.location.href = '/login';
        throw new Error('Sesija je istekla. Prijavite se ponovo.');
    }

    if (response.status === 403) {
        throw new Error('Nemate dozvolu za ovu akciju.');
    }

    if (response.status === 404) {
        throw new Error('Resurs nije pronađen.');
    }

    try {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    } catch {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
};