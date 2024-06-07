# Setup Guide

## Prerequisites:
- Node.js >=18
- npm
- MySQL/MariaDB
- Discord account

## Steps:
1. Clone the repository and change into the directory.
2. Create an application in the [Discord developer panel](https://canary.discord.com/developers/applications) and add a bot user.
3. Enable the Message Content Privileged Gateway Intent.
4. Copy the bot token from the panel, create a file named `.env` and add your Discord bot token in the format `DISCORD_TOKEN=<your token>`.
5. Copy `setup.example.sql` to `setup.sql` and edit the password in the `CREATE USER` statement.
6. Run the modified SQL setup script.
7. Copy `dbConfig.example.js` to `dbConfig.js` and edit placeholders with your SQL details.
8. Install npm dependencies with `npm i`
9. Recommended: Install and use a process manager
    1. Install pm2 (`npm i -g pm2`)
    2. Start the bot with the process manager (`pm2 start . --name discord`)
    3. Save the process list (`pm2 save`)
10.	Start the bot with `node .` if not using a process manager. 

