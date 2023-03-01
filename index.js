require("dotenv").config();
import firebaseService from "./services/firebaseService";
import admin from "./config/firebase";
const userRoutes = require("./routes/usersRoutes");

// Set up Discord client
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

const express = require("express");
const app = express();
const port = 9000;

//load cache of users
firebaseService.cacheUsers();

const db = admin.firestore();

// Set up Express routes
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

client.once("ready", () => {
  client.on("debug", console.log);
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.content === "!ping") {
    message.reply("Pong!");
  }
});

// Start Express server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
