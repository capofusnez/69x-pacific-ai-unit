// index.js - versione semplice senza IA e senza intent privilegiati
require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');

// Client Discord SOLO con l'intent base (Guilds)
// così Discord non si lamenta degli intents
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Quando il bot si avvia
client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot loggato come ${c.user.tag}`);
});

// Comandi slash base
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('🏴‍☠️ Bot online, Fresh Spawn.');
  }

  if (interaction.commandName === 'welcome') {
    const text =
      '👋 **Benvenuto su 69x Pacific Land – Scalakal Full PvP**\n\n' +
      '🇮🇹 **Per iniziare:**\n' +
      '1️⃣ Leggi le regole in `#regole` / `#rules`\n' +
      '2️⃣ Presentati in `#presentazioni` / `#introductions`\n' +
      '3️⃣ Reagisci al messaggio di verifica per ottenere il ruolo **Survivor**\n\n' +
      '🇬🇧 **To start:**\n' +
      '1️⃣ Read the rules in `#regole` / `#rules`\n' +
      '2️⃣ Introduce yourself in `#presentazioni` / `#introductions`\n' +
      '3️⃣ React to the verify message to get the **Survivor** role.\n\n' +
      'Stay sharp. Scalakal doesn’t forgive. 💀';

    await interaction.reply({ content: text });
  }

  if (interaction.commandName === 'rules') {
    const text =
`📜 **REGOLE / RULES – 69x Pacific Land – Scalakal**

🇮🇹 **ITALIANO**
- Full PvP ovunque.
- Raid base H24 (no glitch/exploit).
- Vietati cheat, macro, mod non autorizzate.
- Niente insulti gravi, razzismo o minacce reali → ban diretto.
- Gli admin non fanno favoritismi.

🇬🇧 **ENGLISH**
- Full PvP everywhere.
- Base raiding 24/7 (no glitch/exploit).
- Cheats, macros, unauthorized mods are forbidden.
- No serious insults, racism or real-life threats → instant ban.
- Admins do not give free loot or join raids.

Reagisci 👍 per confermare che hai letto / React 👍 to confirm you read.`;

    await interaction.reply({ content: text });
  }
});

// Login del bot
client.login(process.env.DISCORD_TOKEN);

