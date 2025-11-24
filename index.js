// index.js - 69x Pacific AI Unit
require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  ChannelType,
  PermissionFlagsBits
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
  },
  {
    name: 'setup-server',
    description: 'Crea/ordina canali, categorie e ruoli base (solo admin)'
  }
];

// ------------------------------
// 2) REGISTRAZIONE COMANDI
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
// 3) FUNZIONI DI SUPPORTO PER SETUP
// ------------------------------
async function getOrCreateCategory(guild, name) {
  let cat = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && c.name === name
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
    (c) => c.type === ChannelType.GuildText && c.name === name
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
    (c) => c.type === ChannelType.GuildVoice && c.name === name
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

async function getOrCreateRole(guild, name, options = {}) {
  let role = guild.roles.cache.find((r) => r.name === name);
  if (!role) {
    role = await guild.roles.create({ name, ...options });
  }
  return role;
}

// ------------------------------
// 4) FUNZIONE PRINCIPALE
// ------------------------------
async function main() {
  // 1) registra i comandi
  await registerCommands();

  // 2) crea il client Discord (solo intent Guilds)
  const client = new Client({
    intents: [GatewayIntentBits.Guilds]
  });

  // Quando il bot è pronto
  client.once(Events.ClientReady, (c) => {
    console.log(`✅ Bot loggato come ${c.user.tag}`);
  });

  // ------------------------------
  // 5) GESTIONE COMANDI SLASH
  // ------------------------------
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // /ping
    if (interaction.commandName === 'ping') {
      await interaction.reply('🏴‍☠️ Bot online, Fresh Spawn.');
      return;
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
      return;
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
      return;
    }

    // /panel  → pannello "pagine" del server
    if (interaction.commandName === 'panel') {
      const text =
`📚 **PANNELLO SERVER – 69x Pacific Land – Scalakal**

**Pagina 1 – Regole**
> Vai in <#${process.env.CH_REGOLE_ID || 'ID_CANALEREGOLE'}> e leggi le regole ITA/ENG.

**Pagina 2 – Info Server**
> Vai in <#${process.env.CH_INFO_ID || 'ID_CANALEINFO'}> per leggere mappa, wipe, mod, slot, ecc.

**Pagina 3 – Nuovi Utenti / Verifica**
> Vai in <#${process.env.CH_PRESENTAZIONI_ID || 'ID_CANALEPRESENTAZIONI'}> per presentarti
> e segui il messaggio di verifica per ottenere il ruolo **Survivor**.

**Pagina 4 – Chat generale**
> Usa <#${process.env.CH_GENERALE_ID || 'ID_CANALEGENERALE'}> per parlare con gli altri giocatori.

Puoi richiamare questo pannello in qualsiasi momento con \`/panel\`.`;

      await interaction.reply({ content: text, ephemeral: false });
      return;
    }

    // /setup-server → crea categorie, canali e ruoli base
    if (interaction.commandName === 'setup-server') {
      // Permesso solo admin
      if (
        !interaction.memberPermissions ||
        !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)
      ) {
        await interaction.reply({
          content: '❌ Solo un amministratore può usare questo comando.',
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        content: '🛠 Sto configurando il server... attendi qualche secondo.',
        ephemeral: true
      });

      const guild = interaction.guild;
      if (!guild) {
        await interaction.editReply('❌ Errore: guild non trovata.');
        return;
      }

      try {
        // Categorie
        const catWelcome = await getOrCreateCategory(guild, '🧭 Benvenuto');
        const catCommunity = await getOrCreateCategory(guild, '💬 Community');
        const catVoice = await getOrCreateCategory(guild, '🎧 Vocali');
        const catStaff = await getOrCreateCategory(guild, '🛠 Staff');

        // Canali Benvenuto
        const chRegole = await getOrCreateTextChannel(
          guild,
          '📜┃regole',
          catWelcome
        );
        const chInfo = await getOrCreateTextChannel(
          guild,
          '🧭┃info-server',
          catWelcome
        );
        const chPresentazioni = await getOrCreateTextChannel(
          guild,
          '👋┃presentazioni',
          catWelcome
        );
        const chAnnunci = await getOrCreateTextChannel(
          guild,
          '🔔┃annunci',
          catWelcome
        );

        // Canali Community
        const chGenerale = await getOrCreateTextChannel(
          guild,
          '😎┃generale',
          catCommunity
        );
        const chScreens = await getOrCreateTextChannel(
          guild,
          '📸┃screenshots',
          catCommunity
        );
        const chRaid = await getOrCreateTextChannel(
          guild,
          '🎯┃raid-storie',
          catCommunity
        );

        // Vocali
        const vcMain = await getOrCreateVoiceChannel(
          guild,
          '🎧 Vocale principale',
          catVoice
        );
        const vcSquad1 = await getOrCreateVoiceChannel(
          guild,
          '🎤 Squad 1',
          catVoice
        );
        const vcSquad2 = await getOrCreateVoiceChannel(
          guild,
          '🎤 Squad 2',
          catVoice
        );

        // Staff
        const chAdminOnly = await getOrCreateTextChannel(
          guild,
          '🚫┃admin-only',
          catStaff
        );
        const chTodo = await getOrCreateTextChannel(
          guild,
          '🛠┃server-todo',
          catStaff
        );

        // Ruoli base
        const roleOverlord = await getOrCreateRole(guild, '👑 Overlord');
        const roleCommand = await getOrCreateRole(guild, '🧪 Command Unit');
        const roleOfficer = await getOrCreateRole(guild, '🧢 Field Officer');
        const roleVeteran = await getOrCreateRole(guild, '🎯 Veteran Raider');
        const roleSurvivor = await getOrCreateRole(guild, '🎒 Survivor');
        const roleFresh = await getOrCreateRole(guild, '🦴 Fresh Spawn');

        // Aggiorna risposta
        await interaction.editReply(
          '✅ Setup completato.\n' +
          `Categorie create/aggiornate:\n` +
          `• ${catWelcome.name}\n` +
          `• ${catCommunity.name}\n` +
          `• ${catVoice.name}\n` +
          `• ${catStaff.name}\n\n` +
          `Canali principali:\n` +
          `• ${chRegole} (regole)\n` +
          `• ${chInfo} (info server)\n` +
          `• ${chPresentazioni} (presentazioni)\n` +
          `• ${chGenerale} (generale)\n\n` +
          `Ruoli:\n` +
          `• ${roleOverlord.name}\n` +
          `• ${roleCommand.name}\n` +
          `• ${roleOfficer.name}\n` +
          `• ${roleVeteran.name}\n` +
          `• ${roleSurvivor.name}\n` +
          `• ${roleFresh.name}\n`
        );
      } catch (err) {
        console.error('❌ Errore setup-server:', err);
        await interaction.editReply(
          '❌ Si è verificato un errore durante il setup del server.'
        );
      }

      return;
    }
  });

  // 6) login del bot
  await client.login(process.env.DISCORD_TOKEN);
}

// Avvio
main().catch((err) => {
  console.error('❌ Errore fatale:', err);
});
