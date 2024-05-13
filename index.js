const Discord = require("discord.js");
const Intents = Discord.GatewayIntentBits;
const client = new Discord.Client({
    intents: [Intents.Guilds, Intents.GuildMessages, Intents.MessageContent]
});
const RapidClient = require("./api");

require('dotenv').config();

const rapid = new RapidClient(process.env.RAPIDANALYSIS_TOKEN);
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const fs = require('fs');

client.login(process.env.DISCORD_TOKEN);

let summaryResult = 'Not Found';
let guildID = '';

client.on('ready', () => {
    console.log("Logged in to Discord.");

    const guild = client.guilds.cache.first();
    if (!guild) {
        console.error("Bot is not in any guilds!");
        return;
    }
    guildID = guild.id;

    const askCommand = new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Generates text from a given prompt')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('The prompt to generate text from')
                .setRequired(true));

    const parasumCommand = new SlashCommandBuilder()
        .setName('parasum')
        .setDescription('Summarizes a given paragraph')
        .addStringOption(option =>
            option.setName('paragraph')
                .setDescription('The paragraph to summarize')
                .setRequired(true));

    const sumCommand = new SlashCommandBuilder()
        .setName('sum')
        .setDescription('Summarizes the last n messages in the current channel')
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription('Number of messages to summarize')
                .setRequired(true));

    client.guilds.cache.get(guildID).commands.set([askCommand, parasumCommand, sumCommand]);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'ask') {
        const prompt = interaction.options.getString('prompt');
        rapid.makeRequest("POST", "generate/text-from-text", { prompt }).then(res => {
            interaction.reply(res.output[0]);
        })
    }
    if (commandName === 'parasum') {
        const fulltext = interaction.options.getString('paragraph');
        let percent = 0.25;
        if(fulltext.length < 500) return interaction.reply("Text is too short. Please provide a text with more than 500 characters.");
        if(fulltext.length < 1000) percent = 0.5;
        await interaction.deferReply(); // Acknowledge the interaction
        rapid.makeRequest("POST", "text/to-summary", {
            "percent": percent,
            "fulltext": fulltext
        }).then(res => {
            interaction.editReply(res.output[0]); // Edit the initial reply
        })
    }
    if (commandName === 'sum') {
        let limitChat = interaction.options.getInteger('limit');
        limitChat = parseInt(limitChat) + 1;

        if (!parseInt(limitChat)) return interaction.reply("Please provide a valid number of messages to summarize.");
        const channel = interaction.channel;

        try {
            const messages = await channel.messages.fetch({ limit: limitChat }); // Fetch last 10 messages
            const messageContents = messages.filter(
                m => !m.content.startsWith('/sum') && !m.content.startsWith('/ask') && !m.author.bot).map(m => m.content);
            const paragraph = messageContents.join(' '); // Join all messages into a single paragraph
            percent = 0.25;
            if(paragraph.length < 500) return interaction.reply("Text is too short. Please provide a text with more than 500 characters.");
            if(paragraph.length > 6000) {
                interaction.reply("Text is too long. Please provide a text with less than 6000 characters.");
                return;
            }
            await interaction.deferReply();
            rapid.makeRequest("POST", "text/to-summary", {
                "percent": percent,
                "fulltext": paragraph
            }).then(async res => {
                summaryResult = res.output[0]; // Store the summary result
                await interaction.editReply(res.output[0]);

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
                await interaction.followUp({ content: 'Please provide your feedback:', components: [row] });
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