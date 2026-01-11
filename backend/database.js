const sqlite3 = require("sqlite3").verbose();

// Kreiramo bazu podataka (ako ne postoji)
const db = new sqlite3.Database("./inventory.db", (err) => {
    if (err) {
        console.error("Greška prilikom povezivanja sa bazom:", err);
    } else {
        console.log("Povezan sa SQLite bazom!");
    }
});



// Kreiramo tabele ako ne postoje
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS inventory (
                                                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                 type TEXT NOT NULL,
                                                 quantity INTEGER NOT NULL,
                                                 status TEXT NOT NULL,
                                                 price TEXT NOT NULL
        )`);

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
                                             id INTEGER PRIMARY KEY AUTOINCREMENT,
                                             username TEXT UNIQUE NOT NULL,
                                             password TEXT NOT NULL,
                                             email TEXT,  -- Dodajte stupac email
                                             role TEXT DEFAULT 'user'
        )`);

    // Kreiranje tabele za fuel_production
    db.run(`
        CREATE TABLE IF NOT EXISTS fuel_production (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month TEXT NOT NULL,
            production_tons INTEGER NOT NULL,
            fuel_type TEXT NOT NULL,
            refinery TEXT NOT NULL
        )`,
        (err) => {
            if (err) {
                console.error("Error creating table:", err.message);
            } else {
                console.log("Table 'fuel_production' is ready.");
            }
        }
    );

    // Kreiranje tabele za teme uloga
    db.run(`
        CREATE TABLE IF NOT EXISTS role_themes (
            role TEXT PRIMARY KEY,
            primary_color TEXT,
            secondary_color TEXT,
            background_color TEXT,
            font_family TEXT,
            card_style TEXT DEFAULT 'glass' -- 'glass', 'solid', 'minimal'
        )`,
        (err) => {
            if (err) {
                console.error("Error creating table role_themes:", err.message);
            } else {
                console.log("Table 'role_themes' is ready.");

                // Insert default themes if empty
                db.get("SELECT count(*) as count FROM role_themes", (err, row) => {
                    if (row.count === 0) {
                        const defaultThemes = [
                            { role: 'admin', primary: '#1976d2', secondary: '#42a5f5' },
                            { role: 'Inženjer sigurnosti', primary: '#2e7d32', secondary: '#66bb6a' },
                            { role: 'Menadžer inventara', primary: '#ef6c00', secondary: '#ff9800' },
                            { role: 'Finansijski analitičar', primary: '#7b1fa2', secondary: '#ab47bc' },
                            { role: 'Koordinator stanica', primary: '#0288d1', secondary: '#29b6f6' }
                        ];

                        const stmt = db.prepare("INSERT INTO role_themes (role, primary_color, secondary_color, background_color, font_family, card_style) VALUES (?, ?, ?, ?, ?, ?)");
                        defaultThemes.forEach(theme => {
                            stmt.run(theme.role, theme.primary, theme.secondary, '#f4f6f8', 'Roboto', 'glass');
                        });
                        stmt.finalize();
                        console.log("Default role themes inserted.");
                    }
                });
            }
        }
    );
});


module.exports = db;