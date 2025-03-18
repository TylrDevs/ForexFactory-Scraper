const puppeteer = require('puppeteer');
const config = require('./config');

/**
 * Debug the ForexFactory scraper
 */
async function debugScraper() {
  console.log('Debugging ForexFactory scraper...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to false to see the browser
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set a reasonable viewport
    await page.setViewport({ width: 1366, height: 768 });
    
    // Navigate to ForexFactory
    console.log(`Navigating to ${config.URLS.CALENDAR}...`);
    await page.goto(config.URLS.CALENDAR, { 
      waitUntil: 'networkidle2',
      timeout: config.SCRAPER.TIMEOUT
    });
    
    // Wait for some time to see the page
    console.log('Waiting for 2 seconds to see the page...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take a screenshot
    await page.screenshot({ path: 'forexfactory.png' });
    console.log('Screenshot saved as forexfactory.png');
    
    // Check calendar table
    console.log(`Looking for calendar table with selector: ${config.SELECTORS.CALENDAR_TABLE}`);
    const hasCalendarTable = await page.$(config.SELECTORS.CALENDAR_TABLE);
    console.log(`Calendar table found: ${!!hasCalendarTable}`);
    
    // Check event rows
    console.log(`Looking for event rows with selector: ${config.SELECTORS.EVENT_ROW}`);
    const eventRows = await page.$$(config.SELECTORS.EVENT_ROW);
    console.log(`Found ${eventRows.length} event rows`);
    
    // Debug page structure
    const pageStructure = await page.evaluate(() => {
      // Get all classes in the document
      const allElements = document.querySelectorAll('*');
      const classes = new Set();
      allElements.forEach(el => {
        el.classList.forEach(cls => classes.add(cls));
      });
      
      // Get table structure if exists
      const tableElement = document.querySelector('table');
      const tableInfo = tableElement ? {
        className: tableElement.className,
        childrenCount: tableElement.children.length,
        firstChildClass: tableElement.children[0] ? tableElement.children[0].className : 'N/A',
        rows: tableElement.querySelectorAll('tr').length
      } : 'No table found';
      
      return {
        title: document.title,
        classes: Array.from(classes),
        tableInfo
      };
    });
    
    console.log('Page structure:');
    console.log(JSON.stringify(pageStructure, null, 2));
    
    // Try to extract some events for debugging
    const debugEvents = await page.evaluate((selectors) => {
      // Find all table rows that might contain events
      const rows = document.querySelectorAll('tr');
      console.log(`Found ${rows.length} total rows in document`);
      
      // For debugging, extract text from first 5 rows
      return Array.from(rows).slice(0, 10).map(row => {
        return {
          html: row.outerHTML.slice(0, 200) + '...',
          className: row.className,
          children: row.children.length,
          text: row.innerText.slice(0, 100) + '...'
        };
      });
    }, config.SELECTORS);
    
    console.log('Debug events:');
    console.log(JSON.stringify(debugEvents, null, 2));
    
    console.log('\nDebugging complete. Check the console output and screenshot.');
  } catch (error) {
    console.error('Error during debugging:', error);
  } finally {
    // Wait before closing so we can see what's happening
    console.log('Waiting 5 seconds before closing browser...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

// Run the debug function
debugScraper(); 