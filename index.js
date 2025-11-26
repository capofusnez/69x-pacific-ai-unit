// ------------------------------------------------------------
// 69x Pacific AI Unit - Bot Discord per 69x Pacific Land Sakhal
// Versione per Raspberry Pi con comando /bot-status
// ------------------------------------------------------------

require("dotenv").config();

const os = require("os");
const { exec } = require("child_process");

const {
    Client,
    GatewayIntentBits,
    Partials,
    SlashCommandBuilder,
    REST,
    Routes,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    PermissionFlagsBits,
    ChannelType,
    Events
} = require("discord.js");

// ------------------------------------------------------------
// CONFIGURAZIONE BASE (MODIFICA QUI SE TI SERVE)
// ------------------------------------------------------------

// ID dell'applicazione/bot (CLIENT ID) - NON il token
const CLIENT_ID = "1442475115743940611";

// ID del tuo server Discord
const SERVER_ID = "1442125105575628891";

// Canale regole (già esistente)
const RULES_CHANNEL_ID = "1442141514464759868";

// Canale nuovi utenti / presentazioni
const NEW_USER_CHANNEL_ID = "1442568117296562266";

// Ruolo che viene assegnato quando accettano le regole
const SURVIVOR_ROLE_ID = "1442570651696107711";

// Info server DayZ Sakhal
const SERVER_NAME = "69x Pacific Land | Sakhal Full PvP";
const SERVER_IP = "IP:PORTA (modifica qui)"; // es: "123.45.67.89:2302"
const SERVER_SLOTS = "60 slot";              // modifica se diverso
const SERVER_WIPE = "Wipe completo ogni 30 giorni";
const SERVER_RESTART = "Restart ogni 4 ore";
const SERVER_DISCORD = "Questo Discord ufficiale";
const SERVER_MODS = "Trader, custom loot, veicoli, AI (personalizza)";
const SERVER_STYLE = "Hardcore survival, full PvP, niente favoritismi staff";

// Percorsi usati per lo status
const PROJECT_PATH = "/home/andrea/69x-pacific-ai-unit";
const AUTOUPDATE_LOG = "/home/andrea/pacificbot-autoupdate.log";

// ------------------------------------------------------------
// CREAZIONE CLIENT DISCORD
// ------------------------------------------------------------

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// ------------------------------------------------------------
// HELPER PER CATEGORIE E CANALI (USATI DA /setup-structure)
// ------------------------------------------------------------

async function getOrCreateCategory(guild, name) {
    let cat = guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && c.name === name
    );
    if (!cat) {
        cat = await guild.channels.create({
            name,
            type: ChannelType.GuildCategory
        });
    }
    return cat;
}

async function getOrCreateTextChannel(guild, name, parentCategory) {
    let ch = guild.channels.cache.find(
        c => c.type === ChannelType.GuildText && c.name === name
    );
    if (!ch) {
        ch = await guild.channels.create({
            name,
            type: ChannelType.GuildText,
            parent: parentCategory ? parentCategory.id : null
        });
    } else if (parentCategory && ch.parentId !== parentCategory.id) {
        await ch.setParent(parentCategory.id);
    }
    return ch;
}

async function getOrCreateVoiceChannel(guild, name, parentCategory) {
    let ch = guild.channels.cache.find(
        c => c.type === ChannelType.GuildVoice && c.name === name
    );
    if (!ch) {
        ch = await guild.channels.create({
            name,
            type: ChannelType.GuildVoice,
            parent: parentCategory ? parentCategory.id : null
        });
    } else if (parentCategory && ch.parentId !== parentCategory.id) {
        await ch.setParent(parentCategory.id);
    }
    return ch;
}

// ------------------------------------------------------------
// FUNZIONI HELPER PER /bot-status
// ------------------------------------------------------------

function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(" ");
}

function getSystemUptime() {
    const seconds = os.uptime();
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(" ");
}

function getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usedMB = (used / 1024 / 1024).toFixed(0);
    const totalMB = (total / 1024 / 1024).toFixed(0);
    const perc = ((used / total) * 100).toFixed(1);
    return `${usedMB}MB / ${totalMB}MB (${perc}%)`;
}

function execPromise(cmd, cwd = PROJECT_PATH) {
    return new Promise((resolve, reject) => {
        exec(cmd, { cwd }, (error, stdout) => {
            if (error) return reject(error);
            resolve(stdout.trim());
        });
    });
}

async function getGitShortCommit() {
    try {
        const out = await execPromise("git rev-parse --short HEAD");
        return out || "n/d";
    } catch {
        return "n/d";
    }
}

