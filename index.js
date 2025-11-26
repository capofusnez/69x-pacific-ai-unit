// ------------------------------------------------------------
// 69x Pacific AI Unit - Bot Discord per 69x Pacific Land Sakhal
// - Regole + Accept
// - Info Sakhal (allineato a configurazione server DayZ)
// - Setup struttura canali ITA/ENG
// - Ticket con categorie + chiusura + archivio
// - Notifica staff per ogni nuovo ticket
// - /bot-status con info Raspberry
// - Auto-clean messaggi + /clean-channel
// ------------------------------------------------------------

require('dotenv').config();

const os = require('os');
const { exec } = require('child_process');
const fs = require('fs');

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
} = require('discord.js');

// ------------------------------------------------------------
// CONFIGURAZIONE BASE
// ------------------------------------------------------------

// ID dell'applicazione/bot (CLIENT ID)
const CLIENT_ID = '1442475115743940611';

// ID del tuo server Discord
const SERVER_ID = '1442125105575628891';

// ID canale regole
const RULES_CHANNEL_ID = '1442141514464759868';

// ID canale nuovi utenti / presentazioni
const NEW_USER_CHANNEL_ID = '1442568117296562266';

// Ruolo che viene assegnato quando accettano le regole
const SURVIVOR_ROLE_ID = '1442570651696107711';

// Nome categoria supporto (usata per i ticket aperti)
const SUPPORT_CATEGORY_NAME = '🆘 Supporto • Support';

// Nome categoria ticket chiusi
const CLOSED_TICKETS_CATEGORY_NAME = '🔒 Ticket chiusi • Closed Tickets';

// ------------------------------------------------------------
// CONFIG ATTUALE DEL SERVER DAYZ (MODIFICA QUI QUANDO CAMBIATE SETTAGGI)
// ------------------------------------------------------------

const SERVER_NAME = '69x Pacific Land | Sakhal Full PvP';

// METTI QUI IP:PORTA REALE DEL SERVER DAYZ
const SERVER_IP = '123.45.67.89:2302'; // ESEMPIO: "123.45.67.89:2302"

const SERVER_SLOTS = '50 slot';
const SERVER_WIPE = 'Full wipe ogni 30 giorni';
const SERVER_RESTART = 'Restart automatico ogni 4 ore';
const SERVER_DISCORD = 'Questo Discord ufficiale';

const SERVER_MODS =
  '- Trader custom bilanciato\n' +
  '- Loot rivisto manualmente\n' +
  '- Veicoli espansi\n' +
  '- AI ostili in aree dedicate\n' +
  '- Meteo e notte più aggressivi';

const SERVER_STYLE =
  'Hardcore survival, full PvP, nessun favoritismo staff, niente gear gratis agli admin';

// Percorsi usati per lo status
const PROJECT_PATH = '/home/andrea/69x-pacific-ai-unit';
const AUTOUPDATE_LOG = '/home/andrea/pacificbot-autoupdate.log';

// Canali dove fare auto-clean dei messaggi "comando"
const AUTOCLEAN_CHANNELS = [
  '😎┃generale・general-chat',
  '📢┃looking-for-team・lfg'
  // aggiungi altri nomi se vuoi
];

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
      name: name,
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
      name: name,
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
      name: name,
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
  if (d > 0) parts.push(d + 'd');
  if (h > 0) parts.push(h + 'h');
  if (m > 0) parts.push(m + 'm');
  parts.push(s + 's');
  return parts.join(' ');
}

function getSystemUptime() {
  const seconds = os.uptime();
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(d + 'd');
  if (h > 0) parts.push(h + 'h');
  if (m > 0) parts.push(m + 'm');
  parts.push(s + 's');
  return parts.join(' ');
}

function getMemoryUsage() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const usedMB = (used / 1024 / 1024).toFixed(0);
  const totalMB = (total / 1024 / 1024).toFixed(0);
  const perc = ((used / total) * 100).toFixed(1);
  return usedMB + 'MB / ' + totalMB + 'MB (' + perc + '%)';
}

function execPromise(cmd, cwd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: cwd }, (error, stdout) => {
      if (error) return reject(error);
      resolve(stdout.trim());
    });
  });
}

async function getGitShortCommit() {
  try {
    const out = await execPromise('git rev-parse --short HEAD', PROJECT_PATH);
    return out || 'n/d';
  } catch (e) {
    return 'n/d';
  }
}

