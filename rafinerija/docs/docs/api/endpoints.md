---
id: endpoints
title: API Endpoints
sidebar_label: API Endpoints
slug: /endpoints
---

# API Endpoints

Ovdje su navedeni dostupni API endpointi koji omogućavaju komunikaciju sa serverom putem frontend aplikacije. Svi zahtjevi koriste osnovni URL:

**Base URL:** `http://localhost:5000`

## Pregled Dostupnih Endpointa

| Endpoint               | Metoda | Opis                                          |
|------------------------|--------|-----------------------------------------------|
| `/inventory`           | GET    | Dohvata listu svih stavki iz inventara        |
| `/inventory`           | POST   | Dodaje novu stavku u inventar                 |
| `/inventory/:id`       | PUT    | Ažurira stavku iz inventara po ID-u           |
| `/inventory/:id`       | DELETE | Briše stavku iz inventara po ID-u             |
| `/login`               | POST   | Autentificira korisnika                       |
| `/register`            | POST   | Registruje novog korisnika                    |
| `/protected`           | GET    | Dohvata podatke zaštićene tokenom             |



## POST `/inventory`

Dodaje novu stavku u inventar.

**Request Body:**
```json
{
  "type": "Ulje",
  "quantity": 200,
  "status": "In Stock",
  "price": "45.00"
}
```

**Primjer korištenja:**
```javascript
fetch("http://localhost:5000/inventory", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    type: "Ulje",
    quantity: 200,
    status: "In Stock",
    price: "45.00"
  })
})
.then(response => response.json())
.then(data => console.log(data));
```



## PUT `/inventory/:id`

Ažurira postojeću stavku u inventaru po ID-u.

**Request Body:**
```json
{
  "type": "Benzin",
  "quantity": 150,
  "status": "Low",
  "price": "48.50"
}
```

**Primjer:**
```javascript
fetch("http://localhost:5000/inventory/1", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    type: "Benzin",
    quantity: 150,
    status: "Low",
    price: "48.50"
  })
})
.then(res => res.json())
.then(data => console.log(data));
```



## DELETE `/inventory/:id`

Briše stavku iz inventara po ID-u.

**Primjer:**
```javascript
fetch("http://localhost:5000/inventory/1", {
  method: "DELETE"
})
.then(() => console.log("Deleted"));
```



## POST `/login`

Autentificira korisnika.

**Request Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Primjer:**
```javascript
fetch("http://localhost:5000/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    username: "admin",
    password: "password123"
  })
})
.then(res => res.json())
.then(data => console.log(data));
```



## POST `/register`

Registruje novog korisnika.

**Request Body:**
```json
{
  "ime": "Enis",
  "prezime": "Stranjac",
  "username": "enis",
  "password": "enis",
  "email": "enis@gmail.com"
}
```

**Primjer:**
```javascript
fetch("http://localhost:5000/register", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    ime: "Enis",
    prezime: "Stranjac",
    username: "enis",
    password: "enis",
    email: "enis@gmail.com"
  })
})
.then(res => res.json())
.then(data => console.log(data));
```


## GET `/protected`

Dohvata zaštićene podatke. Potreban je JWT token.

**Primjer:**
```javascript
const token = localStorage.getItem("token");

fetch("http://localhost:5000/protected", {
  headers: {
    "Authorization": `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log(data));
```