async function getRpiTemperature() {
    // usa vcgencmd se disponibile
    try {
        const out = await execPromise("vcgencmd measure_temp", "/");
        // formato tipico: temp=48.0'C
        const match = out.match(/temp=([0-9.]+)'C/);
        if (match) return `${match[1]}°C`;
        return out || "n/d";
    } catch {
        return "n/d";
    }
}

const fs = require("fs");
function getLastAutoUpdate() {
    try {
        if (!fs.existsSync(AUTOUPDATE_LOG)) return "nessun log";
        const content = fs.readFileSync(AUTOUPDATE_LOG, "utf8");
        const lines = content.trim().split("\n").reverse();
        for (const line of lines) {
            if (line.includes("AUTO-UPDATE")) {
                return line.replace("===== ", "").replace(" =====", "").trim();
            }
        }
        return "nessuna voce trovata";
    } catch {
        return "errore lettura log";
    }
}

// ------------------------------------------------------------
// DEFINIZIONE COMANDI SLASH
// ------------------------------------------------------------

const commands = [
    new SlashCommandBuilder()
        .setName("sendrules")
        .setDescription("Invia il messaggio delle regole nel canale corrente"),
    new SlashCommandBuilder()
        .setName("info-sakhal")
        .setDescription("Mostra le info del server DayZ Sakhal"),
    new SlashCommandBuilder()
        .setName("setup-structure")
        .setDescription("Crea/organizza categorie e canali ITA/ENG (solo admin)")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Apri un ticket con lo staff / Open a support ticket"),
    new SlashCommandBuilder()
        .setName("bot-status")
        .setDescription("Mostra stato bot e Raspberry Pi (solo admin)")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// Registrazione comandi sul server (guild commands)
async function registerCommands() {
    try {
        console.log("🔄 Registrazione comandi slash...");
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, SERVER_ID),
            { body: commands }
        );
        console.log("✅ Comandi registrati nel server.");
    } catch (error) {
        console.error("❌ Errore registrazione comandi:", error);
    }
}

// ------------------------------------------------------------
// EVENTO READY
// ------------------------------------------------------------

client.once("ready", () => {
    console.log(`🤖 Bot online come: ${client.user.tag}`);
    client.user.setActivity("Sopravvivere a Sakhal", { type: 0 });
});

// ------------------------------------------------------------
// EVENTO: NUOVO MEMBRO ENTRA NEL SERVER (JOIN)
// ------------------------------------------------------------

client.on(Events.GuildMemberAdd, async member => {
    try {
        const channel = member.guild.channels.cache.get(NEW_USER_CHANNEL_ID);
        if (channel) {
            channel.send(`🎖 <@${member.id}> è entrato nel territorio di **Sakhal**.`);
        }

        // Messaggio privato semplice
        await member.send(`
👋 Benvenuto su **${SERVER_NAME}**

Ricorda:
- Leggi le regole nel canale regole/rules
- Accetta per ottenere il ruolo Survivor
- Poi puoi usare i canali testuali e vocali

Good luck, survivor. 💀
        `);
    } catch (err) {
        console.log("⚠ Impossibile mandare DM all'utente (probabile DM chiusi).");
    }
});

