const Discord = require("discord.js");
const Intents = Discord.GatewayIntentBits;
const client = new Discord.Client({
    intents: [Intents.Guilds, Intents.GuildMessages, Intents.MessageContent]
});
const RapidClient = require("./api");

require('dotenv').config();

const rapid = new RapidClient(process.env.RAPIDANALYSIS_TOKEN);
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const fs = require('fs');

client.login(process.env.DISCORD_TOKEN);

client.on("ready", () => {
    console.log("Logged in to Discord.");
});

client.on("messageCreate", async (msg) => {
    console.log(msg.content);
    if (msg.content.startsWith(".ask")) {
        const prompt = msg.content.split(" ").slice(1).join(" ");
        console.log(prompt);
        rapid.makeRequest("POST", "generate/text-from-text", { prompt }).then(res => {
            msg.reply(res.output[0]);
        })
    }
    if (msg.content.startsWith(".parasum")) {
        const fulltext = msg.content.split(" ").slice(1).join(" ");
        percent = 0.25;
        if (fulltext.length < 500) return msg.reply("Text is too short. Please provide a text with more than 500 characters.");
        if (fulltext.length < 1000) percent = 0.5;
        rapid.makeRequest("POST", "text/to-summary", {
            "percent": percent,
            "fulltext": fulltext
        }).then(res => {
            msg.reply(res.Output);
        })
    }
    if (msg.content.startsWith(".sum")) {
        let limitChat = msg.content.split(" ")[1];
        limitChat = parseInt(limitChat) + 1;

        if (!parseInt(limitChat)) return msg.reply("Please provide a valid number of messages to summarize.");
        const channel = msg.channel;

        try {
            const messages = await channel.messages.fetch({ limit: limitChat }); // Fetch last 10 messages
            const messageContents = messages.filter(m => !m.content.startsWith('.sum') && !m.content.startsWith('.ask')).map(m => m.content);
            const paragraph = messageContents.join(' '); // Join all messages into a single paragraph
            percent = 0.25;
            if (paragraph.length < 500) return msg.reply("Text is too short. Please provide a text with more than 500 characters.");
            if (paragraph.length > 6000) {
                msg.reply("Text is too long. Please provide a text with less than 6000 characters.");
                return;
            }
            rapid.makeRequest("POST", "text/to-summary", {
                "percent": percent,
                "fulltext": paragraph
            }).then(res => {
                summaryResult = res.Output; // Store the summary result
                msg.reply(summaryResult);

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('positive')
                            .setLabel('Good')
                            .setStyle('Success'),
                        new ButtonBuilder()
                            .setCustomId('negative')
                            .setLabel('Bad')
                            .setStyle('Danger')
                    );

                // Send the feedback buttons in a separate message
                msg.reply({ content: 'Please provide your feedback:', components: [row] });
            })
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'positive') {
        await interaction.reply({ content: 'Thank you for your feedback!', ephemeral: true });
    } else if (interaction.customId === 'negative') {
        // Save the summary result to a file
        fs.appendFile('negative_summary.txt', ' Negative Result:' + summaryResult + '\n', err => {
            if (err) {
                console.error(err);
            } else {
                console.log('Negative feedback summary saved to negative_summary.txt');
            }
        });
        await interaction.reply({ content: 'Thank you for your feedback!', ephemeral: true });
    }

    // Delete the button message
    await interaction.message.delete();
});