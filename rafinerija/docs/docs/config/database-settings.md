---
id: database-security
title: Konfiguracija baze podataka
slug: /database-security
---

Konfiguracija baze podataka je ključna za stabilan rad aplikacije. U ovom dijelu opisujemo kako se postavlja i koristi SQLite baza podataka u serveru.

###  Postavke baze podataka

Za rad sa bazom podataka koristi se `sqlite3` biblioteka koja omogućava jednostavno povezivanje i manipulaciju podacima u SQLite bazi.

```bash
   npm install sqlite3
```

```js
const sqlite3 = require('sqlite3').verbose();

// Kreiranje baze podataka (ako ne postoji)
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error("Greška prilikom povezivanja sa bazom:", err.message);
        return;
    }
    console.log('Povezano sa SQLite bazom podataka.');
});
```

###  Kreiranje tabela

Za pohranu podataka kreiramo nekoliko osnovnih tabela u bazi. U ovom primjeru kreiramo tabelu `users` za pohranu informacija o korisnicima.

```js
const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

db.run(createUsersTable, (err) => {
    if (err) {
        console.error("Greška prilikom kreiranja tabele:", err.message);
        return;
    }
    console.log("Tabela 'users' je uspješno kreirana.");
});
