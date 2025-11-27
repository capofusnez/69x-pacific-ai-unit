// V 1.7 beta - 69x Pacific AI Unit
// Bot Discord per 69x Pacific Land | Sakhal

require("dotenv").config();

const os = require("os");
const fs = require("fs");
const path = require("path");

// ------------------------------------------------------------
// GEMINI: gestione sicura (modulo mancante / API mancante / errore)
// ------------------------------------------------------------

let GoogleGenerativeAI = null;
let genAI = null;

const AI_STATUS = {
    available: false,
    reason: null // "no-module" | "no-key" | "runtime-error"
};

try {
    ({ GoogleGenerativeAI } = require("@google/generative-ai"));
} catch (err) {
    console.log("⚠ Modulo '@google/generative-ai' non installato. L'AI sarà disabilitata.");
    AI_STATUS.available = false;
    AI_STATUS.reason = "no-module";
}

if (GoogleGenerativeAI) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
    if (!GEMINI_API_KEY) {
        console.log("⚠ Nessuna GEMINI_API_KEY trovata. L'AI sarà disabilitata.");
        AI_STATUS.available = false;
        AI_STATUS.reason = "no-key";
    } else {
        try {
            const gen = new GoogleGenerativeAI(GEMINI_API_KEY);
            genAI = gen.getGenerativeModel({ model: "gemini-1.5-flash" });
            AI_STATUS.available = true;
            AI_STATUS.reason = null;
            console.log("✅ Gemini inizializzato correttamente.");
        } catch (err) {
            console.log("⚠ Errore inizializzando Gemini:", err.message);
            AI_STATUS.available = false;
            AI_STATUS.reason = "runtime-error";
        }
    }
}

function getAiUnavailableMessage() {
    return "⚠ L'assistente AI di Sakhal non è al momento disponibile. Riprova più tardi o contatta lo staff.";
}

async function askGemini(prompt) {
    if (!AI_STATUS.available || !genAI) {
        throw new Error("AI_UNAVAILABLE");
    }

    const result = await genAI.generateContent({
        contents: [
            {
                role: "user",
                parts: [{ text: prompt }]
            }
        ]
    });

    const text =
        result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Non ho ricevuto una risposta valida da Gemini.";
    return text;
}

// ------------------------------------------------------------
// DISCORD.JS
// ------------------------------------------------------------

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
    ActivityType
} = require("discord.js");

// ------------------------------------------------------------
// COSTANTI / CONFIG
// ------------------------------------------------------------

const CLIENT_ID = process.env.CLIENT_ID || "1442475115743940611";
const SERVER_ID = process.env.SERVER_ID || "1442125105575628891";

const RULES_CHANNEL_ID = process.env.RULES_CHANNEL_ID || "1442141514464759868";
const RULES_CHANNEL_NAME = "📜│rules";

const SUPPORT_CATEGORY_NAME = "🆘 Supporto • Support";
const AI_CATEGORY_NAME = "🤖 AI Sessions";

const SERVER_CONFIG_FILE = path.join(__dirname, "serverconfig.json");
const LEVELS_FILE = path.join(__dirname, "levels.json");
const AI_SESSIONS_FILE = path.join(__dirname, "ai_sessions.json");
const PERMISSIONS_FILE = path.join(__dirname, "permissions.json");
const RULES_MESSAGE_FILE = path.join(__dirname, "rules_message.json");

// 🔹 Nuovo file per configurazione chat (messaggi corti)
const CHAT_CONFIG_FILE = path.join(__dirname, "chatconfig.json");

const AI_SESSION_TIMEOUT_MINUTES = 30;
const AI_SESSION_TIMEOUT_MS = AI_SESSION_TIMEOUT_MINUTES * 60 * 1000;

// ------------------------------------------------------------
// CONFIG CHAT (chatconfig.json) – lunghezza minima messaggi
// ------------------------------------------------------------

let chatConfig = {
    shortMinLength: 5 // default, modificabile da comando
};

function loadChatConfig() {
    try {
        if (fs.existsSync(CHAT_CONFIG_FILE)) {
            const raw = fs.readFileSync(CHAT_CONFIG_FILE, "utf8");
            chatConfig = JSON.parse(raw);
        } else {
            saveChatConfig();
        }
        console.log("💬 Config chat caricata:", chatConfig);
    } catch (err) {
        console.error("⚠ Errore caricando chatconfig.json:", err);
        chatConfig = { shortMinLength: 5 };
        saveChatConfig();
    }
}

function saveChatConfig() {
    try {
        fs.writeFileSync(CHAT_CONFIG_FILE, JSON.stringify(chatConfig, null, 2), "utf8");
        console.log("💾 chatconfig.json salvato.");
    } catch (err) {
        console.error("⚠ Errore salvando chatconfig.json:", err);
    }
}

loadChatConfig();

// ------------------------------------------------------------
// CONFIG SERVER (serverconfig.json)
// ------------------------------------------------------------

let serverConfig = null;

function getDefaultServerConfig() {
    return {
        name: "69x Pacific Land | Sakhal Full PvP",
        ip: "0.0.0.0",
        port: "2302",
        slots: 24,
        wipe: "Ogni 30 giorni",
        restart: "Ogni 2 ore",
        mods: "Trader, Custom Loot, Vehicles",
        style: "Full PvP - Hardcore",
        discord: "69x Pacific Land full PvP"
    };
}

