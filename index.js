// index.js - 69x Pacific AI Unit (Sakhal Full PvP)
require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  ChannelType,
  PermissionFlagsBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
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
  },
  {
    name: 'verify-message',
    description: 'Invia il messaggio di verifica con bottone e emoji per il ruolo Survivor'
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

  // 2) crea il client Discord
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Reaction, Partials.User]
  });

  // Quando il bot è pronto
  client.once(Events.ClientReady, (c) => {
    console.log(`✅ Bot loggato come ${c.user.tag}`);
  });

  // ------------------------------
  // 5) DM DI BENVENUTO QUANDO UN UTENTE ENTRA
  // ------------------------------
  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      const welcomeText =
`👋 Benvenuto su **69x Pacific Land – Sakhal Full PvP**.

🇮🇹 Qui giochiamo su **Sakhal**, full PvP, raid H24, zero favoritismi.

Per iniziare:
1️⃣ Leggi le regole nel canale regole del server Discord.  
2️⃣ Leggi le info server (mappa, mod, wipe, IP).  
3️⃣ Vai nel canale di verifica e **accetta le regole** cliccando il bottone.

Quando accetti, ti verrà assegnato il ruolo **🎒 Survivor** e vedrai il resto del server.

🇬🇧 Welcome to **69x Pacific Land – Sakhal Full PvP**.

Read the rules and server info, then go to the verify channel and **accept the rules**.  
After that, you’ll get the **🎒 Survivor** role and full access.`;

      await member.send(welcomeText).catch(() => {
        console.warn(`⚠️ Impossibile inviare DM a ${member.user.tag}`);
      });
    } catch (err) {
      console.error('❌ Errore DM benvenuto:', err);
    }
  });

  // ------------------------------
  // 6) GESTIONE COMANDI SLASH + BOTTONI
  // ------------------------------
  client.on(Events.InteractionCreate, async (interaction) => {
    // 🔹 BOTTONI (per accettare le regole)
    if (interaction.isButton()) {
      if (interaction.customId === 'accept_rules') {
        const guild = interaction.guild;
        if (!guild) {
          await interaction.reply({ content: '❌ Errore: guild non trovata.', ephemeral: true });
          return;
        }

        const member = await guild.members.fetch(interaction.user.id).catch(() => null);
        if (!member) {
          await interaction.reply({ content: '❌ Errore: membro non trovato.', ephemeral: true });
          return;
        }

        const survivorRole = guild.roles.cache.find((r) => r.name === '🎒 Survivor');
        if (!survivorRole) {
          await interaction.reply({
            content: '⚠️ Ruolo "🎒 Survivor" non trovato. Contatta un admin.',
            ephemeral: true
          });
          return;
        }

        if (member.roles.cache.has(survivorRole.id)) {
          await interaction.reply({
            content: 'Hai già il ruolo **🎒 Survivor**.',
            ephemeral: true
          });
          return;
        }

        await member.roles.add(survivorRole);
        await interaction.reply({
          content: '✅ Hai accettato le regole. Ruolo **🎒 Survivor** assegnato.',
          ephemeral: true
        });

        console.log(`✅ [BOTTONE] Assegnato ruolo Survivor a ${member.user.tag}`);
      }

      return; // esci dopo aver gestito il bottone
    }

    // 🔹 COMANDI SLASH
    if (!interaction.isChatInputCommand()) return;

    // /ping
    if (interaction.commandName === 'ping') {
      await interaction.reply('🏴‍☠️ Bot online, Fresh Spawn.');
      return;
    }

    // /welcome
    if (interaction.commandName === 'welcome') {
      const text =
        '👋 **Benvenuto su 69x Pacific Land – Sakhal Full PvP**\n\n' +
        '🇮🇹 **Per iniziare:**\n' +
        '1️⃣ Leggi le regole nel canale regole.\n' +
        '2️⃣ Leggi le info server (mappa, wipe, mod, IP).\n' +
        '3️⃣ Vai nel canale verifica e **clicca il bottone** per ottenere il ruolo **🎒 Survivor**.\n\n' +
        '🇬🇧 **To start:**\n' +
        '1️⃣ Read the rules channel.\n' +
        '2️⃣ Read server info (map, wipe, mods, IP).\n' +
        '3️⃣ Go to the verify channel and **click the button** to get the **🎒 Survivor** role.\n\n' +
        'Stay sharp. Sakhal doesn’t forgive. 💀';

      await interaction.reply({ content: text });
      return;
    }

    // /rules
    if (interaction.commandName === 'rules') {
      const text =
`📜 **REGOLE / RULES – 69x Pacific Land – Sakhal**

🇮🇹 **ITALIANO**
- Mappa: **Sakhal** – Full PvP ovunque.
- Raid base H24 (no glitch/exploit).
- Vietati cheat, macro, mod non autorizzate.
- Niente insulti gravi, razzismo o minacce reali → ban diretto.
- Gli admin non fanno favoritismi e non regalano loot.

🇬🇧 **ENGLISH**
- Map: **Sakhal** – Full PvP everywhere.
- Base raiding 24/7 (no glitch/exploit).
- Cheats, macros, unauthorized mods are forbidden.
- No serious insults, racism or real-life threats → instant ban.
- Admins do not give free loot or join raids.

Reagisci 👍 per confermare che hai letto / React 👍 to confirm you read.`;

      await interaction.reply({ content: text });
      return;
    }

    // /panel  → pannello "pagine" del server (testo generico)
    if (interaction.commandName === 'panel') {
      const text =
`📚 **PANNELLO SERVER – 69x Pacific Land – Sakhal**

**Pagina 1 – Regole**
> Leggi il canale regole (ITA/ENG).

**Pagina 2 – Info Server**
> Leggi il canale info-server per mappa Sakhal, wipe, mod, slot e IP.

**Pagina 3 – Nuovi Utenti / Verifica**
> Presentati nel canale presentazioni
> e usa il messaggio di verifica per ottenere il ruolo **🎒 Survivor**.

**Pagina 4 – Chat generale**
> Usa la chat generale per parlare con gli altri giocatori.

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
        await getOrCreateVoiceChannel(
          guild,
          '🎧 Vocale principale',
          catVoice
        );
        await getOrCreateVoiceChannel(
          guild,
          '🎤 Squad 1',
          catVoice
        );
        await getOrCreateVoiceChannel(
          guild,
          '🎤 Squad 2',
          catVoice
        );

        // Staff
        await getOrCreateTextChannel(
          guild,
          '🚫┃admin-only',
          catStaff
        );
        await getOrCreateTextChannel(
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

    // /verify-message → manda messaggio di verifica nel canale corrente
    if (interaction.commandName === 'verify-message') {
      const verifyText =
`☣️ **Verifica accesso – 69x Pacific Land – Sakhal**

🇮🇹 Reagisci con ☠️ o clicca il bottone qui sotto per ottenere il ruolo **🎒 Survivor**  
e vedere il resto del server.

🇬🇧 React with ☠️ or click the button below to get the **🎒 Survivor** role  
and access the rest of the server.`;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('accept_rules')
          .setLabel('✅ Accetto le regole')
          .setStyle(ButtonStyle.Success)
      );

      const msg = await interaction.channel.send({
        content: verifyText,
        components: [row]
      });

      await msg.react('☠️');

      await interaction.reply({
        content: '✅ Messaggio di verifica creato.',
        ephemeral: true
      });

      return;
    }
  });

  // ------------------------------
  // 7) GESTIONE REAZIONI (VERIFICA – SOLO AGGIUNTA RUOLO)
// ------------------------------
  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    try {
      if (user.bot) return;

      if (reaction.partial) {
        try {
          await reaction.fetch();
        } catch (err) {
          console.error('❌ Errore fetch reaction:', err);
          return;
        }
      }

      const emojiName = reaction.emoji.name;
      if (emojiName !== '☠️') return;

      const message = reaction.message;
      const guild = message.guild;
      if (!guild) return;

      const member = await guild.members.fetch(user.id).catch(() => null);
      if (!member) return;

      const survivorRole = guild.roles.cache.find(
        (r) => r.name === '🎒 Survivor'
      );
      if (!survivorRole) {
        console.warn('⚠️ Ruolo "🎒 Survivor" non trovato.');
        return;
      }

      if (member.roles.cache.has(survivorRole.id)) {
        return;
      }

      await member.roles.add(survivorRole);
      console.log(`✅ [REACTION] Assegnato ruolo Survivor a ${member.user.tag}`);
    } catch (err) {
      console.error('❌ Errore nella gestione della reazione:', err);
    }
  });

  // 8) login del bot
  await client.login(process.env.DISCORD_TOKEN);
}

// Avvio
main().catch((err) => {
  console.error('❌ Errore fatale:', err);
});
