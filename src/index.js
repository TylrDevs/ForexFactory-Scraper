require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, AttachmentBuilder } = require('discord.js');
const cron = require('node-cron');
const { scrapeForexFactoryEvents, scrapeForexFactoryCalendar } = require('./scraper');
const config = require('./config');
const fs = require('fs');
const path = require('path');

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

/**
 * Create Discord embed with screenshot of ForexFactory calendar
 * @param {String} screenshotPath - Path to the screenshot file
 * @param {Object} options - Additional options
 * @returns {Object} - Discord embed with attachment
 */
function createCalendarEmbed(screenshotPath, options = {}) {
  const days = options.days || 1;
  
  if (!screenshotPath || !fs.existsSync(screenshotPath)) {
    return { 
      embed: new EmbedBuilder()
        .setTitle('ForexFactory Calendar')
        .setDescription('Failed to capture calendar screenshot.')
        .setColor(config.DISCORD.COLORS.ERROR)
        .setTimestamp(),
      attachment: null
    };
  }

  // Get image file stats
  const stats = fs.statSync(screenshotPath);
  const fileSize = (stats.size / 1024).toFixed(1) + ' KB';
  
  // Format current date
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Create title based on number of days
  let title = '';
  let description = '';
  
  if (days === 1) {
    title = 'Today\'s Economic Events (EST)';
    description = `Economic events for today (${formattedDate}) from ForexFactory\nLast updated: ${now.toLocaleTimeString('en-US')}`;
  } else if (days === 7) {
    title = 'Weekly Economic Calendar (EST)';
    description = `Economic events for the week from ForexFactory\nLast updated: ${formattedDate}`;
  } else {
    title = 'ForexFactory Economic Calendar (EST)';
    description = `Economic events for the next ${days} days from ForexFactory\nLast updated: ${formattedDate}`;
  }
  
  // Create attachment from the screenshot file
  const attachment = new AttachmentBuilder(screenshotPath, { 
    name: 'forex-calendar.png',
    description: 'ForexFactory Economic Calendar (EST timezone)'
  });

  // Create embed with the screenshot as image
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(config.DISCORD.COLORS.PRIMARY)
    .setImage('attachment://forex-calendar.png')
    .setURL(config.URLS.CALENDAR)
    .setTimestamp()
    .setFooter({ 
      text: `ForexFactory Calendar in EST timezone | Image size: ${fileSize}`
    });

  return { embed, attachment };
}

/**
 * Send calendar embed to a channel
 * @param {Object} channel - Discord channel
 * @param {String} screenshotPath - Path to the screenshot file
 * @param {Object} options - Additional options
 */
async function sendCalendarToChannel(channel, screenshotPath, options = {}) {
  if (!channel) return;
  
  try {
    const { embed, attachment } = createCalendarEmbed(screenshotPath, options);
    
    if (attachment) {
      await channel.send({ embeds: [embed], files: [attachment] });
      console.log(`Calendar sent to channel ${channel.name}`);
    } else {
      await channel.send({ embeds: [embed] });
      console.log(`Error embed sent to channel ${channel.name}`);
    }
  } catch (error) {
    console.error('Error sending calendar to channel:', error);
  }
}

// Discord bot events
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  
  // Automatic sending has been disabled as requested by the user
  // The bot will now only respond to commands
});

// Command handler for manual calendar fetching
client.on('messageCreate', async message => {
  // Ignore messages from bots
  if (message.author.bot) return;
  
  if (message.content.toLowerCase() === '!events' || message.content.toLowerCase() === '!forexevents') {
    // New consolidated events command - default to today's events
    message.channel.sendTyping();
    
    try {
      await message.channel.send('Fetching today\'s Forex events...');
      const screenshotPath = await scrapeForexFactoryCalendar({ days: 1 });
      sendCalendarToChannel(message.channel, screenshotPath, { days: 1 });
    } catch (error) {
      console.error('Error handling events command:', error);
      message.channel.send('There was an error fetching today\'s Forex events. Please try again later.');
    }
  } else if (message.content.toLowerCase() === '!forexcalendar') {
    // Send typing indicator
    message.channel.sendTyping();
    
    try {
      await message.channel.send('Fetching ForexFactory calendar...');
      
      // Different view options
      if (message.content.toLowerCase().includes('week')) {
        const screenshotPath = await scrapeForexFactoryCalendar({ days: 7 });
        sendCalendarToChannel(message.channel, screenshotPath, { days: 7 });
      } else if (message.content.toLowerCase().includes('today')) {
        // Explicitly show only today's events
        const screenshotPath = await scrapeForexFactoryCalendar({ days: 1 });
        sendCalendarToChannel(message.channel, screenshotPath, { days: 1 });
      } else {
        // Default to today + tomorrow
        const screenshotPath = await scrapeForexFactoryCalendar({ days: 2 });
        sendCalendarToChannel(message.channel, screenshotPath, { days: 2 });
      }
    } catch (error) {
      console.error('Error handling calendar command:', error);
      message.channel.send('There was an error fetching the ForexFactory calendar. Please try again later.');
    }
  } else if (message.content.toLowerCase() === '!forextoday') {
    // Specific command for today's events only
    message.channel.sendTyping();
    
    try {
      await message.channel.send('Fetching today\'s Forex events...');
      const screenshotPath = await scrapeForexFactoryCalendar({ days: 1 });
      sendCalendarToChannel(message.channel, screenshotPath, { days: 1 });
    } catch (error) {
      console.error('Error handling today command:', error);
      message.channel.send('There was an error fetching today\'s Forex events. Please try again later.');
    }
  } else if (message.content.toLowerCase() === '!forexhelp' || message.content.toLowerCase() === '!help') {
    const helpEmbed = new EmbedBuilder()
      .setTitle('ForexFactory Calendar Bot - Help')
      .setDescription('Commands available:')
      .addFields(
        { 
          name: `!events`, 
          value: `Fetch today's economic events (main command)` 
        },
        { 
          name: `!forextoday`, 
          value: `Fetch only today's economic events (screenshot)` 
        },
        { 
          name: `!forexcalendar`, 
          value: `Fetch today and tomorrow's economic events (screenshot)` 
        },
        { 
          name: `!forexcalendar week`, 
          value: `Fetch the full week's economic calendar (screenshot)` 
        },
        { name: '!help or !forexhelp', value: 'Show this help message' }
      )
      .setColor(config.DISCORD.COLORS.PRIMARY);
    
    message.channel.send({ embeds: [helpEmbed] });
  }
});

// Error handling
client.on('error', error => {
  console.error('Discord client error:', error);
});

// Start the bot
client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('Failed to login to Discord:', error);
});

// Export functions for testing
module.exports = {
  createCalendarEmbed,
  sendCalendarToChannel
}; 