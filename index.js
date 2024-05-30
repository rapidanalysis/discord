const Discord = require("discord.js");
const Intents = Discord.GatewayIntentBits;
const client = new Discord.Client({
    intents: [Intents.Guilds, Intents.GuildMessages, Intents.MessageContent]
});

require('dotenv').config();

const mysql = require('mysql2/promise');
const dbConfig = require('./dbConfig');
const RegisterCommand = require("./commands/registerCommand");
const AskCommand = require("./commands/askCommand");
const ParagraphSummaryCommand = require("./commands/paragraphSummaryCommand");
const { CommandManager } = require("./commands");
const SummaryCommand = require("./commands/summaryCommand");
const PreferencesCommand = require("./commands/preferencesCommand");

client.login(process.env.DISCORD_TOKEN);

let paragraph = 'Not Found';
let summaryResult = 'Not Found';
let connection;
let commandManager;

client.on('ready', async () => {
    console.log('Logged in to Discord.');

    connection = await mysql.createPool(dbConfig);

    const regCommand = new RegisterCommand(connection);
    const askCommand = new AskCommand(connection);
    const parasumCommand = new ParagraphSummaryCommand(connection);
    const sumCommand = new SummaryCommand(connection);
    const prefCommand = new PreferencesCommand(connection);

    commandManager = new CommandManager(client, [regCommand, askCommand, parasumCommand, sumCommand, prefCommand]);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    commandManager.execute(interaction);
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
        await interaction.update({ content: 'Thank you for your feedback!', ephemeral: true });
    }
    // Delete the button message
    interaction.message.delete();
});