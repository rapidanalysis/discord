const Discord = require("discord.js");
const Intents = Discord.GatewayIntentBits;
const client = new Discord.Client({
    intents: [Intents.Guilds, Intents.GuildMessages, Intents.MessageContent]
});

require('dotenv').config();

client.login(process.env.DISCORD_TOKEN);

client.on("ready", () => {
    console.log("Logged in to Discord.");
});

client.on("messageCreate", (msg) => {
    console.log(msg.content);
});