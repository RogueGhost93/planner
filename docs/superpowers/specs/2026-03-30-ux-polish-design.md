# UX Polish — Design-Spezifikation

**Datum:** 2026-03-30
**Status:** Genehmigt
**Scope:** UX-Verbesserungen (Phase 1 vor Featureerweiterungen)

---

## Ausgangslage

Oikos v0.1.0 ist funktional vollständig und alle 146 Tests sind grün. Das UI wirkt jedoch steril und beliebig — es fehlt eine eigene Persönlichkeit. Zusätzlich gibt es Konsistenzlücken zwischen Modulen, abrupte Übergänge, ein suboptimales mobiles Erlebnis und verbesserungswürdige Formular-UX.

Die Verbesserungen erfolgen in vier aufeinander aufbauenden Schichten (Layer for Layer), sodass jede Schicht das Fundament der nächsten bildet.

---

## Schicht 1 — Design-Sprache & Konsistenz

### Ziel
Der App eine eigene, wiedererkennbare Persönlichkeit geben — klar und präzise als Hauptrichtung, mit einem Hauch Wärme und Familiarität.

### Typografie-Skala
Vier klar unterscheidbare Stufen ersetzen die aktuelle flache Hierarchie:

| Stufe | Größe | Gewicht | Einsatz |
|-------|-------|---------|---------|
| Display | 24px | 700 | Seitentitel, Modal-Titel |
| Title | 18px | 600 | Widget-Überschriften, Gruppen-Header |
| Body | 15px | 400 | Fließtext, Listeneinträge |
| Caption | 13px | 400 | Metadaten, Zeitstempel, Labels |

Überschriften (Display, Title) erhalten `letter-spacing: -0.3px` für einen modernen, knappen Look.

### Farb-Tokens
Die Grautöne erhalten einen minimalen Warmton-Shift, um den Charakter von "Tech-App" zu "Familien-App" zu verschieben:

```css
/* Vorher → Nachher */
--color-bg:          #F5F5F7  →  #F6F5F3   /* ganz leicht warmer Tint */
--color-surface:     #FFFFFF  →  #FFFFFF   /* bleibt rein */
--color-text-primary:#1C1C1E  →  #1A1A1F   /* minimal wärmer */
```

Der Accent-Blau (`#007AFF`) bleibt unverändert. Dunkel-Modus erhält analoge Anpassungen.

### Komponenten-Konsistenz
Alle Module erhalten identische Card-Tokens:
- Padding: `16px` überall (aktuell variiert zwischen 12px–20px je Modul)
- Schatten: `shadow-sm` im Ruhezustand, `shadow-md` bei Hover
- Buttons: `:hover` = leichter Helligkeitsshift, `:active` = `scale(0.97)` (haptisches Feedback-Gefühl)

### Modul-Akzentfarben
Jedes Modul erhält eine dezente, eigene Akzentfarbe für Page-Header und FAB. Die Farben sind bereits in der Architektur vorgesehen (theme-color), werden aber vervollständigt und konsequent eingesetzt:

| Modul | Akzent |
|-------|--------|
| Dashboard | `#007AFF` (Standard-Blau) |
| Aufgaben | `#FF9500` (Orange) |
| Einkauf | `#34C759` (Grün) |
| Essensplan | `#FF6B35` (Warm-Orange) |
| Kalender | `#5AC8FA` (Hellblau) |
| Notizen | `#FFCC00` (Gelb) |
| Kontakte | `#AF52DE` (Violett) |
| Budget | `#30B0C7` (Teal) |

---

## Schicht 2 — Animationen & Übergänge

### Ziel
Die App fühlt sich lebendig an. Alle Animationen respektieren `prefers-reduced-motion: reduce`.

### Seitenübergänge
Neue Seite fährt von rechts ein, alte geht nach links raus:
- Transform: `translateX(24px) → translateX(0)`
- Opacity: `0 → 1`
- Dauer: `200ms`, Easing: `ease-out`
- Zurück-Navigation: gespiegelte Richtung

Implementierung im zentralen `router.js` — kein Modul-Code nötig.

