require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY || "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567";

let lastInventoryState = {}; // Pamtimo zadnje stanje inventara
let notificationCooldown = new Set(); // Sprečavamo duple notifikacije u kratkom vremenu

// RBAC CONFIG
const RBAC_CONFIG = {
    roles: {
        'admin': ['*'], // Admin ima sve dozvole

        'Inženjer sigurnosti': [
            'security.logs.read',      // Čitanje sigurnosnih logova
            'security.ips.read',       // Pregled blokiranih IP-ova
            'security.ips.manage',     // Upravljanje IP blokadama
            'security.users.read',     // Pregled zaključanih korisnika
            'security.users.manage',   // Otključavanje korisnika
            'security.stats.read',     // Pregled statistika
            'security.debug',          // Debug funkcije (opciono)
            'users.read',              // Pregled korisnika
            'profile.*',               // Upravljanje profilom
            'reports.read',             // Pregled izvještaja
            'tasks.read',       // Može vidjeti zadatke
            'tasks.update'      // Može završiti zadatke
        ],
        'Menadžer inventara': [
            'inventory.read',           // Pregled inventara
            'inventory.create',         // Dodavanje novog goriva
            'inventory.update',         // Ažuriranje goriva
            'inventory.delete',         // Brisanje goriva
            'fuel-production.read',     // Pregled proizvodnje
            'fuel-production.create',   // Dodavanje proizvodnje
            'fuel-forecast.read',       // Pregled prognoza
            'reports.read',             // Pregled izvještaja
            'profile.*',                 // Upravljanje profilom
            'tasks.read',
            'tasks.update'
        ],

        'Finansijski analitičar': [
            'reports.read',         // SVE izvještaje (čitaj, generiš)
            'revenue.*',         // SVE o prihodima
            'capex.*',           // SVE o investicijama
            'fuel-profitability.*', // Analiza profitabilnosti
            'fuel-production.read', // Samo čitanje proizvodnje
            'profile.*',          // Svoje profile operacije
            'tasks.read',
            'tasks.update'
        ],

        'Koordinator stanica': [
            'gas-stations.read',    // Pregled stanica
            'gas-stations.create',  // Dodavanje novih stanica
            'gas-stations.update',  // Uređivanje postojećih stanica
            'gas-stations.delete',  // Brisanje stanica
            'inventory.read',       // Pregled inventara
            'reports.read',         // Pregled izvještaja
            'profile.*',             // Upravljanje profilom
            'tasks.read',
            'tasks.update'
        ]
    }
};

// ABAC CONFIGURATION
const WORK_START_HOUR = 8;
const WORK_END_HOUR = 23;

// Helper function to check working hours
const isWorkingHours = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hour = now.getHours();

    // Check if it's weekend (Saturday or Sunday)
    if (day === 0 || day === 6) {
        return false;
    }

    // Check if within working hours (08:00 - 16:00)
    return hour >= WORK_START_HOUR && hour < WORK_END_HOUR;
};

// ABAC Policies definition
const ABAC_POLICIES = {
    'Inženjer sigurnosti': {
        condition: isWorkingHours,
        errorMessage: "Pristup dozvoljen samo tijekom radnog vremena (08:00 - 16:00, Pon-Pet)."
    },
    'Menadžer inventara': {
        condition: isWorkingHours,
        errorMessage: "Pristup dozvoljen samo tijekom radnog vremena (08:00 - 16:00, Pon-Pet)."
    },
    'Finansijski analitičar': {
        condition: isWorkingHours,
        errorMessage: "Pristup dozvoljen samo tijekom radnog vremena (08:00 - 16:00, Pon-Pet)."
    },
    'Koordinator stanica': {
        condition: isWorkingHours,
        errorMessage: "Pristup dozvoljen samo tijekom radnog vremena (08:00 - 16:00, Pon-Pet)."
    }
};

// MIDDLEWARE PRIJE checkPermission
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "Pristup odbijen! Niste prijavljeni." });
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Token je istekao! Prijavite se ponovo." });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ error: "Neispravan token!" });
        }
        return res.status(403).json({ error: "Autorizacijska greška!" });
    }
};

// RBAC & ABAC MIDDLEWARE
const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: "Pristup odbijen! Niste prijavljeni." });
            }

            const userRole = req.user.role;

            // 1. RBAC CHECK
            // Admin ima sve dozvole i exempt je od ABAC pravila
            if (userRole === 'admin') {
                return next();
            }

            const userPermissions = RBAC_CONFIG.roles[userRole];

            if (!userPermissions) {
                return res.status(403).json({ error: "Korisnička uloga nije pronađena!" });
            }

            const hasPermission = userPermissions.some(permission => {
                if (permission === '*') return true;
                if (permission === requiredPermission) return true;
                if (permission.endsWith('.*')) {
                    const permissionPrefix = permission.replace('.*', '');
                    return requiredPermission.startsWith(permissionPrefix);
                }
                return false;
            });

            if (!hasPermission) {
                return res.status(403).json({ error: "Nemate dozvolu za ovu akciju!" });
            }

            // 2. ABAC CHECK (Dynamic Rules)
            const abacPolicy = ABAC_POLICIES[userRole];
            if (abacPolicy) {
                const passedAbac = abacPolicy.condition(req.user, req);
                if (!passedAbac) {
                    console.warn(`ABAC Deny: User ${req.user.username} (${userRole}) attempted access outside allowed context.`);
                    return res.status(403).json({ error: abacPolicy.errorMessage || "Pristup odbijen zbog sigurnosnih pravila (ABAC)." });
                }
            }

            next();
        } catch (error) {
            console.error("Auth Middleware Error:", error);
            return res.status(500).json({ error: "Greška u autorizaciji!" });
        }
    };
};

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const http = require("http"); // Dodato za WebSockets
const { Server } = require("socket.io"); // Socket.IO server
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 5000;

const fs = require('fs');
const uploadDir = path.join(__dirname, '../rafinerija/public/uploads'); // Apsolutna putanja

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Kreiranje HTTP servera za Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // Omogućava pristup sa bilo koje domene
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.json()); // Omogućava parsiranje JSON podataka
app.use(express.urlencoded({ extended: true })); // Omogućava parsiranje URL parametara

app.use('/uploads', express.static('public/uploads'));
app.use('/uploads', express.static(path.join(__dirname, '../rafinerija/public/uploads')));

// Configure storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Spremamo slike u frontend direktorij
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Jedinstveno ime
    },
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed!'), false);
    }
};

const upload = multer({ storage, fileFilter });

// Endpoint for uploading profile images
app.post('/upload-profile-image', upload.single('profileImage'), (req, res) => {
    console.log('Request body:', req.body); // Log the request body
    console.log('Uploaded file:', req.file); // Log the uploaded file

    if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const imagePath = `/uploads/${req.file.filename}`;
    res.json({ imagePath });
});

// WEB SOCKET - ISPRAVLJENA VERZIJA
io.on("connection", (socket) => {
    console.log("✅ Klijent povezan:", socket.id);

    // DEBUG: Log sve sobe kada se korisnik spoji
    socket.on("join_user_rooms", (userId, userRole) => {
        console.log(`🔗 JOIN REQUEST from socket ${socket.id}:`);
        console.log(`   - User ID: ${userId}`);
        console.log(`   - User Role: ${userRole}`);

        // Ostavi stare sobe
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
            if (room !== socket.id) {
                socket.leave(room);
                console.log(`   - Left room: ${room}`);
            }
        });

        // Join u nove sobe
        if (userId) {
            socket.join(`user_${userId}`);
            console.log(`   ✅ Joined: user_${userId}`);
        }
        if (userRole) {
            socket.join(`role_${userRole}`);
            console.log(`   ✅ Joined: role_${userRole}`);
        }

        // ADMIN je također u admin sobi
        if (userRole === 'admin') {
            socket.join('admin');
            console.log(`   ✅ Joined: admin`);
        }

        // Svi su u public sobi
        socket.join('public');
        console.log(`   ✅ Joined: public`);

        // DEBUG: Pokaži finalne sobe
        setTimeout(() => {
            const finalRooms = Array.from(socket.rooms);
            console.log(`   Final rooms for socket ${socket.id}:`, finalRooms);
        }, 100);
    });

    // Task kreiranje - POBOLJŠANA VERZIJA
    socket.on("task_created", (taskData) => {
        console.log("=".repeat(60));
        console.log("SERVER: Nova task notifikacija primljena");
        console.log("Task data:", JSON.stringify(taskData, null, 2));

        // DEBUG: Prikaži sve sobe na serveru
        console.log("All rooms on server:");
        const rooms = io.sockets.adapter.rooms;
        rooms.forEach((sockets, roomName) => {
            console.log(`   - ${roomName}: ${sockets.size} klijenata`);
        });

        // KREIRAJ NOTIFIKACIJU OBJEKAT
        const notificationData = {
            task: {
                id: taskData.taskId || taskData.id,
                title: taskData.title || "Nova obaveza",
                description: taskData.description
            },
            assignedTo: taskData.assigned_to_user_id || taskData.assignedTo,
            assignedRole: taskData.assigned_to_role || taskData.assignedRole,
            assignedByName: taskData.assignedByName || taskData.createdBy || "Administrator",
            isPublic: !taskData.assigned_to_user_id && !taskData.assigned_to_role,
            timestamp: new Date().toISOString()
        };

        console.log("Notification to send:", JSON.stringify(notificationData, null, 2));

        // ŠALJI NOTIFIKACIJE NA PRAVI NAČIN

        // 1. Ako je dodijeljen konkretnom korisniku
        if (notificationData.assignedTo) {
            const userRoom = `user_${notificationData.assignedTo}`;
            console.log(` Šaljem notifikaciju u sobu: ${userRoom}`);

            // Provjeri da li soba postoji
            if (rooms.has(userRoom)) {
                io.to(userRoom).emit("new_task", notificationData);
                console.log(`   ✅ Notifikacija poslana u ${userRoom}`);
            } else {
                console.log(`   Soba ${userRoom} ne postoji!`);
            }
        }

        // 2. Ako je dodijeljen ulozi
        else if (notificationData.assignedRole) {
            const roleRoom = `role_${notificationData.assignedRole}`;
            console.log(`Šaljem notifikaciju u sobu: ${roleRoom}`);

            if (rooms.has(roleRoom)) {
                io.to(roleRoom).emit("new_task", notificationData);
                console.log(`    Notifikacija poslana u ${roleRoom}`);
            } else {
                console.log(`    Soba ${roleRoom} ne postoji!`);
            }
        }

        // 3. Ako je JAVNI zadatak (za sve)
        else {
            console.log(`Šaljem JAVNI zadatak svima`);
            io.emit("new_task", {
                ...notificationData,
                debug: "Public task - sent to everyone"
            });
            console.log(`   ✅ Javna notifikacija poslana svima`);
        }

        // 4. ADMINI UVJEK TREBAJU DOBITI NOTIFIKACIJU
        console.log(`Šaljem notifikaciju ADMINIMA`);
        io.to('admin').emit("new_task", {
            ...notificationData,
            isAdminNotification: true,
            debug: "Admin notification"
        });

        // 5. Pošalji potvrdu korisniku koji je kreirao zadatak
        if (taskData.createdBySocketId) {
            io.to(taskData.createdBySocketId).emit("task_created_confirmation", {
                success: true,
                message: "✅ Zadatak uspješno kreiran i notifikacija poslana!",
                taskId: notificationData.task.id,
                notificationSent: true
            });
        }

        console.log("=".repeat(60));
    });

    socket.on("disconnect", () => {
        console.log("❌ Klijent odspojen:", socket.id);
    });
});