function loadServerConfig() {
    try {
        if (fs.existsSync(SERVER_CONFIG_FILE)) {
            const raw = fs.readFileSync(SERVER_CONFIG_FILE, "utf8");
            serverConfig = JSON.parse(raw);
        } else {
            serverConfig = getDefaultServerConfig();
            saveServerConfig();
        }
        console.log("✅ Config server caricata.");
    } catch (err) {
        console.error("⚠ Errore nel caricare serverconfig.json:", err);
        serverConfig = getDefaultServerConfig();
    }
}

function saveServerConfig() {
    try {
        fs.writeFileSync(SERVER_CONFIG_FILE, JSON.stringify(serverConfig, null, 2), "utf8");
        console.log("💾 serverconfig.json salvato.");
    } catch (err) {
        console.error("⚠ Errore nel salvare serverconfig.json:", err);
    }
}

loadServerConfig();

// ------------------------------------------------------------
// SISTEMA XP (levels.json)
// ------------------------------------------------------------

let levelsData = {};

function loadLevels() {
    try {
        if (fs.existsSync(LEVELS_FILE)) {
            const raw = fs.readFileSync(LEVELS_FILE, "utf8");
            levelsData = JSON.parse(raw);
        } else {
            levelsData = {};
        }
        console.log("✅ Livelli caricati.");
    } catch (err) {
        console.error("⚠ Errore nel caricare levels.json:", err);
        levelsData = {};
    }
}

function saveLevels() {
    try {
        fs.writeFileSync(LEVELS_FILE, JSON.stringify(levelsData, null, 2), "utf8");
    } catch (err) {
        console.error("⚠ Errore nel salvare levels.json:", err);
    }
}

function ensureUserData(guildId, userId) {
    if (!levelsData[guildId]) levelsData[guildId] = {};
    if (!levelsData[guildId][userId]) levelsData[guildId][userId] = { xp: 0 };
}

function getLevelInfo(xp) {
    if (xp < 0) xp = 0;
    const level = Math.floor(Math.sqrt(xp / 100));
    const currentLevelXP = level * level * 100;
    const nextLevelXP = (level + 1) * (level + 1) * 100;
    const progress = xp - currentLevelXP;
    const needed = nextLevelXP - currentLevelXP;
    const progressPercent = needed > 0 ? Math.floor((progress / needed) * 100) : 100;
    return { level, xp, progress, needed, nextLevelXP, progressPercent };
}

function addXP(guildId, userId, amount) {
    if (amount === 0) return { leveledUp: false, newLevel: 0, xp: 0 };
    ensureUserData(guildId, userId);
    const data = levelsData[guildId][userId];

    const beforeInfo = getLevelInfo(data.xp);
    const beforeLevel = beforeInfo.level;

    data.xp += amount;
    if (data.xp < 0) data.xp = 0;

    const afterInfo = getLevelInfo(data.xp);
    const afterLevel = afterInfo.level;

    saveLevels();

    return {
        leveledUp: afterLevel > beforeLevel,
        newLevel: afterLevel,
        xp: data.xp
    };
}

function getUserLevelInfo(guildId, userId) {
    if (!levelsData[guildId] || !levelsData[guildId][userId]) {
        return getLevelInfo(0);
    }
    return getLevelInfo(levelsData[guildId][userId].xp);
}

loadLevels();

// ------------------------------------------------------------
// CONFIG XP & RUOLI (ID reali server)
// ------------------------------------------------------------

const RANK_ROLES = [
    { level: 0,  name: "Fresh Spawn",    roleId: "1442570652228784240" },
    { level: 1,  name: "Survivor",       roleId: "1442570651696107711" },
    { level: 5,  name: "Veteran Raider", roleId: "1442570650584875019" },
    { level: 10, name: "Field Officer",  roleId: "1442570649724784671" },
    { level: 15, name: "Command Unit",   roleId: "1442570648705568798" },
    { level: 20, name: "Overlord",       roleId: "1442570648022024292" }
];

const FRESH_SPAWN_ROLE_ID = "1442570652228784240";

async function updateRankRoles(guild, member, newLevel) {
    try {
        const availableRanks = RANK_ROLES.filter(r => newLevel >= r.level);
        if (availableRanks.length === 0) return;

        const bestRank = availableRanks[availableRanks.length - 1];
        const roleToAdd = guild.roles.cache.get(bestRank.roleId);

        if (!roleToAdd) {
            console.log(`⚠ Ruolo ID "${bestRank.roleId}" (${bestRank.name}) non trovato nel server.`);
            return;
        }

        if (member.roles.cache.has(roleToAdd.id)) return;

        for (const rank of RANK_ROLES) {
            if (rank.roleId === roleToAdd.id) continue;
            const oldRole = guild.roles.cache.get(rank.roleId);
            if (oldRole && member.roles.cache.has(oldRole.id)) {
                await member.roles.remove(oldRole).catch(() => {});
            }
        }

        await member.roles.add(roleToAdd).catch(() => {});
        console.log(
            `✅ Assegnato ruolo "${bestRank.name}" (${roleToAdd.id}) a ${member.user.tag} (lvl ${newLevel}).`
        );
    } catch (err) {
        console.error("⚠ Errore in updateRankRoles:", err);
    }
}

// ------------------------------------------------------------
// AI SESSIONS (canali personali) – ai_sessions.json
// ------------------------------------------------------------

