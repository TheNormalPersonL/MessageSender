const { Client, GatewayIntentBits } = require('discord.js');
const inquirer = require('inquirer');
const readline = require('readline');

// Set up the Discord client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let rl; // For handling command-line input
let selectedChannel; // Stores the currently selected text channel

// Runs when the bot is ready
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    startChannelSelection(); // Starts the channel selection process
});

// This function handles channel selection using a simple prompt
function startChannelSelection() {
    console.clear(); // Clear the console for a fresh view

    const guilds = client.guilds.cache; // Get the list of all guilds (servers) the bot is in
    let channelList = []; // Stores the text channels

    // Loop through all guilds and channels to grab text-based ones
    guilds.forEach(guild => {
        guild.channels.cache.forEach(channel => {
            if (channel.isTextBased()) {
                channelList.push({ name: `${guild.name} -> ${channel.name}`, id: channel.id });
            }
        });
    });

    const choices = channelList.map((channel) => ({
        name: channel.name, // Display as "Guild Name -> Channel Name"
        value: channel.id // Channel ID as the value
    }));

    // If no text channels are found, exit
    if (choices.length === 0) {
        console.log('No text channels found.');
        process.exit();
    }

    // Prompt the user to select a channel
    inquirer.prompt([
        {
            type: 'list',
            name: 'selectedChannel',
            message: 'Select a channel to send messages to',
            choices
        }
    ])
    .then(answers => {
        // Once selected, save the channel and start accepting input
        selectedChannel = client.channels.cache.get(answers.selectedChannel);
        console.log(`You selected - ${selectedChannel.guild.name} -> ${selectedChannel.name}`);

        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        startListening(); // Begin listening for user input
    })
    .catch(error => {
        console.log('An error occurred:', error);
    });
}

// Listens for new messages in the selected channel
client.on('messageCreate', (message) => {
    // If a message is sent in the selected channel by a non-bot user, print it
    if (selectedChannel && message.channel.id === selectedChannel.id && !message.author.bot) {
        rl.pause(); // Pause input so the message can be printed
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        console.log(`${message.author.tag.replace(':', ' - ')} - ${message.content}`); // Print message
        rl.resume(); // Resume input
        rl.prompt(true);
    }
});

// Start accepting user input for sending messages
function startListening() {
    rl.setPrompt('Type your message - '); // Prompt for user input
    rl.prompt();

    // Handle different types of input commands
    rl.on('line', (input) => {
        const trimmedInput = input.trim().toLowerCase();

        if (trimmedInput === 'clearconsole') {
            console.clear(); // Clear the console on 'clearconsole' command
            rl.prompt();
        } else if (trimmedInput === 'goback') {
            rl.close(); // Go back to channel selection on 'goback' command
            startChannelSelection();
        } else if (selectedChannel && trimmedInput !== '') {
            // Send the message if input is valid
            selectedChannel.send(input)
                .then(() => {
                    process.stdout.clearLine();
                    process.stdout.cursorTo(0);
                    rl.setPrompt('Type your message - '); // Reset prompt
                    rl.prompt();
                })
                .catch(error => {
                    console.log('Error sending message:', error);
                    rl.prompt(); // Re-prompt if there's an error
                });
        } else {
            rl.prompt(); // If input is invalid, just re-prompt
        }
    });
}

// Log in with your bot token
client.login('Bot Token Goes Here');
