class CommandManager {
    #commands = [];

    constructor(client) {
        this.#commands.forEach(command => {
            client.on("interactionCreate", i => {
                command.handleInteraction(i);
            })
        })
    }
}

module.exports = CommandManager;