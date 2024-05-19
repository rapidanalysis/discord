# RapidAnalysis Text Bot

## Introduction
The Large Language Model (LLM), when given a context, is a substantial tool for all-around text-based work tasks. The goal of our project is to improve workflow through simplification of team communication through LLM. 

The RapidAnalysis Text Bot is a Discord chatbot designed to automatically summarise conversations within Discord servers. The bot aims to address the challenge of information overload in active Discord communities by providing users with concise summaries of ongoing conversations. Developed using RapidAnalysis's LLM through API requests for text summarisation, the bot offers real-time summarisation capabilities to enhance user experience on Discord.

## Features 
- **/ask**
	- **Description**: Generates text from a given prompt.
	- **Explanation**: This command is used to produce text based on a specific input provided by the user
-  **/parasum**
    - **Description**: Summarises a given paragraph.
    - **Explanation**: This command is designed to take a paragraph of text and condense it into a shorter summary. It is useful for quickly understanding the main points of a lengthy paragraph.
	- **Option for /parasum**: 
		- **percentage**:
			- **Description**: Percentage of summarisation to shorten the text to.
			- **Details**: This option sets how much the text should be condensed in the summary. The default value is 25%, meaning the summary will be approximately 25% of the original text's length. The allowed range is from 20% to 75%.
 
- **/pref**
    - **Description**: Set the percentage of summarisation.
    - **Explanation**: This command allows the user to specify how much of the original text should be included in the summary. For example, setting it to 50% would aim to create a summary that is half the length of the original text.
    - 1. **Options for /pref**:
	    - **percentage**:
	        - **Description**: Percentage of summarisation to shorten the text to (20%-75%). Default is 25%.
	        - **Details**: This option sets the default percentage for how much the text should be condensed in the summary. For example, setting it to 30% will make all future summaries approximately 30% of the original text length.
	    - **privacy**:
	        - **Description**: Set the privacy of the summary. Default is public (TRUE).
	        - **Details**: This option allows the user to set the privacy level of the summaries. When set to TRUE, the summary will be public.
	    - **limit**:
	        - **Description**: Set the default limit of /sum. Default is 20.
	        - **Details**: This option sets the default number of messages to be summarised when using the `/sum` command. For example, if you set the limit to 30, then every time you use the `/sum` command, it will summarise the last 30 messages by default.
- **/reg**
    - **Description**: Registers user.
    - **Explanation**: This command is used to register a new user in the system. It takes in the user's api key. 
- **/sum**
    - **Description**: Summarises the last n messages in the current channel.
    - **Explanation**: This command is used to create a summary of the most recent messages in a communication channel. The number of messages to be summarised is specified by the user through these options: 
	    - **limit**:
		    - **Description**: Number of messages to summarise.
		    - **Details**: This option specifies how many of the most recent messages in the current channel should be included in the summary. The default value is 20 messages, and the maximum value is 99 messages.
		- **percentage**:
		    - **Description**: Percentage of summarisation to shorten the text to.
		    - **Details**: This option sets how much the text should be condensed in the summary. The default value is 25%, meaning the summary will be approximately 25% of the original text's length. The allowed range is from 20% to 75%.


## Installation

### Requirements

- A Discord account
- A Discord server where you have admin privileges

### Bot Installation

1. **Bot Invite Link**:
    
    - Click on the following [invite link](https://canary.discord.com/oauth2/authorize?client_id=1213473267457724416&scope=applications.commands%20bot&integration_type=0).
    
    
2. **Authorise the Bot**:
    
    - In the "ADD TO SERVER" field, select the desired server where you want to add the bot.
    - Click the "Authorize" button.
      
<img src="https://github.com/rapidanalysis/discord/blob/prototype/documents/Images/Screenshot%202024-05-19%20at%202.52.35%20pm.png" width="300" height="500">  
	Fig 1: A screenshot of a bot invitation pop-up with 'authorise' button highlighted.


That's it! In just two simple steps, the bot will be installed on your server. You can now start interacting with the bot and utilise its summarisation features.

<img src="https://github.com/rapidanalysis/discord/blob/prototype/documents/Images/Screenshot%202024-05-19%20at%202.55.24%20pm.png" width="300" height="300"> 
	Fig 2: Screenshot of a success pop-up indicating that the bot has been successfully added to the selected server.

## Usage

<img src="https://github.com/rapidanalysis/discord/blob/prototype/documents/Images/U1.png" width="600" height="300">
Fig 1: A snapshot of a discord server

The user interface presented is the classic Discord server interface, which is characterised by its user-friendly and intuitive design. The layout typically features a column on the far left that lists the server name at the top — in this case, ‘rapidanalysis group 26’ — followed by a list of text and voice channels. Here, there are two text channels: ‘general’ for regular conversations and ‘bot’ for interactions with the bot. 

Creating a separate channel for bot queries, like the ‘bot’ channel seen here, is highly recommended to keep bot interactions organised. By creating a separate channel specifically for bot interactions, users can issue commands and receive summaries without cluttering other channels where different discussions are taking place.

<img src="https://github.com/rapidanalysis/discord/blob/prototype/documents/Images/U2.png" width="600" height="500">
Fig 2: A drop-down table displaying a range of commands

typing '/' into the chat text field triggers a drop-down table displaying a range of commands, including 'summarise' and 'preference', for easy access and efficiency.

A response from the bot will be a reply to its corresponding request message. 

<img src="https://github.com/rapidanalysis/discord/blob/prototype/documents/Images/U3.png" width="500" height="500">
Fig 3: An example of the bot's responses to user requests 


