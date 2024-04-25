const Discord = require("discord.js");
const Intents = Discord.GatewayIntentBits;
const client = new Discord.Client({
    intents: [Intents.Guilds, Intents.GuildMessages, Intents.MessageContent]
});
const RapidClient = require("./api");

require('dotenv').config();

const rapid = new RapidClient(process.env.RAPIDANALYSIS_TOKEN);

client.login(process.env.DISCORD_TOKEN);

client.on("ready", () => {
    console.log("Logged in to Discord.");
});

client.on("messageCreate", (msg) => {
    console.log(msg.content);
    
    if (msg.content.startsWith(".ask")) {
        const prompt = msg.content.split(" ")[1];
        rapid.makeRequest("POST", "generate/text-from-text", { prompt }).then(res => {
            msg.reply(res.output[0]);
        })
    }
});