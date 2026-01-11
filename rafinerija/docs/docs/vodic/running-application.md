---
id: running-application
title: Pokretanje Aplikacije
sidebar_label: Pokretanje Aplikacije
slug: running-application
---

# Pokretanje Aplikacije

### Frontend (Development)
Za pokretanje frontend dijela aplikacije u development okruženju potrebno je da u terminalu uđete u folder `rafinerija` i pokrenete aplikaciju koristeći sljedeću komandu:

```bash
npm run dev
```

Ova komanda pokreće frontend aplikaciju u development okruženju.

### Backend (Development)
Za pokretanje backend dijela aplikacije u development okruženju potrebno je da u terminalu uđete u folder `backend` i pokrenete aplikaciju koristeći sljedeću komandu:

```bash
node server.js
```

Ova komanda pokreće backend server aplikacije.

:::tip Savjet
Za lakše upravljanje, koristite dva odvojena terminal prozora - jedan za frontend, drugi za backend.
:::


### Frontend (Produkcija)
Za produkcijsko pokretanje frontend aplikacije, prvo je potrebno izgraditi aplikaciju koristeći sljedeću komandu:

```bash
npm run build
```

Ova komanda generira produkcijsku verziju aplikacije unutar `rafinerija/dist` direktorija. Zatim možete pokrenuti frontend server koristeći bilo koji HTTP server, kao što je `serve`:

```bash
npm install -g serve
serve -s dist
```

### Backend (Produkcija)
Za produkcijsko pokretanje backend servera, potrebno je koristiti sljedeće komande:

```bash
cd backend
node server.js
```

Ako želite pokrenuti backend aplikaciju kao produkciju, preporučuje se korištenje alata kao što je `pm2` za upravljanje serverom:

```bash
npm install pm2 -g
pm2 start server.js
```

Ova komanda pokreće backend aplikaciju u produkcijskom okruženju koristeći `pm2`.