// ------------------------------------------------------------
// EVENTO: INTERAZIONI (COMANDI SLASH)
// ------------------------------------------------------------

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // ---------------- /sendrules ----------------
    if (interaction.commandName === "sendrules") {

        const embed = new EmbedBuilder()
            .setTitle("📜 Regole del Server – Zona Controllata")
            .setDescription(`
**🇮🇹 Premi il pulsante "ACCEPT / ACCETTO" qui sotto per confermare che hai letto e accettato le regole.**  
**🇬🇧 Press the "ACCEPT / ACCETTO" button below to confirm you have read and accepted the rules.**

────────────────────────

> "Questo non è un gioco. È sopravvivenza."

**🇮🇹 ITALIANO**

1️⃣ Rispetto obbligatorio  
Nessun insulto, razzismo, sessismo, bullismo o provocazione verso altri membri.

2️⃣ Niente spam o flood  
Evita messaggi ripetitivi, tag inutili, pubblicità, link sospetti o autopromozione senza permesso.

3️⃣ Segui la gerarchia  
Le decisioni dello staff sono definitive. Discussioni civili ok, mancanza di rispetto no.

4️⃣ Usa i canali giusti  
Se c’è un canale dedicato, usalo.

5️⃣ Vietati cheat, exploit e glitch  
Cheat = ban permanente. Mod non autorizzate = punizione immediata.

6️⃣ No divulgazione dati personali  
Nessun doxxing, minacce o comportamenti illegali.

7️⃣ NSFW vietato  
Niente contenuti sessuali o gore reale.

8️⃣ No drama  
Problemi? Contatta lo staff. Niente flame pubblici.

9️⃣ Linguaggio  
Meme e battute ok — discriminazioni no.

🔟 Staff > tutto  
Lo staff può aggiornare le regole in qualsiasi momento.

────────────────────────

**🇬🇧 ENGLISH**

1️⃣ Respect is mandatory  
No insults, racism, sexism, bullying or provoking others.

2️⃣ No spam or flood  
Avoid repeated messages, useless pings, ads, scam links or self-promo.

3️⃣ Follow the staff hierarchy  
Staff decisions are final.

4️⃣ Use the correct channels  
If a channel is dedicated to something, use it.

5️⃣ No cheats, exploits or glitches  
Cheaters = permanent ban.

6️⃣ No personal data sharing  
No doxxing, threats or illegal behaviour.

7️⃣ NSFW forbidden  
No sexual or real-life gore content.

8️⃣ No drama  
If you have an issue, contact staff.

9️⃣ Language  
Memes and jokes ok, discrimination is not.

🔟 Staff > everything  
Staff can change rules anytime to protect the community.
            `)
            .setColor("DarkGreen")
            .setFooter({ text: "⚠ Accept/Accetto per entrare ufficialmente nel server" });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("accept_rules")
                .setLabel("✔ ACCEPT / ACCETTO")
                .setStyle(ButtonStyle.Success)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: "📜 Regole inviate in questo canale.", ephemeral: true });
        return;
    }

    // ---------------- /info-sakhal ----------------
    if (interaction.commandName === "info-sakhal") {

        const embedInfo = new EmbedBuilder()
            .setTitle("🧭 Info Server – 69x Pacific Land | Sakhal")
            .setDescription(`
**Nome server:** \`${SERVER_NAME}\`

> "Sakhal non perdona. O uccidi, o sei loot."
            `)
            .addFields(
                {
                    name: "🇮🇹 Info generali",
                    value: `
• **Mappa:** Sakhal  
• **Stile:** ${SERVER_STYLE}  
• **Slot:** ${SERVER_SLOTS}  
• **Wipe:** ${SERVER_WIPE}  
• **Restart:** ${SERVER_RESTART}  
• **Discord:** ${SERVER_DISCORD}  
                    `
                },
                {
                    name: "🧰 Mod & gameplay",
                    value: `${SERVER_MODS}`
                },
                {
                    name: "🌐 Connessione / Connection",
                    value: `
**Direct Connect:**  
\`${SERVER_IP}\`

Se non funziona, cerca il nome **${SERVER_NAME}** nella lista server DayZ.
                    `
                }
            )
            .setColor("DarkGold");

        await interaction.reply({ embeds: [embedInfo] });
        return;
    }

    // ---------------- /setup-structure ----------------
    if (interaction.commandName === "setup-structure") {

        if (
            !interaction.memberPermissions ||
            !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)
        ) {
            await interaction.reply({
                content: "❌ Solo un amministratore può usare questo comando.",
                ephemeral: true
            });
            return;
        }

        await interaction.reply({
            content: "🛠 Sto creando/organizzando categorie e canali ITA/ENG...",
            ephemeral: true
        });

        const guild = interaction.guild;
        if (!guild) {
            await interaction.editReply("❌ Errore: guild non trovata.");
            return;
        }

        try {
            // Categorie principali
            const catWelcome = await getOrCreateCategory(guild, "🧭 Benvenuto • Welcome");
            const catCommunity = await getOrCreateCategory(guild, "💬 Community • Community");
            const catInGame = await getOrCreateCategory(guild, "🎮 In gioco • In-Game");
            const catVoice = await getOrCreateCategory(guild, "🎧 Vocali • Voice Channels");
            const catSupport = await getOrCreateCategory(guild, "🆘 Supporto • Support");
            const catStaff = await getOrCreateCategory(guild, "🛠 Staff • Staff Only");

            // --- CANALI WELCOME ---
            let rulesChannel = await guild.channels.fetch(RULES_CHANNEL_ID).catch(() => null);
            if (rulesChannel) {
                await rulesChannel.setName("📜┃regole・rules");
                await rulesChannel.setParent(catWelcome.id);
            } else {
                rulesChannel = await getOrCreateTextChannel(
                    guild,
                    "📜┃regole・rules",
                    catWelcome
                );
            }

            let newUserChannel = await guild.channels.fetch(NEW_USER_CHANNEL_ID).catch(() => null);
            if (newUserChannel) {
                await newUserChannel.setName("🎖┃nuovi-utenti・new-survivors");
                await newUserChannel.setParent(catWelcome.id);
            } else {
                newUserChannel = await getOrCreateTextChannel(
                    guild,
                    "🎖┃nuovi-utenti・new-survivors",
                    catWelcome
                );
            }

            await getOrCreateTextChannel(
                guild,
                "🧭┃info-sakhal・server-info",
                catWelcome
            );
            await getOrCreateTextChannel(
                guild,
                "📣┃annunci・announcements",
                catWelcome
            );

            // --- CANALI COMMUNITY ---
            await getOrCreateTextChannel(
                guild,
                "😎┃generale・general-chat",
                catCommunity
            );
            await getOrCreateTextChannel(
                guild,
                "📸┃screen・screenshots",
                catCommunity
            );
            await getOrCreateTextChannel(
                guild,
                "🎯┃storie-raid・raid-stories",
                catCommunity
            );
            await getOrCreateTextChannel(
                guild,
                "🌐┃international・english-chat",
                catCommunity
            );

            // --- CANALI IN-GAME ---
            await getOrCreateTextChannel(
                guild,
                "📢┃looking-for-team・lfg",
                catInGame
            );
            await getOrCreateTextChannel(
                guild,
                "💰┃commercio・trade",
                catInGame
            );
            await getOrCreateTextChannel(
                guild,
                "🎯┃raid-planning・raid-plans",
                catInGame
            );

            // --- VOCALI ---
            await getOrCreateVoiceChannel(
                guild,
                "🎧┃vocale-1・voice-1",
                catVoice
            );
            await getOrCreateVoiceChannel(
                guild,
                "🎧┃vocale-2・voice-2",
                catVoice
            );
            await getOrCreateVoiceChannel(
                guild,
                "🎤┃raid-squad・raid-squad",
                catVoice
            );

            // --- SUPPORTO ---
            await getOrCreateTextChannel(
                guild,
                "🎫┃ticket-supporto・tickets",
                catSupport
            );
            await getOrCreateTextChannel(
                guild,
                "🐞┃bug-report・bug-report",
                catSupport
            );
            await getOrCreateTextChannel(
                guild,
                "💡┃suggerimenti・suggestions",
                catSupport
            );

            // --- STAFF ---
            await getOrCreateTextChannel(
                guild,
                "🚫┃admin-log",
                catStaff
            );
            await getOrCreateTextChannel(
                guild,
                "🛠┃staff-chat",
                catStaff
            );
            await getOrCreateTextChannel(
                guild,
                "📋┃ban-log",
                catStaff
            );

            await interaction.editReply(
                "✅ Struttura categorie/canali ITA/ENG creata/aggiornata."
            );

        } catch (err) {
            console.error("❌ Errore setup-structure:", err);
            await interaction.editReply(
                "❌ Si è verificato un errore durante la creazione della struttura."
            );
        }

        return;
    }

    // ---------------- /ticket ----------------
    if (interaction.commandName === "ticket") {

        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply({
                content: "❌ Errore: guild non trovata.",
                ephemeral: true
            });
            return;
        }

        const supportCategoryName = "🆘 Supporto • Support";
        let catSupport = guild.channels.cache.find(
            c => c.type === ChannelType.GuildCategory && c.name === supportCategoryName
        );
        if (!catSupport) {
            catSupport = await getOrCreateCategory(guild, supportCategoryName);
        }

        const baseName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9\-]/g, "");
        const uniqueId = interaction.user.id.slice(-4);
        const channelName = `${baseName}-${uniqueId}`;

        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: catSupport.id,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                }
                // gli admin con Administrator vedono comunque il canale
            ]
        });

        await ticketChannel.send(`
🎫 **Nuovo ticket aperto da <@${interaction.user.id}>**

🇮🇹 Scrivi qui il tuo problema, domanda o segnalazione.  
Più dettagli dai, più velocemente lo staff può aiutarti.

🇬🇧 Write here your issue, question or report.  
The more details you give, the easier it is for the staff to help you.

Uno staffer risponderà appena possibile.
        `);

        await interaction.reply({
            content: `✅ Ticket creato: ${ticketChannel}`,
            ephemeral: true
        });

        return;
    }

    // ---------------- /bot-status ----------------
    if (interaction.commandName === "bot-status") {

        if (
            !interaction.memberPermissions ||
            !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)
        ) {
            await interaction.reply({
                content: "❌ Solo un amministratore può usare questo comando.",
                ephemeral: true
            });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const guild = interaction.guild;

            const botUptime = formatDuration(client.uptime || 0);
            const sysUptime = getSystemUptime();
            const memUsage = getMemoryUsage();
            const temp = await getRpiTemperature();
            const commit = await getGitShortCommit();
            const lastUpdate = getLastAutoUpdate();
            const ping = Math.round(client.ws.ping);

            const embed = new EmbedBuilder()
                .setTitle("📊 Bot & Raspberry Status")
                .setDescription("Stato attuale del bot e del Raspberry Pi.")
                .setColor("DarkBlue")
                .addFields(
                    {
                        name: "🤖 Bot",
                        value: `
• **Nome:** ${client.user.tag}
• **Ping Discord:** \`${ping} ms\`
• **Uptime bot:** \`${botUptime}\`
• **Server Discord:** ${guild ? guild.name : "n/d"}
                        `
                    },
                    {
                        name: "📦 Codice",
                        value: `
• **Commit attuale:** \`${commit}\`
• **Ultimo auto-update:** \`${lastUpdate}\`
                        `
                    },
                    {
                        name: "🧠 Raspberry Pi",
                        value: `
• **Hostname:** \`${os.hostname()}\`
• **Uptime sistema:** \`${sysUptime}\`
                        `
                    },
                    {
                        name: "🔥 Risorse",
                        value: `
• **RAM:** ${memUsage}
• **Temperatura CPU:** \`${temp}\`
                        `
                    }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error("❌ Errore /bot-status:", err);
            await interaction.editReply({
                content: "⚠ Errore nel recuperare lo stato. Controlla i log del Raspberry.",
            });
        }

        return;
    }
});

