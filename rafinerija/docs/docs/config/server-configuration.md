---
id: server-configuration
title: Konfiguracija servera
slug: /server-security
---

Glavna serverska logika nalazi se u fajlu `server.js`. Ovdje se postavlja Express server, rukuje HTTP i WebSocket komunikacijom, uploadom slika i REST API endpointima.

###  Osnovne biblioteke

- `express` – za backend server
- `sqlite3` – rad sa bazom podataka
- `cors`, `body-parser` – middlewares za obradu zahtjeva
- `bcryptjs`, `jsonwebtoken` – za sigurnost (hashiranje lozinki i JWT)
- `socket.io` – real-time notifikacije
- `multer` – za upload slika



###  Pokretanje servera

```js
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

server.listen(PORT, () => {
    console.log(`Server pokrenut na portu ${PORT}`);
});
```


###  WebSocket komunikacija

Server koristi `socket.io` za slanje notifikacija korisnicima u realnom vremenu.

```js
io.on("connection", (socket) => {
    console.log("✅ Klijent povezan:", socket.id);

    // Slanje upozorenja na male zalihe svakih 10 sekundi
    setInterval(() => {
        db.all("SELECT * FROM inventory WHERE quantity < 1000", [], (err, rows) => {
            if (!err && rows.length > 0) {
                io.emit("updateNotifications", rows);
            }
        });
    }, 10000);

    socket.on("disconnect", () => {
        console.log("❌ Klijent odspojen:", socket.id);
    });
});
```

###  Upload slika

Za upload slika koristi se `multer` koji omogućava spremanje slika u specifičnu mapu na serveru.

```js
// Postavke za upload slika koristeći multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Spremamo slike u direktorij 'uploads'
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Jedinstveno ime
    },
});

// Filter za provjeru da li je fajl slika
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // Ako je slika, dopuštamo upload
    } else {
        cb(new Error('Samo slike su dozvoljene!'), false); // Ako nije slika, odbijamo
    }
};

// Konfiguracija za upload
const upload = multer({ storage, fileFilter });

// Endpoint za upload profilnih slika
app.post('/upload-profile-image', upload.single('profileImage'), (req, res) => {
    console.log('Uploadovana slika:', req.file);

    if (!req.file) {
        return res.status(400).json({ error: 'Nema fajla za upload!' });
    }

    const imagePath = `/uploads/${req.file.filename}`;
    res.json({ imagePath });
});
```

### ️ Okruženje

Za konfiguraciju okruženja koristi se `.env` fajl za pohranu osjetljivih podataka kao što su API ključevi, tajni ključ, port i drugi parametri.

1. **Instalacija**:

Prvo instaliraj potrebne pakete:

```bash
npm install dotenv express cors body-parser sqlite3 bcryptjs jsonwebtoken multer socket.io
```

2. **.env fajl:**

Kreirajte .env fajl u root direktoriju sa sljedećim sadržajem:

```env
SECRET_KEY=tajni-kljuc
PORT=5000
```

3. **Učitavanje varijabli iz .env fajla:**:

```js
// Učitavanje varijabli iz .env fajla
require("dotenv").config();

// Tajni ključ za JWT autentifikaciju
const SECRET_KEY = process.env.SECRET_KEY || "123";

// Port za server
const PORT = process.env.PORT || 5000;

```
Da bi se osigurala efikasna i sigurna konfiguracija servera, potrebno je redovno pratiti i ažurirati zavisnosti i environment postavke, kao i implementirati najbolje prakse za sigurnost, kao što su enkripcija podataka i zaštita API endpointa, kako bi se spriječili potencijalni napadi.

