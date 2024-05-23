const { BaseCommand } = require(".");
const { SlashCommandBuilder, ChatInputCommandInteraction } = require("discord.js");

class AskCommand extends BaseCommand {

    constructor(connection) {
        const command = new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Generates text from a given prompt')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('The prompt to generate text from')
                .setRequired(true));
        super(command, connection);
    }

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        const state = await super.execute(interaction);
        if (!state) {
            return;
        }
        const prompt = interaction.options.getString('prompt');
        state.rapid.makeRequest('POST', 'generate/text-from-text', { prompt }).then(res => {
            interaction.reply(res.output[0]);
        })
    }
}

module.exports = AskCommand;