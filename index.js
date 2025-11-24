require("dotenv").config();
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
    EmbedBuilder
} = require("discord.js");

// -------------------------------------------
// CONFIGURAZIONE SERVER
// -------------------------------------------

const CLIENT_ID = "1442475115743940611";
const SERVER_ID = "1442125105575628891";

const RULES_CHANNEL_ID = "1442141514464759868";     // canale regole (non usato direttamente, ma utile)
const NEW_USER_CHANNEL_ID = "1442568117296562266";  // canale nuovi utenti / presentazioni
const SURVIVOR_ROLE_ID = "1442570651696107711";     // ruolo Survivor

// --- INFO SERVER SAKHAL (MODIFICA QUI IN BASE AL TUO SERVER) ---
const SERVER_NAME = "69x Pacific Land | Sakhal Full PvP";
const SERVER_IP = "IP:PORTA (modifica qui)"; // es: "123.45.67.89:2302"
const SERVER_SLOTS = "60 slot (modifica se diverso)";
const SERVER_WIPE = "Wipe completo ogni 30 giorni (modifica se diverso)";
const SERVER_RESTART = "Restart ogni 4 ore (modifica se diverso)";
const SERVER_DISCORD = "Questo Discord ufficiale";
const SERVER_MODS = "PVE & PVP mix? / Trader? / Custom loot? (scrivi tu)";
const SERVER_STYLE = "Hardcore survival, full PvP, niente favoritismi staff";

// -------------------------------------------
// CLIENT
// -------------------------------------------

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// -------------------------------------------
// REGISTRAZIONE COMANDI (GUILD SPECIFIC)
// -------------------------------------------

