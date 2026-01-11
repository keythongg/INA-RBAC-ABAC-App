---
id: working-with-db
title: Rad s Bazom Podataka
sidebar_label: Rad s Bazom Podataka
slug: working-with-db
---

# Rad s Bazom Podataka

## Pregled

U ovom dijelu dokumentacije objašnjeno je kako raditi s bazom podataka koja koristi **SQLite**. Fokus je na osnovnim SQL operacijama, ali i na korištenju alata **DB Browser for SQLite** koji omogućava jednostavno upravljanje bazom kroz grafički interfejs.

## Korištenje DB Browser for SQLite

**DB Browser for SQLite** je besplatan alat koji omogućava vizuelno upravljanje SQLite bazama. Možete ga koristiti za:

- Kreiranje i otvaranje `.sqlite` baza
- Pregledavanje, dodavanje, ažuriranje i brisanje podataka
- Izvršavanje SQL upita
- Pregled strukture tabela
- Uvoz i izvoz podataka

### Koraci za rad:

1. **Pokrenite DB Browser for SQLite**
2. Otvorite vašu bazu podataka putem opcije `File > Open Database`
3. Nakon otvaranja baze, možete preći na tab `Browse Data` da pregledate podatke ili na `Execute SQL` da pišete upite

<img src="/../img/dbsqlite.png" class="doc-image" alt="DB Browser" />

### Dodavanje novog podatka

Kliknite na `Browse Data`, odaberite tabelu (npr. `fuel_production`), pa kliknite na `New Record` za dodavanje novog reda. Polja popunite prema strukturi tabele.

### Uređivanje postojećih podataka

U tabu `Browse Data` možete direktno izmijeniti vrijednosti ćelija dvostrukim klikom, a zatim klikom na `Write Changes` sačuvati izmjene.

### Izvršavanje SQL upita

U tabu `Execute SQL` možete napisati upite poput:

```sql
SELECT * FROM fuel_production WHERE year = 2023;
```

Klikom na `Execute All` izvršavate upit i vidite rezultate u donjem dijelu.

:::tip Savjet
- Koristite Write Changes dugme nakon svake promjene u DB Browser-u kako biste sačuvali izmjene.
- Prije rada s bazom napravite kopiju (backup) baze kako biste izbjegli gubitak podataka.
:::
