const { SlashCommandBuilder, Client, REST, Routes, BaseInteraction, ChatInputCommandInteraction } = require("discord.js");

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

    /**
     * Construct a new Command.
     * @param {SlashCommandBuilder} command - The command.
     */
    constructor(command) {
        this.data = command;
        this.name = command.name;
    }

    /**
     * Command logic to handle execution.
     * @param {BaseInteraction} interaction - The interaction that comes from Discord.
     */
    async execute(interaction) {
        await interaction.reply("test");
    }
}

module.exports.CommandManager = CommandManager;
module.exports.BaseCommand = BaseCommand;