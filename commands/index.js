const { SlashCommandBuilder, Client, REST, Routes, BaseInteraction, ChatInputCommandInteraction } = require("discord.js");
const RapidClient = require("../api");

class CommandManager {
    #commands = new Map();

    /**
     * 
     * @param {Client} client 
     * @param {BaseCommand[]} commandList 
     */
    constructor(client, commandList) {
        let commandJson = [];
        commandList.forEach(command => {
            this.#commands.set(command.name, command);
            commandJson.push(command.data.toJSON());
        });
        new REST().setToken(client.token).put(Routes.applicationCommands(client.user.id), { body: commandJson });
    }

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        return this.#commands.get(interaction.commandName).execute(interaction);
    }
}

class BaseCommand {
    name = "basecommand";
    data = new SlashCommandBuilder();
    #connection;

    /**
     * Construct a new Command.
     * @param {SlashCommandBuilder} command - The command.
     * @param {import("mysql2/promise").Connection} connection - The database connetion
     */
    constructor(command, connection) {
        this.data = command;
        this.name = command.name;
        this.#connection = connection;
    }

    /**
     * Command logic to handle execution.
     * @param {BaseInteraction} interaction - The interaction that comes from Discord.
     */
    async execute(interaction) {
        // Check if the user is registered
        console.log('Checking if user is registered');
        const [rows] = await this.#connection.execute('SELECT apikey, percent, privacy, limitc FROM user_profile WHERE uid = ?', [interaction.user.id]);

        if (rows.length === 0) {
            // User is not registered
            await interaction.reply('You are not registered!\nPlease go to https://rapidanalysis.github.io/getting-started.html to register and get api key\nThen enter /reg + [api key]');
            return false;
        } else {
            const apiKey = rows[0].apikey;
            const rapid = new RapidClient(apiKey);
            percent = Number(rows[0].percent);
            privacy = !rows[0].privacy;
            limit = Number(rows[0].limitc);
            return {apiKey, rapid, percent, privacy, limit};
        }
    }
}

module.exports.CommandManager = CommandManager;
module.exports.BaseCommand = BaseCommand;