### Gestaffelte Listen-Einblendung (Staggered Fade-In)
Beim initialen Laden einer Seite erscheinen Listenelemente und Cards nacheinander:
- Jedes Item: `opacity 0 → 1` + `translateY(8px) → 0`
- Verzögerung: 30ms pro Item, maximal 5 Items gestaffelt (danach sofort)
- Dauer pro Item: `180ms`

### Micro-Interactions

**Checkbox (Aufgaben erledigt):**
Das SVG-Häkchen zeichnet sich per `stroke-dashoffset`-Animation ein (60ms). Die Karten-Zeile bekommt einen `text-decoration: line-through`-Transition (100ms).

**FAB:**
`scale(0.92)` beim `:active` + Ripple-Effekt (radial expandierender Kreis, 300ms, opacity 0→1→0).

**Swipe-Reveal (Aufgaben):**
Aktuell erscheint der farbige Hintergrund abrupt. Neu: Hintergrundfarbe und Icon blenden proportional zur Swipe-Distanz ein (`opacity: swipeDistance / SWIPE_THRESHOLD`).

### Skeleton-Loading
Dashboard-Widgets zeigen beim Laden animierte Skeleton-Platzhalter:
- Shimmer-Animation via `@keyframes` (linearer Gradient läuft durch, 1.4s, unendlich)
- Schematische Rechtecke in Card-Form, passend zur jeweiligen Widget-Größe
- Ersetzt leere Flächen während des API-Calls

### Empty States
Jede leere Liste erhält einen Inline-SVG-Platzhalter und einen kontextuellen CTA:

| Modul | Text | CTA |
|-------|------|-----|
| Aufgaben | "Keine Aufgaben — alles erledigt?" | "+ Aufgabe erstellen" |
| Einkauf | "Die Liste ist leer" | "+ Artikel hinzufügen" |
| Essensplan | "Kein Essen geplant" | "Mahlzeit eintragen" |
| Notizen | "Noch keine Notizen" | "+ Notiz erstellen" |
| Kontakte | "Noch keine Kontakte" | "+ Kontakt hinzufügen" |
| Budget | "Keine Buchungen diesen Monat" | "+ Buchung eintragen" |

SVGs sind kleine, themenbezogene Illustrationen (Linien-Icons, kein Clipart), inline im HTML, kein externer Fetch.

---

## Schicht 3 — Mobile PWA & Natives Gefühl

### Ziel
Die installierte App fühlt sich auf dem Handy nativ an.

### PWA-Install-Prompt
**Timing:** Prompt erscheint erst nach 2–3 Benutzerinteraktionen (z.B. nach dem ersten erfolgreich erstellten Eintrag), nicht sofort beim ersten Seitenaufruf.

**Darstellung:** Bottom Sheet von unten einfahrend (nicht abruptes Banner). Enthält App-Icon, Name "Oikos", kurzen Nutzentext.

**Wiederholung:** Einmal abgelehnt → 7 Tage nicht erneut zeigen (via `localStorage` mit Timestamp).

**Plattformspezifisch:**
- Android: natives `beforeinstallprompt`-Event
- iOS: eigene Anleitung ("Teilen → Zum Home-Bildschirm") da kein natives Event

### Scroll & Overscroll
Auf allen scrollbaren Containern:
- `overscroll-behavior: contain` — verhindert Browser-Pull-to-Refresh innerhalb der App
- `-webkit-overflow-scrolling: touch` — Momentum-Scrolling auf iOS
- Bottom Nav und Header: `position: sticky` mit `env(safe-area-inset-bottom)` — kein Layout-Shift durch dynamische Viewport-Höhe (iOS Safari)

### Vibrations-Feedback
`navigator.vibrate()` bei bedeutsamen Aktionen, nur wenn API verfügbar und `prefers-reduced-motion` nicht gesetzt:

| Aktion | Muster |
|--------|--------|
| Aufgabe erledigt | `10ms` |
| Swipe-Aktion ausgelöst | `15ms` |
| Eintrag gelöscht | `[30, 50, 30]ms` |
| Fehlermeldung | `[20, 40, 20]ms` |

