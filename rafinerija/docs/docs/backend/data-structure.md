---
id: data-structure
title: Struktura Podataka
sidebar_label: Struktura Podataka
slug: data-structure
---

# Struktura Podataka

## Pregled
Struktura podataka u bazi je dizajnirana za efikasno pohranjivanje, pretragu i manipulaciju podacima o proizvodnji goriva, inventaru, izvještajima i korisnicima. Svaka tabela sadrži specifične informacije koje omogućuju lakše praćenje i analizu podataka. Podaci su organizirani tako da omogućuju brzo pretraživanje, filtriranje i agregiranje potrebnih informacija.

## Povezanost između tabela
Struktura baze podataka je relacijska, gdje su podaci raspoređeni u više tabela, a veze između njih omogućuju efikasno korištenje i izvještavanje. Iako nisu eksplicitno definirani strani ključevi u ovoj verziji baze, povezivanje između podataka se postiže logičkim odnosima između tabela.

Evo kako se podaci u tabelama međusobno povezuju:

### fuel_production
Tabela `fuel_production` sadrži podatke o proizvodnji goriva na mjesečnom nivou. Kolona `month` i `year` zajedno predstavljaju jedinstven identifikator za svaki proizvodni period. Ova tabela sadrži informacije o tipu goriva (`fuel_type`), lokaciji rafinerije (`refinery`) i količini proizvedenog goriva (`production_tons`) kao i potrošnju goriva (`consumption_liters`). Ovi podaci omogućuju praćenje proizvodnje i potrošnje goriva u određenim vremenskim periodima.

### inventory
Tabela `inventory` se koristi za praćenje stavki u inventaru, kao što su različite vrste goriva ili materijali potrebni za proizvodnju. Svaka stavka u inventaru se identificira pomoću jedinstvene `id` kolone, dok `status` označava stanje stavke (npr. "Na skladištu" ili "Nisko").

### reports
Tabela `reports` sadrži generirane izvještaje na temelju podataka iz drugih tabela, poput ukupne proizvodnje, prihoda i potrošnje. Svaki izvještaj je vremenski označen s `timestamp` i omogućava korisnicima praćenje ukupnih poslovnih rezultata na dnevnoj ili mjesečnoj bazi.

### users
Tabela `users` je zadužena za upravljanje korisnicima sistema, uključujući njihove osobne podatke kao što su ime (`ime`), prezime (`prezime`), korisničko ime (`username`), email adresu (`email`), te ulogu korisnika (`role`). Svaki korisnik ima svoje jedinstveno korisničko ime, a pristup različitim dijelovima sistema zavisi od njegove uloge.

## Struktura tabele u bazi

Svaka tabela ima specifične kolone koje čine njen strukturirani skup podataka. Na primjer, tabela `fuel_production` ima kolone koje predstavljaju sve relevantne informacije o proizvodnji i potrošnji goriva. Za efikasnost baze, svaka tabela je dizajnirana s jasno definiranim kolonama i vrstama podataka (INTEGER, TEXT, DATETIME, DECIMAL) kako bi se osigurala visoka performansa pri pretrazi i agregaciji podataka.

## Tipovi podataka i normalizacija
Baza podataka koristi osnovne SQL tipove podataka: `INTEGER`, `TEXT`, `DATETIME` i `DECIMAL`. Također, podaci su normalizirani kako bi se izbjeglo dupliciranje i osigurala dosljednost podataka u bazi.

- **INTEGER**: Koristi se za numeričke podatke kao što su količina proizvodnje ili broj stavki u inventaru.
- **TEXT**: Koristi se za tekstualne podatke kao što su imena, tipovi goriva, status inventara i druge tekstualne informacije.
- **DATETIME**: Koristi se za pohranu vremenskih pečata, poput vremena kada je izvještaj generiran.
- **DECIMAL**: Koristi se za precizne decimalne vrijednosti, poput prihoda, kako bi se osigurala tačnost financijskih podataka.

## Indeksi i optimizacija
Kako bi se poboljšala brzina pretrage i filtriranja podataka, moguće je kreirati indekse na kolonama koje se često koriste za pretragu, kao što su `month`, `year` i `fuel_type`. Korištenje indeksa može značajno ubrzati upite koji filtriraju ili agregiraju podatke po tim kolonama.

## Zaključak
Struktura podataka u ovoj bazi podataka omogućava efikasno praćenje, izvještavanje i analizu podataka o proizvodnji goriva, inventaru, izvještajima i korisnicima. S obzirom na dizajn i normalizaciju podataka, baza je optimizirana za brzu pretragu i minimalizaciju redundancije podataka.
