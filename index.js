// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Events } = require('discord.js');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// Quando il bot si avvia
client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot loggato come ${c.user.tag}`);
});

// ─────────────────────────────
// COMANDI SLASH BASE
// ─────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (interaction.commandName === 'ping') {
      await interaction.reply('🏴‍☠️ Sono vivo, Fresh Spawn.');
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
  } catch (err) {
    console.error(err);
    if (interaction.replied || interaction.deferred) return;
    await interaction.reply({ content: '❌ Errore durante il comando.', ephemeral: true });
  }
});

// ─────────────────────────────
// IA: risponde quando viene menzionato il bot (personalità C ibrida)
// ─────────────────────────────
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const isMentioned = message.mentions.has(client.user);
  if (!isMentioned) return;

  // Messaggio dell'utente ripulito dalla mention
  const cleanContent = message.content.replace(`<@${client.user.id}>`, '').trim();

  // Se l'utente scrive solo "ciao", "hello" ecc → rispondi più gentile
  const lower = cleanContent.toLowerCase();
  const isNewbieStyle =
    lower.includes('ciao') ||
    lower.includes('hello') ||
    lower.includes('how does') ||
    lower.includes('come funziona') ||
    lower.includes('help') ||
    lower.includes('aiuto');

  // Prompt IA
  const systemPrompt = `
Sei "69x Pacific AI Unit", l'assistente IA del server DayZ "69x Pacific Land – Scalakal Full PvP".

Personalità C (ibrida):
- Con chi è nuovo o chiede aiuto in modo educato: rispondi chiaro, utile, tono serio ma non aggressivo.
- Con chi flamma, provoca o fa domande stupide: sei più cinico e tagliente, ma senza bestemmie o insulti reali.
- Stile DayZ hardcore survival: parla spesso di sopravvivenza, rischio, raid, loot, wipe, bunker, zone tossiche.
- Risposte brevi, massimo 4-5 frasi.
- Non parlare di cose fuori da DayZ/Discord se non necessario.

Lingua:
- Se l'utente scrive in italiano, rispondi in italiano.
- Se l'utente scrive in inglese, rispondi in inglese.
`;

  try {
    await message.channel.sendTyping();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: (isNewbieStyle ? '[NUOVO GIOCATORE] ' : '') + cleanContent
        }
      ]
    });

    const reply = completion.choices[0]?.message?.content || 'Silenzio radio. Riprova.';

    await message.reply(reply);
  } catch (err) {
    console.error('Errore IA:', err);
    await message.reply('❌ La nebbia su Scalakal disturba il segnale. Riprova tra poco.');
  }
});

// Login del bot
client.login(process.env.DISCORD_TOKEN);
