require('dotenv').config();
import firebaseService from './services/firebaseService';
import Discord from 'discord.js';
import storeService from './services/storeService';

// -----------------------------------------------------------------------------------Set up Discord client
const fs = require('fs');
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'));
const { Client, GatewayIntentBits, Partials } = require('discord.js');

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
  ],
  partials: [Partials.USER, Partials.CHANNEL, Partials.GUILD_MEMBER],
});

const token = process.env.BOT_TOKKEN;
client.login(token);

client.once('ready', () => {
  console.log('********************************************');
  console.log(`Logged in as ${client.user.tag}`);
  console.log('********************************************');
  console.log('\n\n');
});

// Handle delete item from store button
client.on(Discord.Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId.includes('delete-btn')) {
    //get user by id
    const user = await firebaseService.getUserById(interaction.user.id);
    const userData = user.data();
    const usersStoreEntries = userData.storeEntries;
    const entryId = interaction.customId.split('-').pop();
    //Make sure the user is the author of the store entry
    const entry = await firebaseService.getStoreEntryById(entryId);
    const entryData = entry.data();
    if (entryData.userId !== interaction.user.id)
      return interaction.reply({
        content: 'No eres el autor de este mensaje.',
        ephemeral: true,
      });

    // delete store entry
    await firebaseService.deleteStoreEntry(entryId);
    // delete user store entry
    const filteredStoreEntries = usersStoreEntries.filter(
      (entry) => entry.id !== entryId,
    );
    // update user store entries
    await firebaseService.editUser(interaction.user.id, {
      ...userData,
      storeEntries: filteredStoreEntries,
    });

    interaction.message.delete();
    return interaction.reply({
      content: 'Entrada eliminada.',
      ephemeral: true,
    });
  }
});

// Create a new command handler map
// eslint-disable-next-line no-undef
const commands = new Map();

// Load all command handlers from the "commands" directory
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.set(command.name, command);
}
const prefix = 'mu!';

client.on('messageCreate', (message) => {
  // Ignore messages that don't start with the prefix or are sent by bots
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  // Parse the command and arguments from the message content
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  // Get the command handler from the map
  const command = commands.get(commandName);

  if (!command) return;

  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply('There was an error executing that command.');
  }
});

// -------------------------------------------- Store Deleting Timeout
// run once a day
setInterval(async () => {
  await storeService.deleteOldStoreEntries();
}, 1000 * 60 * 60 * 24);
