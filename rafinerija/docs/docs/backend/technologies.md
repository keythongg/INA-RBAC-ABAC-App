# Tehnologije i biblioteke

Za backend aplikacije korištene su sledeće tehnologije:

### Node.js

- Node.js je JavaScript runtime koji omogućava pokretanje JavaScript koda na serveru. Aplikacija je razvijena koristeći Node.js, što omogućava visok performans i asinkrono upravljanje I/O operacijama.

### Express.js

- Express.js je web framework za Node.js, koji pojednostavljuje kreiranje web servera i API-ja. Koristi se za rukovanje HTTP zahtjevima (GET, POST, PUT, DELETE) i omogućava brzu izgradnju RESTful API-ja.

### SQLite

- SQLite je serverless, samostalna SQL baza podataka koja se koristi za pohranu podataka u aplikaciji. U ovom projektu, SQLite baza koristi se za pohranu podataka o korisnicima, zalihama goriva i drugim poslovnim podacima.

### Multer

- Multer je middleware za upravljanje `multipart/form-data`, koji se koristi za upload datoteka. U ovom projektu se koristi za omogućavanje upload-a profilnih slika u aplikaciju.

### Socket.IO

- Socket.IO je biblioteka za real-time, dvosmjernu komunikaciju između klijenta i servera. U ovom projektu koristi se za slanje real-time obavijesti (npr. za obavještavanje korisnika o niskim količinama goriva) putem WebSocket-a.

### JSON Web Token (JWT)

- JWT se koristi za autentifikaciju i autorizaciju korisnika. JWT token se generira prilikom prijave korisnika i koristi se za autentifikaciju zahtjeva prema zaštićenim rutama aplikacije.

### Bcrypt.js

- Bcrypt.js je biblioteka za sigurnu enkripciju lozinki. Koristi se za hashiranje lozinki prilikom registracije korisnika, čime se poboljšava sigurnost aplikacije.

### CORS (Cross-Origin Resource Sharing)

- CORS omogućava pristup resursima s različitih domena. Ovdje se koristi za omogućavanje pristupa frontend aplikaciji (koja se može nalaziti na različitim domenama ili portovima) backend serveru.

## Server i struktura aplikacije

Aplikacija koristi **Express.js** za postavljanje HTTP servera, a koristi **Socket.IO** za postavljanje real-time komunikacije. Backend je dizajniran da omogući različite funkcionalnosti, uključujući autentifikaciju korisnika putem JWT-a, upload slika, rad s bazom podataka (SQLite), i obavještavanje korisnika o važnim podacima kroz WebSocket.