// ------------------------------------------------------------
// EVENTO: BOTTONI (ACCETTO REGOLE)
// ------------------------------------------------------------

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== "accept_rules") return;

    try {
        const member = interaction.member;

        if (!SURVIVOR_ROLE_ID) {
            return interaction.reply({
                content: "❌ Errore di configurazione: ruolo Survivor non impostato nel bot.",
                ephemeral: true
            });
        }

        const role = interaction.guild.roles.cache.get(SURVIVOR_ROLE_ID);
        if (!role) {
            return interaction.reply({
                content: "❌ Non trovo il ruolo Survivor sul server. Avvisa un admin.",
                ephemeral: true
            });
        }

        // Se ha già il ruolo
        if (member.roles.cache.has(SURVIVOR_ROLE_ID)) {
            return interaction.reply({
                content: "✅ Hai già accettato le regole ed hai già il ruolo Survivor.",
                ephemeral: true
            });
        }

        await member.roles.add(role);

        await interaction.update({
            content: "✔ Hai accettato le regole. Benvenuto sopravvissuto.",
            components: []
        });

        // DM con info server
        try {
            await member.send(`
👋 Benvenuto sopravvissuto.

Ora fai parte di **${SERVER_NAME}**.

🔥 Consigli:
- Non fidarti di nessuno
- Loota tutto
- Spara per primo
- Sopravvivi finché puoi

Good luck… you’ll need it. 💀

────────────────────────
🇮🇹 **Info server**

• Nome: ${SERVER_NAME}  
• Mappa: Sakhal  
• Stile: ${SERVER_STYLE}  
• Slot: ${SERVER_SLOTS}  
• Wipe: ${SERVER_WIPE}  
• Restart: ${SERVER_RESTART}  

🔌 Direct Connect (se disponibile):  
${SERVER_IP}

────────────────────────
🇬🇧 **Server info**

• Name: ${SERVER_NAME}  
• Map: Sakhal  
• Style: ${SERVER_STYLE}  
• Slots: ${SERVER_SLOTS}  
• Wipe: ${SERVER_WIPE}  
• Restart: ${SERVER_RESTART}  

🔌 Direct Connect:  
${SERVER_IP}
            `);
        } catch (err) {
            console.log("⚠ DM non consegnato (utente con DM chiusi).");
        }

    } catch (err) {
        console.error("❌ Errore nel bottone accept_rules:", err);
        if (!interaction.replied && !interaction.deferred) {
            interaction.reply({
                content: "⚠ Errore interno durante l'accettazione delle regole. Avvisa lo staff.",
                ephemeral: true
            }).catch(() => {});
        }
    }
});

// ------------------------------------------------------------
// GESTIONE ERRORI GLOBALI (PER NON FAR CRASHARE IL BOT)
// ------------------------------------------------------------

process.on("unhandledRejection", (reason, promise) => {
    console.error("🚨 UNHANDLED REJECTION:", reason);
});

process.on("uncaughtException", err => {
    console.error("🚨 UNCAUGHT EXCEPTION:", err);
});

// ------------------------------------------------------------
// AVVIO BOT
// ------------------------------------------------------------

registerCommands();
client.login(process.env.DISCORD_TOKEN);