const commands = [
    new SlashCommandBuilder()
        .setName("sendrules")
        .setDescription("Invia il messaggio delle regole nel canale corrente"),
    new SlashCommandBuilder()
        .setName("info-sakhal")
        .setDescription("Mostra le info del server DayZ Sakhal")
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

// -------------------------------------------
// READY EVENT
// -------------------------------------------

client.once("ready", () => {
    console.log(`🤖 Bot online come: ${client.user.tag}`);
});

// -------------------------------------------
// COMANDO /sendrules – Regole ITA + ENG + bottone
// -------------------------------------------

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "sendrules") {

        const embed = new EmbedBuilder()
            .setTitle("📜 Regole del Server – Zona Controllata")
            .setDescription(`
> "Questo non è un gioco. È sopravvivenza."

**🇮🇹 ITALIANO**

**1️⃣ Rispetto obbligatorio**  
Nessun insulto, razzismo, sessismo, bullismo o provocazione verso altri membri.  
Siamo qui per divertirci, non per creare caos tossico.

**2️⃣ Niente spam o flood**  
Evita messaggi ripetitivi, tag inutili, pubblicità, link sospetti o autopromozione senza permesso.

**3️⃣ Segui la gerarchia**  
Le decisioni dello staff sono definitive.  
Discussioni civili ok, mancanza di rispetto no.

**4️⃣ Usa i canali giusti**  
Se c’è un canale dedicato, usalo.  
Evita di scrivere ovunque o aprire thread inutili.

**5️⃣ Vietati cheat, exploit e glitch**  
Qualsiasi giocatore colto a barare nel server DayZ verrà bannato permanentemente.  
Mod non autorizzate o tentativi di manipolazione = punizione immediata.

**6️⃣ No divulgazione dati personali**  
Non condividere informazioni private tue o di altri.  
Nessun doxxing, minacce o comportamenti illegali.

**7️⃣ NSFW vietato**  
Niente foto/video sessuali o estremi.  
Contenuti gore reali vietati (gore da gioco ok).

**8️⃣ Drama? No, grazie**  
Se hai un problema con un membro, contatta lo staff.  
Flame war, insulti pubblici e vendette non sono tollerati.

**9️⃣ Linguaggio**  
Puoi parlare liberamente, ma con buon senso.  
Meme e battute ok — discriminazioni no.

**🔟 Staff > tutto**  
Lo staff può aggiornare, modificare o aggiungere regole in qualsiasi momento per migliorare la community.

**🩸 Conseguenze delle violazioni**  
• Infrazione minore → Avviso  
• Ripetuta → Mute temporaneo  
• Grave → Kick o Ban permanente  

**🧭 Ultimo punto**  
Se sei qui per divertirti, sopravvivere e fare parte della community: benvenuto.  
Se sei qui per rovinare l’esperienza agli altri: verrai eliminato.

────────────────────────

**🇬🇧 ENGLISH**

**1️⃣ Respect is mandatory**  
No insults, racism, sexism, bullying or provoking other members.  
We are here to have fun, not to be toxic.

**2️⃣ No spam or flood**  
Avoid repeated messages, useless pings, ads, scam links or self-promo without permission.

**3️⃣ Follow the staff hierarchy**  
Staff decisions are final.  
Civil discussion is fine, disrespect is not.

**4️⃣ Use the correct channels**  
If a channel is dedicated to something, use it.  
Don’t write everywhere or open useless threads.

**5️⃣ No cheats, exploits or glitches**  
Anyone caught cheating on the DayZ server will be permanently banned.  
Unauthorized mods or manipulation attempts = instant punishment.

**6️⃣ No personal data sharing**  
Do not share your or others’ private info.  
No doxxing, threats or illegal behaviour.

**7️⃣ NSFW is forbidden**  
No sexual or extreme content.  
Real-life gore is forbidden (in-game gore is fine).

**8️⃣ No drama**  
If you have an issue with someone, contact the staff.  
Flame wars, public insults and revenge are not tolerated.

**9️⃣ Language**  
You can talk freely, but with common sense.  
Memes and jokes are ok — discrimination is not.

**🔟 Staff > everything**  
Staff can update, change or add rules anytime to protect the community.

**🩸 Violations consequences**  
• Minor → Warning  
• Repeated → Temporary mute  
• Serious → Kick or permanent ban  

**🧭 Last point**  
If you’re here to survive, have fun and be part of the community: welcome.  
If you’re here to ruin the experience: you will be removed.
            `)
            .setColor("DarkGreen")
            .setFooter({ text: "⚠ Premi ACCETTO per entrare ufficialmente nel server" });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("accept_rules")
                    .setLabel("✔ ACCETTO")
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: "Regole inviate ✔", ephemeral: true });
    }

    // -------------------------------------------
    // COMANDO /info-sakhal – Info server ITA + ENG
    // -------------------------------------------
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
                    value: `
${SERVER_MODS}

*(Personalizza questa sezione nel codice: armi, veicoli, trader, AI, ecc.)*
                    `
                },
                {
                    name: "🌐 Connessione / Connection",
                    value: `
**Direct Connect:**  
\`${SERVER_IP}\`

Se non funziona, cerca il nome **${SERVER_NAME}** nella lista server DayZ.
                    `
                },
                {
                    name: "🇬🇧 ENGLISH QUICK INFO",
                    value: `
• **Map:** Sakhal  
• **Style:** ${SERVER_STYLE}  
• **Slots:** ${SERVER_SLOTS}  
• **Wipe:** ${SERVER_WIPE}  
• **Restart:** ${SERVER_RESTART}  

**Direct Connect:** \`${SERVER_IP}\`  

If it doesn't show up, search for **${SERVER_NAME}** in the DayZ server browser.
                    `
                }
            )
            .setColor("DarkGold")
            .setFooter({ text: "Aggiorna IP, wipe e info direttamente nel codice se cambi qualcosa." });

        await interaction.reply({ embeds: [embedInfo] });
    }
});

// -------------------------------------------
// CLICK BOTTONE → ASSEGNA RUOLO + ANNUNCIO + DM
// -------------------------------------------

client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== "accept_rules") return;

    const role = interaction.guild.roles.cache.get(SURVIVOR_ROLE_ID);
    if (!role) {
        return interaction.reply({ content: "❌ Ruolo Survivor non trovato.", ephemeral: true });
    }

    // Assegna ruolo
    await interaction.member.roles.add(role);

    // Risposta privata nel canale
    await interaction.reply({ content: "✔ Regole accettate! Sei ora un Survivor.", ephemeral: true });

    // Messaggio nel canale nuovi utenti
    const welcomeChannel = interaction.guild.channels.cache.get(NEW_USER_CHANNEL_ID);
    if (welcomeChannel) {
        welcomeChannel.send(`🎖 <@${interaction.user.id}> è entrato ufficialmente nel mondo malato di **Sakhal**.`);
    }

    // DM al giocatore
    interaction.user.send(`
👋 Benvenuto sopravvissuto.

Ora fai parte di **69x Pacific Land [Sakhal]**.

🔥 Consigli:
- Non fidarti di nessuno
- Loota tutto
- Spara per primo
- Sopravvivi finché puoi

Good luck… you’ll need it. 💀
    `).catch(() => null);
});

// -------------------------------------------
// AVVIO
// -------------------------------------------

registerCommands();
client.login(process.env.DISCORD_TOKEN);