async function getRpiTemperature() {
  try {
    const out = await execPromise('vcgencmd measure_temp', '/');
    const match = out.match(/temp=([0-9.]+)'C/);
    if (match) return match[1] + '°C';
    return out || 'n/d';
  } catch (e) {
    return 'n/d';
  }
}

function getLastAutoUpdate() {
  try {
    if (!fs.existsSync(AUTOUPDATE_LOG)) return 'nessun log';
    const content = fs.readFileSync(AUTOUPDATE_LOG, 'utf8');
    const lines = content.trim().split('\n').reverse();
    for (const line of lines) {
      if (line.includes('AUTO-UPDATE')) {
        return line.replace('===== ', '').replace(' =====', '').trim();
      }
    }
    return 'nessuna voce trovata';
  } catch (e) {
    return 'errore lettura log';
  }
}

// ------------------------------------------------------------
// AUTO-CLEAN: cancellazione messaggi dopo X secondi
// ------------------------------------------------------------

async function autoDeleteMessage(message, seconds) {
  try {
    if (!message || !message.deletable) return;
    setTimeout(async () => {
      try {
        await message.delete().catch(() => {});
      } catch (e) {
        // ignore
      }
    }, seconds * 1000);
  } catch (e) {
    console.error('Errore autoDeleteMessage:', e);
  }
}

// ------------------------------------------------------------
// HELPER PER I TICKET (con categorie/tipi)
// ------------------------------------------------------------

const TICKET_TYPES = {
  support: {
    prefix: 'ticket-support',
    labelIt: 'Supporto',
    labelEn: 'Support'
  },
  bug: {
    prefix: 'ticket-bug',
    labelIt: 'Bug / Problema tecnico',
    labelEn: 'Bug report'
  },
  report: {
    prefix: 'ticket-report',
    labelIt: 'Segnalazione giocatore / comportamento',
    labelEn: 'Player / behaviour report'
  },
  request: {
    prefix: 'ticket-request',
    labelIt: 'Richiesta / Suggestion',
    labelEn: 'Request / suggestion'
  },
  ban: {
    prefix: 'ticket-ban',
    labelIt: 'Ban & Appeal',
    labelEn: 'Ban & appeal'
  }
};

function getTicketTypeConfig(ticketType) {
  return TICKET_TYPES[ticketType] || TICKET_TYPES.support;
}

// 🔔 Notifica staff quando si apre un ticket
async function notifyStaffNewTicket(guild, channel, user, ticketType) {
  try {
    let staffChannel =
      guild.channels.cache.find(
        c =>
          c.type === ChannelType.GuildText &&
          c.name === '🛠┃staff-chat'
      ) ||
      guild.channels.cache.find(
        c =>
          c.type === ChannelType.GuildText &&
          c.name === '🚫┃admin-log'
      );

    if (!staffChannel) return;

    const typeCfg = getTicketTypeConfig(ticketType);

    await staffChannel.send(
      '🔔 **Nuovo ticket aperto**\n' +
        '• **Tipo:** ' + typeCfg.labelIt + ' (`' + ticketType + '`)\n' +
        '• **Utente:** <@' + user.id + '>\n' +
        '• **Canale:** ' + channel.toString()
    );
  } catch (e) {
    console.error('⚠ Errore invio notifica staff:', e);
  }
}

async function createTicketChannel(guild, user, ticketType) {
  const typeCfg = getTicketTypeConfig(ticketType);
  const catSupport = await getOrCreateCategory(guild, SUPPORT_CATEGORY_NAME);

  const baseName = (typeCfg.prefix + '-' + user.username)
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, '');
  const uniqueId = user.id.slice(-4);
  const channelName = baseName + '-' + uniqueId;

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: catSupport.id,
    topic:
      'Ticket tipo: ' +
      typeCfg.labelIt +
      ' (' +
      ticketType +
      ') - aperto da USERID: ' +
      user.id,
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

  let introTypeTextIt = '';
  let introTypeTextEn = '';

  switch (ticketType) {
    case 'bug':
      introTypeTextIt = '🛠 **Tipo:** Bug / Problema tecnico';
      introTypeTextEn = '🛠 **Type:** Bug / Technical issue';
      break;
    case 'report':
      introTypeTextIt = '🚨 **Tipo:** Segnalazione giocatore / comportamento';
      introTypeTextEn = '🚨 **Type:** Player / behaviour report';
      break;
    case 'request':
      introTypeTextIt = '💡 **Tipo:** Richiesta / Suggestion';
      introTypeTextEn = '💡 **Type:** Request / suggestion';
      break;
    case 'ban':
      introTypeTextIt = '⚖️ **Tipo:** Ban & Appeal';
      introTypeTextEn = '⚖️ **Type:** Ban & appeal';
      break;
    default:
      introTypeTextIt = '🧰 **Tipo:** Supporto generale';
      introTypeTextEn = '🧰 **Type:** General support';
      break;
  }

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('🔒 Chiudi ticket / Close ticket')
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content:
      introTypeTextIt +
      ' | ' +
      introTypeTextEn +
      '\n\n' +
      '🎫 **Nuovo ticket aperto da <@' +
      user.id +
      '>**\n\n' +
      '🇮🇹 Scrivi qui il tuo problema, domanda o segnalazione.\n' +
      'Più dettagli dai, più velocemente lo staff può aiutarti.\n\n' +
      '🇬🇧 Write here your issue, question or report.\n' +
      'The more details you give, the easier it is for the staff to help you.\n\n' +
      'Quando hai finito, puoi chiudere il ticket con il pulsante qui sotto.',
    components: [closeRow]
  });

  await notifyStaffNewTicket(guild, channel, user, ticketType);

  return channel;
}