// Dobavljanje svih zaliha goriva (GET)
app.get("/inventory", authenticateToken, checkPermission('inventory.read'), (req, res) => {
    db.all("SELECT * FROM inventory", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 📌 Dodavanje novog goriva (POST)
app.post("/inventory", authenticateToken, checkPermission('inventory.create'), (req, res) => {
    const { type, quantity, status, price } = req.body;
    db.run(
        "INSERT INTO inventory (type, quantity, status, price) VALUES (?, ?, ?, ?)",
        [type, quantity, status, price],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, type, quantity, status, price });
        }
    );
});

// Ažuriranje postojećeg goriva (PUT)
app.put("/inventory/:id", authenticateToken, checkPermission('inventory.update'), (req, res) => {
    const { id } = req.params;
    const { type, quantity, status, price } = req.body;
    db.run(
        "UPDATE inventory SET type = ?, quantity = ?, status = ?, price = ? WHERE id = ?",
        [type, quantity, status, price, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: "Podaci ažurirani!" });
        }
    );
});

//  Brisanje goriva (DELETE)
app.delete("/inventory/:id", authenticateToken, checkPermission('inventory.delete'), (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM inventory WHERE id = ?", id, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "Zapis obrisan!" });
    });
});

// Registracija korisnika (POST)
app.post("/register", (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, hashedPassword],
        function (err) {
            if (err) {
                res.status(400).json({ error: "Korisnik već postoji!" });
                return;
            }
            res.json({ message: "Registracija uspješna!" });
        }
    );
});

//  Zaštićena ruta (test)
app.get("/protected", authenticateToken, (req, res) => {
    res.json({ message: "Dobrodošli u zaštićenu zonu!", user: req.user });
});

// Za admina
const checkAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Pristup odbijen!" });
        }

        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Nemaš administratorske privilegije!" });
        }

        next();
    } catch (error) {
        return res.status(403).json({ error: "Autorizacijska greška!" });
    }
};

// Ruta samo za admina
app.get("/dashboard", authenticateToken, checkPermission('admin.*'), (req, res) => {
    res.json({ message: "Dobrodošao Admin!", user: req.user });
});

// ✅ Dodaj nove podatke o proizvodnji goriva
app.post("/api/fuel-production", authenticateToken, checkPermission('fuel-production.read'), (req, res) => {
    const { month, production_tons, fuel_type, refinery } = req.body;
    db.run(
        `INSERT INTO fuel_production (month, production_tons, fuel_type, refinery) VALUES (?, ?, ?, ?)`,
        [month, production_tons, fuel_type, refinery],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: "New fuel production data added", id: this.lastID });
        }
    );
});

// 📌 **Ruta za dodavanje novih podataka (za testiranje)**
app.post("/api/fuel-production", authenticateToken, checkPermission('fuel-production.create'), (req, res) => {
    const { month, year, production_tons, fuel_type, refinery } = req.body;

    if (!month || !year || !production_tons || !fuel_type || !refinery) {
        return res.status(400).json({ error: "Svi podaci su obavezni!" });
    }

    db.run(
        `INSERT INTO fuel_production (month, year, production_tons, fuel_type, refinery)
         VALUES (?, ?, ?, ?, ?)`,
        [month, year, production_tons, fuel_type, refinery],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: "Podaci uspješno dodani!", id: this.lastID });
        }
    );
});

// 📌 API ruta za dohvaćanje svih rafinerija
app.get("/api/refineries", authenticateToken, (req, res) => {
    db.all("SELECT DISTINCT refinery FROM fuel_production", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 📌 API ruta za dohvaćanje podataka o proizvodnji goriva
app.get("/api/fuel-production", authenticateToken, checkPermission('fuel-production.read'), (req, res) => {
    const fuelType = req.query.fuelType;
    const refinery = req.query.refinery;
    const year = req.query.year;

    let query = `SELECT month, fuel_type, SUM(production_tons) as production_tons FROM fuel_production WHERE 1=1`;
    let params = [];

    if (fuelType && fuelType !== "") {
        query += " AND fuel_type = ?";
        params.push(fuelType);
    }

    if (refinery && refinery !== "") {
        query += " AND refinery = ?";
        params.push(refinery);
    }

    if (year && year !== "") {
        query += " AND year = ?";
        params.push(year);
    }

    query += " GROUP BY month, fuel_type ORDER BY month ASC";

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error("SQL greška:", err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 📌 API ruta za dohvaćanje svih vrsta goriva
app.get("/api/fuel-types", authenticateToken, (req, res) => {
    db.all("SELECT DISTINCT fuel_type FROM fuel_production", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows.map(row => row.fuel_type));
    });
});

// 📌 API ruta za dohvaćanje dostupnih godina
app.get("/api/years", authenticateToken, (req, res) => {
    db.all("SELECT DISTINCT year FROM fuel_production ORDER BY year ASC", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows.map(row => row.year));
    });
});

// 📌 Predviđanje potrošnje goriva na osnovu prošlih godina
app.get("/api/fuel-forecast", authenticateToken, checkPermission('fuel-forecast.read'), (req, res) => {
    db.all(
        `SELECT month, year, SUM(production_tons) as total_production
         FROM fuel_production
         GROUP BY year, month
         ORDER BY year, month`,
        [],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (rows.length === 0) {
                res.json([]);
                return;
            }

            const monthOrder = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];

            // 1. GRUPIRANJE UKUPNE PROIZVODNJE PO GODINAMA I MJESECIMA
            const dataByYearMonth = {};
            const years = [];

            rows.forEach(row => {
                if (!dataByYearMonth[row.year]) {
                    dataByYearMonth[row.year] = {};
                    years.push(row.year);
                }
                dataByYearMonth[row.year][row.month] = row.total_production;
            });

            years.sort((a, b) => a - b);

            // 2. POPUNA PRAZNIH MJESECI - koristimo podatke iz istog kvartala
            const completedData = JSON.parse(JSON.stringify(dataByYearMonth));

            years.forEach(year => {
                const yearData = completedData[year];
                const quarters = {
                    "Q1": ["January", "February", "March"],
                    "Q2": ["April", "May", "June"],
                    "Q3": ["July", "August", "September"],
                    "Q4": ["October", "November", "December"]
                };

                // Za svaki kvartal, popuni prazne mjesece
                Object.values(quarters).forEach(quarterMonths => {
                    const filledMonths = quarterMonths.filter(month => yearData[month]);
                    const emptyMonths = quarterMonths.filter(month => !yearData[month]);

                    if (filledMonths.length > 0 && emptyMonths.length > 0) {
                        const quarterAvg = filledMonths.reduce((sum, month) => sum + yearData[month], 0) / filledMonths.length;
                        emptyMonths.forEach(month => {
                            completedData[year][month] = quarterAvg;
                        });
                    }
                });
            });

            // 3. IZRAČUN PROSJEKA PO MJESECU IZ SVIH GODINA
            const monthlyAverages = {};

            monthOrder.forEach(month => {
                const values = years.map(year => completedData[year][month]).filter(val => val);
                if (values.length > 0) {
                    monthlyAverages[month] = values.reduce((a, b) => a + b, 0) / values.length;
                }
            });

            // 4. ANALIZA TRENDA
            let yearlyGrowth = 0;
            if (years.length >= 2) {
                const firstYear = years[0];
                const lastYear = years[years.length - 1];

                const firstYearTotal = monthOrder.reduce((sum, month) => sum + (completedData[firstYear][month] || 0), 0);
                const lastYearTotal = monthOrder.reduce((sum, month) => sum + (completedData[lastYear][month] || 0), 0);

                const yearDiff = lastYear - firstYear;
                yearlyGrowth = yearDiff > 0 ? (lastYearTotal - firstYearTotal) / firstYearTotal / yearDiff : 0;
            }

            // 5. GENERIRANJE PROGNOZE
            const now = new Date();
            let currentMonthIndex = (now.getMonth() + 1) % 12;
            let currentYear = currentMonthIndex === 0 ? now.getFullYear() + 1 : now.getFullYear();

            const finalForecast = [];

            for (let i = 0; i < 12; i++) {
                const month = monthOrder[currentMonthIndex];
                const baseValue = monthlyAverages[month] || Object.values(monthlyAverages)[0] || 0;

                // Realan rast (max ±10% godišnje)
                const realisticGrowth = Math.max(-0.1, Math.min(0.1, yearlyGrowth));
                const predictedValue = baseValue * (1 + realisticGrowth);

                finalForecast.push({
                    month: month,
                    year: currentYear,
                    predicted_production: Math.round(predictedValue),
                    unit: "tons"
                });

                currentMonthIndex = (currentMonthIndex + 1) % 12;
                if (currentMonthIndex === 0) currentYear++;
            }

            res.json(finalForecast);
        }
    );
});

