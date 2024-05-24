const { BaseCommand } = require(".");
const { SlashCommandBuilder, ChatInputCommandInteraction, Collection, Message } = require("discord.js");

class AskCommand extends BaseCommand {

    constructor(connection) {
        const command = new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Generates text from a given prompt')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('The prompt to generate text from')
                .setRequired(true))
        .addBooleanOption(option => 
            option.setName("context")
                .setDescription("Use the last 100 chat messages as context"));
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
        let body = { prompt };
        if (interaction.options.getBoolean("context")) {
            await interaction.deferReply({ ephemeral: state.privacy });
            const messages = await interaction.channel.messages.fetch({ limit: 99, cache: false });
            body.text = await this.buildContext(messages);
        }
        state.rapid.makeRequest('POST', 'generate/text-from-text', body).then(res => {
            if (interaction.deferred) {
                interaction.editReply({ content: res.output[0], ephemeral: state.privacy });
            } else {
                interaction.reply({ content: res.output[0], ephemeral: state.privacy });
            }  
        })
    }

    /**
     * Build context for the LLM from a collection of messages.
     * @param {Collection<import("discord.js").Snowflake, Message>} messages 
     */
    async buildContext(messages) {
        let context = [];
        messages.forEach(message => {
            let user = message.guild.members.cache.get(message.author.id);
            if (user == undefined) {
                user = message.author.displayName;
            } else {
                user = user.nickname;
            }
            context.push(`${user} says: ${message.cleanContent}`);
        });
        context.reverse();
        return context.join("\n");
    }
}

module.exports = AskCommand;