### Keyboard-Verhalten (Virtuelles Keyboard)
Beim Tippen in ein Eingabefeld springt dieses automatisch in den sichtbaren Bereich:
```js
input.addEventListener('focus', () => {
  setTimeout(() => input.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
});
```
300ms Verzögerung gibt dem Keyboard Zeit, sich zu öffnen.

### Theme-Color
Dynamische `theme-color` Meta-Tag-Aktualisierung beim Modulwechsel wird vervollständigt — jedes Modul übergibt beim Rendern seine Akzentfarbe, die Browser-Chrome-Farbe wechselt entsprechend.

---

## Schicht 4 — Formulare & Modals

### Ziel
Eingaben sind schnell, klar und fehlertolerant — besonders auf Mobil.

### Auto-Fokus & Tastaturnavigation
- Beim Öffnen eines Modals: Fokus springt automatisch auf erstes Eingabefeld (`setTimeout(0)` nach Modal-Render)
- `Tab`: logische Feldreihenfolge (entspricht DOM-Reihenfolge)
- `Enter` in einzeiligen Inputs: springt zum nächsten Feld
- `Enter` im letzten Feld (oder Textarea + `Ctrl+Enter`): löst Submit aus
- `Escape`: schließt Modal

### Inline-Validierung
- Trigger: `blur`-Event auf jedem Feld (nicht erst bei Submit)
- Fehlermeldung: direkt unter dem Feld, `color: var(--color-danger)`, mit Warn-Icon
- Erfolgreiche Pflichtfelder: dezenter grüner Rand (`border-color: var(--color-success)`)
- Submit-Button: deaktiviert solange Pflichtfelder leer, aktiv sobald Minimalanforderungen erfüllt

### Modal-UX auf Mobil
Auf Screens < 768px werden Modals als **Bottom Sheet** dargestellt:
- Einfähranimation: `translateY(100%) → translateY(0)`, 250ms, `ease-out`
- Maximalhöhe: `90dvh`, intern scrollbar
- Swipe-to-Close: Swipe nach unten > 80px schließt Modal; zwischen 0–80px gibt es gummibandartigen Widerstand (`transform: translateY(distance * 0.4)`)
- Backdrop-Klick: schließt Modal
- Schließanimation: `translateY(0) → translateY(100%)`, 200ms

Auf Desktop (≥ 768px): zentriertes Modal bleibt unverändert (Backdrop-Klick + Escape schließen).

### Submit-Feedback
**Erfolg:**
1. Submit-Button: Label wird durch Checkmark-Icon ersetzt (600ms)
2. Modal schließt sich mit Slide-Down-Animation
3. Liste aktualisiert sich (optimistisch oder via Re-Fetch)

**Fehler:**
1. Submit-Button: `shake`-Animation (300ms, ±4px horizontal)
2. Fehlermeldung erscheint unter dem betreffenden Feld oder als Banner oben im Modal
3. Kein Datenverlust — alle eingegebenen Werte bleiben erhalten

---

## Nicht in Scope

- Neue Features (Meal Drag&Drop, Budget-Recurrence, Kalender-Auto-Sync) — diese kommen erst nach UX + Code-Qualität
- Backend-Änderungen — alle vier Schichten sind rein frontend-seitig
- Push-Benachrichtigungen — explizit v1.1 (BACKLOG)
- Grundlegende Architekturänderungen am Router oder API-Layer

---

## Reihenfolge der Implementierung

1. Schicht 1: `tokens.css`, `reset.css`, `layout.css`, alle Modul-CSS-Dateien
2. Schicht 2: `router.js` (Seitenübergänge), alle Page-Module (Staggering, Micro-Interactions), `dashboard.js` (Skeleton)
3. Schicht 3: `oikos-install-prompt.js`, `sw.js`, alle Page-Module (Scroll, Keyboard, Vibration)
4. Schicht 4: `components/modal.js`, alle Page-Module (Formulare, Validierung)

Jede Schicht ist ein eigener Commit-Block und kann unabhängig reviewt werden.
