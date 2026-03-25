<div align="center">

<br>

# Oikos

### Der Familienplaner, der bei dir zuhause bleibt.

Oikos ist eine selbstgehostete Web-App, die den Alltag deiner Familie organisiert —
vom Einkaufszettel bis zum Kalender, vom Essensplan bis zum Budget.
Alles auf deinem eigenen Server. Ohne Cloud. Ohne Abo. Ohne Tracking.

<br>

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com)
[![SQLite](https://img.shields.io/badge/SQLite-verschl%C3%BCsselt-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.zetetic.net/sqlcipher/)
[![PWA](https://img.shields.io/badge/PWA-offline--f%C3%A4hig-5A0FC8?style=flat-square)](https://web.dev/progressive-web-apps/)
[![Lizenz](https://img.shields.io/badge/Lizenz-MIT-green?style=flat-square)](./LICENSE)

<br>

[Funktionen](#-was-kann-oikos) · [Screenshots](#-screenshots) · [Installation](#-installation) · [Konfiguration](#-konfiguration) · [FAQ](#-faq)

<br>

</div>

---

<br>

## Warum Oikos?

Die meisten Familienplaner sind Cloud-Dienste: Deine Termine, Einkaufslisten und Finanzdaten liegen auf fremden Servern. Oikos dreht das um.

| | Cloud-Dienste | Oikos |
|:---|:---|:---|
| **Deine Daten** | Auf fremden Servern | Auf deinem Server, verschlüsselt |
| **Kosten** | Monatliches Abo | Einmal einrichten, dauerhaft kostenlos |
| **Datenschutz** | Tracking, Werbung, Analyse | Kein Tracking. Keine Telemetrie. Nichts. |
| **Verfügbarkeit** | Abhängig vom Anbieter | Du hast die Kontrolle |
| **Zugang** | App Store nötig | Browser reicht (PWA, installierbar) |

> **Der Name:** *Oikos* (griechisch: *oikos*) bedeutet „Haus" oder „Haushalt" — der Ursprung des Wortes *Ökonomie*. Passend für eine App, die deinen Haushalt organisiert.

<br>

---

<br>

## Was kann Oikos?

<table>
  <tr>
    <td width="60">
      <div align="center"><strong>Modul</strong></div>
    </td>
    <td><strong>Beschreibung</strong></td>
  </tr>
  <tr>
    <td align="center">Dashboard</td>
    <td>Dein Tagesstart auf einen Blick: Wetter, anstehende Termine, dringende Aufgaben, heutiges Essen und angepinnte Notizen. Alles in einem personalisierten Feed.</td>
  </tr>
  <tr>
    <td align="center">Aufgaben</td>
    <td>Aufgaben erstellen, priorisieren und Familienmitgliedern zuweisen. Mit Teilaufgaben, Wiederholungen (täglich/wöchentlich/monatlich), Statusfiltern und Swipe-Gesten auf dem Handy.</td>
  </tr>
  <tr>
    <td align="center">Einkauf</td>
    <td>Mehrere Einkaufslisten parallel führen (REWE, dm, Baumarkt ...). Artikel werden automatisch nach Supermarkt-Kategorien gruppiert — wie ein digitaler Einkaufszettel, den die ganze Familie gemeinsam befüllt.</td>
  </tr>
  <tr>
    <td align="center">Essensplan</td>
    <td>Wochenplan für Frühstück, Mittag, Abend und Snacks. Zutaten pro Mahlzeit erfassen und mit einem Klick auf die Einkaufsliste übernehmen.</td>
  </tr>
  <tr>
    <td align="center">Kalender</td>
    <td>Familienkalender mit vier Ansichten (Monat, Woche, Tag, Agenda). Farbcodiert pro Person. Wiederkehrende Termine. Optional mit Google Calendar und Apple iCloud synchronisierbar.</td>
  </tr>
  <tr>
    <td align="center">Pinnwand</td>
    <td>Farbige Sticky Notes im Masonry-Grid. Für schnelle Erinnerungen, Nachrichten an die Familie oder Ideen. Mit Markdown-Light (fett, kursiv, Listen).</td>
  </tr>
  <tr>
    <td align="center">Kontakte</td>
    <td>Wichtige Kontakte der Familie — Kinderarzt, Schule, Handwerker, Versicherung. Mit Direktanruf per Tap, E-Mail-Links und Kartennavigation.</td>
  </tr>
  <tr>
    <td align="center">Budget</td>
    <td>Einnahmen und Ausgaben tracken, nach Kategorien auswerten, Monate vergleichen. Mit wiederkehrenden Buchungen (Miete, Gehalt) und CSV-Export.</td>
  </tr>
  <tr>
    <td align="center">Einstellungen</td>
    <td>Dark Mode (System / Hell / Dunkel), Passwort ändern, Kalender-Sync verwalten, Familienmitglieder anlegen.</td>
  </tr>
</table>

<br>

---

<br>

## Screenshots

<div align="center">

### Light Mode

<table>
  <tr>
    <td align="center">
      <img src="public/screenshots/dashboard.png" width="180" alt="Dashboard" /><br/>
      <sub><b>Dashboard</b></sub><br/>
      <sub>Wetter, Termine, Aufgaben, Essen</sub>
    </td>
    <td align="center">
      <img src="public/screenshots/tasks.png" width="180" alt="Aufgaben" /><br/>
      <sub><b>Aufgaben</b></sub><br/>
      <sub>Prioritäten, Zuweisung, Filter</sub>
    </td>
    <td align="center">
      <img src="public/screenshots/calendar.png" width="180" alt="Kalender" /><br/>
      <sub><b>Kalender</b></sub><br/>
      <sub>Monatsansicht, Tagesdetails</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="public/screenshots/shopping.png" width="180" alt="Einkaufsliste" /><br/>
      <sub><b>Einkauf</b></sub><br/>
      <sub>Mehrere Listen, Kategorien</sub>
    </td>
    <td align="center">
      <img src="public/screenshots/meals.png" width="180" alt="Essensplan" /><br/>
      <sub><b>Essensplan</b></sub><br/>
      <sub>Wochenplan, Zutaten</sub>
    </td>
    <td align="center">
      &nbsp;
    </td>
  </tr>
</table>

<br>

### Dark Mode

<table>
  <tr>
    <td align="center">
      <img src="public/screenshots/dashboard-dark.png" width="180" alt="Dashboard Dark" /><br/>
      <sub><b>Dashboard</b></sub>
    </td>
    <td align="center">
      <img src="public/screenshots/tasks-dark.png" width="180" alt="Aufgaben Dark" /><br/>
      <sub><b>Aufgaben</b></sub>
    </td>
    <td align="center">
      <img src="public/screenshots/calendar-dark.png" width="180" alt="Kalender Dark" /><br/>
      <sub><b>Kalender</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="public/screenshots/shopping-dark.png" width="180" alt="Einkaufsliste Dark" /><br/>
      <sub><b>Einkauf</b></sub>
    </td>
    <td align="center">
      <img src="public/screenshots/meals-dark.png" width="180" alt="Essensplan Dark" /><br/>
      <sub><b>Essensplan</b></sub>
    </td>
    <td align="center">
      &nbsp;
    </td>
  </tr>
</table>

<sub>Dark Mode folgt automatisch deiner Systemeinstellung oder lässt sich manuell unter Einstellungen umschalten.</sub>

</div>

<br>

---

<br>

## Technik auf einen Blick

Oikos setzt bewusst auf einen minimalen, wartungsarmen Stack — keine 200 npm-Pakete, kein Build-Step, kein Framework-Lock-in.

| Schicht | Technologie |
|:---|:---|
| **Server** | Node.js + Express.js |
| **Datenbank** | SQLite mit SQLCipher-Verschlüsselung (AES-256) |
| **Frontend** | Vanilla JavaScript (ES-Module), eigenes CSS — kein React, kein Vue, kein Bundler |
| **Auth** | Session-basiert, bcrypt-Passwort-Hashing, CSRF-Schutz |
| **Deployment** | Docker (ein Container, ein Volume) |
| **PWA** | Service Worker + Manifest — installierbar auf Homescreen, offline-fähig |
| **Kalender-Sync** | Google Calendar API v3 (OAuth) + Apple iCloud CalDAV (optional) |

<br>

---

<br>

## Installation

> **Zeitaufwand:** ca. 10–15 Minuten, auch wenn du Docker zum ersten Mal nutzt.

### Voraussetzungen

Du brauchst einen Linux-Server (oder eine lokale Linux-Maschine / VM / Raspberry Pi) mit:

- **Docker** und **Docker Compose** — [Installationsanleitung (offizielle Docs)](https://docs.docker.com/engine/install/)
- **Git** — ist auf den meisten Linux-Distributionen vorinstalliert (`git --version` zum Prüfen)

> **Noch keinen Server?** Ein günstiger VPS (z.B. bei Hetzner, Netcup oder Oracle Cloud Free Tier) reicht völlig aus. Oikos braucht minimal 512 MB RAM und 1 CPU-Kern.

---

### Schritt 1 — Repository herunterladen

Öffne ein Terminal auf deinem Server und führe aus:

```bash
git clone https://github.com/ulsklyc/oikos.git
cd oikos
```

<details>
<summary><strong>Was passiert hier?</strong></summary>

`git clone` lädt den gesamten Quellcode von GitHub auf deinen Server herunter.
`cd oikos` wechselt in das heruntergeladene Verzeichnis.

</details>

---

### Schritt 2 — Konfiguration anlegen

```bash
cp .env.example .env
```

Jetzt die `.env`-Datei bearbeiten — z.B. mit `nano`:

```bash
nano .env
```

Mindestens diese zwei Felder musst du ausfüllen:

```env
# Ein langer, zufälliger String. Wird zum Signieren von Sessions verwendet.
# So generierst du einen im Terminal:
#   openssl rand -base64 32
SESSION_SECRET=hier_einen_langen_zufaelligen_string_eintragen

# Verschlüsselungsschlüssel für die Datenbank (AES-256).
# Ebenfalls mit openssl generieren. Leer lassen = keine Verschlüsselung.
DB_ENCRYPTION_KEY=hier_einen_starken_schluessel_eintragen
```

<details>
<summary><strong>Schlüssel generieren — so geht's</strong></summary>

Führe diesen Befehl zweimal aus und kopiere die Ausgabe jeweils in die `.env`:

```bash
openssl rand -base64 32
```

Das erzeugt eine zufällige Zeichenfolge wie `K7xQ3m+r9Fz1bY4p...` — perfekt als Secret.

</details>

<details>
<summary><strong>Was bedeuten die anderen Felder in der .env?</strong></summary>

Die `.env.example` enthält noch weitere Optionen (Wetter, Kalender-Sync etc.). Diese sind alle **optional** und werden weiter unten im Abschnitt [Konfiguration](#-konfiguration) erklärt. Für den Start brauchst du nur die zwei Pflichtfelder.

</details>

Speichern in nano: `Strg+O`, `Enter`, `Strg+X`.

---

### Schritt 3 — App starten

```bash
docker compose up -d --build
```

Der erste Build kompiliert SQLCipher und dauert **2–3 Minuten**. Alle weiteren Starts sind deutlich schneller.

Prüfe, ob der Container läuft:

```bash
docker compose ps
```

Du solltest sehen, dass der Container `oikos` den Status `Up` hat. Falls etwas nicht stimmt:

```bash
docker compose logs oikos --tail=30
```

Wenn in den Logs steht:

```
[Oikos] Server läuft auf Port 3000
```

...ist alles bereit.

---

### Schritt 4 — Ersten Benutzer anlegen

```bash
docker compose exec oikos node setup.js
```

Das Script fragt dich interaktiv nach:
- **Benutzername** — zum Einloggen (z.B. `mama`, `papa`, `lisa`)
- **Anzeigename** — wird in der App angezeigt (z.B. `Lisa Müller`)
- **Passwort** — mindestens 6 Zeichen

Dieser erste Account bekommt automatisch **Admin-Rechte** und kann später weitere Familienmitglieder anlegen.

---

### Schritt 5 — App öffnen

Im Browser aufrufen:

```
http://<deine-server-ip>:3000
```

Logge dich mit dem gerade erstellten Account ein — fertig!

> **Hinweis für lokalen Zugriff ohne HTTPS:**
> Im Produktionsmodus erwartet Oikos standardmäßig HTTPS für sichere Cookies. Wenn du die App zunächst ohne Reverse Proxy testen möchtest, füge in der `.env` hinzu:
> ```env
> SESSION_SECURE=false
> ```
> Dann Container neu starten: `docker compose down && docker compose up -d`
>
> **Entferne diese Zeile wieder**, sobald du HTTPS eingerichtet hast (siehe nächster Schritt).

---

### Schritt 6 — HTTPS einrichten (empfohlen)

Für den dauerhaften Betrieb sollte Oikos hinter einem Reverse Proxy mit SSL laufen. Das schützt Passwörter und Sessions auf dem Transportweg.

<details>
<summary><strong>Variante A: Nginx Proxy Manager (empfohlen für Einsteiger)</strong></summary>

[Nginx Proxy Manager](https://nginxproxymanager.com) ist ein benutzerfreundlicher Reverse Proxy mit Web-Oberfläche.

1. **Nginx Proxy Manager installieren** (falls noch nicht vorhanden) — [Anleitung](https://nginxproxymanager.com/guide/)
2. Neuen **Proxy Host** anlegen:
   - Domain: `oikos.deine-domain.de`
   - Forward Hostname: `deine-server-ip` (oder `localhost` wenn auf demselben Server)
   - Forward Port: `3000`
3. Reiter **SSL**: Let's Encrypt Zertifikat ausstellen lassen (kostenlos, automatisch)
4. Reiter **Advanced**: Den Inhalt von [`nginx.conf.example`](./nginx.conf.example) einfügen

**Wichtig:** Der Header `X-Forwarded-Proto` muss gesetzt sein (ist in der Beispielkonfiguration enthalten). Ohne ihn erkennt Oikos nicht, dass die Verbindung per HTTPS läuft.

</details>

<details>
<summary><strong>Variante B: Nginx manuell konfigurieren</strong></summary>

Kopiere die Datei [`nginx.conf.example`](./nginx.conf.example) und passe die Domain an:

```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/oikos
sudo ln -s /etc/nginx/sites-available/oikos /etc/nginx/sites-enabled/
# Domain in der Datei anpassen:
sudo nano /etc/nginx/sites-available/oikos
```

Für SSL-Zertifikate mit Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d oikos.deine-domain.de
```

Nginx neu laden:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

</details>

Sobald HTTPS läuft: `SESSION_SECURE=false` aus der `.env` **entfernen** und Container neu starten.

<br>

---

<br>

## Konfiguration

### Pflichtfelder

| Variable | Beschreibung | Beispiel |
|:---|:---|:---|
| `SESSION_SECRET` | Zufälliger String (mind. 32 Zeichen) zum Signieren von Sessions | `openssl rand -base64 32` |
| `DB_ENCRYPTION_KEY` | SQLCipher-Schlüssel (AES-256) — leer = keine Verschlüsselung | `openssl rand -base64 32` |

### Wetter-Widget

Das Dashboard zeigt ein Wetter-Widget, wenn ein API-Key konfiguriert ist. Kostenlos registrieren bei [openweathermap.org](https://openweathermap.org/api):

```env
OPENWEATHER_API_KEY=dein_api_key_hier
OPENWEATHER_CITY=Berlin
OPENWEATHER_UNITS=metric   # metric = Celsius, imperial = Fahrenheit
OPENWEATHER_LANG=de
```

### Sicherheit

| Variable | Standard | Beschreibung |
|:---|:---|:---|
| `SESSION_SECURE` | *(nicht gesetzt)* | Auf `false` setzen wenn kein HTTPS verfügbar (nur zum Testen!) |
| `RATE_LIMIT_MAX_ATTEMPTS` | `5` | Max. fehlgeschlagene Login-Versuche pro Minute |

### Weitere Optionen

| Variable | Standard | Beschreibung |
|:---|:---|:---|
| `PORT` | `3000` | Server-Port im Container |
| `DB_PATH` | `/data/oikos.db` | Datenbankpfad im Container |
| `SYNC_INTERVAL_MINUTES` | `15` | Kalender-Sync-Intervall (in Minuten) |

Die vollständige Vorlage mit allen Optionen findest du in [`.env.example`](./.env.example).

<br>

---

<br>

## Kalender-Synchronisation

Oikos kann sich mit externen Kalendern synchronisieren, damit Termine aus Google Calendar oder Apple iCloud automatisch in der App erscheinen — und umgekehrt.

### Google Calendar

<details>
<summary><strong>Schritt-für-Schritt-Anleitung</strong></summary>

#### 1. Google Cloud Projekt anlegen

1. Gehe zu [console.cloud.google.com](https://console.cloud.google.com) und erstelle ein neues Projekt
2. Aktiviere die **Google Calendar API** unter „APIs & Dienste" → „Bibliothek"
3. Unter „APIs & Dienste" → „Anmeldedaten" → **OAuth 2.0-Client-ID erstellen**
   - Anwendungstyp: „Webanwendung"
   - Autorisierte Redirect-URI:
     ```
     https://oikos.deine-domain.de/api/v1/calendar/google/callback
     ```
4. Client-ID und Client-Secret kopieren

#### 2. In Oikos konfigurieren

In der `.env` eintragen:

```env
GOOGLE_CLIENT_ID=deine-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=dein-client-secret
GOOGLE_REDIRECT_URI=https://oikos.deine-domain.de/api/v1/calendar/google/callback
```

Container neu starten: `docker compose up -d`

#### 3. Verbindung herstellen

1. In Oikos einloggen (Admin-Account)
2. **Einstellungen** → **Kalender-Synchronisation** → **Mit Google verbinden**
3. Google-Konto auswählen und autorisieren
4. Automatische Weiterleitung zurück zu Oikos

#### So funktioniert der Sync

- **Erster Sync:** Termine der letzten 3 Monate und nächsten 12 Monate werden importiert
- **Folge-Syncs:** Nur Änderungen werden abgeglichen (effizient via Google syncToken)
- **Neue lokale Termine** werden auch nach Google übertragen (bidirektional)
- **Bei Konflikten** gewinnt Google — lokale Ergänzungen bleiben erhalten

</details>

### Apple Calendar (iCloud)

<details>
<summary><strong>Schritt-für-Schritt-Anleitung</strong></summary>

#### 1. App-spezifisches Passwort erstellen

Apple erfordert ein eigenes Passwort für Drittanbieter-Apps:

1. Gehe zu [appleid.apple.com](https://appleid.apple.com)
2. Unter „Anmeldung und Sicherheit" → „App-spezifische Passwörter" → „Passwort generieren"
3. Label eingeben (z.B. „Oikos")
4. Das generierte Passwort kopieren (Format: `xxxx-xxxx-xxxx-xxxx`)

#### 2. In Oikos konfigurieren

In der `.env` eintragen:

```env
APPLE_CALDAV_URL=https://caldav.icloud.com
APPLE_USERNAME=deine@apple-id.de
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

Container neu starten: `docker compose up -d`

Der Sync-Button erscheint dann automatisch in den Einstellungen.

</details>

<br>

---

<br>

## Familienmitglieder verwalten

Neue Accounts können **nur Admins** anlegen — es gibt absichtlich keine öffentliche Registrierung.

**In der App:** Einstellungen → Familienmitglieder → Mitglied hinzufügen

**Per Terminal** (z.B. für einen weiteren Admin):

```bash
docker compose exec oikos node setup.js
```

<br>

---

<br>

## Updates

```bash
cd oikos
git pull
docker compose up -d --build
```

Das war's. Datenbank-Migrationen laufen automatisch beim Start. Alle Daten im Docker-Volume bleiben erhalten.

> **Empfehlung:** Vor jedem Update ein Backup erstellen.

<br>

---

<br>

## Datensicherung

### Backup erstellen

```bash
docker run --rm \
  -v oikos_oikos_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/oikos-backup-$(date +%Y%m%d).tar.gz /data
```

Das erstellt eine komprimierte Sicherung der gesamten Datenbank im aktuellen Verzeichnis.

### Backup wiederherstellen

```bash
docker compose down
docker run --rm \
  -v oikos_oikos_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/oikos-backup-YYYYMMDD.tar.gz -C /
docker compose up -d
```

> Ersetze `YYYYMMDD` durch das Datum deines Backups (z.B. `20260326`).

<br>

---

<br>

## Lokale Entwicklung

Falls du Oikos weiterentwickeln oder anpassen möchtest:

```bash
git clone https://github.com/ulsklyc/oikos.git
cd oikos
npm install
cp .env.example .env
# In der .env: SESSION_SECRET setzen, DB_ENCRYPTION_KEY leer lassen
npm run dev        # Server starten mit Auto-Reload bei Dateiänderungen
```

Tests ausführen:

```bash
npm test           # 146 Tests, 7 Suiten (In-Memory-SQLite, kein laufender Server nötig)
```

<br>

---

<br>

## Sicherheit

Oikos nimmt den Schutz deiner Familiendaten ernst:

| Maßnahme | Details |
|:---|:---|
| **Verschlüsselte Datenbank** | SQLCipher (AES-256) — Daten sind auch bei Serverzugriff geschützt |
| **Sichere Passwörter** | bcrypt mit Cost Factor 12 — kein Klartext, nie |
| **Session-Schutz** | `httpOnly`, `SameSite=Strict`, `Secure`-Cookies, 7 Tage Ablauf |
| **CSRF-Schutz** | Double Submit Cookie mit `crypto.timingSafeEqual` |
| **Rate Limiting** | 5 Login-Versuche/Minute, dann 15 Min. Sperre |
| **Input-Validation** | Zentrale Validierung auf allen Endpoints (Länge, Typ, Whitelist) |
| **SQL-Injection-Schutz** | Parametrisierte Queries überall — kein String-Zusammenbau |
| **Security Headers** | CSP, HSTS, X-Frame-Options via Helmet |
| **Kein offener Zugang** | Jeder API-Endpoint erfordert Authentifizierung (außer Login) |

<br>

---

<br>

## FAQ

<details>
<summary><strong>Brauche ich Docker-Erfahrung?</strong></summary>

Nein. Die Installation besteht aus 6 Befehlen, die du einfach kopieren und einfügen kannst. Docker sorgt dafür, dass alles in einem isolierten Container läuft — du musst nichts manuell installieren oder konfigurieren.

</details>

<details>
<summary><strong>Kann ich Oikos auf einem Raspberry Pi betreiben?</strong></summary>

Ja. Oikos läuft auf jedem System, das Docker unterstützt — einschließlich Raspberry Pi 4 (ARM64). Der Build dauert dort etwas länger (~5 Min), aber die App selbst läuft flüssig.

</details>

<details>
<summary><strong>Ist Oikos auch auf dem Handy nutzbar?</strong></summary>

Ja, Oikos ist eine Progressive Web App (PWA). Du kannst sie im Browser nutzen oder auf deinen Homescreen installieren — sie verhält sich dann wie eine native App, inklusive Offline-Grundfunktionen.

</details>

<details>
<summary><strong>Wie viele Familienmitglieder werden unterstützt?</strong></summary>

Oikos ist für 2–6 Personen konzipiert. Technisch gibt es kein festes Limit, aber das UI ist für kleine Familien und WGs optimiert.

</details>

<details>
<summary><strong>Ist die Kalender-Synchronisation Pflicht?</strong></summary>

Nein. Der integrierte Kalender funktioniert komplett eigenständig. Google- und Apple-Sync sind optionale Zusatzfunktionen.

</details>

<details>
<summary><strong>Was passiert mit meinen Daten bei einem Update?</strong></summary>

Deine Daten liegen in einem Docker-Volume und bleiben bei Updates erhalten. Datenbank-Migrationen laufen automatisch beim Start. Trotzdem empfehlen wir vor jedem Update ein Backup.

</details>

<details>
<summary><strong>Kann ich das Design anpassen?</strong></summary>

Ja. Oikos verwendet CSS Custom Properties (Design Tokens) für Farben, Abstände und Schriften. Diese kannst du in `public/styles/tokens.css` nach deinem Geschmack anpassen — ohne Build-Step.

</details>

<br>

---

<br>

<div align="center">

**Oikos** wird mit Sorgfalt entwickelt und ist Open Source.

Feedback, Ideen und Beiträge sind willkommen — erstelle einfach ein [Issue](https://github.com/ulsklyc/oikos/issues).

[MIT-Lizenz](./LICENSE) · Made with care

</div>
