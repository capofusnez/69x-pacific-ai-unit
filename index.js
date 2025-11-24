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
// CONFIGURAZIONE COMPLETATA 💀
// -------------------------------------------

const RULES_CHANNEL_ID = "1442141514464759868";
const NEW_USER_CHANNEL_ID = "1442568117296562266";
const SURVIVOR_ROLE_ID = "1442570651696107711";

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
// REGISTRAZIONE COMANDI
// -------------------------------------------

const commands = [
    new SlashCommandBuilder()
        .setName("sendrules")
        .setDescription("Invia il messaggio delle regole nel canale")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
    try {
        console.log("🔄 Registrazione comandi slash...");
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log("✅ Comandi registrati.");
    } catch (error) {
        console.error("❌ Errore registrazione comandi:", error);
    }
}

// -------------------------------------------
// EVENTO READY
// -------------------------------------------

client.once("ready", () => {
    console.log(`🤖 Bot online come: ${client.user.tag}`);
});

// -------------------------------------------
// INVIO REGOLAMENTO CON BOTTONE
// -------------------------------------------

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "sendrules") {

        const embed = new EmbedBuilder()
            .setTitle("📜 Regole Server — 69x Pacific Land | Sakhal")
            .setDescription(`
Benvenuto nel server **69x Pacific Land Full PvP — Sakhal 🧭**

Prima di accedere devi accettare le regole:

💀 PvP Ovunque  
🚫 No cheat / exploit  
👀 No stream snipe abusivo  
🗣 Rispetta staff & player  
🔨 Bann permanenti per violazioni gravi  

Premi il bottone qui sotto per accettare ed entrare ufficialmente nella zona contaminata.
`)
            .setColor("DarkGreen")
            .setFooter({ text: "⚠ Non accettare = accesso limitato" });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("accept_rules")
                    .setLabel("✔ ACCETTO")
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: "Messaggio delle regole inviato ✔", ephemeral: true });
    }
});

// -------------------------------------------
// CLICK BOTTONE → ASSEGNA RUOLO
// -------------------------------------------

client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "accept_rules") {

        const role = interaction.guild.roles.cache.get(SURVIVOR_ROLE_ID);
        if (!role) return interaction.reply({ content: "❌ Ruolo Survivor non trovato.", ephemeral: true });

        await interaction.member.roles.add(role);

        await interaction.reply({ content: "✔ Regole accettate! Sei ora un Survivor.", ephemeral: true });

        const welcomeChannel = interaction.guild.channels.cache.get(NEW_USER_CHANNEL_ID);
        if (welcomeChannel) {
            welcomeChannel.send(`🎖 <@${interaction.user.id}> è entrato ufficialmente nel mondo malato di **Sakhal**.`);
        }

        interaction.user.send(`
👋 Benvenuto sopravvissuto.

Ora fai parte di **69x Pacific Land [Sakhal]**.

🔥 Consigli:
- Non fidarti di nessuno
- Loota tutto
- Spara per primo
- Sopravvivi finché puoi

Buona fortuna... ne avrai bisogno 💀
        `).catch(() => null);
    }
});

// -------------------------------------------
// LOGIN
// -------------------------------------------

registerCommands();
client.login(process.env.DISCORD_TOKEN);