let aiSessions = {};

function loadAiSessions() {
    try {
        if (fs.existsSync(AI_SESSIONS_FILE)) {
            const raw = fs.readFileSync(AI_SESSIONS_FILE, "utf8");
            aiSessions = JSON.parse(raw);
        } else {
            aiSessions = {};
            saveAiSessions();
        }
        console.log("✅ AI sessions caricate.");
    } catch (err) {
        console.error("⚠ Errore nel caricare ai_sessions.json:", err);
        aiSessions = {};
    }
}

function saveAiSessions() {
    try {
        fs.writeFileSync(AI_SESSIONS_FILE, JSON.stringify(aiSessions, null, 2), "utf8");
    } catch (err) {
        console.error("⚠ Errore nel salvare ai_sessions.json:", err);
    }
}

function startAiSessionCleanupLoop(client) {
    console.log("⏱ Loop pulizia canali AI avviato.");
    setInterval(async () => {
        const now = Date.now();
        for (const [channelId, session] of Object.entries(aiSessions)) {
            try {
                if (now - session.lastActivity < AI_SESSION_TIMEOUT_MS) continue;

                const guild = await client.guilds.fetch(session.guildId).catch(() => null);
                if (!guild) {
                    delete aiSessions[channelId];
                    saveAiSessions();
                    continue;
                }

                let ch = guild.channels.cache.get(channelId);
                if (!ch) ch = await guild.channels.fetch(channelId).catch(() => null);
                if (!ch) {
                    delete aiSessions[channelId];
                    saveAiSessions();
                    continue;
                }

                await ch.send("⌛ Questo canale AI è stato inattivo troppo a lungo e verrà eliminato.").catch(() => {});
                await ch.delete().catch(() => {});

                delete aiSessions[channelId];
                saveAiSessions();
            } catch (err) {
                console.error("⚠ Errore nella pulizia canale AI:", err);
            }
        }
    }, 5 * 60 * 1000);
}

loadAiSessions();

// ------------------------------------------------------------
// permissions.json – gestione ruoli che possono usare i comandi
// ------------------------------------------------------------

let botPermissions = {
    allowedRoles: [
        "1442570648022024292", // Overlord
        "1442570648705568798", // Command Unit
        "1442570649724784671"  // Field Officer
    ],
    ownerOverride: true
};

function loadPermissions() {
    try {
        if (fs.existsSync(PERMISSIONS_FILE)) {
            botPermissions = JSON.parse(fs.readFileSync(PERMISSIONS_FILE, "utf8"));
        } else {
            fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(botPermissions, null, 2), "utf8");
        }
        console.log("🔐 Permessi caricati:", botPermissions);
    } catch (err) {
        console.error("⚠ Errore caricando permissions.json:", err);
    }
}

function savePermissions() {
    try {
        fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(botPermissions, null, 2), "utf8");
    } catch (err) {
        console.error("⚠ Errore salvando permissions.json:", err);
    }
}

loadPermissions();

// ------------------------------------------------------------
// rules_message.json – gestione messaggio regole
// ------------------------------------------------------------

let rulesMessageInfo = {
    guildId: null,
    channelId: null,
    messageId: null
};

function loadRulesMessage() {
    try {
        if (fs.existsSync(RULES_MESSAGE_FILE)) {
            rulesMessageInfo = JSON.parse(fs.readFileSync(RULES_MESSAGE_FILE, "utf8"));
        } else {
            saveRulesMessage();
        }
        console.log("📜 Info messaggio regole caricata:", rulesMessageInfo);
    } catch (err) {
        console.error("⚠ Errore caricando rules_message.json:", err);
    }
}

function saveRulesMessage() {
    try {
        fs.writeFileSync(RULES_MESSAGE_FILE, JSON.stringify(rulesMessageInfo, null, 2), "utf8");
    } catch (err) {
        console.error("⚠ Errore salvando rules_message.json:", err);
    }
}

loadRulesMessage();

// ------------------------------------------------------------
// CLIENT DISCORD
// ------------------------------------------------------------

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences // 👈 per vedere se giocano a DayZ
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// ------------------------------------------------------------
// HELPER: rileva se sta giocando a DayZ
// ------------------------------------------------------------

function isPlayingDayZ(member) {
    const presence = member?.presence;
    if (!presence || !presence.activities || presence.activities.length === 0) {
        return false;
    }

    return presence.activities.some(a =>
        a.type === ActivityType.Playing &&
        a.name &&
        a.name.toLowerCase().includes("dayz")
    );
}

// ------------------------------------------------------------
// HELPER CANALI/CATEGORIE
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

// ------------------------------------------------------------
// TICKET HELPERS
// ------------------------------------------------------------

async function createTicketChannel(guild, user) {
    const catSupport = await getOrCreateCategory(guild, SUPPORT_CATEGORY_NAME);
    const baseName = `ticket-${user.username}`.toLowerCase().replace(/[^a-z0-9\-]/g, "");
    const uniqueId = user.id.slice(-4);
    const channelName = `${baseName}-${uniqueId}`;

    const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: catSupport.id,
        topic: `Ticket aperto da USERID: ${user.id}`,
        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            }
        ]
    });

    const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("ticket_close")
            .setLabel("🔒 Chiudi ticket / Close ticket")
            .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
        content: `
🎫 **Nuovo ticket aperto da <@${user.id}>**

🇮🇹 Scrivi qui il tuo problema, domanda o segnalazione.  
🇬🇧 Write here your issue, question or report.

Quando hai finito, chiudi il ticket con il pulsante qui sotto.
        `,
        components: [closeRow]
    });

    return channel;
}