// ------------------------------------------------------------
// DEFINIZIONE COMANDI SLASH
// ------------------------------------------------------------

const commands = [
  new SlashCommandBuilder()
    .setName('sendrules')
    .setDescription('Invia il messaggio delle regole nel canale corrente'),
  new SlashCommandBuilder()
    .setName('info-sakhal')
    .setDescription('Mostra le info del server DayZ Sakhal'),
  new SlashCommandBuilder()
    .setName('setup-structure')
    .setDescription('Crea/organizza categorie e canali ITA/ENG (solo admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Apri un ticket con lo staff (supporto generale)'),
  new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Invia il pannello con pulsanti per aprire ticket (solo admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName('bot-status')
    .setDescription('Mostra stato bot e Raspberry Pi (solo admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName('clean-channel')
    .setDescription('Pulisce messaggi vecchi nel canale corrente (solo admin)')
    .addIntegerOption(opt =>
      opt
        .setName('days')
        .setDescription('Cancella messaggi più vecchi di X giorni (default 7, max 14)')
        .setMinValue(1)
        .setMaxValue(14)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
  try {
    console.log('🔄 Registrazione comandi slash...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, SERVER_ID),
      { body: commands }
    );
    console.log('✅ Comandi registrati nel server.');
  } catch (error) {
    console.error('❌ Errore registrazione comandi:', error);
  }
}

// ------------------------------------------------------------
// EVENTO READY
// ------------------------------------------------------------

client.once('ready', () => {
  console.log('🤖 Bot online come: ' + client.user.tag);
  client.user.setActivity('Sopravvivere a Sakhal', { type: 0 });
});

// ------------------------------------------------------------
// EVENTO: NUOVO MEMBRO ENTRA NEL SERVER
// ------------------------------------------------------------

client.on(Events.GuildMemberAdd, async member => {
  try {
    const channel = member.guild.channels.cache.get(NEW_USER_CHANNEL_ID);
    if (channel) {
      channel.send(
        '🎖 <@' + member.id + '> è entrato nel territorio di **Sakhal**.'
      );
    }

    await member.send(
      '👋 Benvenuto su **' + SERVER_NAME + '**\n\n' +
      'Ricorda:\n' +
      '- Leggi le regole nel canale regole/rules\n' +
      '- Accetta per ottenere il ruolo Survivor\n' +
      '- Poi puoi usare i canali testuali e vocali\n\n' +
      'Good luck, survivor. 💀'
    );
  } catch (e) {
    console.log('⚠ Impossibile mandare DM all\'utente (probabile DM chiusi).');
  }
});

// ------------------------------------------------------------
// EVENTO: INTERAZIONI COMANDI SLASH
// ------------------------------------------------------------

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const commandName = interaction.commandName;

  // ---------------- /sendrules ----------------
  if (commandName === 'sendrules') {
    const desc =
      '**🇮🇹 Premi il pulsante "ACCEPT / ACCETTO" qui sotto per confermare che hai letto e accettato le regole.**\n' +
      '**🇬🇧 Press the "ACCEPT / ACCETTO" button below to confirm you have read and accepted the rules.**\n\n' +
      '────────────────────────\n\n' +
      '> "Questo non è un gioco. È sopravvivenza."\n\n' +
      '**🇮🇹 ITALIANO**\n\n' +
      '1️⃣ Rispetto obbligatorio\n' +
      'Nessun insulto, razzismo, sessismo, bullismo o provocazione verso altri membri.\n\n' +
      '2️⃣ Niente spam o flood\n' +
      'Evita messaggi ripetitivi, tag inutili, pubblicità, link sospetti o autopromozione senza permesso.\n\n' +
      '3️⃣ Segui la gerarchia\n' +
      'Le decisioni dello staff sono definitive. Discussioni civili ok, mancanza di rispetto no.\n\n' +
      '4️⃣ Usa i canali giusti\n' +
      'Se c’è un canale dedicato, usalo.\n\n' +
      '5️⃣ Vietati cheat, exploit e glitch\n' +
      'Cheat = ban permanente. Mod non autorizzate = punizione immediata.\n\n' +
      '6️⃣ No divulgazione dati personali\n' +
      'Nessun doxxing, minacce o comportamenti illegali.\n\n' +
      '7️⃣ NSFW vietato\n' +
      'Niente contenuti sessuali o gore reale.\n\n' +
      '8️⃣ No drama\n' +
      'Problemi? Contatta lo staff. Niente flame pubblici.\n\n' +
      '9️⃣ Linguaggio\n' +
      'Meme e battute ok — discriminazioni no.\n\n' +
      '🔟 Staff > tutto\n' +
      'Lo staff può aggiornare le regole in qualsiasi momento.\n\n' +
      '────────────────────────\n\n' +
      '**🇬🇧 ENGLISH**\n\n' +
      '1️⃣ Respect is mandatory\n' +
      'No insults, racism, sexism, bullying or provoking others.\n\n' +
      '2️⃣ No spam or flood\n' +
      'Avoid repeated messages, useless pings, ads, scam links or self-promo.\n\n' +
      '3️⃣ Follow the staff hierarchy\n' +
      'Staff decisions are final.\n\n' +
      '4️⃣ Use the correct channels\n' +
      'If a channel is dedicated to something, use it.\n\n' +
      '5️⃣ No cheats, exploits or glitches\n' +
      'Cheaters = permanent ban.\n\n' +
      '6️⃣ No personal data sharing\n' +
      'No doxxing, threats or illegal behaviour.\n\n' +
      '7️⃣ NSFW forbidden\n' +
      'No sexual or real-life gore content.\n\n' +
      '8️⃣ No drama\n' +
      'If you have an issue, contact staff.\n\n' +
      '9️⃣ Language\n' +
      'Memes and jokes ok, discrimination is not.\n\n' +
      '🔟 Staff > everything\n' +
      'Staff can change rules anytime to protect the community.';

    const embed = new EmbedBuilder()
      .setTitle('📜 Regole del Server – Zona Controllata')
      .setDescription(desc)
      .setColor('DarkGreen')
      .setFooter({
        text: '⚠ Accept/Accetto per entrare ufficialmente nel server'
      });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('accept_rules')
        .setLabel('✔ ACCEPT / ACCETTO')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({
      content: '📜 Regole inviate in questo canale.',
      ephemeral: true
    });
    return;
  }

  // ---------------- /info-sakhal ----------------
  if (commandName === 'info-sakhal') {
    const embedInfo = new EmbedBuilder()
      .setTitle('🧭 Info Server – ' + SERVER_NAME)
      .setDescription(
        '**Mappa:** `Sakhal`\n' +
        '> "Sakhal non perdona. O uccidi, o sei loot."\n\n' +
        'ℹ️ Questo comando è aggiornato alla configurazione attuale del server (settaggi by Riccardo).'
      )
      .addFields(
        {
          name: '🇮🇹 Info generali',
          value:
            '• **Nome server:** ' + SERVER_NAME + '\n' +
            '• **Slot:** ' + SERVER_SLOTS + '\n' +
            '• **Stile:** ' + SERVER_STYLE + '\n' +
            '• **Wipe:** ' + SERVER_WIPE + '\n' +
            '• **Restart:** ' + SERVER_RESTART + '\n' +
            '• **Discord:** ' + SERVER_DISCORD,
          inline: false
        },
        {
          name: '🧰 Mod & gameplay',
          value: SERVER_MODS,
          inline: false
        },
        {
          name: '🌐 Connessione / Connection',
          value:
            '🇮🇹 **Connessione diretta:**\n' +
            '`' + SERVER_IP + '`\n' +
            'Se non funziona, cerca **' + SERVER_NAME + '** nella lista server DayZ.\n\n' +
            '🇬🇧 **Direct Connect:**\n' +
            '`' + SERVER_IP + '`\n' +
            'If it doesn\'t work, search **' + SERVER_NAME + '** in the DayZ server browser.',
          inline: false
        },
        {
          name: '📌 Note veloci / Quick notes',
          value:
            '• Full PvP ovunque\n' +
            '• Nessun favoritismo staff\n' +
            '• Loot e trader bilanciati a mano\n' +
            '• Rispetta le regole sia su Discord che in-game',
          inline: false
        }
      )
      .setColor('DarkGold');

    await interaction.reply({ embeds: [embedInfo] });
    return;
  }

  // ---------------- /setup-structure ----------------
  if (commandName === 'setup-structure') {
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
      content: '🛠 Sto creando/organizzando categorie e canali ITA/ENG...',
      ephemeral: true
    });

    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply('❌ Errore: guild non trovata.');
      return;
    }

    try {
      const catWelcome = await getOrCreateCategory(guild, '🧭 Benvenuto • Welcome');
      const catCommunity = await getOrCreateCategory(guild, '💬 Community • Community');
      const catInGame = await getOrCreateCategory(guild, '🎮 In gioco • In-Game');
      const catVoice = await getOrCreateCategory(guild, '🎧 Vocali • Voice Channels');
      const catSupport = await getOrCreateCategory(guild, SUPPORT_CATEGORY_NAME);
      const catStaff = await getOrCreateCategory(guild, '🛠 Staff • Staff Only');
      const catClosed = await getOrCreateCategory(guild, CLOSED_TICKETS_CATEGORY_NAME);
      await getOrCreateTextChannel(guild, '🗄┃archivio-ticket', catClosed);

      // Welcome
      let rulesChannel = await guild.channels.fetch(RULES_CHANNEL_ID).catch(() => null);
      if (rulesChannel) {
        await rulesChannel.setName('📜┃regole・rules');
        await rulesChannel.setParent(catWelcome.id);
      } else {
        rulesChannel = await getOrCreateTextChannel(guild, '📜┃regole・rules', catWelcome);
      }

      let newUserChannel = await guild.channels.fetch(NEW_USER_CHANNEL_ID).catch(() => null);
      if (newUserChannel) {
        await newUserChannel.setName('🎖┃nuovi-utenti・new-survivors');
        await newUserChannel.setParent(catWelcome.id);
      } else {
        newUserChannel = await getOrCreateTextChannel(
          guild,
          '🎖┃nuovi-utenti・new-survivors',
          catWelcome
        );
      }

      await getOrCreateTextChannel(guild, '🧭┃info-sakhal・server-info', catWelcome);
      await getOrCreateTextChannel(guild, '📣┃annunci・announcements', catWelcome);

      // Community
      await getOrCreateTextChannel(guild, '😎┃generale・general-chat', catCommunity);
      await getOrCreateTextChannel(guild, '📸┃screen・screenshots', catCommunity);
      await getOrCreateTextChannel(guild, '🎯┃storie-raid・raid-stories', catCommunity);
      await getOrCreateTextChannel(guild, '🌐┃international・english-chat', catCommunity);

      // In-game
      await getOrCreateTextChannel(guild, '📢┃looking-for-team・lfg', catInGame);
      await getOrCreateTextChannel(guild, '💰┃commercio・trade', catInGame);
      await getOrCreateTextChannel(guild, '🎯┃raid-planning・raid-plans', catInGame);

      // Voice
      await getOrCreateVoiceChannel(guild, '🎧┃vocale-1・voice-1', catVoice);
      await getOrCreateVoiceChannel(guild, '🎧┃vocale-2・voice-2', catVoice);
      await getOrCreateVoiceChannel(guild, '🎤┃raid-squad・raid-squad', catVoice);

      // Support
      await getOrCreateTextChannel(guild, '🎫┃ticket-supporto・tickets', catSupport);
      await getOrCreateTextChannel(guild, '🐞┃bug-report・bug-report', catSupport);
      await getOrCreateTextChannel(guild, '💡┃suggerimenti・suggestions', catSupport);

      // Staff
      await getOrCreateTextChannel(guild, '🚫┃admin-log', catStaff);
      await getOrCreateTextChannel(guild, '🛠┃staff-chat', catStaff);
      await getOrCreateTextChannel(guild, '📋┃ban-log', catStaff);

      await interaction.editReply('✅ Struttura categorie/canali ITA/ENG creata/aggiornata.');
    } catch (err) {
      console.error('❌ Errore setup-structure:', err);
      await interaction.editReply(
        '❌ Si è verificato un errore durante la creazione della struttura.'
      );
    }
    return;
  }

  // ---------------- /ticket (apertura via comando generico) ----------------
  if (commandName === 'ticket') {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: '❌ Errore: guild non trovata.',
        ephemeral: true
      });
      return;
    }

    const ticketChannel = await createTicketChannel(guild, interaction.user, 'support');

    await interaction.reply({
      content: '✅ Ticket di supporto creato: ' + ticketChannel.toString(),
      ephemeral: true
    });
    return;
  }

  // ---------------- /ticket-panel ----------------
  if (commandName === 'ticket-panel') {
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

    const embed = new EmbedBuilder()
      .setTitle('🎫 Sistema Ticket • Ticket System')
      .setDescription(
        '🇮🇹 Seleziona il tipo di ticket di cui hai bisogno:\n\n' +
        '• 🧰 Supporto generale\n' +
        '• 🛠 Bug / Problema tecnico\n' +
        '• 🚨 Segnalazione giocatore / comportamento\n' +
        '• 💡 Richiesta / Suggestion\n' +
        '• ⚖️ Ban & Appeal\n\n' +
        '🇬🇧 Choose the type of ticket you need:\n\n' +
        '• 🧰 General support\n' +
        '• 🛠 Bug / Technical issue\n' +
        '• 🚨 Player / behaviour report\n' +
        '• 💡 Request / suggestion\n' +
        '• ⚖️ Ban & appeal'
      )
      .setColor('Purple');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_support')
        .setLabel('🧰 Supporto / Support')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('ticket_bug')
        .setLabel('🛠 Bug Report')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('ticket_report')
        .setLabel('🚨 Segnalazioni / Reports')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('ticket_request')
        .setLabel('💡 Richieste / Requests')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('ticket_ban')
        .setLabel('⚖️ Ban & Appeal')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({
      content: '✅ Pannello ticket con categorie inviato in questo canale.',
      ephemeral: true
    });
    return;
  }

  // ---------------- /bot-status ----------------
  if (commandName === 'bot-status') {
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

    await interaction.deferReply({ ephemeral: true });

    try {
      const guild = interaction.guild;

      const botUptime = formatDuration(client.uptime || 0);
      const sysUptime = getSystemUptime();
      const memUsage = getMemoryUsage();
      const temp = await getRpiTemperature();
      const commit = await getGitShortCommit();
      const lastUpdate = getLastAutoUpdate();
      const ping = Math.round(client.ws.ping);

      const embed = new EmbedBuilder()
        .setTitle('📊 Bot & Raspberry Status')
        .setDescription('Stato attuale del bot e del Raspberry Pi.')
        .setColor('DarkBlue')
        .addFields(
          {
            name: '🤖 Bot',
            value:
              '• **Nome:** ' + client.user.tag + '\n' +
              '• **Ping Discord:** `' + ping + ' ms`\n' +
              '• **Uptime bot:** `' + botUptime + '`\n' +
              '• **Server Discord:** ' + (guild ? guild.name : 'n/d')
          },
          {
            name: '📦 Codice',
            value:
              '• **Commit attuale:** `' + commit + '`\n' +
              '• **Ultimo auto-update:** `' + lastUpdate + '`'
          },
          {
            name: '🧠 Raspberry Pi',
            value:
              '• **Hostname:** `' + os.hostname() + '`\n' +
              '• **Uptime sistema:** `' + sysUptime + '`'
          },
          {
            name: '🔥 Risorse',
            value:
              '• **RAM:** ' + memUsage + '\n' +
              '• **Temperatura CPU:** `' + temp + '`'
          }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('❌ Errore /bot-status:', err);
      await interaction.editReply({
        content: '⚠ Errore nel recuperare lo stato. Controlla i log del Raspberry.'
      });
    }
    return;
  }

  // ---------------- /clean-channel ----------------
  if (commandName === 'clean-channel') {
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

    const channel = interaction.channel;
    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: '❌ Questo comando va usato in un canale testuale del server.',
        ephemeral: true
      });
      return;
    }

    const days = interaction.options.getInteger('days') ?? 7;
    const now = Date.now();
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

    await interaction.reply({
      content: `🧹 Avvio pulizia in <#${channel.id}> per messaggi più vecchi di **${days} giorni** (limitata agli ultimi 14 giorni, vincolo Discord)...`,
      ephemeral: true
    });

    let deletedCount = 0;
    let lastId = null;
    let fetched;

    try {
      do {
        fetched = await channel.messages.fetch({
          limit: 100,
          before: lastId ?? undefined
        });

        if (fetched.size === 0) break;

        const messagesToDelete = fetched.filter(msg => {
          if (msg.pinned) return false;
          if (msg.createdTimestamp < fourteenDaysAgo) return false; // troppo vecchi per l'API
          return msg.createdTimestamp < cutoff;
        });

        for (const msg of messagesToDelete.values()) {
          try {
            await msg.delete();
            deletedCount++;
          } catch {
            // ignora singoli errori
          }
        }

        lastId = fetched.last()?.id ?? null;
      } while (fetched.size === 100);

      await interaction.followUp({
        content: `✅ Pulizia completata in <#${channel.id}>.\nMessaggi eliminati: **${deletedCount}**.\n(Discord non permette di cancellare automaticamente messaggi più vecchi di 14 giorni.)`,
        ephemeral: true
      });
    } catch (err) {
      console.error('❌ Errore /clean-channel:', err);
      await interaction.followUp({
        content: '⚠ Errore durante la pulizia del canale. Controlla i log del bot.',
        ephemeral: true
      });
    }

    return;
  }
});

