const { Client, GatewayIntentBits } = require('discord.js');
const inquirer = require('inquirer');
const readline = require('readline');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let rl;
let selectedChannel;

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    startChannelSelection();
});

function startChannelSelection() {
    console.clear(); // Clears console before showing channel selection

    const guilds = client.guilds.cache;
    let channelList = [];

    guilds.forEach(guild => {
        guild.channels.cache.forEach(channel => {
            if (channel.isTextBased()) {
                channelList.push({ name: `${guild.name} -> ${channel.name}`, id: channel.id });
            }
        });
    });

    const choices = channelList.map((channel) => ({
        name: channel.name,
        value: channel.id
    }));

    if (choices.length === 0) {
        console.log('No text channels found.');
        process.exit();
    }

    inquirer.prompt([
        {
            type: 'list',
            name: 'selectedChannel',
            message: 'Select a channel to send messages to',
            choices
        }
    ])
    .then(answers => {
        selectedChannel = client.channels.cache.get(answers.selectedChannel);
        console.log(`You selected - ${selectedChannel.guild.name} -> ${selectedChannel.name}`);

        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        startListening();
    })
    .catch(error => {
        console.log('An error occurred:', error);
    });
}

client.on('messageCreate', (message) => {
    if (selectedChannel && message.channel.id === selectedChannel.id && !message.author.bot) {
        rl.pause();
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        console.log(`${message.author.tag.replace(':', ' - ')} - ${message.content}`);
        rl.resume();
        rl.prompt(true);
    }
});

function startListening() {
    rl.setPrompt('Type your message - ');
    rl.prompt();

    rl.on('line', (input) => {
        if (input.trim().toLowerCase() === 'clearconsole') {
            console.clear();
            rl.prompt();
        } else if (input.trim().toLowerCase() === 'goback') {
            rl.close();
            startChannelSelection();
        } else if (selectedChannel && input.trim() !== '') {
            selectedChannel.send(input)
                .then(() => {
                    process.stdout.clearLine();
                    process.stdout.cursorTo(0);
                    rl.setPrompt('Type your message - ');
                    rl.prompt();
                })
                .catch(error => {
                    console.log('Error sending message:', error);
                    rl.prompt();
                });
        } else {
            rl.prompt();
        }
    });
}

client.login('Bot Token Goes Here');
