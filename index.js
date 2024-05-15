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
let percent = 0.25;
let privacy = false;

client.on('ready', () => {
    console.log("Logged in to Discord.");

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
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('percentage')
                .setDescription('Percentage of summarization to shorten the text to. Default is 25%. Need to be from 10% to 75%')
                .setRequired(false)); // Make this option not required

    const sumCommand = new SlashCommandBuilder()
        .setName('sum')
        .setDescription('Summarizes the last n messages in the current channel')
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription('Number of messages to summarize')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('percentage')
                .setDescription('Percentage of summarization to shorten the text to. Default is 25%. Need to be from 20% to 75%')
                .setRequired(false)); // Make this option not required

    const prefCommand = new SlashCommandBuilder()
        .setName('pref')
        .setDescription('Set the percentage of summarization')
        .addIntegerOption(option =>
            option.setName('percentage')
                .setDescription('Percentage of summarization to shorten the text to (20%-75%). Default is 25%.')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('privacy')
                .setDescription('Set the privacy of the summary. Default is public (TRUE).')
                .setRequired(false));

    client.guilds.cache.get('1223195046854266910').commands.set([regCommand, askCommand, parasumCommand, sumCommand, prefCommand]);
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
            if (!res) {
                // API key is invalid
                await interaction.reply('API Key is invalid. Please enter a valid API key.');
            } else {
                // API key is valid, save it to the database
                try {
                    const connection = await mysql.createConnection(dbConfig);
                    const [rows] = await connection.execute('SELECT * FROM user_profile WHERE uid = ?', [userId]);

                    if (rows.length === 0) {
                        // The user doesn't exist in the table, so insert a new row
                        await connection.execute('INSERT INTO user_profile (uid, apikey, percent, privacy) VALUES (?, ?, ?, ?)', [userId, apiKey, 0.25, 1]);
                    } else {
                        // The user already exists in the table, so update the existing row
                        await connection.execute('UPDATE user_profile SET apikey = ? WHERE uid = ?', [apiKey, userId]);
                    }
                    await connection.end();

                    // Delete the user's reply
                    const userReply = await interaction.reply({ content: 'API Key updated successfully.', fetchReply: true });
                    setTimeout(() => userReply.delete(), 2000); // Delete after 2 seconds
                } catch (err) {
                    console.error(err);
                    await interaction.reply('Failed to update API Key.');
                }
            }
        });
    } else {
        // Check if the user is registered
        console.log('Checking if user is registered');
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT apikey, percent, privacy FROM user_profile WHERE uid = ?', [userId]);
        await connection.end();

        if (rows.length === 0) {
            // User is not registered
            await interaction.reply('You are not registered!\nPlease go to https://rapidanalysis.github.io/getting-started.html to register and get api key\nThen enter /reg + [api key]');
        } else {
            // User is registered
            const apiKey = rows[0].apikey;
            const rapid = new RapidClient(apiKey);
            percent = Number(rows[0].percent);
            privacy = !rows[0].privacy;

            if (commandName === 'ask') {
                const prompt = interaction.options.getString('prompt');
                rapid.makeRequest("POST", "generate/text-from-text", { prompt }).then(res => {
                    interaction.reply(res.output[0]);
                })
            }
            if (commandName === 'parasum') {
                const fulltext = interaction.options.getString('paragraph');
                if (fulltext.length < 500) return interaction.reply("Text is too short. Please provide a text with more than 500 characters.");
                if (paragraph.length > 6000) {
                    interaction.reply("Text is too long. Please provide a text with less than 6000 characters.");
                    return;
                }

                const percentage = interaction.options.getInteger('percentage');
                if (percentage) { // Check if the percentage is provided
                    // Check if the percentage is within the range
                    if (percentage < 20 || percentage > 75) {
                        await interaction.reply('Percentage must be between 20% and 75%');
                        return;
                    }
                    // Use the percentage value
                    percent = percentage / 100;
                }

                interaction.deferReply({ content: "The Bot is processing", ephemeral: privacy });
                rapid.makeRequest("POST", "text/to-summary", {
                    "percent": percent,
                    "fulltext": fulltext
                }).then(res => {
                    interaction.editReply(res.output[0]); // Edit the initial reply
                }).catch(err => {
                    console.error(err);
                    // Handle or throw the error as needed
                });
            }
            if (commandName === 'sum') {
                let limitChat = interaction.options.getInteger('limit');
                limitChat = parseInt(limitChat) + 1;

                if (!parseInt(limitChat)) return interaction.reply("Please provide a valid number of messages to summarize.");
                const channel = interaction.channel;

                try {
                    const messages = await channel.messages.fetch({ limit: limitChat }); // Fetch last 10 messages

                    // Filter and map messages in one step
                    const messageContents = messages.reduce((acc, message) => {
                        if (!message.content.startsWith('/sum') && !message.content.startsWith('/ask') && !message.author.bot) {
                            acc.push(message.content);
                        }
                        return acc;
                    }, []);

                    paragraph = messageContents.join(' '); // Join all messages into a single paragraph

                    if (paragraph.length < 500) return interaction.reply("Text is too short. Please provide a text with more than 500 characters.");
                    if (paragraph.length > 6000) {
                        interaction.reply("Text is too long. Please provide a text with less than 6000 characters.");
                        return;
                    }

                    const percentage = interaction.options.getInteger('percentage');
                    if (percentage) { // Check if the percentage is provided
                        // Check if the percentage is within the range
                        if (percentage < 20 || percentage > 75) {
                            await interaction.reply('Percentage must be between 20% and 75%');
                            return;
                        }
                        // Use the percentage value
                        percent = percentage / 100;
                    }

                    interaction.deferReply({ content: "The Bot is processing", ephemeral: privacy });
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
                        await interaction.followUp({ content: 'Please provide your feedback:', components: [row], ephemeral: privacy });
                    })
                } catch (error) {
                    console.error('Error fetching messages:', error);
                }
            }
            if (commandName === 'pref') {
                let percentage = interaction.options.getInteger('percentage');
                let privacies = interaction.options.getBoolean('privacy');

                if (percentage) { // Check if the percentage is provided
                    // Check if the percentage is within the range
                    if (percentage < 20 || percentage > 75) {
                        await interaction.reply('Percentage must be between 20% and 75%');
                        return;
                    }
                    percentage = percentage / 100;
                } else {
                    percentage = percent;
                }
                if(privacies != null) {
                    privacies = !privacy;
                }

                // Save the percentage preference to the server
                try {
                    const connection = await mysql.createConnection(dbConfig);
                    await connection.execute('UPDATE user_profile SET percent = ?, privacy = ? WHERE uid = ?', [percentage, privacy, userId]);
                    await interaction.reply('Preference updated successfully.');
                } catch (err) {
                    console.error(err);
                    await interaction.reply('Failed to update preference.');
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
        await interaction.update({ content: 'Thank you for your feedback!' });
    }
    // Delete the button message
    if (privacy === false) {
        await interaction.message.delete();
    }
});