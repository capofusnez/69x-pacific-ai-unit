// deploy-commands.js
require('dotenv').config();
const { REST, Routes } = require('discord.js');

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
  }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🔄 Registrazione comandi slash...');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('✅ Comandi registrati.');
  } catch (error) {
    console.error(error);
  }
})();