// ------------------------------------------------------------
// AI CHANNEL HELPERS
// ------------------------------------------------------------

async function createAiChannel(guild, user) {
    const aiCategory = await getOrCreateCategory(guild, AI_CATEGORY_NAME);
    const baseName = `ai-${user.username}`.toLowerCase().replace(/[^a-z0-9\-]/g, "");
    const uniqueId = user.id.slice(-4);
    const channelName = `${baseName}-${uniqueId}`;

    const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: aiCategory.id,
        topic: `AI_SESSION | USERID: ${user.id}`,
        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            }
        ]
    });

    aiSessions[channel.id] = {
        guildId: guild.id,
        userId: user.id,
        lastActivity: Date.now()
    };
    saveAiSessions();

    const introEmbed = new EmbedBuilder()
        .setTitle("🤖 Canale personale con l'AI – Sakhal Assistant")
        .setDescription(
            `🇮🇹 Qui puoi fare domande sull'esperienza di gioco su **${serverConfig.name}**.\n\n` +
            `⏱ Questo canale verrà eliminato dopo **${AI_SESSION_TIMEOUT_MINUTES} minuti di inattività**.\n\n` +
            `🇬🇧 Here you can ask questions about **${serverConfig.name}**.\n` +
            `Channel will be auto-deleted after **${AI_SESSION_TIMEOUT_MINUTES} minutes of inactivity**.`
        )
        .setColor("DarkPurple");

    await channel.send({ embeds: [introEmbed] });

    return channel;
}

// ------------------------------------------------------------
// COMANDI SLASH
// ------------------------------------------------------------

const commands = [
    new SlashCommandBuilder()
        .setName("sendrules")
        .setDescription("Invia il messaggio delle regole bilingue con pulsante ACCETTO")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    new SlashCommandBuilder()
        .setName("info-sakhal")
        .setDescription("Mostra le info del server DayZ Sakhal")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    new SlashCommandBuilder()
        .setName("setup-structure")
        .setDescription("Crea/organizza categorie base (Supporto + AI) (solo admin)")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Apri un ticket con lo staff"),

    new SlashCommandBuilder()
        .setName("ai")
        .setDescription("Crea un canale personale per parlare con l'AI"),

    // XP
    new SlashCommandBuilder()
        .setName("xp-add")
        .setDescription("Aggiunge XP a un utente (solo staff)")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addUserOption(opt =>
            opt.setName("utente")
               .setDescription("Utente a cui dare gli XP")
               .setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName("quantita")
               .setDescription("Quantità di XP da aggiungere (può essere negativa)")
               .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("xp-panel")
        .setDescription("Invia un messaggio con il bottone per vedere i propri XP (solo staff)")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    // SERVER CONFIG
    new SlashCommandBuilder()
        .setName("server-info")
        .setDescription("Mostra le impostazioni attuali del server DayZ"),

    new SlashCommandBuilder()
        .setName("server-set")
        .setDescription("Modifica un parametro del server (solo staff)")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(opt =>
            opt.setName("chiave")
               .setDescription("Parametro (name, ip, port, slots, wipe, restart, mods, style)")
               .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName("valore")
               .setDescription("Nuovo valore")
               .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("server-reset")
        .setDescription("Ripristina configurazione server ai valori default (solo staff)")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    new SlashCommandBuilder()
        .setName("server-sync")
        .setDescription("Aggiorna embed info server nel canale regole/info (solo staff)")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    // PERMISSIONS MANAGEMENT
    new SlashCommandBuilder()
        .setName("perm-allow")
        .setDescription("Autorizza un ruolo ad usare i comandi del bot")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(opt =>
            opt.setName("ruolo")
               .setDescription("Ruolo da autorizzare")
               .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("perm-deny")
        .setDescription("Rimuove un ruolo dall'accesso ai comandi del bot")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(opt =>
            opt.setName("ruolo")
               .setDescription("Ruolo da rimuovere")
               .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("perm-list")
        .setDescription("Mostra quali ruoli sono autorizzati ai comandi del bot")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    // 🔹 NUOVO: gestione messaggi corti
    new SlashCommandBuilder()
        .setName("chat-short")
        .setDescription("Mostra o imposta la lunghezza minima dei messaggi (anti spam)")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(opt =>
            opt.setName("azione")
               .setDescription("Scegli se leggere o impostare")
               .setRequired(true)
               .addChoices(
                   { name: "Mostra valore attuale", value: "get" },
                   { name: "Imposta nuovo valore", value: "set" }
               )
        )
        .addIntegerOption(opt =>
            opt.setName("valore")
               .setDescription("Nuova lunghezza minima (2 - 200 caratteri)")
               .setRequired(false)
        )
];

// ------------------------------------------------------------
// REGISTRAZIONE COMANDI
// ------------------------------------------------------------

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, SERVER_ID),
            { body: commands.map(c => c.toJSON()) }
        );
        console.log("✅ Comandi slash registrati.");
    } catch (err) {
        console.error("⚠ Errore registrando i comandi:", err);
    }
}

// ------------------------------------------------------------
// AUTO-SETUP MESSAGGIO REGOLE
// ------------------------------------------------------------

