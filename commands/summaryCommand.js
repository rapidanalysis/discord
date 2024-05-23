const { BaseCommand } = require(".");
const { SlashCommandBuilder, ChatInputCommandInteraction, AttachmentBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");

class SummaryCommand extends BaseCommand {

    constructor(connection) {
        const command = new SlashCommandBuilder()
            .setName('sum')
            .setDescription('Summarizes the last n messages in the current channel')
            .addIntegerOption(option =>
                option.setName('limit')
                    .setDescription('Number of messages to summarize. Default is 20. Maximum is 99.')
                    .setRequired(false))
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
        let privacy = state.privacy;
        let percent = state.percent;
        let paragraph = "Not Found";
        let summaryResult = "Not Found";
        let limitChat = interaction.options.getInteger('limit');
        if (limitChat == null) {
            limitChat = state.limit;
        } else {
            limitChat = parseInt(limitChat);
        }
        if (limitChat > 100 || limitChat < 1) return interaction.reply({ content: 'Please provide a number of messages to summarize less than 100 and larger than 0.', ephemeral: privacy });

        if (!parseInt(limitChat)) return interaction.reply({ content: 'Please provide a valid number of messages to summarize.', ephemeral: privacy });
        const channel = interaction.channel;

        try {
            if (!channel) {
                return interaction.reply({ content: 'There are no messages in this channel.', ephemeral: privacy });
            }
            if (channel.messages.size < limitChat) {
                return interaction.reply({ content: 'There are less messages than the limit in this channel.', ephemeral: privacy });
            }

            const messages = await channel.messages.fetch({ limit: limitChat }); // Fetch last limit messages

            // Filter and map messages in one step
            const messageContents = messages.reduce((acc, message) => {
                if (!message.content.startsWith('/sum') && !message.content.startsWith('/ask') && !message.author.bot) {
                    acc.push(message.content);
                }
                return acc;
            }, []);

            paragraph = messageContents.join(' '); // Join all messages into a single paragraph

            if (paragraph.length < 500) return interaction.reply({ content: 'Text is too short. Please provide a text with more than 500 characters.', ephemeral: privacy });
            if (paragraph.length > 6000) {
                interaction.reply({ content: 'Text is too long. Please provide a text with less than 6000 characters.', ephemeral: privacy });
                return;
            }

            const percentage = interaction.options.getInteger('percentage');
            if (percentage) { // Check if the percentage is provided
                // Check if the percentage is within the range
                if (percentage < 20 || percentage > 75) {
                    await interaction.reply({ content: 'Percentage must be between 20% and 75%', ephemeral: privacy });
                    return;
                }
                // Use the percentage value
                percent = percentage / 100;
            }

            if (paragraph.length < 800 && percent < 0.5) {
                percent = 0.5;
            }

            interaction.deferReply({ content: 'The Bot is processing', ephemeral: privacy });
            state.rapid.makeRequest('POST', 'text/to-summary', {
                'percent': percent,
                'fulltext': paragraph
            }).then(async res => {
                summaryResult = res.output[0];
                if (summaryResult == null || summaryResult.length === 0) return interaction.editReply('Error. No summary found.');
                if (summaryResult.length > 2000) {
                    await interaction.editReply('The summary is bigger than 2000 characters. Here is the file:');
                    let file = new AttachmentBuilder()
                        .setFile(Buffer.from(summaryResult, "utf-8"))
                        .setName("summaryResult.txt");
                    await interaction.followUp({ files: [file], ephemeral: privacy });
                } else {
                    await interaction.editReply(summaryResult);
                }

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

module.exports = SummaryCommand;