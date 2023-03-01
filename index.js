require("dotenv").config();
import firebaseService from "./services/firebaseService";
import admin from "./config/firebase";
const userRoutes = require("./routes/usersRoutes");

// -------------------------------------------------------------------------------------------------------Firebase stuff
firebaseService.cacheUsers();
const db = admin.firestore();

// ----------------------------------------------------------------------------------Set up express
const express = require("express");
const app = express();
const port = 9000;

// -----------------------------------------------------------------------------------Set up Discord client
const fs = require("fs");
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));
const { Client, GatewayIntentBits, Partials } = require("discord.js");

const client = new Client({
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

client.once("ready", () => {
  client.on("debug", console.log);
  console.log(`Logged in as ${client.user.tag}`);
});

// Create a new command handler map
const commands = new Map();

// Load all command handlers from the "commands" directory
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.set(command.name, command);
}
const prefix = "mu!";

client.on("message", (message) => {
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
    message.reply("There was an error executing that command.");
  }
});

// --------------------------------------------------------------------------------------------------------Set up Express routes
app.use("/users", userRoutes);

app.post("/adduser", async (req, res) => {
  const name = req.body.name;
  const age = req.body.age;

  await db.collection("users").add({
    name: name,
    age: age,
  });
  console.log("User added to Firestore!");
  res.send("User added to Firestore!");
});

// Start Express server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
