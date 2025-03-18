#!/bin/bash

# Display banner
echo "========================================"
echo "     ForexFactory Discord Bot Setup     "
echo "========================================"

# Check if .env file exists
if [ ! -f .env ]; then
  echo "⚠️ .env file not found. Creating a template..."
  
  cat > .env << EOL
# Discord Bot Token (replace with your actual token)
DISCORD_TOKEN=your_discord_token_here

# Scraping Configuration
SCRAPE_INTERVAL=30 # in minutes
EOL

  echo "✅ Created .env file template."
  echo "⚠️ Please edit the .env file and insert your Discord bot token before running again."
  exit 1
fi

# Check if token is still the placeholder
if grep -q "your_discord_token_here" .env; then
  echo "⚠️ Please replace the placeholder token in .env file with your actual Discord bot token."
  echo "  Open the .env file and update DISCORD_TOKEN=your_discord_token_here"
  exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  
  if [ $? -ne 0 ]; then
    echo "❌ Error installing dependencies. Please check your internet connection or Node.js installation."
    exit 1
  fi
  
  echo "✅ Dependencies installed."
fi

# Run the test to make sure scraper works
echo "🧪 Testing the scraper..."
npm test

# If the test is successful, start the bot
if [ $? -eq 0 ]; then
  echo "🤖 Starting the Discord bot..."
  npm start
else
  echo "❌ Scraper test failed. Please check your internet connection and try again."
  exit 1
fi 