//---------------------------------------------------------
// 69x Pacific AI Unit – Full System | Made for Render
//---------------------------------------------------------

require("dotenv").config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require("discord.js");
const express = require("express");

// ----------- HTTP SERVER per Render ---------------------
const app = express();
app.get("/", (req, res) => res.send("Bot attivo - 69x Pacific AI Unit is running!"));
app.listen(process.env.PORT || 3000, () => console.log("🌍 HTTP server avviato per Render"));

// ---------- CONFIG ---------------------------------------
const SERVER_ID = process.env.SERVER_ID;
const RULES_CHANNEL_ID = process.env.RULES_CHANNEL_ID;
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;
const SURVIVOR_ROLE_ID = process.env.SURVIVOR_ROLE_ID || null;

const SERVER_NAME = "69x Pacific Land | Sakhal Full PvP";
const SERVER_MAP = "🗺 Mappa: Sakhal";
const SERVER_IP = "🌐 IP Server: (inserisci IP e porta)";

// ---------------------------------------------------------
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

//----------------------------------------------------------
// BOT ONLINE
//----------------------------------------------------------
client.once("ready", () => {
    console.log(`🤖 Bot online come: ${client.user.tag}`);
    client.user.setActivity("👀 Guardando Sopravvissuti");
});

//----------------------------------------------------------
// WELCOME SYSTEM AUTOMATICO
//----------------------------------------------------------
client.on(Events.GuildMemberAdd, async member => {
    try {
        const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);

        if (channel) {
            channel.send(`🔥 **${member.user.username} è entrato nel territorio!**\nBenvenuto sopravvissuto.`);
        }

        // Messaggio privato
        await member.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle("👋 Benvenuto nel server!")
                    .setDescription(`Sei entrato in **${SERVER_NAME}**\n\n📌 Informazioni:\n${SERVER_MAP}\n${SERVER_IP}`)
                    .setColor("#ff0000")
            ]
        });

    } catch (err) {
        console.log("⚠ Errore DM disattivati:", err.message);
    }
});

//----------------------------------------------------------
// INVIO REGOLE CON BOTTONE ACCETTA
//----------------------------------------------------------
client.on(Events.InteractionCreate, async interaction => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "rules") {

        const embed = new EmbedBuilder()
            .setTitle("📜 RULES | REGOLE")
            .setDescription("Leggi le regole e premi **Accept / Accetta** per continuare")
            .setColor("#ff1100");

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("accept_rules")
                .setLabel("✔ ACCEPT / ACCETTA")
                .setStyle(ButtonStyle.Success)
        );

        await interaction.reply({ embeds: [embed], components: [button], ephemeral: true });
    }
});

//⚠ BOTTONE ACCETTA
client.on(Events.InteractionCreate, async interaction => {

    if (!interaction.isButton()) return;
    if (interaction.customId !== "accept_rules") return;

    const member = interaction.member;

    // Se ha già il ruolo → non di nuovo.
    if (member.roles.cache.has(SURVIVOR_ROLE_ID)) {
        return interaction.reply({ content: "Hai già accettato le regole ✔", ephemeral: true });
    }

    await member.roles.add(SURVIVOR_ROLE_ID);

    await interaction.update({
        content: "✔ Hai accettato le regole. Benvenuto sopravvissuto.",
        components: []
    });

    // invio info server
    try {
        await member.send(`📌 **SERVER INFO**\n${SERVER_NAME}\n${SERVER_MAP}\n${SERVER_IP}`);
    } catch { }
});

//----------------------------------------------------------
// LOGIN
//----------------------------------------------------------
client.login(process.env.DISCORD_TOKEN);
