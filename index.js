// index.js - 69x Pacific AI Unit (versione senza IA, con "pagine" gestite dal bot)
require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes
} = require('discord.js');

// ------------------------------
// 1) DEFINIZIONE COMANDI SLASH
// ------------------------------
const commands = [
  {
    name: 'ping',
    description: 'Test del bot'
  },
  {
    name: 'welcome',
    description: 'Invia il messaggio di benvenuto multilingue nel canale corrente'
  },
  {
    name: 'rules',
    description: 'Invia le regole ITA/ENG nel canale corrente'
  },
  {
    name: 'panel',
    description: 'Mostra il pannello con le pagine principali del server'
  }
];

// ------------------------------
// 2) REGISTRAZIONE COMANDI
//    (viene fatta ogni volta che il bot parte)
// ------------------------------
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('🔄 Registrazione comandi slash...');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID, // Application ID
        process.env.GUILD_ID   // ID server
      ),
      { body: commands }
    );

    console.log('✅ Comandi registrati.');
  } catch (error) {
    console.error('❌ Errore registrazione comandi:', error);
  }
}

// ------------------------------
// 3) FUNZIONE PRINCIPALE
// ------------------------------
async function main() {
  // 1) registra i comandi
  await registerCommands();

  // 2) crea il client Discord
  //    SOLO intent Guilds, così non rompe con gli intents privilegiati
  const client = new Client({
    intents: [GatewayIntentBits.Guilds]
  });

  // Quando il bot è pronto
  client.once(Events.ClientReady, (c) => {
    console.log(`✅ Bot loggato come ${c.user.tag}`);
  });

  // ------------------------------
  // 4) GESTIONE COMANDI SLASH
  // ------------------------------
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // /ping
    if (interaction.commandName === 'ping') {
      await interaction.reply('🏴‍☠️ Bot online, Fresh Spawn.');
    }

    // /welcome
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

    // /rules
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

    // /panel  → "pagine" del server
    if (interaction.commandName === 'panel') {
      const text =
`📚 **PANNELLO SERVER – 69x Pacific Land – Scalakal**

**Pagina 1 – Regole**
> Vai in <#1442141514464759868> e leggi le regole ITA/ENG.

**Pagina 2 – Info Server**
> Vai in <#1442568020999536792> per leggere mappa, wipe, mod, slot, ecc.

**Pagina 3 – Nuovi Utenti / Verifica**
> Vai in <#1442568117296562266> per presentarti
> e segui il messaggio di verifica per ottenere il ruolo **Survivor**.

**Pagina 4 – Chat generale**
> Usa <#1442125106154573885> per parlare con gli altri giocatori.

Puoi richiamare questo pannello in qualsiasi momento con \`/panel\`.`;

      await interaction.reply({ content: text, ephemeral: false });
    }
  });

  // 5) login del bot
  await client.login(process.env.DISCORD_TOKEN);
}

// Avvio
main().catch((err) => {
  console.error('❌ Errore fatale:', err);
});
