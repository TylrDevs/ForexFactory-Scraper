const scraper = require('./scraper');

// Add color to console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bg: {
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m'
  }
};

/**
 * Test the forex factory scraper
 */
async function runTest() {
  console.log(`${colors.bright}${colors.cyan}Starting ForexFactory Scraper Test${colors.reset}`);
  console.log('-'.repeat(50));
  
  try {
    // Scrape events for the next 5 days
    console.log(`${colors.bright}Scraping events for the next 5 days...${colors.reset}`);
    const events = await scraper.scrapeForexFactoryEvents({ days: 5 });
    
    if (!events || events.length === 0) {
      console.log(`${colors.red}No events found!${colors.reset}`);
      return;
    }
    
    console.log(`${colors.green}Successfully scraped ${events.length} events.${colors.reset}`);
    console.log('-'.repeat(50));
    
    // Show debugging info for the first few events to analyze HTML structure
    console.log(`${colors.bright}${colors.blue}Debug info for first few events:${colors.reset}`);
    events.slice(0, 3).forEach((event, index) => {
      console.log(`\n${colors.bright}Event #${index + 1}: ${event.currency} - ${event.event}${colors.reset}`);
      console.log(`  Impact: ${event.impact}`);
      console.log(`  Date: ${event.date}, Time: ${event.time}`);
      
      // Show raw HTML if available (temporary for debugging)
      if (event.rowHTML) {
        console.log(`${colors.dim}Row HTML snippet:${colors.reset}`);
        console.log(`  ${event.rowHTML.substring(0, 150)}...`);
      }
    });
    console.log('-'.repeat(50));
    
    // Count events by impact
    const impactCounts = {
      High: 0,
      Medium: 0,
      Low: 0,
      Unknown: 0
    };
    
    // Count events by currency
    const currencyCounts = {};
    
    // Display events grouped by impact
    console.log(`${colors.bright}Events by Impact Level:${colors.reset}`);
    
    // Process High impact events first
    console.log(`\n${colors.bg.red}${colors.white}${colors.bright} HIGH IMPACT EVENTS ${colors.reset}\n`);
    const highImpactEvents = events.filter(event => event.impact === 'High');
    highImpactEvents.forEach(event => {
      impactCounts.High++;
      currencyCounts[event.currency] = (currencyCounts[event.currency] || 0) + 1;
      
      console.log(`${colors.red}${colors.bright}[${event.currency}]${colors.reset} ${event.time} - ${event.event}`);
      if (event.forecast) console.log(`  Forecast: ${event.forecast}`);
      if (event.previous) console.log(`  Previous: ${event.previous}`);
      if (event.actual) console.log(`  ${colors.green}Actual: ${event.actual}${colors.reset}`);
      console.log('');
    });
    
    // Process Medium impact events
    console.log(`\n${colors.bg.yellow}${colors.black}${colors.bright} MEDIUM IMPACT EVENTS ${colors.reset}\n`);
    const mediumImpactEvents = events.filter(event => event.impact === 'Medium');
    mediumImpactEvents.forEach(event => {
      impactCounts.Medium++;
      currencyCounts[event.currency] = (currencyCounts[event.currency] || 0) + 1;
      
      console.log(`${colors.yellow}${colors.bright}[${event.currency}]${colors.reset} ${event.time} - ${event.event}`);
      if (event.forecast) console.log(`  Forecast: ${event.forecast}`);
      if (event.previous) console.log(`  Previous: ${event.previous}`);
      if (event.actual) console.log(`  ${colors.green}Actual: ${event.actual}${colors.reset}`);
      console.log('');
    });
    
    // Process Low impact events (limited display)
    console.log(`\n${colors.bright} LOW IMPACT EVENTS (Summary) ${colors.reset}\n`);
    const lowImpactEvents = events.filter(event => event.impact === 'Low');
    lowImpactEvents.forEach(event => {
      impactCounts.Low++;
      currencyCounts[event.currency] = (currencyCounts[event.currency] || 0) + 1;
    });
    console.log(`${colors.dim}Total Low Impact Events: ${lowImpactEvents.length}${colors.reset}`);
    
    // Process events with unknown impact
    const unknownImpactEvents = events.filter(event => 
      !['High', 'Medium', 'Low'].includes(event.impact));
    if (unknownImpactEvents.length > 0) {
      console.log(`\n${colors.bright} UNKNOWN IMPACT EVENTS ${colors.reset}\n`);
      unknownImpactEvents.forEach(event => {
        impactCounts.Unknown++;
        currencyCounts[event.currency] = (currencyCounts[event.currency] || 0) + 1;
        
        console.log(`[${event.currency}] ${event.time} - ${event.event} (Impact: ${event.impact || 'None'})`);
      });
    }
    
    // Display summary statistics
    console.log('-'.repeat(50));
    console.log(`${colors.bright}Summary:${colors.reset}`);
    console.log(`Total Events: ${events.length}`);
    console.log(`Impact Breakdown:
  ${colors.red}High: ${impactCounts.High}${colors.reset}
  ${colors.yellow}Medium: ${impactCounts.Medium}${colors.reset}
  Low: ${impactCounts.Low}
  Unknown: ${impactCounts.Unknown || 0}`);
    
    console.log(`\n${colors.bright}Currency Breakdown:${colors.reset}`);
    const sortedCurrencies = Object.entries(currencyCounts)
      .sort((a, b) => b[1] - a[1]);
    
    sortedCurrencies.forEach(([currency, count]) => {
      console.log(`  ${currency}: ${count} events`);
    });
    
  } catch (error) {
    console.error(`${colors.red}Error during test:${colors.reset}`, error);
  }
}

// Run the test
runTest(); 