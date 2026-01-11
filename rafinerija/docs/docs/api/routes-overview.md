---
id: routes-overview
title: Dostupne rute
slug: /routes-overview
---

Ovdje je prikazan pregled svih dostupnih ruta u frontend aplikaciji, zajedno sa komponentama koje se prikazuju i informacijama o pristupu.

## Rute bez Layout-a (Login & Register)

| Ruta        | Komponenta     | Zaštićena ruta | Opis                           |
|-------------|----------------|----------------|--------------------------------|
| `/`         | LoginPage      | ❌             | Početna stranica (login)       |
| `/login`    | LoginPage      | ❌             | Stranica za prijavu            |
| `/register` | RegisterPage   | ❌             | Stranica za registraciju       |



## Rute unutar Dashboard Layout-a

Sve ove rute se nalaze unutar `DashboardLayout` komponente i većina ih je zaštićena putem `ProtectedRoute`.

| Ruta               | Komponenta       | Zaštićena ruta | Opis                                 |
|--------------------|------------------|----------------|--------------------------------------|
| `/inventory`       | InventoryPage    | ✅             | Upravljanje inventarom              |
| `/admin-dashboard` | AdminDashboard   | ✅             | Administratorski dashboard          |
| `/reports`         | Reports          | ✅             | Prikaz izvještaja                   |
| `/users`           | UsersPage        | ✅             | Upravljanje korisnicima             |
| `/world`           | WorldPage        | ✅             | Prikaz globalnih podataka (World)   |



---
:::success Napomena

-  Zaštićene rute zahtijevaju autentifikaciju i pristup im je moguć samo ako je korisnik prijavljen. One koriste `ProtectedRoute` komponentu za provjeru tokena ili stanja prijave.
- Sve ostale rute su dostupne bez prijave (npr. login).
:::


## Primjer navigacije u React aplikaciji

Primjer kako iz neke komponente prebaciti korisnika na `/inventory` stranicu pomoću `useNavigate` hook-a iz `react-router-dom`.

```jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import InventoryPage from "../pages/inventory/InventoryPage";
import ProtectedRoute from "../components/ProtectedRoute";
import LoginPage from "../pages/auth/LoginPage";

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Rute bez layouta */}
        <Route path="/login" element={<LoginPage />} />

        {/* Zaštićene rute unutar layouta */}
        <Route
          path="/*"
          element={
            <DashboardLayout>
              <Routes>
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute>
                      <InventoryPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </DashboardLayout>
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