app.get("/api/reports", authenticateToken, checkPermission('reports.read'), (req, res) => {
    db.all(`
        SELECT
            month,
            SUM(production_tons) as totalProduction,
            SUM(production_tons * 1.5) as totalIncome,
            SUM(production_tons * 0.8) as totalConsumption
        FROM fuel_production
        GROUP BY month
        ORDER BY month ASC
    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 13.2.2025 ZA USERS U DASHBOARDU

// 📌 Dobavljanje svih korisnika (GET)
app.get("/users", authenticateToken, checkAdmin, (req, res) => {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 📌 Dodavanje novog korisnika (POST) - ISPRAVLJENO
app.post("/users", authenticateToken, checkAdmin, (req, res) => {
    const { ime, prezime, email, username, password, role, profile_image } = req.body;

    console.log('🔐 Password received:', password); // DEBUG

    // 👇 PROVJERI DA LI JE LOZINKA VEĆ HASHIRANA
    let hashedPassword;
    if (password.startsWith('$2a$') || password.startsWith('$2b$')) {
        // Ako počinje sa bcrypt patternom, već je hashirana
        hashedPassword = password;
        console.log('✅ Password je već hashiran');
    } else {
        // Ako nije, hashiraj je
        hashedPassword = bcrypt.hashSync(password, 10);
        console.log('🔐 Password hashiran na backendu');
    }

    db.run(
        "INSERT INTO users (ime, prezime, email, username, password, role, profile_image) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [ime, prezime, email, username, hashedPassword, role, profile_image || null],
        function (err) {
            if (err) {
                console.error('❌ Database error:', err);
                res.status(400).json({ error: "Korisnik već postoji!" });
                return;
            }
            res.json({ message: "Korisnik uspješno dodan!", id: this.lastID });
        }
    );
});

// 📌 Ažuriranje korisnika (PUT)
app.put('/users/:id', authenticateToken, checkAdmin, (req, res) => {
    const { id } = req.params;
    const { ime, prezime, username, email, role, profile_image } = req.body;

    db.run(
        'UPDATE users SET ime = ?, prezime = ?, username = ?, email = ?, role = ?, profile_image = ? WHERE id = ?',
        [ime, prezime, username, email, role, profile_image || null, id], // Allow profile_image to be NULL
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Podaci korisnika ažurirani!' });
        }
    );
});

// 📌 Brisanje korisnika (DELETE)
app.delete("/users/:id", authenticateToken, checkAdmin, (req, res) => {
    const { id } = req.params;
    console.log(`Brisanje korisnika sa ID: ${id}`);  // Debugging
    db.run("DELETE FROM users WHERE id = ?", id, function (err) {
        if (err) {
            console.error("Greška pri brisanju korisnika:", err);
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Korisnik nije pronađen" });
        }
        res.json({ message: "Korisnik obrisan!" });
    });
});

// Ažurirajte korisnika s putanjom do slike
app.put('/users/:id/profile-image', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { imagePath } = req.body;

    db.run(
        'UPDATE users SET profile_image = ? WHERE id = ?',
        [imagePath, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Profilna slika ažurirana!' });
        }
    );
});

// 📌 Dohvati korisnički profil SA RBAC-om
app.get("/users/profile", authenticateToken, checkPermission('profile.read'), (req, res) => {
    db.get("SELECT id, username, ime, prezime, role, profile_image FROM users WHERE id = ?", [req.user.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: "Greška pri dohvaćanju podataka!" });
        }

        if (row) {
            console.log('✅ Dohvaćeni podaci s backend-a za korisnika:', req.user.username);
            res.json({
                id: row.id,
                username: row.username,
                ime: row.ime,
                prezime: row.prezime,
                role: row.role,  // 👈 OVO JE KLJUČNO - mora vraćati role!
                profile_image: row.profile_image,
            });
        } else {
            res.status(404).json({ error: "Korisnik nije pronađen!" });
        }
    });
});

// 11.11.2025.

// 📌 API ruta za dohvaćanje ukupnog prihoda po godinama
app.get("/api/revenue-by-year", authenticateToken, (req, res) => {
    const { year } = req.query;

    let query = `SELECT SUM(revenue) AS totalIncome FROM reports`;  // Početni upit
    let params = [];

    if (year && year !== "Sve") {  // Ako nije "all", filtriramo po godini
        query += ` WHERE year = ?`;
        params.push(year);
    } else if (year === "Sve") { // Ako je "all", ne filtriramo po godini
        query = `SELECT SUM(revenue) AS totalIncome FROM reports`;  // Upit za sve godine
    }

    db.get(query, params, (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ totalIncome: row.totalIncome || 0 });  // Vraćamo totalIncome
    });
});

// API ruta za dohvaćanje zadnje godine
app.get("/api/latest-year", authenticateToken, (req, res) => {
    db.get("SELECT MAX(year) AS latestYear FROM reports", [], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ latestYear: row.latestYear });
    });
});

// 📌 API ruta za dohvaćanje dostupnih godina
app.get("/api/years", authenticateToken, (req, res) => {
    db.all("SELECT DISTINCT year FROM reports ORDER BY year ASC", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows.map(row => row.year));  // Vraćamo samo godine iz baze
    });
});

// 14.11.2025

// 📌 API ruta za dohvaćanje CAPEX po godinama
app.get("/api/capex-by-year", authenticateToken, checkPermission('capex.*'), (req, res) => {
    const { year } = req.query;

    let query = `SELECT SUM(amount_invested) AS totalCapex FROM refinery_capex`;
    let params = [];

    if (year && year !== "Sve") {
        query += ` WHERE year = ?`;
        params.push(year);
    } else if (year === "Sve") {
        query = `SELECT SUM(amount_invested) AS totalCapex FROM refinery_capex`;
    }

    db.get(query, params, (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ totalCapex: row.totalCapex || 0 });
    });
});

// 16.11.2025.

// Ruta za dohvat broja zaposlenih
app.get('/api/total-employees', authenticateToken, (req, res) => {
    const query = `SELECT COUNT(*) AS totalEmployees FROM users`; // Broji sve korisnike u tablici users
    db.get(query, (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ totalEmployees: row.totalEmployees }); // Vraća broj zaposlenih
    });
});

// 19.11.2025. DOADATAK BENZISKIH PUMPI

// server.js - ISPRAVNE RUTE ZA GAS STATIONS
// 📌 GET - Dohvati sve benzinske stanice
app.get("/api/gas-stations", authenticateToken, checkPermission('gas-stations.read'), (req, res) => {
    console.log('✅ Pozivam /api/gas-stations...');

    const query = 'SELECT * FROM gas_stations ORDER BY id DESC';

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('❌ SQL greška:', err);
            return res.status(500).json({ error: err.message });
        }

        console.log(`✅ Pronađeno stanica: ${rows.length}`);

        // NEMA POTREBE ZA TRANSFORMACIJOM - već koristimo pravi naziv
        res.json(rows);
    });
});

// 📌 POST - Dodaj novu benzinsku stanicu
app.post('/api/gas-stations', authenticateToken, checkPermission('gas-stations.create'), (req, res) => {
    console.log('📝 Dodajem novu stanicu:', req.body);

    const { name, location, country, type, status, has_fresh_corner, latitude, longitude } = req.body;

    // KORISTI PRAVI NAZIV STUPCA - has_fresh_corner
    const query = `
        INSERT INTO gas_stations
        (name, location, country, type, status, has_fresh_corner, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [name, location, country, type, status, has_fresh_corner ? 1 : 0, latitude, longitude];

    db.run(query, params, function (err) {
        if (err) {
            console.error('❌ SQL greška pri insert:', err);
            return res.status(500).json({ error: err.message });
        }

        console.log('✅ Stanica dodana, ID:', this.lastID);
        res.json({ id: this.lastID, success: true });
    });
});

// 📌 PUT - Ažuriraj postojeću stanicu
app.put('/api/gas-stations/:id', authenticateToken, checkPermission('gas-stations.update'), (req, res) => {
    const { id } = req.params;
    const { name, location, country, type, status, has_fresh_corner, latitude, longitude } = req.body;

    console.log(`✏️ Ažuriram stanicu ID: ${id}`, req.body);

    // KORISTI PRAVI NAZIV STUPCA - has_fresh_corner
    const query = `
        UPDATE gas_stations SET
                                name = ?, location = ?, country = ?, type = ?, status = ?,
                                has_fresh_corner = ?, latitude = ?, longitude = ?
        WHERE id = ?
    `;

    const params = [name, location, country, type, status, has_fresh_corner ? 1 : 0, latitude, longitude, id];

    db.run(query, params, function (err) {
        if (err) {
            console.error('❌ SQL greška pri update:', err);
            return res.status(500).json({ error: err.message });
        }

        console.log('✅ Stanica ažurirana');
        res.json({ success: true });
    });
});

// 📌 DELETE - Obriši stanicu
app.delete('/api/gas-stations/:id', authenticateToken, checkPermission('gas-stations.delete'), (req, res) => {
    const { id } = req.params;
    console.log(`🗑️ Brišem stanicu ID: ${id}`);

    const query = 'DELETE FROM gas_stations WHERE id = ?';

    db.run(query, [id], function (err) {
        if (err) {
            console.error('❌ SQL greška pri delete:', err);
            return res.status(500).json({ error: err.message });
        }

        console.log('✅ Stanica obrisana');
        res.json({ success: true });
    });
});

// 📌 DEBUG - Provjera strukture tablice
app.get('/api/debug-table-structure', authenticateToken, checkPermission('gas-stations.*'), (req, res) => {
    const query = "PRAGMA table_info(gas_stations)";

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        console.log('📋 Struktura tablice gas_stations:');
        rows.forEach(col => {
            console.log(`   ${col.name} (${col.type})`);
        });

        res.json({ structure: rows });
    });
});

