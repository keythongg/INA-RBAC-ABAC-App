---
id: project-structure
title: Struktura Projekta
sidebar_label: Struktura Projekta
slug: project-structure
---

# Struktura Projekta

Ovaj projekt se sastoji od dva glavna foldera: **backend** i **rafinerija**. Svaki folder sadrži specifične datoteke i poddirektorije koji služe za različite dijelove aplikacije, kao što su backend server, frontend, konfiguracija, i resursi.

## Backend Folder

Folder `backend` sadrži sve potrebne datoteke za pokretanje backend dijela aplikacije. Struktura foldera je sljedeća:

```bash
backend/
│
├── node_modules/         # Svi instalirani paketi i zavisnosti za backend
├── server.js             # Glavna datoteka za pokretanje servera
├── database.js           # Konfiguracija baze podataka
├── inventory.db          # Baza podataka (SQLite)
├── package.json          # Konfiguracija backend paketa i zavisnosti
└── package-lock.json     # Verzije zavisnosti backend aplikacije
```

### Objašnjenje:

- **node_modules/**: Sadrži sve zavisnosti potrebne za backend aplikaciju.
- **server.js**: Glavna datoteka koja pokreće backend server.
- **database.js**: Sadrži konfiguraciju za povezivanje s bazom podataka.
- **inventory.db**: SQLite baza podataka koja se koristi za pohranu podataka.
- **package.json**: Sadrži metapodatke o backend aplikaciji i popis zavisnosti.
- **package-lock.json**: Ovaj fajl zaključava verzije zavisnosti kako bi se osigurala dosljednost prilikom instalacije paketa.

## Rafinerija Folder

Folder `rafinerija` sadrži frontend aplikaciju koja se pokreće pomoću React-a i Vite-a. Struktura foldera je sljedeća:

```bash
rafinerija/
│
├── public/               # Public direktorij za statičke datoteke
├── docs/                 # Dokumentacija projekta
├── node_modules/         # Svi instalirani paketi i zavisnosti za frontend
│
├── src/                  # Izvorna koda za frontend
│   ├── assets/           # Statističke datoteke (slike, fontovi, ikone)
│   ├── layouts/          # Layout komponente koje se koriste u različitim stranicama
│   ├── pages/            # Stranice aplikacije
│   ├── routes/           # Definicije ruta za navigaciju
│   ├── services/         # API servisi i logika za komunikaciju s backendom
│   ├── theme/            # Tematske postavke, stilovi i globalna konfiguracija
│   ├── components/       # Reusable komponente koje se koriste na različitim stranicama
│   ├── App.css           # Glavni CSS stilovi za aplikaciju
│   ├── App.jsx           # Glavna React komponenta aplikacije
│   ├── index.css         # Globalni CSS za aplikaciju
│   ├── main.jsx          # Ulazna točka aplikacije koja se povezuje s HTML-om
│
└── package.json          # Konfiguracija frontend paketa i zavisnosti
└── vite.config.js        # Konfiguracija za Vite build alat
```

### Objašnjenje:

- **public/**: Sadrži sve statičke resurse koji će biti posluženi korisnicima (kao što su slike, favicon, itd.).
- **docs/**: Sadrži dokumentaciju projekta.
- **node_modules/**: Sadrži sve zavisnosti za frontend aplikaciju.
- **src/**: Glavni direktorij za izvorni kod aplikacije.
    - **assets/**: Statističke datoteke (slike, fontovi, ikone).
    - **layouts/**: Komponente koje se koriste kao osnovne komponente za više stranica.
    - **pages/**: Stranice aplikacije.
    - **routes/**: Definicije ruta koje omogućavaju navigaciju između stranica.
    - **services/**: Komponente koje omogućavaju komunikaciju s backendom (API servisi).
    - **theme/**: Tematske postavke, stilovi i globalna konfiguracija.
    - **components/**: Reusable komponente koje se mogu koristiti na više stranica.
    - **App.css**: Glavni CSS stil za aplikaciju.
    - **App.jsx**: Glavna React komponenta koja učitava aplikaciju.
    - **index.css**: Globalni CSS koji se primjenjuje na cijelu aplikaciju.
    - **main.jsx**: Ulazna točka aplikacije koja povezuje React aplikaciju s HTML-om.
- **package.json**: Sadrži metapodatke o frontend aplikaciji, zavisnostima i konfiguraciji build sistema.
- **vite.config.js**: Konfiguracija za Vite build alat koji se koristi za razvoj i build aplikacije.

### Dodatne Napomene
- **Frontend (rafinerija)** koristi **React** kao framework, dok backend koristi **Node.js** za server-side aplikaciju.
- Oba dijela aplikacije (frontend i backend) imaju odvojene konfiguracije za zavisnosti (`package.json` za svaki) i koriste različite tehnologije za razvoj.

