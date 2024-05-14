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
const mysql = require('mysql2/promise');
const dbConfig = require('./dbConfig');

client.login(process.env.DISCORD_TOKEN);

let paragraph = 'Not Found';
let summaryResult = 'Not Found';
let guildID = '';
let percent = 0.25;

client.on('ready', () => {
    console.log("Logged in to Discord.");

    const guild = client.guilds.cache.first();
    if (!guild) {
        console.error("Bot is not in any guilds!");
        return;
    }
    guildID = guild.id;

    const regCommand = new SlashCommandBuilder()
        .setName('reg')
        .setDescription('Registers user')
        .addStringOption(option =>
            option.setName('api_key')
                .setDescription('Rapid Analysis API Key')
                .setRequired(true));

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

    client.guilds.cache.get(guildID).commands.set([regCommand, askCommand, parasumCommand, sumCommand]);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    const userId = interaction.user.id;

    if (commandName === 'reg') {
        const apiKey = interaction.options.getString('api_key');
        // Test the API key
        const rapidtest = new RapidClient(apiKey);
        rapidtest.makeRequest("POST", "generate/text-from-text", { prompt: "test" }).then(async res => {
            if(!res) {
                // API key is invalid
                await interaction.reply('API Key is invalid. Please enter a valid API key.');
            } else {
                // API key is valid, save it to the database
                try {
                    const connection = await mysql.createConnection(dbConfig);
                    const sql = 'INSERT INTO user_profile (uid, percent, apikey) VALUES (?, ?, ?)';
                    await connection.execute(sql, [userId, percent, apiKey]);
                    await connection.end();
                    await interaction.reply('Your API key has been registered. You can use the bot now.');
                } catch (err) {
                    console.error('Failed to save to database:', err);
                }
            }
        });
    } else {
        // Check if the user is registered
        console.log('Checking if user is registered');
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT apikey FROM user_profile WHERE uid = ?', [userId]);
        await connection.end();

        if (rows.length === 0) {
            // User is not registered
            await interaction.reply('You are not registered!\nPlease go to https://rapidanalysis.github.io/getting-started.html to register and get api key\nThen enter /reg + [api key]');
        } else {
            // User is registered
            const apiKey = rows[0].apikey;
            const rapid = new RapidClient(apiKey);

            if (commandName === 'ask') {
                const prompt = interaction.options.getString('prompt');
                rapid.makeRequest("POST", "generate/text-from-text", { prompt }).then(res => {
                    interaction.reply(res.output[0]);
                })
            }
            if (commandName === 'parasum') {
                const fulltext = interaction.options.getString('paragraph');
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
                    paragraph = messageContents.join(' '); // Join all messages into a single paragraph
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
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'positive') {
        await interaction.reply({ content: 'Thank you for your feedback!', ephemeral: true });
    } else if (interaction.customId === 'negative') {
        // Save the summary result to the database
        try {
            const connection = await mysql.createConnection(dbConfig);
            const sql = 'INSERT INTO negative_feedback (summary, paragraph) VALUES (?, ?)';
            await connection.execute(sql, [summaryResult, paragraph]);
            await connection.end();
            console.log('Negative feedback summary and paragraph saved to database');
        } catch (err) {
            console.error('Failed to save to database:', err);
        }
        await interaction.reply({ content: 'Thank you for your feedback!', ephemeral: true });
    }

    // Delete the button message
    await interaction.message.delete();
});