// 20.11.2025.
// 📌 SIGURNOSNI MIDDLEWARE I FUNKCIJE
// Konfiguracija sigurnosnih postavki - SUPER BRZO TESTIRANJE (30 SEKUNDI)
const SECURITY_CONFIG = {
    MAX_LOGIN_ATTEMPTS: 3,
    LOCKOUT_DURATION: 30 * 1000, // 30 SEKUNDI
    IP_BLOCK_DURATION: 30 * 1000, // 30 SEKUNDI
    FAILED_LOGIN_WINDOW: 30 * 1000 // 30 SEKUNDI
};

// 📌 Funkcija za logovanje sigurnosnih događaja
function logSecurityEvent(ip, username, actionType, description, userAgent = null, severity = 'medium') {
    const query = `
        INSERT INTO security_logs (ip_address, username, action_type, description, user_agent, severity)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [ip, username, actionType, description, userAgent, severity], (err) => {
        if (err) {
            console.error('Greška pri logovanju sigurnosnog događaja:', err);
        }
    });
}

// Provjera da li je IP blokiran - ISPRAVLJENA VERZIJA
function isIpBlocked(ip, callback) {
    const query = `
        SELECT * FROM blocked_ips
        WHERE ip_address = ? AND (is_permanent = 1 OR datetime(blocked_until) > datetime('now'))
    `;

    db.get(query, [ip], (err, row) => {
        if (err) {
            console.error('Greška pri provjeri IP blokade:', err);
            return callback(false);
        }

        if (row) {
            console.log(`🚫🚫🚫 IP ${ip} JE BLOKIRAN do: ${row.blocked_until}`);
            console.log(`⏰ Trenutno vrijeme baze: ${new Date().toISOString()}`);
            console.log(`📋 Razlog: ${row.reason}`);
        } else {
            console.log(`✅ IP ${ip} NIJE blokiran`);
        }

        callback(!!row);
    });
}

// Provjera da li je korisnik zaključan - ISPRAVLJENA VERZIJA
function isUserLocked(username, callback) {
    const query = `
        SELECT * FROM user_lockouts
        WHERE username = ? AND datetime(locked_until) > datetime('now')
    `;

    db.get(query, [username], (err, row) => {
        if (err) {
            console.error('Greška pri provjeri lockout-a:', err);
            return callback(false);
        }

        if (row) {
            console.log(`User ${username} je ZAKLJUČAN do: ${row.locked_until}`);
            console.log(`Trenutno vrijeme (UTC): ${new Date().toISOString()}`);
        }

        callback(!!row);
    });
}

// Detekcija SQL injection napada
function detectSqlInjection(input) {
    if (typeof input !== 'string') return false;

    const sqlInjectionPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|ALTER|CREATE|TRUNCATE)\b)/i,
        /(\b(OR|AND)\b\s*\d+\s*=\s*\d+)/i,
        /('|"|;|--|\/\*|\*\/|@@|char|nchar|varchar|nvarchar)/i,
        /(\b(WAITFOR|DELAY)\b\s*'\d+:\d+:\d+')/i,
        /(\b(SLEEP|BENCHMARK)\b\s*\(\d+\))/i,
        /(;\s*(DROP|DELETE|UPDATE|INSERT))/i,
        /(\bUNION\b.*\bSELECT\b)/i
    ];

    return sqlInjectionPatterns.some(pattern => pattern.test(input));
}

// Snimi failed login pokušaj
function recordFailedLogin(ip, username, userAgent) {
    const query = `
        INSERT INTO failed_logins (ip_address, username, user_agent)
        VALUES (?, ?, ?)
    `;

    db.run(query, [ip, username, userAgent], (err) => {
        if (err) {
            console.error('Greška pri snimanju failed login-a:', err);
            return;
        }

        // Provjeri da li treba blokirati IP ili korisnika
        checkAndBlockIfNeeded(ip, username);
    });
}

//  Provjeri i blokiraj ako je potrebno - ISPRAVLJENA VERZIJA
function checkAndBlockIfNeeded(ip, username) {
    const timeWindow = new Date(Date.now() - SECURITY_CONFIG.FAILED_LOGIN_WINDOW);

    console.log(`🔍 Checking security for IP: ${ip}, User: ${username}`);

    // Provjeri IP-based brute force
    const ipQuery = `
        SELECT COUNT(*) as attempt_count
        FROM failed_logins
        WHERE ip_address = ? AND attempted_at > datetime(?)
    `;

    db.get(ipQuery, [ip, timeWindow.toISOString()], (err, ipResult) => {
        if (err) {
            console.error('Greška pri provjeri IP pokušaja:', err);
            return;
        }

        console.log(`📊 IP ${ip} ima ${ipResult.attempt_count} pokušaja u zadnjih ${SECURITY_CONFIG.FAILED_LOGIN_WINDOW / 60000} minuta`);

        if (ipResult.attempt_count >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
            console.log(`🚨 BLOKIRAM IP ${ip} zbog brute force napada!`);
            blockIp(ip, 'Brute force attack detected', 'system');
            logSecurityEvent(ip, null, 'brute_force_detected',
                `IP automatski blokiran zbog ${ipResult.attempt_count} neuspješnih login pokušaja`,
                null, 'high');
        }
    });

    // Provjeri user-based brute force
    if (username) {
        const userQuery = `
            SELECT COUNT(*) as attempt_count
            FROM failed_logins
            WHERE username = ? AND attempted_at > datetime(?)
        `;

        db.get(userQuery, [username, timeWindow.toISOString()], (err, userResult) => {
            if (err) {
                console.error('Greška pri provjeri user pokušaja:', err);
                return;
            }

            console.log(`📊 User ${username} ima ${userResult.attempt_count} pokušaja u zadnjih ${SECURITY_CONFIG.FAILED_LOGIN_WINDOW / 60000} minuta`);

            if (userResult.attempt_count >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
                console.log(`🔐 ZAKLJUČAVAM user ${username} zbog previše pokušaja!`);
                lockoutUser(username, 'Too many failed login attempts');
                logSecurityEvent(ip, username, 'user_lockout',
                    `Korisnik automatski zaključan zbog ${userResult.attempt_count} neuspješnih login pokušaja`,
                    null, 'high');
            }
        });
    }
}

// Blokiraj IP adresu
function blockIp(ip, reason, blockedBy = 'system', duration = SECURITY_CONFIG.IP_BLOCK_DURATION) {
    const blockedUntil = new Date(Date.now() + duration);

    const query = `
        INSERT OR REPLACE INTO blocked_ips (ip_address, blocked_until, reason, blocked_by, is_permanent)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(query, [ip, blockedUntil.toISOString(), reason, blockedBy, 0], (err) => {
        if (err) {
            console.error('Greška pri blokiranju IP:', err);
        }
    });
}

// Zaključaj korisnika
function lockoutUser(username, reason, duration = SECURITY_CONFIG.LOCKOUT_DURATION) {
    const lockedUntil = new Date(Date.now() + duration);

    const query = `
        INSERT OR REPLACE INTO user_lockouts (username, locked_until, reason, failed_attempts)
        VALUES (?, ?, ?, ?)
    `;

    db.run(query, [username, lockedUntil.toISOString(), reason, SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS], (err) => {
        if (err) {
            console.error('Greška pri lockout-u korisnika:', err);
        }
    });
}

//  Dobavi IP adresu iz requesta
function getClientIp(req) {
    return req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
        '127.0.0.1';
}

// MIDDLEWARE ZA SIGURNOSNU PROVJERU
const securityMiddleware = (req, res, next) => {
    console.log("securityMiddleware - URL:", req.url);
    console.log("securityMiddleware - Headers:", req.headers);

    const clientIp = getClientIp(req);
    const userAgent = req.get('User-Agent');

    // Provjeri SQL injection u body i query parametrima
    const checkForSqlInjection = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string' && detectSqlInjection(obj[key])) {
                logSecurityEvent(clientIp, null, 'sql_injection_attempt',
                    `SQL injection detected in ${key}: ${obj[key].substring(0, 100)}`,
                    userAgent, 'critical');
                return true;
            }
        }
        return false;
    };

    if (checkForSqlInjection(req.body) || checkForSqlInjection(req.query)) {
        return res.status(403).json({
            error: "Sigurnosna provjera neuspješna! Sumljiva aktivnost detektovana."
        });
    }

    // Provjeri da li je IP blokiran
    isIpBlocked(clientIp, (blocked) => {
        if (blocked) {
            logSecurityEvent(clientIp, null, 'blocked_ip_access',
                'Blocked IP attempted to access the system', userAgent, 'high');
            return res.status(403).json({
                error: "Vaša IP adresa je privremeno blokirana zbog sigurnosnih razloga."
            });
        }
        next();
    });
};

// Primijeni sigurnosni middleware na sve rute
app.use(securityMiddleware);

