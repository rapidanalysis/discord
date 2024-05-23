const { BaseCommand } = require(".");
const { SlashCommandBuilder, ChatInputCommandInteraction } = require("discord.js");

class PreferencesCommand extends BaseCommand {

    constructor(connection) {
        const command = new SlashCommandBuilder()
            .setName('pref')
            .setDescription('Set the percentage of summarization')
            .addIntegerOption(option =>
                option.setName('percentage')
                    .setDescription('Percentage of summarization to shorten the text to (20%-75%). Default is 25%.')
                    .setRequired(false))
            .addBooleanOption(option =>
                option.setName('privacy')
                    .setDescription('Set the privacy of the summary. Default is public (TRUE).')
                    .setRequired(false))
            .addIntegerOption(option =>
                option.setName('limit')
                    .setDescription('Set the default limit of /sum. Default is 20.')
                    .setRequired(false));
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
        let percentage = interaction.options.getInteger('percentage');
        let privacies = interaction.options.getBoolean('privacy');
        let limitChat = interaction.options.getInteger('limit');

        let percent = state.percent;
        let limit = state.limit;
        let privacy = state.privacy;

        if (limitChat == null) {
            limitChat = limit;
        } else {
            if (limitChat > 100 || limitChat < 1) return interaction.reply('Please provide a number of messages to summarize less than 100 and larger than 1.');
        }

        if (percentage) { // Check if the percentage is provided
            // Check if the percentage is within the range
            if (percentage < 20 || percentage > 75) {
                interaction.reply('Percentage must be between 20% and 75%');
                return;
            }
            percentage = percentage / 100;
        } else {
            percentage = percent;
        }
        if (privacies != null) {
            privacies = !privacy;
        }

        // Save the percentage preference to the server
        try {
            await this.#connection.execute('UPDATE user_profile SET percent = ?, privacy = ?, limitc = ? WHERE uid = ?', [percentage, privacy, limitChat, interaction.user.id]);
            await interaction.reply('Preference updated successfully.');
        } catch (err) {
            console.error(err);
            await interaction.reply('Failed to update preference.');
        }
    }
}

module.exports = PreferencesCommand;