// ------------------------------------------------------------
// EVENTO: INTERAZIONI BOTTONI (REGOLE + TICKET)
// ------------------------------------------------------------

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;

  // --------- Bottone Accetta Regole ----------
  if (customId === 'accept_rules') {
    try {
      const member = interaction.member;

      if (!SURVIVOR_ROLE_ID) {
        await interaction.reply({
          content: '❌ Errore di configurazione: ruolo Survivor non impostato nel bot.',
          ephemeral: true
        });
        return;
      }

      const role = interaction.guild.roles.cache.get(SURVIVOR_ROLE_ID);
      if (!role) {
        await interaction.reply({
          content: '❌ Non trovo il ruolo Survivor sul server. Avvisa un admin.',
          ephemeral: true
        });
        return;
      }

      if (member.roles.cache.has(SURVIVOR_ROLE_ID)) {
        await interaction.reply({
          content: '✅ Hai già accettato le regole ed hai già il ruolo Survivor.',
          ephemeral: true
        });
        return;
      }

      await member.roles.add(role);

      await interaction.update({
        content: '✔ Hai accettato le regole. Benvenuto sopravvissuto.',
        components: []
      });

      try {
        await member.send(
          '👋 Benvenuto sopravvissuto.\n\n' +
          'Ora fai parte di **' + SERVER_NAME + '**\n\n' +
          '🔥 Consigli:\n' +
          '- Non fidarti di nessuno\n' +
          '- Loota tutto\n' +
          '- Spara per primo\n' +
          '- Sopravvivi finché puoi\n\n' +
          'Good luck… you’ll need it. 💀\n\n' +
          '────────────────────────\n' +
          '🇮🇹 **Info server**\n\n' +
          '• Nome: ' + SERVER_NAME + '\n' +
          '• Mappa: Sakhal\n' +
          '• Stile: ' + SERVER_STYLE + '\n' +
          '• Slot: ' + SERVER_SLOTS + '\n' +
          '• Wipe: ' + SERVER_WIPE + '\n' +
          '• Restart: ' + SERVER_RESTART + '\n\n' +
          '🔌 Direct Connect (se disponibile):\n' +
          SERVER_IP + '\n\n' +
          '────────────────────────\n' +
          '🇬🇧 **Server info**\n\n' +
          '• Name: ' + SERVER_NAME + '\n' +
          '• Map: Sakhal\n' +
          '• Style: ' + SERVER_STYLE + '\n' +
          '• Slots: ' + SERVER_SLOTS + '\n' +
          '• Wipe: ' + SERVER_WIPE + '\n' +
          '• Restart: ' + SERVER_RESTART + '\n\n' +
          '🔌 Direct Connect:\n' +
          SERVER_IP
        );
      } catch (e) {
        console.log('⚠ DM non consegnato (utente con DM chiusi).');
      }
    } catch (err) {
      console.error('❌ Errore nel bottone accept_rules:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '⚠ Errore interno durante l\'accettazione delle regole. Avvisa lo staff.',
          ephemeral: true
        });
      }
    }
    return;
  }

  // --------- Bottoni Apertura Ticket per Categoria ----------
  if (
    customId === 'ticket_support' ||
    customId === 'ticket_bug' ||
    customId === 'ticket_report' ||
    customId === 'ticket_request' ||
    customId === 'ticket_ban'
  ) {
    try {
      const guild = interaction.guild;
      if (!guild) {
        await interaction.reply({
          content: '❌ Errore: guild non trovata.',
          ephemeral: true
        });
        return;
      }

      let ticketType = 'support';
      if (customId === 'ticket_bug') ticketType = 'bug';
      else if (customId === 'ticket_report') ticketType = 'report';
      else if (customId === 'ticket_request') ticketType = 'request';
      else if (customId === 'ticket_ban') ticketType = 'ban';

      const ticketChannel = await createTicketChannel(
        guild,
        interaction.user,
        ticketType
      );

      await interaction.reply({
        content: '✅ Ticket creato: ' + ticketChannel.toString(),
        ephemeral: true
      });
    } catch (err) {
      console.error('❌ Errore bottone apertura ticket categoria:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '⚠ Errore nella creazione del ticket. Avvisa lo staff.',
          ephemeral: true
        });
      }
    }
    return;
  }

  // --------- Bottone Chiusura Ticket ----------
  if (customId === 'ticket_close') {
    try {
      const channel = interaction.channel;
      const member = interaction.member;
      const guild = interaction.guild;

      if (
        channel.type !== ChannelType.GuildText ||
        !channel.name.startsWith('ticket-')
      ) {
        await interaction.reply({
          content: '❌ Questo bottone può essere usato solo nei canali ticket.',
          ephemeral: true
        });
        return;
      }

      const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

      let ownerId = null;
      if (channel.topic) {
        const match = channel.topic.match(/USERID:\s*(\d{5,})/);
        if (match) ownerId = match[1];
      }

      const isOwner = ownerId === interaction.user.id;

      if (!isAdmin && !isOwner) {
        await interaction.reply({
          content: '❌ Solo il proprietario del ticket o un membro dello staff può chiuderlo.',
          ephemeral: true
        });
        return;
      }

      const closedCategory = await getOrCreateCategory(
        guild,
        CLOSED_TICKETS_CATEGORY_NAME
      );

      await channel.send(
        '🔒 Ticket chiuso da <@' + interaction.user.id + '>.\n' +
        '📁 Questo ticket è stato archiviato in **' + CLOSED_TICKETS_CATEGORY_NAME + '**.\n' +
        'Solo lo staff può ancora vederlo.'
      );

      let newName = channel.name;
      newName = newName.replace(/^ticket-/, 'closed-');

      await channel.setParent(closedCategory.id);
      await channel.setName(newName);

      await channel.permissionOverwrites.set([
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        }
        // gli admin con Administrator vedono comunque tutto
      ]);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.deferUpdate().catch(() => {});
      }
    } catch (err) {
      console.error('❌ Errore bottone ticket_close:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '⚠ Errore durante la chiusura del ticket. Avvisa lo staff.',
          ephemeral: true
        });
      }
    }
    return;
  }
});