//  POBOLJŠANA LOGIN RUTA SA ROLE DEBUG-OM
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const clientIp = getClientIp(req);
        const userAgent = req.get('User-Agent');

        console.log(`\nNOVI LOGIN POKUŠAJ: ${username} from IP: ${clientIp}`);

        //  PRVO PROVJERI BLOKADU - SINHRONO!
        const ipBlocked = await new Promise((resolve) => {
            isIpBlocked(clientIp, resolve);
        });

        if (ipBlocked) {
            console.log(`❌❌❌ BLOKIRAN PRISTUP: IP ${clientIp} je blokiran!`);
            logSecurityEvent(clientIp, username, 'login_attempt_blocked',
                `Blocked IP attempted login - Username: ${username}`, userAgent, 'high');
            return res.status(403).json({
                error: "🚫 Vaša IP adresa je privremeno blokirana zbog sigurnosnih razloga. Pokušajte ponovo za 1 minut."
            });
        }

        // 👇 PROVJERA SQL INJECTION
        const hasSqlInjection = detectSqlInjection(username) || detectSqlInjection(password);

        if (hasSqlInjection) {
            console.log(`CRITICAL SQL INJECTION DETECTED FROM IP: ${clientIp}`);
            console.log(`sername attempt: "${username}"`);
            console.log(`Password attempt: "${password}"`);

            // 👇 AGRESIVNO BLOKIRANJE - 1 MINUTA
            blockIp(clientIp, 'SQL injection attack', 'system', 60 * 1000);

            logSecurityEvent(clientIp, username, 'sql_injection_attempt',
                `SQL INJECTION - BLOCKED IP - Username: "${username}"`,
                userAgent, 'critical');

            return res.status(403).json({
                error: "Sigurnosna provjera neuspješna! Detektovan je pokušaj SQL injection napada. Vaša IP adresa je blokirana 1 minut."
            });
        }

        isUserLocked(username, (userLocked) => {
            if (userLocked) {
                logSecurityEvent(clientIp, username, 'login_attempt_locked',
                    'Attempted login to locked account', userAgent, 'medium');
                return res.status(423).json({
                    error: "Račun je privremeno zaključan. Pokušajte ponovo za 1 minut."
                });
            }

            db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
                if (err || !user) {
                    recordFailedLogin(clientIp, username, userAgent);
                    logSecurityEvent(clientIp, username, 'login_failed',
                        'Attempted login with non-existent username', userAgent, 'medium');
                    return res.status(400).json({ error: "Pogrešno korisničko ime ili lozinka!" });
                }

                if (!bcrypt.compareSync(password, user.password)) {
                    recordFailedLogin(clientIp, username, userAgent);
                    logSecurityEvent(clientIp, username, 'login_failed',
                        'Failed login attempt - incorrect password', userAgent, 'medium');
                    return res.status(401).json({ error: "Pogrešno korisničko ime ili lozinka!" });
                }

                // USPJEŠNA PRIJAVA
                console.log(`✅✅✅ USPJEŠAN LOGIN: ${username}`);
                console.log(`👤 Podaci korisnika iz baze:`, {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    ime: user.ime,
                    prezime: user.prezime
                });

                // Provjeri da li role postoji u RBAC_CONFIG

                // Provjeri da li role postoji u RBAC_CONFIG
                if (user.role && RBAC_CONFIG.roles[user.role]) {
                    console.log(`ROLE PRONAĐENA U RBAC: ${user.role}`);
                    console.log(`Dozvole za ${user.role}:`, RBAC_CONFIG.roles[user.role]);
                } else {
                    console.log(`UPOZORENJE: Role "${user.role}" nije pronađena u RBAC_CONFIG!`);
                }

                // 🛑 ABAC CHECK NA LOGINU (NOVO)
                const abacPolicy = ABAC_POLICIES[user.role];
                if (abacPolicy) {
                    const passedAbac = abacPolicy.condition(); // isWorkingHours ne prima argumente
                    if (!passedAbac) {
                        console.warn(`ABAC Login Deny: User ${username} (${user.role}) attempted login outside allowed context.`);

                        logSecurityEvent(clientIp, username, 'login_denied_abac',
                            `Login blocked by ABAC policy: ${abacPolicy.errorMessage}`, userAgent, 'medium');

                        return res.status(403).json({ error: abacPolicy.errorMessage || "Pristup odbijen zbog sigurnosnih pravila (ABAC)." });
                    }
                }

                const token = jwt.sign(
                    { id: user.id, username: user.username, role: user.role },
                    SECRET_KEY,
                    { expiresIn: "1h" }
                );

                console.log(`TOKEN KREIRAN za ${user.role}:`, token.substring(0, 50) + "...");

                logSecurityEvent(clientIp, username, 'login_success',
                    'User successfully logged in', userAgent, 'low');

                res.json({
                    token,
                    role: user.role,
                    user: {
                        id: user.id,
                        username: user.username,
                        ime: user.ime,
                        prezime: user.prezime
                    }
                });
            });
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Greška pri prijavi!" });
    }
});

