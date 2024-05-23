const { BaseCommand } = require(".");
const { SlashCommandBuilder, ChatInputCommandInteraction, AttachmentBuilder } = require("discord.js");

class ParagraphSummaryCommand extends BaseCommand {
    #connection;

    constructor(connection) {
        const command = new SlashCommandBuilder()
            .setName('parasum')
            .setDescription('Summarizes a given paragraph')
            .addStringOption(option =>
                option.setName('paragraph')
                    .setDescription('The paragraph to summarize')
                    .setRequired(true))
            .addIntegerOption(option =>
                option.setName('percentage')
                    .setDescription('Percentage of summarization to shorten the text to. Default is 25%. Need to be from 20% to 75%')
                    .setRequired(false)); // Make this option not required
        super(command, connection);
    }

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        const state = await super.execute(interaction);
        const fulltext = interaction.options.getString('paragraph');
        let percent = state.percent;
        let privacy = state.privacy;
        if (fulltext.length < 500) return interaction.reply({ content: 'Text is too short. Please provide a text with more than 500 characters.', ephemeral: privacy });
        if (fulltext.length > 6000) {
            interaction.reply({ content: 'Text is too long. Please provide a text with less than 6000 characters.', ephemeral: privacy });
            return;
        }

        const percentageFromCommand = interaction.options.getInteger('percentage');
        let summaryResult = "Not Found";
        if (percentageFromCommand) { // Check if the percentage is provided
            // Check if the percentage is within the range
            if (percentageFromCommand < 20 || percentageFromCommand > 75) {
                await interaction.reply({ content: 'Percentage must be between 20% and 75%', ephemeral: privacy });
                return;
            }
            // Use the percentage value
            percent = percentageFromCommand / 100;
        }

        if (fulltext.length < 800 && percent < 0.5) {
            percent = 0.5;
        }

        interaction.deferReply({ content: 'The Bot is processing', ephemeral: privacy });
        state.rapid.makeRequest('POST', 'text/to-summary', {
            'percent': percent,
            'fulltext': fulltext
        }).then(res => {
            summaryResult = res.output[0];
            if (summaryResult == null || summaryResult.length === 0) return interaction.editReply('Error. No summary found.');
            if (summaryResult.length > 2000) {
                interaction.editReply('The summary is bigger than 2000 characters. Here is the file:');
                let file = new AttachmentBuilder()
                    .setFile(Buffer.from(summaryResult, "utf-8"))
                    .setName("summaryResult.txt");
                interaction.followUp({ files: [file], ephemeral: privacy });
            } else {
                interaction.editReply(summaryResult);
            }
        }).catch(err => {
            console.error(err);
            // Handle or throw the error as needed
        });
    }
}

module.exports = ParagraphSummaryCommand;