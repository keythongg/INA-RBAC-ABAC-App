---
id: database
title: Baza podataka
slug: database
---
## Pregled
Baza podataka je izgrađena korištenjem SQLite-a i sadrži tabele za praćenje proizvodnje goriva, inventara, izvještaja i upravljanje korisnicima. Ova dokumentacija pruža detalje o svakoj tabeli, njenoj strukturi i odnosima.

## Tabele

### fuel_production
Prati mjesečnu proizvodnju goriva i podatke o potrošnji.

| Kolona | Tip | Opis |
|--------|-----|------|
| id | INTEGER | Primarni ključ, automatski se inkrementira |
| month | TEXT | Mjesec proizvodnje (npr. "Januar") |
| year | INTEGER | Godina proizvodnje |
| production_tons | INTEGER | Količina proizvodnje u tonama |
| fuel_type | TEXT | Tip goriva (npr. "Dizel", "Benzin") |
| refinery | TEXT | Lokacija rafinerije |
| consumption_liters | INTEGER | Količina potrošnje u litrima |

### inventory
Upravlja trenutnim stavkama u inventaru.

| Kolona | Tip | Opis |
|--------|-----|------|
| id | INTEGER | Primarni ključ, automatski se inkrementira |
| type | TEXT | Tip stavke inventara |
| quantity | INTEGER | Dostupna količina |
| status | TEXT | Trenutni status (npr. "Na skladištu", "Nisko") |
| price | TEXT | Cijena stavke (pohranjeno kao TEXT) |

### reports
Pohranjuje generirane izvještaje sistema.

| Kolona | Tip | Opis |
|--------|-----|------|
| id | INT | Primarni ključ, automatski se inkrementira |
| timestamp | DATETIME | Vrijeme generiranja izvještaja (podrazumijevano: trenutni vremenski pečat) |
| totalProduction | INT | Ukupna količina proizvodnje |
| totalIncome | DECIMAL(10,2) | Ukupna vrijednost prihoda |
| totalConsumption | INT | Ukupna količina potrošnje |

### users
Tabela za upravljanje korisnicima i pristup sistema.

| Kolona | Tip | Opis |
|--------|-----|------|
| id | INTEGER | Primarni ključ, automatski se inkrementira |
| ime | TEXT | Ime korisnika |
| prezime | TEXT | Prezime korisnika |
| username | TEXT | Jedinstveno korisničko ime |
| password | TEXT | Hashirana lozinka |
| role | TEXT | Uloga korisnika (podrazumijevano: 'user') |
| profile_image | TEXT | Putanja do profilne slike |
| email | TEXT | Email adresa korisnika |

## Specifične napomene za SQLite
- Baza podataka koristi AUTOINCREMENT funkciju SQLite-a za primarne ključeve
- Tabela `sqlite_sequence` automatski se održava od strane SQLite-a za praćenje brojača sekvenci
- Sve string vrijednosti se pohranjuju kao TEXT bez obzira na dužinu
- Nema eksplicitno definiranih stranih ključeva u shemi

## Primjeri upita

```sql
-- Dobijanje mjesečnog pregleda proizvodnje
SELECT month, year, SUM(production_tons) as total_production
FROM fuel_production
GROUP BY month, year
ORDER BY year, month;

-- Provjera stavki sa niskim stanjem u inventaru
SELECT type, quantity, status 
FROM inventory
WHERE status = 'Low';

-- Lista korisnika sa ulogama
SELECT username, email, role
FROM users
ORDER BY role;