// Dohvati sigurnosne logove
app.get("/api/security/logs", authenticateToken, checkPermission('security.logs.read'), (req, res) => {
    const { page = 1, limit = 50, severity, action_type } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM security_logs WHERE 1=1`;
    let params = [];

    if (severity) {
        query += ` AND severity = ?`;
        params.push(severity);
    }

    if (action_type) {
        query += ` AND action_type = ?`;
        params.push(action_type);
    }

    query += ` ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Dohvati blokirane IP adrese
app.get("/api/security/blocked-ips", authenticateToken, checkPermission('security.ips.read'), (req, res) => {
    db.all(`SELECT * FROM blocked_ips ORDER BY blocked_at DESC`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Dohvati lockout-e korisnika
app.get("/api/security/user-lockouts", authenticateToken, checkPermission('security.users.read'), (req, res) => {
    db.all(`SELECT * FROM user_lockouts ORDER BY locked_at DESC`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Blokiraj IP adresu (manualno)
app.post("/api/security/block-ip", authenticateToken, checkPermission('security.ips.manage'), (req, res) => {
    try {
        const { ip_address, reason, duration_hours = 24, is_permanent = false } = req.body;

        let blockedUntil = null;
        if (!is_permanent) {
            blockedUntil = new Date(Date.now() + (duration_hours * 60 * 60 * 1000));
        }

        const query = `
            INSERT OR REPLACE INTO blocked_ips (ip_address, blocked_until, reason, blocked_by, is_permanent)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.run(query, [ip_address, blockedUntil?.toISOString(), reason, req.user.username, is_permanent ? 1 : 0], function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            logSecurityEvent(getClientIp(req), req.user.username, 'ip_manual_block',
                `Manually blocked IP: ${ip_address} - Reason: ${reason}`, null, 'high');

            res.json({ message: "IP adresa uspješno blokirana!" });
        });
    } catch (error) {
        res.status(500).json({ error: "Greška pri blokiranju IP!" });
    }
});

// Deblokiraj IP adresu
app.delete("/api/security/unblock-ip/:ip", authenticateToken, checkPermission('security.ips.manage'), (req, res) => {
    try {
        const { ip } = req.params;

        db.run("DELETE FROM blocked_ips WHERE ip_address = ?", [ip], function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            logSecurityEvent(getClientIp(req), req.user.username, 'ip_manual_unblock',
                `Manually unblocked IP: ${ip}`, null, 'medium');

            res.json({ message: "IP adresa uspješno deblokirana!" });
        });
    } catch (error) {
        res.status(500).json({ error: "Greška pri deblokiranju IP!" });
    }
});

// Otključaj korisnika
app.delete("/api/security/unlock-user/:username", authenticateToken, checkPermission('security.users.manage'), (req, res) => {
    try {
        const { username } = req.params;

        db.run("DELETE FROM user_lockouts WHERE username = ?", [username], function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            logSecurityEvent(getClientIp(req), req.user.username, 'user_manual_unlock',
                `Manually unlocked user: ${username}`, null, 'medium');

            res.json({ message: "Korisnik uspješno otključan!" });
        });
    } catch (error) {
        res.status(500).json({ error: "Greška pri otključavanju korisnika!" });
    }
});

// Statistike za dashboard
app.get("/api/security/stats", authenticateToken, checkPermission('security.stats.read'), (req, res) => {
    const queries = {
        totalLogs: `SELECT COUNT(*) as count FROM security_logs`,
        todayLogs: `SELECT COUNT(*) as count FROM security_logs WHERE DATE(timestamp) = DATE('now')`,
        blockedIps: `SELECT COUNT(*) as count FROM blocked_ips WHERE is_permanent = 1 OR blocked_until > datetime('now')`,
        lockedUsers: `SELECT COUNT(*) as count FROM user_lockouts WHERE locked_until > datetime('now')`,
        highSeverity: `SELECT COUNT(*) as count FROM security_logs WHERE severity IN ('high', 'critical') AND DATE(timestamp) = DATE('now')`
    };

    const results = {};
    let completed = 0;

    for (const [key, query] of Object.entries(queries)) {
        db.get(query, [], (err, row) => {
            if (!err) {
                results[key] = row.count;
            }
            completed++;

            if (completed === Object.keys(queries).length) {
                res.json(results);
            }
        });
    }
});

// Aktivnosti po satu (za graf)
app.get("/api/security/activity-by-hour", authenticateToken, checkPermission('security.stats.read'), (req, res) => {
    const query = `
        SELECT
            strftime('%H', timestamp) as hour,
            COUNT(*) as count
        FROM security_logs
        WHERE DATE(timestamp) = DATE('now')
        GROUP BY strftime('%H', timestamp)
        ORDER BY hour
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// --- MIGRACIJA (AUTOMATSKA) ---
// Tiho dodaj stupce ako ne postoje
db.run("ALTER TABLE users ADD COLUMN address TEXT", (e) => { });
db.run("ALTER TABLE users ADD COLUMN phone TEXT", (e) => { });
db.run("ALTER TABLE users ADD COLUMN ime TEXT", (e) => { });
db.run("ALTER TABLE users ADD COLUMN prezime TEXT", (e) => { });

// SEED DATA FOR AMEL (da AI ima što pročitati)
db.run(`UPDATE users SET 
    email = 'amel.toroman@ina.hr', 
    phone = '+385 91 234 5678', 
    address = 'Avenija Većeslava Holjevca 10, Zagreb' 
    WHERE username = 'amel' AND email IS NULL`, (e) => { });


// Helper za provjeru dozvola (sinkrono)
const hasPermission = (userRole, requiredPermission) => {
    if (userRole === 'admin') return true;
    const permissions = RBAC_CONFIG.roles[userRole] || [];
    return permissions.some(p => {
        if (p === '*') return true;
        if (p === requiredPermission) return true;
        if (p.endsWith('.*')) {
            return requiredPermission.startsWith(p.replace('.*', ''));
        }
        return false;
    });
};

// Pomocna funkcija za DB promise
const dbQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// GLAVNA FUNKCIJA ZA KONTEKST
const buildRBACContext = async (user) => {
    let context = `TRENUTNI KORISNIK:\nIme: ${user.username}\nUloga: ${user.role}\n\nSISTEMSKI PODACI (Vidljivi samo za tvoju ulogu):\n`;
    let hasData = false;

    // 1. BENZINSKE POSTAJE (Gas Stations)
    // Svi mogu vidjeti popis stanica, ali detalje (prihod) samo određeni.
    if (hasPermission(user.role, 'gas-stations.read')) {
        try {
            const stations = await dbQuery("SELECT name, location, type, status, has_fresh_corner FROM gas_stations");
            const stText = stations.map(s => `- ${s.name} (${s.location}): ${s.status}, ${s.type} ${s.has_fresh_corner ? '[FreshCorner]' : ''}`).join('\n') || "Nema stanica";
            context += `\n1. BENZINSKE POSTAJE:\n${stText}\n`;
            hasData = true;
        } catch (e) { context += `\n1. BENZINSKE POSTAJE: Greška\n`; }
    }

    // 2. PROIZVODNJA (Fuel Production)
    if (hasPermission(user.role, 'production.read')) {
        try {
            const prod = await dbQuery("SELECT fuel_type, production_rate, efficiency, status FROM fuel_production");
            const prodText = prod.map(p => `- ${p.fuel_type}: ${p.production_rate}/h (Efikasnost: ${p.efficiency}%) [${p.status}]`).join('\n') || "Nema podataka";
            context += `\n2. PROIZVODNJA:\n${prodText}\n`;
            hasData = true;
        } catch (e) { }
    }

    // 3. INVENTAR (Inventory)
    if (hasPermission(user.role, 'inventory.read')) {
        try {
            const rows = await dbQuery("SELECT type, quantity FROM inventory");
            const inventoryText = rows.map(r => `- ${r.type}: ${r.quantity}L`).join('\n') || "Prazno";
            context += `\n3. INVENTAR:\n${inventoryText}\n`;
            hasData = true;
        } catch (e) { context += `\n3. INVENTAR: Greška pri dohvatu\n`; }
    }

    // 4. FINANCIJE (Reports)
    if (hasPermission(user.role, 'reports.read')) {
        try {
            const rows = await dbQuery("SELECT SUM(revenue) as totalRev, SUM(sold_quantity) as totalSold FROM reports");
            const fin = rows[0];
            context += `\n4. FINANCIJE:\n- Ukupni prihod: ${fin.totalRev || 0} EUR\n- Prodano: ${fin.totalSold || 0} L\n`;
            hasData = true;
        } catch (e) { context += `\n4. FINANCIJE: Greška\n`; }
    } else {
        context += `\n4. FINANCIJE: [PRISTUP ZABRANJEN - Nemaš ovlasti]\n`;
    }

    // 5. SIGURNOST (Security Stats)
    if (hasPermission(user.role, 'security.stats.read')) {
        try {
            const blocked = await dbQuery("SELECT COUNT(*) as c FROM blocked_ips WHERE blocked_until > datetime('now')");
            const threats = await dbQuery("SELECT COUNT(*) as c FROM security_logs WHERE severity='high' AND date(timestamp)=date('now')");
            context += `\n5. SIGURNOST:\n- Blokiranih IP-ova: ${blocked[0].c}\n- Prijetnji danas: ${threats[0].c}\n`;
            hasData = true;
        } catch (e) { context += `\n5. SIGURNOST: Greška\n`; }
    }

    // 6. ZAPOSLENICI (Users) i ZADNJI LOGIN - EXTENDED
    if (hasPermission(user.role, 'users.read')) {
        try {
            const query = `
                SELECT u.username, u.role, u.ime, u.prezime, u.email, u.address, u.phone, MAX(sl.timestamp) as last_login
                FROM users u
                LEFT JOIN security_logs sl ON u.username = sl.username AND sl.action_type = 'login_success'
                GROUP BY u.id
            `;
            const users = await dbQuery(query);

            const userList = users.map(u => {
                const loginInfo = u.last_login ? `[Zadnji login: ${u.last_login}]` : `[Nikad]`;
                const contact = [];
                if (u.email) contact.push(`Email: ${u.email}`);
                if (u.phone) contact.push(`Tel: ${u.phone}`);
                if (u.address) contact.push(`Adresa: ${u.address}`);

                const contactStr = contact.length > 0 ? ` {${contact.join(', ')}}` : "";

                return `- ${u.ime || u.username} ${u.prezime || ''} (${u.role}) ${loginInfo}${contactStr}`;
            }).join('\n');

            context += `\n6. ZAPOSLENICI I PODACI:\n${userList}\n`;
            hasData = true;
        } catch (e) { console.error(e); }
    } else {
        context += `\n6. ZAPOSLENICI: [PRISTUP ZABRANJEN]\n`;
    }

    // 7. ZADACI (Tasks) - DETALJNO
    try {
        let tasksQuery = `
            SELECT t.title, t.description, t.priority, t.status, t.due_date, 
                   u1.username as assignee, u2.username as creator,
                   t.assigned_to_role
            FROM daily_tasks t 
            LEFT JOIN users u1 ON t.assigned_to_user_id = u1.id 
            LEFT JOIN users u2 ON t.assigned_by_user_id = u2.id
        `;

        let params = [];
        if (!hasPermission(user.role, 'tasks.manage')) {
            tasksQuery += " WHERE t.assigned_to_user_id = ? OR t.assigned_to_role = ? OR (t.assigned_to_user_id IS NULL AND t.assigned_to_role IS NULL)";
            params = [user.id, user.role];
        }

        tasksQuery += " ORDER BY t.priority DESC, t.due_date ASC";

        const tasks = await dbQuery(tasksQuery, params);

        const taskText = tasks.map(t => {
            const assignInfo = t.assignee ? `(ZA: ${t.assignee})` : t.assigned_to_role ? `(ROLA: ${t.assigned_to_role})` : `(JAVNO)`;
            const desc = t.description ? `\n   Opis: "${t.description}"` : "";
            const due = t.due_date ? ` [Rok: ${t.due_date}]` : "";
            return `- [${t.priority}] ${t.title} ${assignInfo} [Status: ${t.status}]${due}${desc}`;
        }).join('\n') || "Nema zadataka";

        context += `\n7. ZADACI:\n${taskText}\n`;
        hasData = true;
    } catch (e) {
        console.error("Task fetch error:", e);
        context += `\n7. ZADACI: Greška pri dohvatu\n`;
    }

    if (!hasData) {
        context += "\nNAPOMENA: Trenutno nema dostupnih podataka za tvoju ulogu ili je došlo do greške.";
    }

    context += `\n\nUPUTE ZA AI (STRICT SYSTEM ONLY + SYSTEM FIRST):
Ti si super-inteligentni INA Asistent.
1. Tvoj svijet su GORE NAVEDENI sistemski podaci. Tvoje "znanje" van toga je sekundarno.
2. KRITIČNO PRAVILO: Ako te pitaju za pojam koji postoji u sustavu (npr. "Mostar", "Amel", "Split"), MORAŠ PRVO DATI PODATKE IZ SUSTAVA.
   - Primjer: Ako te pitaju "a Mostar?", a vidiš "Mostar" pod "BENZINSKE POSTAJE", odgovori: "INA Mostar je aktivna benzinska postaja u sustavu (Standard)." NE OPISUJ GRAD MOSTAR osim ako te to izričito ne traže.
   - Primjer: Ako pitaju "Tko je X?", odgovori podacima iz "ZAPOSLENICI" (Uloga, Kontakt, Zadnji login).
3. Ako te pitaju "Koji je email od X?", a email piše gore, reci ga. Ako fali, reci da fali.
4. Ako te pitaju "Koje stanice postoje u BiH?", pregledaj popis stanica i izdvoji one u gradovima BiH (Cazin, Sarajevo, Mostar...).
5. Ako te pitaju nepovezanu stvar (npr. "Recept za pizzu"), odbij pristojno i reci da si tu za INA sustav.
6. Budi proaktivan i koristan inženjer.`;

    return context;
};

// 22.11.2025. - AI CHAT PROXY (RBAC ENHANCED)
app.post("/api/chat", authenticateToken, async (req, res) => {
    try {
        const { message, apiKey, model, provider } = req.body;

        if (!apiKey) return res.status(400).json({ error: "API Key is missing" });

        // GENERIRAJ KONTEKST NA SERVERU
        const context = await buildRBACContext(req.user);
        console.log(`🤖 AI Context generated for ${req.user.username} (${req.user.role})`);

        // DETEKTIRAJ PROVIDERA
        const isOpenAI = provider === 'openai' || apiKey.startsWith('sk-');
        const isPerplexity = provider === 'perplexity' || apiKey.startsWith('pplx-');

        if (isOpenAI || isPerplexity) {
            // --- OPENAI & PERPLEXITY (Compatible API) ---
            let apiUrl = "https://api.openai.com/v1/chat/completions";
            let defaultModel = "gpt-4o-mini";

            if (isPerplexity) {
                apiUrl = "https://api.perplexity.ai/chat/completions";
                defaultModel = "sonar";
            }

            const targetModel = model && !model.includes('gemini') ? model : defaultModel;
            const finalContext = context.trim().length > 0 ? context : "System context is currently unavailable.";

            console.log(`🤖 AI Request (${isPerplexity ? 'Perplexity' : 'OpenAI'}) -> Model: ${targetModel}`);

            const response = await axios.post(apiUrl, {
                model: targetModel,
                messages: [
                    { role: "system", content: finalContext },
                    { role: "user", content: message }
                ],
                temperature: 0.2
            }, {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                }
            });

            const generatedText = response.data?.choices?.[0]?.message?.content;
            if (!generatedText) throw new Error(`No content generated from ${isPerplexity ? 'Perplexity' : 'OpenAI'}`);

            res.json({ text: generatedText });

        } else {
            // --- GOOGLE GEMINI LOGIKA ---
            const targetModel = model && model.includes('gemini') ? model : "gemini-1.5-flash";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
            const finalContext = context.trim().length > 0 ? context : "System context unavailable.";

            console.log(`🤖 AI Request (Gemini) -> Model: ${targetModel}`);

            const contents = [
                {
                    role: "user",
                    parts: [{ text: finalContext + "\n\nUSER QUESTION: " + message }]
                }
            ];

            const response = await axios.post(apiUrl, { contents }, {
                headers: { "Content-Type": "application/json" }
            });

            const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!generatedText) throw new Error("No content generated from Gemini");

            res.json({ text: generatedText });
        }

    } catch (error) {
        console.error("❌ AI Error:", error.response?.data || error.message);
        const status = error.response?.status || 500;
        const errorData = error.response?.data;

        // Izvadi čitljivu poruku ovisno o provideru
        let errMsg = error.message;
        if (errorData?.error?.message) errMsg = errorData.error.message; // Google & OpenAI standard
        if (errorData?.error?.type) errMsg = `${errorData.error.type}: ${errMsg}`;

        res.status(status).json({ error: `AI Error: ${errMsg}` });
    }
});

// test

// Resetiraj sve blokade (samo za development)
app.post("/api/security/reset-blocks", authenticateToken, checkPermission('security.debug'), (req, res) => {
    db.run("DELETE FROM blocked_ips", (err) => {
        if (err) console.error(err);
    });
    db.run("DELETE FROM user_lockouts", (err) => {
        if (err) console.error(err);
    });
    db.run("DELETE FROM failed_logins", (err) => {
        if (err) console.error(err);
    });

    console.log("🔄 Svi blokovi resetovani za testiranje");
    res.json({ message: "Svi sigurnosni blokovi resetovani!" });
});

// Prikaži trenutne failed logine
app.get("/api/security/debug-failed-logins", authenticateToken, checkPermission('security.debug'), (req, res) => {
    db.all("SELECT * FROM failed_logins ORDER BY attempted_at DESC", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Prikaži trenutne blokade
app.get("/api/security/debug-blocks", authenticateToken, checkPermission('security.debug'), (req, res) => {
    db.all(`
        SELECT 'ip' as type, ip_address as identifier, blocked_until, reason FROM blocked_ips
        UNION ALL
        SELECT 'user' as type, username as identifier, locked_until as blocked_until, reason FROM user_lockouts
        ORDER BY blocked_until DESC
    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 22.11.2025.
// MIJENJAM ANALIZA POTROŠNJE GORIVA U PROFITABILNOST PO GORIVIMA
app.get("/api/fuel-profitability", authenticateToken, checkPermission('fuel-profitability.read'), (req, res) => {
    db.all(`
        SELECT
            fuel_type,
            SUM(sold_quantity) as total_sold,
            SUM(revenue) as total_revenue,
            AVG(revenue / sold_quantity) as revenue_per_ton
        FROM reports
        WHERE sold_quantity > 0 AND revenue > 0
        GROUP BY fuel_type
        ORDER BY total_revenue DESC
    `, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        res.json(rows);
    });
});

// 4.12.2025.

// RUTA ZA DOHVAĆANJE ZADNJEG LOGINA
app.get("/api/security/last-login", authenticateToken, (req, res) => {
    try {
        db.get(
            `SELECT timestamp 
             FROM security_logs 
             WHERE username = ? AND action_type = 'login_success' 
             ORDER BY timestamp DESC LIMIT 1`,
            [req.user.username],
            (err, row) => {
                if (err) {
                    console.error("Greška pri dohvaćanju posljednje prijave:", err);
                    return res.status(500).json({ error: "Database error" });
                }

                res.json({ lastLogin: row?.timestamp || null });
            }
        );
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
});

// AŽURIRANA RUTA ZA DOHVAĆANJE ZADATAKA
// AŽURIRANA RUTA ZA DOHVAĆANJE ZADATAKA
app.get("/api/tasks/my-tasks", authenticateToken, checkPermission('tasks.read'), (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { include_completed } = req.query;

    console.log(`📋 Fetching tasks for user ${req.user.username} (ID: ${userId}, Role: ${userRole})`);

    // Dynamic status filter
    const statusFilter = include_completed === 'true'
        ? "t.status IN ('pending', 'in_progress', 'completed')"
        : "t.status IN ('pending', 'in_progress')";

    db.all(
        `SELECT t.*,
                u.username as assigned_to_name,
                u2.username as assigned_by_name
         FROM daily_tasks t
                  LEFT JOIN users u ON t.assigned_to_user_id = u.id
                  LEFT JOIN users u2 ON t.assigned_by_user_id = u2.id
         WHERE ${statusFilter}
           AND (
             ? = 'admin'
                 OR t.assigned_to_user_id = ?
                 OR t.assigned_to_role = ?
                 OR t.is_public = 1
                 OR (t.assigned_to_user_id IS NULL AND t.assigned_to_role IS NULL)
                 OR t.assigned_by_user_id = ?
             )
         ORDER BY
             CASE t.priority
                 WHEN 'critical' THEN 1
                 WHEN 'high' THEN 2
                 WHEN 'medium' THEN 3
                 WHEN 'low' THEN 4
                 END,
             t.due_date ASC`,
        [userRole, userId, userRole, userId],
        (err, rows) => {
            if (err) {
                console.error("Greška pri dohvaćanju zadataka:", err);
                return res.status(500).json({ error: "Database error" });
            }

            console.log(`Vraćeno ${rows.length} zadataka za korisnika ${req.user.username}`);

            res.json(rows);
        }
    );
});

// DEBUG RUTA - provjeri zadatke
app.get("/api/debug/tasks", authenticateToken, (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    const query = `
        SELECT
            id,
            title,
            assigned_to_user_id,
            assigned_to_role,
            assigned_by_user_id,
            CASE
                WHEN assigned_to_user_id IS NULL AND assigned_to_role IS NULL THEN 'PUBLIC'
                WHEN assigned_to_user_id IS NOT NULL THEN 'USER'
                WHEN assigned_to_role IS NOT NULL THEN 'ROLE'
                END as assignment_type
        FROM daily_tasks
        WHERE status IN ('pending', 'in_progress')
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json({
            userId,
            userRole,
            allTasks: rows,
            publicTasks: rows.filter(t => !t.assigned_to_user_id && !t.assigned_to_role),
            myTasks: rows.filter(t =>
                t.assigned_to_user_id === userId ||
                t.assigned_to_role === userRole ||
                (!t.assigned_to_user_id && !t.assigned_to_role)
            )
        });
    });
});

app.post("/api/tasks", authenticateToken, checkPermission('tasks.create'), (req, res) => {
    try {
        const {
            title,
            description,
            assigned_to_user_id,
            assigned_to_role,
            priority,
            due_date,
            category
        } = req.body;

        console.log(`\n📝 ===== CREATING NEW TASK =====`);
        console.log(`👤 Created by: ${req.user.username} (ID: ${req.user.id}, Role: ${req.user.role})`);
        console.log(`📋 Task data:`, req.body);

        // Konverzija i validacija
        let assignedUserId = assigned_to_user_id ? parseInt(assigned_to_user_id) : null;
        let assignedRole = assigned_to_role || null;

        // Kreiranje zadatka u bazi
        db.run(
            `INSERT INTO daily_tasks
             (title, description, assigned_to_user_id, assigned_to_role,
              assigned_by_user_id, priority, due_date, category, status, created_at, is_public)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, ?)`,
            [
                title,
                description,
                assignedUserId,
                assignedRole,
                req.user.id,
                priority || 'medium',
                due_date || null,
                category || 'general',
                (!assignedUserId && !assignedRole) ? 1 : 0 // is_public
            ],
            function (err) {
                if (err) {
                    console.error("Greška pri kreiranju zadatka:", err);
                    return res.status(500).json({ error: "Database error" });
                }

                const taskId = this.lastID;
                console.log(`✅ Task created with ID: ${taskId}`);

                // Dohvati podatke o adminu (kreatoru)
                db.get(
                    "SELECT ime, prezime, profile_image FROM users WHERE id = ?",
                    [req.user.id],
                    (err, adminUser) => {
                        const assignedByName = adminUser ?
                            `${adminUser.ime} ${adminUser.prezime}` : 'Administrator';

                        const creatorImage = adminUser ? adminUser.profile_image : null;

                        // POŠALJI NOTIFIKACIJU PREKO WEBSOCKETA
                        const notificationData = {
                            taskId: taskId,
                            title: title,
                            description: description,
                            assigned_to_user_id: assignedUserId,
                            assigned_to_role: assignedRole,
                            assignedByName: assignedByName,
                            createdBy: req.user.username,
                            createdByImage: creatorImage, // Dodana slika kreatora
                            createdBySocketId: req.headers['socket-id'],
                            createdAt: new Date()
                        };

                        console.log('🔔 Emitting task_created event:', notificationData);

                        // CILJANO SLANJE NOTIFIKACIJA
                        if (assignedUserId) {
                            // Ako je dodijeljeno korisniku, šalji njemu i adminima
                            console.log(`📡 Sending to specific user: user_${assignedUserId}`);
                            io.to(`user_${assignedUserId}`).emit("task_created", notificationData);
                            // Opcionalno: poslati i adminima da znaju
                            io.to('admin').emit("task_created", notificationData);
                        } else if (assignedRole) {
                            // Ako je dodijeljeno roli, šalji toj roli i adminima
                            console.log(`📡 Sending to role: role_${assignedRole}`);
                            io.to(`role_${assignedRole}`).emit("task_created", notificationData);
                            io.to('admin').emit("task_created", notificationData);
                        } else {
                            // Ako je javno, šalji svima (public soba ili broadcast)
                            console.log(`📡 Sending to ALL (Public task)`);
                            io.emit("task_created", notificationData);
                        }

                        res.json({
                            id: taskId,
                            success: true,
                            message: "Zadatak uspješno kreiran!",
                            assignedByName: assignedByName,
                            notificationSent: true
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error("Greška u /api/tasks:", error);
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

// Ažuriraj zadatak
app.put("/api/tasks/:id", authenticateToken, checkPermission('tasks.update'), (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            assigned_to_user_id,
            assigned_to_role,
            priority,
            due_date,
            category
        } = req.body;

        // Validacija
        if (!title || !description) {
            return res.status(400).json({ error: "Naslov i opis su obavezni!" });
        }

        // Parsiranje assigned_to_user_id
        let assignedUserId = assigned_to_user_id ? parseInt(assigned_to_user_id) : null;
        let assignedRole = assigned_to_role || null;

        const query = `
            UPDATE daily_tasks
            SET title = ?, description = ?, assigned_to_user_id = ?, assigned_to_role = ?,
                priority = ?, due_date = ?, category = ?
            WHERE id = ?
        `;

        const params = [
            title,
            description,
            assignedUserId,
            assignedRole,
            priority || 'medium',
            due_date || null,
            category || 'general',
            id
        ];

        db.run(query, params, function (err) {
            if (err) {
                console.error("Greška pri ažuriranju zadatka:", err);
                return res.status(500).json({ error: "Database error" });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: "Zadatak nije pronađen" });
            }
            res.json({ success: true, message: "Zadatak uspješno ažuriran" });
        });

    } catch (error) {
        console.error("Greška u PUT /api/tasks/:id:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Označi zadatak kao završen
app.put("/api/tasks/:id/complete", authenticateToken, checkPermission('tasks.update'), (req, res) => {
    try {
        const taskId = req.params.id;

        db.run(
            `UPDATE daily_tasks
             SET status = 'completed', completed_at = CURRENT_TIMESTAMP
             WHERE id = ? AND (assigned_to_user_id = ? OR ? = 'admin')`,
            [taskId, req.user.id, req.user.role],
            function (err) {
                if (err) {
                    console.error("Greška pri ažuriranju zadatka:", err);
                    return res.status(500).json({ error: "Database error" });
                }

                if (this.changes === 0) {
                    return res.status(403).json({ error: "Niste ovlašteni za ovu akciju" });
                }

                // Zabilježi aktivnost
                db.run(
                    `INSERT INTO task_activities (task_id, user_id, activity)
                     VALUES (?, ?, 'completed')`,
                    [taskId, req.user.id]
                );

                res.json({ success: true });
            }
        );
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
});

//  RUTA ZA DOHVAĆANJE TRENUTNOG KORISNIKA (za Dashboard)
app.get("/api/user/me", authenticateToken, (req, res) => {
    try {
        db.get(
            "SELECT id, username, ime, prezime, role, profile_image, email FROM users WHERE id = ?",
            [req.user.id],
            (err, user) => {
                if (err) {
                    console.error("Greška u bazi pri dohvaćanju korisnika:", err);
                    return res.status(500).json({ error: "Greška u bazi podataka!" });
                }

                if (!user) {
                    return res.status(404).json({ error: "Korisnik nije pronađen!" });
                }

                console.log("✅ Korisnik pronađen:", user.username, "Role:", user.role);
                res.json(user);
            }
        );
    } catch (error) {
        console.error("Greška u /api/user/me:", error.message);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: "Neispravan token!" });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Token je istekao!" });
        }

        res.status(500).json({ error: "Interna greška servera!" });
    }
});

//  RUTA ZA DOHVAĆANJE KORISNIKA ZA TASKS (Pojednostavljena verzija)
app.get("/api/tasks/users", authenticateToken, (req, res) => {
    console.log("🔐 Auth prošao, korisnik:", req.user.username);

    // Provjeri permisiju
    if (req.user.role !== 'admin') {
        const userPerms = RBAC_CONFIG.roles[req.user.role] || [];
        if (!userPerms.includes('tasks.create') &&
            !userPerms.includes('*') &&
            !userPerms.includes('tasks.*')) {
            return res.status(403).json({ error: "Nemate dozvolu za kreiranje zadataka!" });
        }
    }

    // Dohvati korisnike
    db.all(
        `SELECT id, username, ime, prezime, role, email
         FROM users
         WHERE status IS NULL OR status = 'active'
         ORDER BY role, username`,
        [],
        (err, rows) => {
            if (err) {
                console.error("Greška pri dohvaćanju korisnika:", err);
                return res.status(500).json({ error: "Database error" });
            }
            res.json(rows);
        }
    );
});

//  RUTA ZA KREIRANJE NOVOG ZADATKA
app.post("/api/tasks", authenticateToken, checkPermission('tasks.create'), (req, res) => {
    try {
        const {
            title,
            description,
            assigned_to_user_id,
            assigned_to_role,
            priority,
            due_date,
            category
        } = req.body;

        // Validacija
        if (!title || !description) {
            return res.status(400).json({ error: "Naslov i opis su obavezni!" });
        }

        db.run(
            `INSERT INTO daily_tasks
             (title, description, assigned_to_user_id, assigned_to_role,
              assigned_by_user_id, priority, due_date, category, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
            [
                title,
                description,
                assigned_to_user_id || null,
                assigned_to_role || null,
                req.user.id,
                priority || 'medium',
                due_date || null,
                category || 'general'
            ],
            function (err) {
                if (err) {
                    console.error("Greška pri kreiranju zadatka:", err);
                    return res.status(500).json({ error: "Database error" });
                }

                // Zabilježi aktivnost
                db.run(
                    `INSERT INTO task_activities (task_id, user_id, activity)
                     VALUES (?, ?, 'assigned')`,
                    [this.lastID, req.user.id],
                    (err) => {
                        if (err) console.error("Greška pri logovanju aktivnosti:", err);
                    }
                );

                res.json({
                    id: this.lastID,
                    success: true,
                    message: "Zadatak uspješno kreiran!"
                });
            }
        );
    } catch (error) {
        console.error("Greška u /api/tasks:", error);
        res.status(500).json({ error: "Server error" });
    }
});

//  RUTA ZA PRETRAGU KORISNIKA ZA DODJELU ZADATAKA
app.get("/api/users/search", authenticateToken, checkPermission('users.read'), (req, res) => {
    const { searchTerm = '' } = req.query;

    let query = `
        SELECT id, username, ime, prezime, role, email, profile_image
        FROM users
        WHERE (username LIKE ? OR ime LIKE ? OR prezime LIKE ? OR email LIKE ? OR role LIKE ?)
        ORDER BY role, username
    `;

    const searchPattern = `%${searchTerm}%`;

    db.all(query,
        [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern],
        (err, rows) => {
            if (err) {
                console.error("Greška pri pretrazi korisnika:", err);
                return res.status(500).json({ error: "Database error" });
            }
            res.json(rows);
        }
    );
});

//  RUTA ZA TASK STATISTIKE
app.get("/api/tasks/stats", authenticateToken, (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    const query = `
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN priority = 'critical' THEN 1 ELSE 0 END) as critical,
            SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high
        FROM daily_tasks
        WHERE (
            assigned_to_user_id = ?
                OR assigned_to_role = ?
                OR (assigned_to_user_id IS NULL AND assigned_to_role IS NULL)
                OR ? = 'admin'
                OR assigned_by_user_id = ?
            )
          AND status IN ('pending', 'in_progress')
    `;

    db.get(query, [userId, userRole, userRole, userId], (err, row) => {
        if (err) {
            console.error("Greška pri dohvaćanju statistike:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(row);
    });
});

// RUTA ZA DOHVAĆANJE JAVNIH ZADATAKA (za sve)
app.get("/api/tasks/public", authenticateToken, (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`🌍 Fetching PUBLIC tasks for user ${req.user.username}`);

    db.all(
        `SELECT t.*,
                u.username as assigned_to_name,
                u2.username as assigned_by_name
         FROM daily_tasks t
                  LEFT JOIN users u ON t.assigned_to_user_id = u.id
                  LEFT JOIN users u2 ON t.assigned_by_user_id = u2.id
         WHERE t.status IN ('pending', 'in_progress')
           AND (
             t.is_public = 1
                 OR (t.assigned_to_user_id IS NULL AND t.assigned_to_role IS NULL)
             )
         ORDER BY
             CASE t.priority
                 WHEN 'critical' THEN 1
                 WHEN 'high' THEN 2
                 WHEN 'medium' THEN 3
                 WHEN 'low' THEN 4
                 END,
             t.due_date ASC`,
        [],
        (err, rows) => {
            if (err) {
                console.error("Greška pri dohvaćanju javnih zadataka:", err);
                return res.status(500).json({ error: "Database error" });
            }

            console.log(`📊 Vraćeno ${rows.length} JAVNIH zadataka`);
            res.json(rows);
        }
    );
});

// U backend/server.js dodajte:
app.get("/api/tasks/all", authenticateToken, (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    const query = `
        SELECT t.*,
                u.username as assigned_to_name,
                u2.username as assigned_by_name
         FROM daily_tasks t
                  LEFT JOIN users u ON t.assigned_to_user_id = u.id
                  LEFT JOIN users u2 ON t.assigned_by_user_id = u2.id
         ORDER BY t.created_at DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Greška pri dohvaćanju svih zadataka:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(rows);
    });
});

// ----------------------------------------------------
// UI THEME AND CONFIGURATION ENDPOINTS
// ----------------------------------------------------

// Dohvati sve teme
app.get("/api/ui/themes", authenticateToken, (req, res) => {
    db.all("SELECT * FROM role_themes", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Dohvati temu za specifičnu ulogu
app.get("/api/ui/themes/:role", authenticateToken, (req, res) => {
    const { role } = req.params;
    db.get("SELECT * FROM role_themes WHERE role = ?", [role], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Vrati default ako nema
        if (!row) {
            return res.json({
                role,
                primary_color: '#1976d2',
                secondary_color: '#42a5f5',
                background_color: '#f4f6f8',
                card_style: 'glass'
            });
        }
        res.json(row);
    });
});

// Ažuriraj temu za ulogu (Samo Admin)
app.put("/api/ui/themes/:role", authenticateToken, checkAdmin, (req, res) => {
    const { role } = req.params;
    const { primary_color, secondary_color, background_color, font_family, card_style } = req.body;

    const query = `
        INSERT INTO role_themes (role, primary_color, secondary_color, background_color, font_family, card_style)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(role) DO UPDATE SET
            primary_color = excluded.primary_color,
            secondary_color = excluded.secondary_color,
            background_color = excluded.background_color,
            font_family = excluded.font_family,
            card_style = excluded.card_style
    `;

    db.run(query, [role, primary_color, secondary_color, background_color, font_family, card_style], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Obavijesti sve klijente o promjeni teme putem socketa
        io.to(`role_${role}`).emit('theme_updated', {
            role, primary_color, secondary_color, background_color, card_style
        });

        res.json({ message: "Tema uspješno ažurirana!" });
    });
});

//  Pokretanje servera sa WebSockets podrškom
server.listen(PORT, () => {
    console.log(`🚀 Server pokrenut na http://localhost:${PORT}`);
});