// ------------------------------------------------------------
// 69x Pacific AI Unit - Bot Discord per 69x Pacific Land Sakhal
// Versione per Raspberry Pi con ticket + bot-status
// ------------------------------------------------------------

require("dotenv").config();

const os = require("os");
const { exec } = require("child_process");
const fs = require("fs");

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
// CONFIGURAZIONE BASE
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

// Nome categoria supporto (usata per i ticket)
const SUPPORT_CATEGORY_NAME = "🆘 Supporto • Support";

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
// HELPER PER CATEGORIE E CANALI
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
    try {
        const out = await execPromise("vcgencmd measure_temp", "/");
        const match = out.match(/temp=([0-9.]+)'C/);
        if (match) return `${match[1]}°C`;
        return out || "n/d";
    } catch {
        return "n/d";
    }
}

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
// HELPER PER I TICKET (creazione canale + messaggio + pulsante chiusura)
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
            // gli admin con Administrator vedono comunque il canale
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
Più dettagli dai, più velocemente lo staff può aiutarti.

🇬🇧 Write here your issue, question or report.  
The more details you give, the easier it is for the staff to help you.

Quando hai finito, puoi chiudere il ticket con il pulsante qui sotto.
        `,
        components: [closeRow]
    });

    return channel;
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
        .setName("ticket-panel")
        .setDescription("Invia il pannello con pulsante per aprire ticket (solo admin)")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName("bot-status")
        .setDescription("Mostra stato bot e Raspberry Pi (solo admin)")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

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
// EVENTO: NUOVO MEMBRO ENTRA NEL SERVER
// ------------------------------------------------------------

client.on(Events.GuildMemberAdd, async member => {
    try {
        const channel = member.guild.channels.cache.get(NEW_USER_CHANNEL_ID);
        if (channel) {
            channel.send(`🎖 <@${member.id}> è entrato nel territorio di **Sakhal**.`);
        }

        await member.send(`
👋 Benvenuto su **${SERVER_NAME}**

Ricorda:
- Leggi le regole nel canale regole/rules
- Accetta per ottenere il ruolo Survivor
- Poi puoi usare i canali testuali e vocali

Good luck, survivor. 💀
        `);
    } catch {
        console.log("⚠ Impossibile mandare DM all'utente (probabile DM chiusi).");
    }
});

// ------------------------------------------------------------
// EVENTO: INTERAZIONI COMANDI SLASH
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
            const catSupport = await getOrCreateCategory(guild, SUPPORT_CATEGORY_NAME);
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
            await getOrCreateTextChanne
