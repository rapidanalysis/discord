const { BaseCommand } = require(".");
const RapidClient = require("../api");
const { SlashCommandBuilder, ChatInputCommandInteraction } = require("discord.js");

class RegisterCommand extends BaseCommand {
    #connection;

    constructor(connection) {
        const command = new SlashCommandBuilder()
        .setName('reg')
        .setDescription('Registers user')
        .addStringOption(option =>
            option.setName('api_key')
                .setDescription('Rapid Analysis API Key')
                .setRequired(true));
        super(command);
        this.#connection = connection;
    }

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        const apiKey = interaction.options.getString('api_key');
        // Test the API key
        const rapidtest = new RapidClient(apiKey);
        await interaction.deferReply({ ephemeral: true });
        rapidtest.makeRequest('POST', 'generate/text-from-text', { prompt: 'test' }).then(async res => {
            if (!res) {
                // API key is invalid
                await interaction.editReply('API Key is invalid. Please enter a valid API key.');
            } else {
                // API key is valid, save it to the database
                try {
                    const [rows] = await this.#connection.execute('SELECT * FROM user_profile WHERE uid = ?', [interaction.user.id]);

                    if (rows.length === 0) {
                        // The user doesn't exist in the table, so insert a new row
                        await this.#connection.execute('INSERT INTO user_profile (uid, apikey, percent, privacy, limitc) VALUES (?, ?, ?, ?, ?)', [interaction.user.id, apiKey, 0.25, 1, 20]);
                    } else {
                        // The user already exists in the table, so update the existing row
                        await this.#connection.execute('UPDATE user_profile SET apikey = ? WHERE uid = ?', [apiKey, interaction.user.id]);
                    }

                    // Delete the user's reply
                    await interaction.editReply({ content: 'API Key updated successfully.', fetchReply: true, ephemeral: true });
                } catch (err) {
                    console.error(err);
                    await interaction.editReply('Failed to update API Key.', { ephemeral: true });
                }
            }
        }).catch(async () => {
            // API key is invalid
            await interaction.editReply('API Key is invalid. Please enter a valid API key.', { ephemeral: true });
        });
    }
}

module.exports = RegisterCommand;