// ------------------------------------------------------------
// AUTO-CLEAN: intercetta i messaggi e pulisce quelli "comando"
// ------------------------------------------------------------

client.on(Events.MessageCreate, async message => {
  try {
    if (!message.guild || message.author.bot) return;

    const channelName = message.channel.name;
    if (!AUTOCLEAN_CHANNELS.includes(channelName)) return;

    const content = message.content.trim();

    const isMaybeCommand =
      content.startsWith('!') ||
      content.startsWith('?') ||
      content.startsWith('/') ||
      content.length < 3; // messaggi "ok", "si", ecc. (togli se non ti piace)

    if (!isMaybeCommand) return;

    // Cancella dopo 20 secondi
    await autoDeleteMessage(message, 20);
  } catch (e) {
    console.error('Errore in auto-clean message:', e);
  }
});

// ------------------------------------------------------------
// GESTIONE ERRORI GLOBALI
// ------------------------------------------------------------

process.on('unhandledRejection', reason => {
  console.error('🚨 UNHANDLED REJECTION:', reason);
});

process.on('uncaughtException', err => {
  console.error('🚨 UNCAUGHT EXCEPTION:', err);
});

// ------------------------------------------------------------
// AVVIO BOT
// ------------------------------------------------------------

registerCommands();
client.login(process.env.DISCORD_TOKEN);