function getRulesText() {
    return [
        "➡️ Premi il pulsante qui sotto per accettare le regole ed entrare nel server.",
        "➡️ Click the button below to **accept the rules** and enter the server.",
        "",
        "🇮🇹 **REGOLE GENERALI**",
        "- Vietati cheat, exploit, macro, glitch.",
        "- Vietati insulti razziali, minacce reali e contenuti NSFW (ban diretto).",
        "- Duping e bug abuse = ban permanente.",
        "",
        "⚔️ **PvP / Raid**",
        "- PvP ovunque (FULL PVP).",
        "- Vietato camping eccessivo dell'eventuale safezone.",
        "- Vietato combat log intenzionale.",
        "",
        "🏠 **Base Building**",
        "- Max 1 base per team.",
        "- No basi in glitch / map holes / zone protette.",
        "- La base deve essere raidabile.",
        "",
        "🚗 **Veicoli**",
        "- Veicoli lasciati in safezone >24h possono essere rimossi.",
        "- Vietato bloccare strade o trollare con i veicoli.",
        "",
        "👥 **Staff**",
        "- Lo staff ha l'ultima parola su interpretazione delle regole.",
        "",
        "🇬🇧 **GENERAL RULES**",
        "- No cheats, exploits, macros or glitches.",
        "- No racism, real life threats or NSFW content (instant ban).",
        "- Duping and bug abuse = permanent ban.",
        "",
        "⚔️ **PvP / Raiding**",
        "- PvP everywhere (FULL PvP).",
        "- No excessive camping of any safezone.",
        "- No intentional combat log.",
        "",
        "🏠 **Base Building**",
        "- Max 1 base per team.",
        "- No bases in glitches / map holes / protected areas.",
        "- Base must be raid-able.",
        "",
        "🚗 **Vehicles**",
        "- Vehicles left in safezone >24h may be removed.",
        "- No blocking roads or trolling with vehicles.",
        "",
        "👥 **Staff**",
        "- Staff always has the final word on rules."
    ].join("\n");
}

async function ensureRulesMessage(client) {
    try {
        const guild = await client.guilds.fetch(SERVER_ID).catch(() => null);
        if (!guild) {
            console.log("⚠ Guild non trovata per ensureRulesMessage.");
            return;
        }

        let channel = null;

        if (RULES_CHANNEL_ID) {
            channel = await guild.channels.fetch(RULES_CHANNEL_ID).catch(() => null);
        }

        if (!channel) {
            channel = guild.channels.cache.find(
                c => c.type === ChannelType.GuildText && c.name === RULES_CHANNEL_NAME
            );
        }

        if (!channel) {
            console.log(`⚠ Canale regole "${RULES_CHANNEL_NAME}" non trovato. Crealo o imposta RULES_CHANNEL_ID.`);
            return;
        }

        if (
            rulesMessageInfo.guildId === guild.id &&
            rulesMessageInfo.channelId === channel.id &&
            rulesMessageInfo.messageId
        ) {
            const msg = await channel.messages.fetch(rulesMessageInfo.messageId).catch(() => null);
            if (msg) {
                console.log("📜 Messaggio regole già presente, nessuna azione.");
                return;
            } else {
                console.log("📜 Messaggio regole salvato ma non trovato, lo ricreo...");
            }
        } else {
            console.log("📜 Nessun messaggio regole salvato, lo creo ora...");
        }

        const embed = new EmbedBuilder()
            .setTitle("📕 Rules / Regolamento – 69x Pacific Land (Full PvP)")
            .setDescription(getRulesText())
            .setColor("Red");

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("rules_accept_button")
                .setLabel("✅ Accetto le regole / I accept the rules")
                .setStyle(ButtonStyle.Success)
        );

        const msg = await channel.send({ embeds: [embed], components: [row] });

        rulesMessageInfo = {
            guildId: guild.id,
            channelId: channel.id,
            messageId: msg.id
        };
        saveRulesMessage();

        console.log("📜 Messaggio regole creato e salvato.");
    } catch (err) {
        console.error("⚠ Errore ensureRulesMessage:", err);
    }
}

// ------------------------------------------------------------
// INTERACTION HANDLER
// ------------------------------------------------------------

