## 🧾 Changelog – 69x Pacific AI Unit

### v1.1.0 – Sistema completo gestione server & ticket

#### 🧭 Regole & ingresso utenti
- Aggiunto comando `/sendrules`:
  - Invia un messaggio embed con **regole ITA + ENG**.
  - Intestazione bilingue: “Premi il pulsante ACCEPT / ACCETTO…” / “Press the ACCEPT / ACCETTO button…”.
  - Pulsante `✔ ACCEPT / ACCETTO` per accettare le regole.
- Bottone `accept_rules`:
  - Assegna automaticamente il ruolo **Survivor** al giocatore che accetta.
  - Evita multi-click: se l’utente ha già il ruolo, riceve un messaggio informativo.
  - Aggiorna il messaggio rimuovendo il pulsante dopo l’accettazione.
- Benvenuto automatico:
  - Su `GuildMemberAdd` invia un messaggio in `nuovi-utenti`.
  - Prova a mandare un **DM di benvenuto** con:
    - Info su cosa fare (leggere regole, accettare, ecc.).
    - Info server in stile DayZ.

#### 🧭 Info server DayZ – Sakhal
- Aggiunto comando `/info-sakhal`:
  - Embed con:
    - Nome server, mappa (Sakhal), stile, slot, wipe, restart, Discord.
    - Sezione **Mod & gameplay** (trader, AI, veicoli, loot bilanciato).
    - Sezione **Connessione / Connection** (Direct Connect IP:PORTA in ITA + ENG).
    - Note rapide su PvP e policy staff.
- Tutti i dati sono presi da costanti configurabili in cima al file:
  - `SERVER_NAME`, `SERVER_IP`, `SERVER_SLOTS`, `SERVER_WIPE`,
    `SERVER_RESTART`, `SERVER_DISCORD`, `SERVER_MODS`, `SERVER_STYLE`.
- Bastano modifiche a queste costanti per allineare il bot alle nuove impostazioni di gioco (es. cambi di slot, nuovo IP, nuovo wipe).

#### 🏗 Setup struttura server Discord
- Aggiunto comando `/setup-structure` (solo admin):
  - Crea/organizza categorie bilingue:
    - `🧭 Benvenuto • Welcome`
    - `💬 Community • Community`
    - `🎮 In gioco • In-Game`
    - `🎧 Vocali • Voice Channels`
    - `🆘 Supporto • Support`
    - `🛠 Staff • Staff Only`
    - `🔒 Ticket chiusi • Closed Tickets`
  - Crea/riordina i canali principali (regole, info server, annunci, generale, LFG, trade, raid, staff-chat, admin-log, ecc.).
- Utile per standardizzare la struttura dopo modifiche o disordine nei canali.

#### 🎫 Sistema Ticket avanzato
- Comando `/ticket`:
  - Crea un ticket di supporto generale con canale dedicato (`ticket-support-username-XXXX`).
- Comando `/ticket-panel` (solo admin):
  - Invia un pannello con pulsanti per aprire ticket senza comandi manuali:
    - 🧰 Supporto / Support (`ticket_support`)
    - 🛠 Bug Report (`ticket_bug`)
    - 🚨 Segnalazioni / Reports (`ticket_report`)
    - 💡 Richieste / Requests (`ticket_request`)
    - ⚖️ Ban & Appeal (`ticket_ban`)
- Per ogni ticket:
  - Canale separato per utente + staff.
  - Messaggio iniziale bilingue (ITA + ENG) con spiegazione del tipo di richiesta.
  - Pulsante `🔒 Chiudi ticket / Close ticket`.
- Notifica staff automatica:
  - Ogni nuovo ticket viene notificato in `🛠┃staff-chat` (o `🚫┃admin-log` se presente).
- Chiusura ticket:
  - Il bottone `ticket_close` può essere usato dal proprietario del ticket o da un admin.
  - Il canale viene spostato nella categoria `🔒 Ticket chiusi • Closed Tickets`.
  - Il nome cambia da `ticket-...` a `closed-...`.
  - I permessi vengono aggiornati (visibile solo allo staff).

#### 🧹 Pulizia messaggi
- Auto-clean:
  - Nei canali configurati (es. `😎┃generale・general-chat`, `📢┃looking-for-team・lfg`) i messaggi considerati “comandi” o messaggi brevi vengono eliminati automaticamente dopo alcuni secondi.
- Comando `/clean-channel` (solo admin):
  - Elimina messaggi non pinnati più vecchi di X giorni (limitato ai 14 giorni imposti da Discord).
  - Parametro `days` (default 7, min 1, max 14).
  - Restituisce un riepilogo con il numero di messaggi cancellati.

#### 📊 Monitoraggio bot & Raspberry
- Aggiunto comando `/bot-status` (solo admin):
  - Mostra:
    - Ping verso Discord, uptime del bot, nome server Discord.
    - Commit git attuale del progetto.
    - Ultimo auto-update (letto dal log `pacificbot-autoupdate.log`).
    - Hostname, uptime del sistema, utilizzo RAM.
    - Temperatura CPU del Raspberry Pi (via `vcgencmd measure_temp`).

---

> Il bot è stato pensato per gestire in modo automatico onboarding, regole, ticket e comunicazioni per il server DayZ **69x Pacific Land | Sakhal Full PvP**, con struttura bilingue (Italiano / Inglese) e integrazione con l’infrastruttura su Raspberry Pi.
