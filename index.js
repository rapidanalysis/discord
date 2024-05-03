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
    if (msg.content.startsWith(".parasum")) {
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

client.on("messageCreate", async (msg) => { // Summarize last n messages
    if (msg.content.startsWith(".sum")) {
        let limitChat = msg.content.split(" ")[1]; // Number of chat to get
        limitChat = parseInt(limitChat) + 1;

        if (!parseInt(limitChat)) return msg.reply("Please provide a valid number of messages to summarize.");
        const channel = msg.channel;

        try {
            const messages = await channel.messages.fetch({ limit: limitChat }); // Fetch last limitChat messages
            const messageContents = messages.filter(m => !m.content.startsWith('.sum') && !m.content.startsWith('.ask')).map(m => m.content);
            const paragraph = messageContents.join(' '); // Join all messages into a single paragraph
            percent = 0.25;
            if(paragraph.length < 500) return msg.reply("Text is too short. Please provide a text with more than 500 characters.");
            if(paragraph.length > 6000) {
                msg.reply("Text is too long. Please provide a text with less than 6000 characters.");
                return;
            }

            rapid.makeRequest("POST", "text/to-summary", {
                "percent": percent,
                "fulltext": paragraph
            }).then(res => {
                msg.reply(res.Output);
            })
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }
});