client.on("interactionCreate", async interaction => {
    // --------------------------------------------------------
    // PROTEZIONE COMANDI SLASH
    // --------------------------------------------------------
    if (interaction.isChatInputCommand()) {
        const member = interaction.member;
        const userId = interaction.user.id;
        const ownerId = process.env.OWNER_ID || null;
        const isOwner = ownerId && userId === ownerId;

        if (!(botPermissions.ownerOverride && isOwner)) {
            const isAllowed = member.roles.cache.some(r =>
                botPermissions.allowedRoles.includes(r.id)
            );

            if (!isAllowed) {
                return interaction.reply({
                    content: "⛔ Non hai i permessi per usare questo comando.",
                    ephemeral: true
                });
            }
        }

        const { commandName } = interaction;

        // ---------------- sendrules ----------------
        if (commandName === "sendrules") {
            const embed = new EmbedBuilder()
                .setTitle("📕 Rules / Regolamento – 69x Pacific Land (Full PvP)")
                .setDescription(getRulesText())
                .setColor("Red");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("rules_accept_button")
                    .setLabel("✅ Accetto le regole / I accept the rules")
                    .setStyle(ButtonStyle.Success)
            );

            const msg = await interaction.channel.send({ embeds: [embed], components: [row] });

            rulesMessageInfo = {
                guildId: interaction.guild.id,
                channelId: interaction.channel.id,
                messageId: msg.id
            };
            saveRulesMessage();

            return interaction.reply({
                content: "✅ Regole + pulsante ACCETTO inviate in questo canale.",
                ephemeral: true
            });
        }

        // ---------------- info-sakhal ----------------
        if (commandName === "info-sakhal") {
            loadServerConfig();
            const embed = new EmbedBuilder()
                .setTitle("📌 Info server DayZ – Sakhal")
                .setColor("Aqua")
                .setDescription(
                    `**Nome:** ${serverConfig.name}\n` +
                    `**IP:** ${serverConfig.ip}:${serverConfig.port}\n` +
                    `**Slot:** ${serverConfig.slots}\n` +
                    `**Wipe:** ${serverConfig.wipe}\n` +
                    `**Restart:** ${serverConfig.restart}\n` +
                    `**Mods:** ${serverConfig.mods}\n` +
                    `**Stile:** ${serverConfig.style}`
                );
            return interaction.reply({ embeds: [embed], ephemeral: false });
        }

        // ---------------- setup-structure ----------------
        if (commandName === "setup-structure") {
            await getOrCreateCategory(interaction.guild, SUPPORT_CATEGORY_NAME);
            await getOrCreateCategory(interaction.guild, AI_CATEGORY_NAME);

            return interaction.reply({
                content: "✅ Struttura base (Supporto + AI Sessions) verificata/creata.",
                ephemeral: true
            });
        }

        // ---------------- ticket ----------------
        if (commandName === "ticket") {
            const channel = await createTicketChannel(interaction.guild, interaction.user);
            return interaction.reply({
                content: `📩 Ticket creato: ${channel}`,
                ephemeral: true
            });
        }

        // ---------------- ai ----------------
        if (commandName === "ai") {
            if (!AI_STATUS.available) {
                return interaction.reply({
                    content: getAiUnavailableMessage(),
                    ephemeral: true
                });
            }

            const channel = await createAiChannel(interaction.guild, interaction.user);
            return interaction.reply({
                content: `🤖 Canale AI creato: ${channel}`,
                ephemeral: true
            });
        }

        // ---------------- xp-add ----------------
        if (commandName === "xp-add") {
            const target = interaction.options.getUser("utente", true);
            const qta = interaction.options.getInteger("quantita", true);

            const res = addXP(interaction.guild.id, target.id, qta);
            const info = getUserLevelInfo(interaction.guild.id, target.id);

            try {
                const memberTarget = await interaction.guild.members.fetch(target.id);
                await updateRankRoles(interaction.guild, memberTarget, info.level);
            } catch (err) {
                console.error("Errore updateRankRoles in /xp-add:", err);
            }

            return interaction.reply({
                content: `✅ Aggiunti **${qta} XP** a **${target.username}**.\nOra ha **${info.xp} XP** (livello **${info.level}**).`,
                ephemeral: true
            });
        }

        // ---------------- xp-panel ----------------
        if (commandName === "xp-panel") {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("xp_show_button")
                    .setLabel("📊 Mostra i miei XP")
                    .setStyle(ButtonStyle.Primary)
            );

            const embed = new EmbedBuilder()
                .setTitle("📈 Sistema XP – 69x Pacific Land")
                .setDescription(
                    "Clicca il pulsante qui sotto per vedere **i tuoi XP e il tuo livello attuale**.\n\n" +
                    "Lo staff può assegnare XP extra per eventi, segnalazioni utili, ecc."
                )
                .setColor("Gold");

            await interaction.reply({
                content: "Pannello XP creato.",
                ephemeral: true
            });

            await interaction.channel.send({ embeds: [embed], components: [row] });
        }

        // ---------------- server-info ----------------
        if (commandName === "server-info") {
            loadServerConfig();
            const embed = new EmbedBuilder()
                .setTitle("📌 Configurazione Server DayZ")
                .setColor("Aqua")
                .setDescription(
                    `**Nome:** ${serverConfig.name}\n` +
                    `**IP:** ${serverConfig.ip}\n` +
                    `**Porta:** ${serverConfig.port}\n` +
                    `**Slot:** ${serverConfig.slots}\n` +
                    `**Wipe:** ${serverConfig.wipe}\n` +
                    `**Restart:** ${serverConfig.restart}\n` +
                    `**Mods:** ${serverConfig.mods}\n` +
                    `**Stile:** ${serverConfig.style}`
                );

            return interaction.reply({ embeds: [embed], ephemeral: false });
        }

        // ---------------- server-set ----------------
        if (commandName === "server-set") {
            const key = interaction.options.getString("chiave", true);
            const val = interaction.options.getString("valore", true);

            if (!Object.prototype.hasOwnProperty.call(serverConfig, key)) {
                return interaction.reply({
                    content: `⚠️ Il parametro **${key}** non esiste in serverconfig.json.`,
                    ephemeral: true
                });
            }

            serverConfig[key] = isNaN(val) ? val : Number(val);
            saveServerConfig();

            return interaction.reply({
                content: `✅ Parametro **${key}** aggiornato a:\n\`${serverConfig[key]}\``,
                ephemeral: true
            });
        }

        // ---------------- server-reset ----------------
        if (commandName === "server-reset") {
            serverConfig = getDefaultServerConfig();
            saveServerConfig();

            return interaction.reply({
                content: "♻️ Config server ripristinata ai valori di default.",
                ephemeral: true
            });
        }

        // ---------------- server-sync ----------------
        if (commandName === "server-sync") {
            let channel = null;
            if (RULES_CHANNEL_ID) {
                channel = await interaction.guild.channels.fetch(RULES_CHANNEL_ID).catch(() => null);
            }
            if (!channel) {
                channel = interaction.guild.channels.cache.find(
                    c => c.type === ChannelType.GuildText && c.name === RULES_CHANNEL_NAME
                );
            }

            if (!channel) {
                return interaction.reply({
                    content: `❌ Canale info/regole non trovato (cerca "${RULES_CHANNEL_NAME}" o imposta RULES_CHANNEL_ID).`,
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("📌 Server Info — 69x Pacific Land")
                .setColor("Green")
                .setDescription(
                    `**Nome:** ${serverConfig.name}\n` +
                    `**IP:** ${serverConfig.ip}:${serverConfig.port}\n` +
                    `**Slot:** ${serverConfig.slots}\n` +
                    `**Wipe:** ${serverConfig.wipe}\n` +
                    `**Restart:** ${serverConfig.restart}\n` +
                    `**Mods:** ${serverConfig.mods}`
                );

            await channel.send({ embeds: [embed] });

            return interaction.reply({
                content: "📨 Pannello info server aggiornato!",
                ephemeral: true
            });
        }

        // ---------------- perm-allow ----------------
        if (commandName === "perm-allow") {
            const role = interaction.options.getRole("ruolo", true);

            if (!botPermissions.allowedRoles.includes(role.id)) {
                botPermissions.allowedRoles.push(role.id);
                savePermissions();
            }

            return interaction.reply({
                content: `✅ Ruolo **${role.name}** ora può usare i comandi del bot.`,
                ephemeral: true
            });
        }

        // ---------------- perm-deny ----------------
        if (commandName === "perm-deny") {
            const role = interaction.options.getRole("ruolo", true);

            botPermissions.allowedRoles = botPermissions.allowedRoles.filter(r => r !== role.id);
            savePermissions();

            return interaction.reply({
                content: `🚫 Il ruolo **${role.name}** NON può più usare i comandi del bot.`,
                ephemeral: true
            });
        }

        // ---------------- perm-list ----------------
        if (commandName === "perm-list") {
            const list = botPermissions.allowedRoles.length
                ? botPermissions.allowedRoles.map(id => `<@&${id}>`).join("\n")
                : "❌ Nessun ruolo autorizzato.";

            return interaction.reply({
                content: `🔐 **Ruoli autorizzati:**\n${list}`,
                ephemeral: true
            });
        }

        // ---------------- chat-short ----------------
        if (commandName === "chat-short") {
            const action = interaction.options.getString("azione", true); // "get" | "set"
            const value = interaction.options.getInteger("valore");

            if (action === "get") {
                return interaction.reply({
                    content:
                        `💬 Lunghezza minima messaggi attuale: **${chatConfig.shortMinLength}** caratteri.\n` +
                        `Messaggi più corti (senza allegati) vengono rimossi automaticamente.`,
                    ephemeral: true
                });
            }

            if (action === "set") {
                if (value === null) {
                    return interaction.reply({
                        content: "⚠ Devi specificare un valore numerico per `valore`.",
                        ephemeral: true
                    });
                }

                if (value < 2 || value > 200) {
                    return interaction.reply({
                        content: "⚠ Il valore deve essere compreso tra **2** e **200** caratteri.",
                        ephemeral: true
                    });
                }

                chatConfig.shortMinLength = value;
                saveChatConfig();

                return interaction.reply({
                    content: `✅ Lunghezza minima messaggi aggiornata a **${value}** caratteri.`,
                    ephemeral: true
                });
            }
        }
    }

    // --------------------------------------------------------
    // BUTTONS
    // --------------------------------------------------------
    if (interaction.isButton()) {
        const id = interaction.customId;

        // Bottone "ACCETTO LE REGOLE"
        if (id === "rules_accept_button") {
            const member = interaction.member;

            const xpRoles = RANK_ROLES.map(r => r.roleId).filter(Boolean);
            const freshRole = xpRoles[0] || FRESH_SPAWN_ROLE_ID;
            const userRoles = member.roles.cache.map(r => r.id);

            const hasHigherRank = xpRoles.slice(1).some(r => userRoles.includes(r));

            if (hasHigherRank) {
                return interaction.reply({
                    content:
                        "🛡 Hai già un rango più alto — non serve premere di nuovo.\n\n" +
                        "🛡 You already have a higher rank — no need to press again.",
                    ephemeral: true
                });
            }

            if (userRoles.includes(freshRole)) {
                return interaction.reply({
                    content:
                        "✔ Hai già accettato le regole.\n" +
                        "✔ You already accepted the rules.",
                    ephemeral: true
                });
            }

            const roleObj = interaction.guild.roles.cache.get(freshRole);
            if (!roleObj) {
                return interaction.reply({
                    content:
                        "⚠ Errore: ruolo Fresh Spawn non trovato. Avvisa lo staff.\n" +
                        "⚠ Error: Fresh Spawn role not found. Contact staff.",
                    ephemeral: true
                });
            }

            try {
                await member.roles.add(roleObj, "Ha accettato le regole");
            } catch (err) {
                console.error("Errore assegnando Fresh Spawn:", err);
                return interaction.reply({
                    content:
                        "⚠ Errore durante l'assegnazione del ruolo. Avvisa lo staff.\n" +
                        "⚠ Error assigning role. Contact staff.",
                    ephemeral: true
                });
            }

            return interaction.reply({
                content:
                    "🔥 Benvenuto sopravvissuto — ora sei un **Fresh Spawn**.\n" +
                    "Ricorda: nessuno verrà a salvarti.\n\n" +
                    "🔥 Welcome survivor — you are now a **Fresh Spawn**.\n" +
                    "Remember: no one is coming to save you.",
                ephemeral: true
            });
        }

        // XP – Mostra i miei XP
        if (id === "xp_show_button") {
            const info = getUserLevelInfo(interaction.guild.id, interaction.user.id);

            return interaction.reply({
                content:
                    `📊 **${interaction.user.username}**\n` +
                    `XP totali: **${info.xp}**\n` +
                    `Livello: **${info.level}**\n` +
                    `Progresso livello: **${info.progress}/${info.needed}** (${info.progressPercent}%)`,
                ephemeral: true
            });
        }

        // Ticket – chiudi
        if (id === "ticket_close") {
            await interaction.reply({
                content: "🔒 Ticket chiuso. Il canale verrà eliminato tra pochi secondi.",
                ephemeral: false
            });

            setTimeout(async () => {
                try {
                    await interaction.channel.delete("Ticket chiuso");
                } catch (err) {
                    console.error("⚠ Errore cancellando ticket:", err);
                }
            }, 5000);
        }
    }
});

// ------------------------------------------------------------
// MESSAGGI – filtro messaggi corti + XP (solo se sta giocando a DayZ) + AI
// ------------------------------------------------------------

client.on("messageCreate", async message => {
    if (!message.guild || message.author.bot) return;

    const guildId = message.guild.id;
    const userId = message.author.id;

    const isTicket = message.channel.name?.startsWith("ticket-");
    const isAI = message.channel.topic && message.channel.topic.includes("AI_SESSION");

    const member = message.member;

    // --------------------------------------------------------
    // FILTRO MESSAGGI CORTI (anti spam)
    // Non si applica a: ticket, AI, messaggi con allegati
    // --------------------------------------------------------
    const content = (message.content || "").trim();

    if (
        !isTicket &&
        !isAI &&
        member &&
        content.length > 0 &&
        content.length < chatConfig.shortMinLength &&
        message.attachments.size === 0
    ) {
        try {
            await message.delete();
        } catch (err) {
            console.error("⚠ Errore cancellando messaggio corto:", err);
            return;
        }

        try {
            const warn = await message.channel.send(
                `💬 ${message.author}, i messaggi troppo corti vengono rimossi per evitare spam.`
            );
            setTimeout(() => {
                warn.delete().catch(() => {});
            }, 5000);
        } catch (err) {
            console.error("⚠ Errore inviando avviso messaggio corto:", err);
        }

        return; // niente XP / AI per questo messaggio
    }

    // --------------------------------------------------------
    // XP solo in canali normali (no ticket, no AI) E solo se sta giocando a DayZ
    // (al momento XP per messaggi = 0, lasciato per futura riattivazione)
    // --------------------------------------------------------
    if (!isTicket && !isAI && member) {
        if (isPlayingDayZ(member)) {
            const res = addXP(guildId, userId, 0); // 0 = XP disattivati
            const beforeLevel = getLevelInfo(res.xp - 0).level;
            if (res.newLevel > beforeLevel) {
                try {
                    const guildMember = await message.guild.members.fetch(userId);
                    await updateRankRoles(message.guild, guildMember, res.newLevel);
                } catch (err) {
                    console.error("⚠ Errore updateRankRoles in messageCreate:", err);
                }
            }
        }
    }

    // --------------------------------------------------------
    // Gestione AI nei canali AI_SESSION
    // --------------------------------------------------------
    if (isAI) {
        if (!aiSessions[message.channel.id]) {
            aiSessions[message.channel.id] = {
                guildId,
                userId,
                lastActivity: Date.now()
            };
        } else {
            aiSessions[message.channel.id].lastActivity = Date.now();
        }
        saveAiSessions();

        if (!AI_STATUS.available || !genAI) {
            return message.reply(getAiUnavailableMessage()).catch(() => {});
        }

        try {
            await message.channel.sendTyping();
            const reply = await askGemini(
                `Server 69x Pacific Land | Utente: ${message.author.tag} | Messaggio: ${message.content}`
            );
            await message.channel.send(reply);
        } catch (err) {
            console.error("⚠ Errore AI:", err);
            await message.channel.send(getAiUnavailableMessage()).catch(() => {});
        }
    }
});

// ------------------------------------------------------------
// READY
// ------------------------------------------------------------

client.once("ready", async () => {
    console.log(`✅ Loggato come ${client.user.tag}`);
    client.user.setPresence({
        activities: [{ name: "69x Pacific Land | FULL PvP", type: ActivityType.Playing }],
        status: "online"
    });

    await registerCommands();
    startAiSessionCleanupLoop(client);
    await ensureRulesMessage(client);
});

// ------------------------------------------------------------
// LOGIN
// ------------------------------------------------------------

client.login(process.env.DISCORD_TOKEN);
