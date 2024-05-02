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
        const prompt = msg.content.split(" ").slice(1).join(" ");
        rapid.makeRequest("POST", "generate/text-from-text", { prompt }).then(res => {
            msg.reply(res.output[0]);
        })
    }
});

client.on("messageCreate", (msg) => {
    if (msg.content.startsWith(".sum")) {
        const fulltext = msg.content.split(" ").slice(1).join(" ");
        console.log(fulltext.length);
        if(fulltext.length < 500) return msg.reply("Text is too short. Please provide a text with more than 500 characters.");
        rapid.makeRequest("POST", "text/to-summary", {
            "percent": 0.25,
            "fulltext": fulltext
        }).then(res => {
            msg.reply(res.Output);
        })
    }
});