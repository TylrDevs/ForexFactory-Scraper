# ForexFactory Events Discord Bot

A Discord bot that scrapes economic events from ForexFactory and posts them to your Discord server.

## Features

- Real-time scraping of ForexFactory economic calendar
- Shows today's economic events
- Responds to the `!forexevents` command for on-demand updates ( change this command in src/index.js )

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with your Discord bot token:
   ```
   DISCORD_TOKEN=your_discord_token_here
   ```

## Getting a Discord Bot Token

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to the "Bot" tab and click "Add Bot"
4. Under the "TOKEN" section, click "Copy" to get your bot token
5. Enable necessary intents for your bot (Message Content Intent)

## Running the Bot

Start the bot with:

```
npm start
```

For development with auto-restart:

```
npm run dev
```

## Commands

- `!forexevents` - Fetches and displays today's economic events from ForexFactory
