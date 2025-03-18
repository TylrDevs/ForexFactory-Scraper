const puppeteer = require('puppeteer');
const config = require('./config');
const path = require('path');
const fs = require('fs');

/**
 * Scrapes ForexFactory calendar as screenshot
 * @param {Object} options - Scraping options
 * @param {number} options.days - Number of days to include (default: 1)
 * @returns {Promise<String>} - Path to the screenshot file
 */
async function scrapeForexFactoryCalendar(options = {}) {
  const days = Math.min(options.days || config.SCRAPER.DEFAULT_DAYS, config.SCRAPER.MAX_DAYS);
  console.log(`Taking screenshot of ForexFactory calendar for ${days} day(s)...`);
  
  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(__dirname, '../screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set user agent to avoid anti-bot measures
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Set viewport to capture more events but be optimized for Discord
    await page.setViewport({ width: 1000, height: 1600 });
    
    // Get the current date for the page URL
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.toLocaleString('en-US', { month: 'short' }).toLowerCase();
    const todayYear = today.getFullYear();
    
    // Base URL for calendar
    const baseUrl = config.URLS.CALENDAR;
    let url;
    
    // If days is 7 or more, use the week view
    if (days >= 7) {
      url = `${baseUrl}?week=${todayMonth}${todayDay}.${todayYear}`;
    } else {
      // Use the default view which shows today's events
      url = baseUrl;
    }
    
    // Ensure we're on EST timezone and today's date
    url += url.includes('?') ? '&tz=EST&day=today' : '?tz=EST&day=today';
    
    console.log(`Navigating to calendar with EST timezone: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle2', // Wait until network is idle for better loading
      timeout: config.SCRAPER.TIMEOUT
    });
    
    // Accept cookies if the dialog appears
    try {
      if (await page.$(config.SELECTORS.COOKIE_BUTTON)) {
        await page.click(config.SELECTORS.COOKIE_BUTTON);
        await new Promise(resolve => setTimeout(resolve, config.SCRAPER.WAIT_BETWEEN_REQUESTS));
      }
    } catch (error) {
      console.log('No cookie dialog or error handling it:', error.message);
    }
    
    // Wait for the calendar table to fully load
    await page.waitForSelector(config.SELECTORS.CALENDAR_TABLE, { 
      timeout: config.SCRAPER.TIMEOUT 
    });
    
    // Get HTML structure for debugging
    const tableStructure = await page.evaluate(() => {
      const table = document.querySelector('.calendar__table');
      if (!table) return 'Calendar table not found';
      
      // Get first few rows to understand structure
      const rowsHtml = [];
      const rows = table.querySelectorAll('tr');
      const maxRows = Math.min(5, rows.length);
      
      for (let i = 0; i < maxRows; i++) {
        rowsHtml.push(rows[i].outerHTML.substring(0, 200) + '...');
      }
      
      return {
        tableClass: table.className,
        rowCount: rows.length,
        firstFewRows: rowsHtml,
        todayRows: document.querySelectorAll('.calendar__row--today').length,
        dayHeaders: document.querySelectorAll('.calendar__row--day-breaker').length
      };
    });
    
    console.log('Calendar structure:', JSON.stringify(tableStructure, null, 2));
    
    // Inject CSS to improve screenshot appearance
    await page.addStyleTag({
      content: `
        /* Hide unnecessary elements */
        .calendar__filter, .calendar-toolbar, .calendar-options, .calendar__legend,
        .calendar-search-module, .box-header, .calendar__header, footer, header, 
        .calendar__row--empty, .calendar__row--nophone {
          display: none !important;
        }
        
        /* Make sure events are clearly visible */
        .calendar__table {
          margin: 0 !important;
          width: 100% !important;
          box-shadow: none !important;
          border: 1px solid #ccc !important;
          border-collapse: collapse !important;
        }
        
        /* Clean up event rows */
        .calendar__row {
          border-bottom: 1px solid #eee !important;
          height: 40px !important;
        }
        
        /* Make today's header more visible */
        .calendar__row--day-breaker, .calendar__row--custom-today-header {
          background-color: #f8f8f8 !important;
          text-align: center !important;
          font-weight: bold !important;
          padding: 10px 0 !important;
          font-size: 16px !important;
          display: table-row !important;
        }
        
        /* Today's specific styling */
        .calendar__row--today, .calendar__row.calendar__row--today, 
        .calendar__row--custom-today, .calendar__row--new-day {
          background-color: rgba(240, 248, 255, 0.3) !important;
          border-left: 4px solid #4682b4 !important;
          display: table-row !important;
        }
        
        /* Format cells better */
        .calendar__cell {
          padding: 8px !important;
          vertical-align: middle !important;
        }
        
        /* Make currency column stand out */
        .calendar__currency {
          font-weight: bold !important;
        }
        
        /* Improve event name readability */
        .calendar__event, .calendar__event-title {
          font-size: 14px !important;
        }
        
        /* Customize the impact column based on severity */
        .icon--ff-impact-red, .impact--high, .high-impact, [class*="impact-red"] {
          background-color: #FF0000 !important;
          width: 8px !important;
          padding: 0 !important;
        }
        
        .icon--ff-impact-ora, .impact--medium, .medium-impact, [class*="impact-ora"] {
          background-color: #FFA500 !important;
          width: 8px !important;
          padding: 0 !important;
        }
        
        .icon--ff-impact-yel, .impact--low, .low-impact, [class*="impact-yel"] {
          background-color: #FFFF00 !important;
          width: 8px !important;
          padding: 0 !important;
        }
        
        /* Improve data presentation */
        .calendar__actual, .calendar__forecast, .calendar__previous {
          text-align: center !important;
          font-family: monospace !important;
        }
        
        /* Highlight actual values that differ from forecast */
        .calendar__actual.calendar__actual--better, .better {
          color: green !important;
          font-weight: bold !important;
        }
        
        .calendar__actual.calendar__actual--worse, .worse {
          color: red !important;
          font-weight: bold !important;
        }
        
        /* Only keep the essential columns */
        .calendar__cell:nth-child(1), /* Time */
        .calendar__cell:nth-child(2), /* Currency */
        .calendar__cell:nth-child(3), /* Event name */
        .calendar__cell:nth-child(4), /* Impact */
        .calendar__cell:nth-child(5), /* Actual */
        .calendar__cell:nth-child(6), /* Forecast */
        .calendar__cell:nth-child(7) { /* Previous */
          display: table-cell !important;
        }
        
        /* Hide other columns */
        .calendar__cell:nth-child(n+8) {
          display: none !important;
        }
        
        /* Custom title for today's events */
        .today-events-title {
          font-size: 20px !important;
          font-weight: bold !important;
          text-align: center !important;
          margin: 10px 0 !important;
          padding: 10px !important;
          background-color: #4682b4 !important;
          color: white !important;
          border-radius: 5px !important;
        }
      `
    });
    
    // Wait a bit more for all elements to fully render
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Process page to better highlight today's events
    await page.evaluate((daysToShow) => {
      // Get today's date info
      const today = new Date();
      const todayMonth = today.toLocaleString('en-US', { month: 'short' });
      const todayDay = today.getDate();
      const todayWeekday = today.toLocaleString('en-US', { weekday: 'short' });
      const todayString = `${todayWeekday} ${todayMonth} ${todayDay}`;
      const simpleTodayString = `${todayWeekday} ${todayDay}`;
      
      console.log('Looking for today string:', todayString, 'or', simpleTodayString);
      
      // Find today's header row - ForexFactory now uses different classes
      const dayHeaders = document.querySelectorAll('.calendar__row--day-breaker');
      let todayHeader = null;
      
      // Loop through headers to find today's
      for (const header of dayHeaders) {
        const headerText = header.textContent.trim();
        console.log('Checking header:', headerText);
        
        if (headerText.includes(simpleTodayString) || 
            headerText.toLowerCase().includes('today') || 
            headerText.includes(todayWeekday)) {
          todayHeader = header;
          console.log('Found today header:', headerText);
          break;
        }
      }
      
      console.log('Found today header through search:', !!todayHeader);
      
      // Find today's event rows - look for rows after today's header
      let todayRows = [];
      let foundTodaySection = false;
      const allRows = document.querySelectorAll('.calendar__row');
      
      // Mark all rows that belong to today
      if (todayHeader) {
        foundTodaySection = false;
        let nextDaySectionFound = false;
        
        for (const row of allRows) {
          // Check if this is the today header
          if (row === todayHeader) {
            foundTodaySection = true;
            row.classList.add('calendar__row--custom-today-header');
            continue;
          }
          
          // If we found a new day header after today's section, stop marking rows
          if (foundTodaySection && row.classList.contains('calendar__row--day-breaker')) {
            nextDaySectionFound = true;
          }
          
          // Mark rows in today's section
          if (foundTodaySection && !nextDaySectionFound && !row.classList.contains('calendar__row--day-breaker')) {
            row.classList.add('calendar__row--custom-today');
            todayRows.push(row);
          }
        }
        
        console.log('Found today section:', foundTodaySection);
        console.log('Marked today rows count:', todayRows.length);
      } else {
        // Fallback - try to find today's rows by looking for the --new-day class which is often used for the first day
        const newDayRows = document.querySelectorAll('.calendar__row--new-day');
        if (newDayRows.length > 0) {
          todayRows = Array.from(newDayRows);
          for (const row of todayRows) {
            row.classList.add('calendar__row--custom-today');
          }
          console.log('Used fallback method, found new-day rows:', newDayRows.length);
        }
      }
      
      // If we found today's header, style it
      if (todayHeader) {
        todayHeader.style.display = 'table-row';
        todayHeader.style.backgroundColor = '#f0f8ff';
        todayHeader.style.fontWeight = 'bold';
        todayHeader.style.fontSize = '16px';
        todayHeader.style.textAlign = 'center';
        todayHeader.style.padding = '10px 0';
      }
      
      // Add a prominent header for today
      const customHeader = document.createElement('div');
      customHeader.className = 'today-events-title';
      customHeader.textContent = "TODAY'S ECONOMIC EVENTS (EST)";
      
      // Insert the header before the table
      const table = document.querySelector('.calendar__table');
      console.log('Found calendar table:', !!table);
      if (table && table.parentNode) {
        table.parentNode.insertBefore(customHeader, table);
      }
      
      // Hide everything except today if requested
      if (daysToShow === 1) {
        // Hide all rows first
        for (const row of allRows) {
          if (row === todayHeader || 
              row.classList.contains('calendar__row--custom-today-header') || 
              row.classList.contains('calendar__row--custom-today')) {
            // Show today's rows
            row.style.display = 'table-row';
            if (row.classList.contains('calendar__row--custom-today')) {
              row.style.backgroundColor = 'rgba(240, 248, 255, 0.3)';
              row.style.borderLeft = '4px solid #4682b4';
            }
          } else {
            // Hide all other rows
            row.style.display = 'none';
          }
        }
        
        console.log('Visible rows count after filtering:', todayRows.length + (todayHeader ? 1 : 0));
      }
      
      // If today header exists, scroll to it
      if (todayHeader) {
        todayHeader.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
      
      // If no today rows were found, add a message
      if (todayRows.length === 0 && daysToShow === 1) {
        const calendarTable = document.querySelector('.calendar__table tbody');
        if (calendarTable) {
          const noEventsRow = document.createElement('tr');
          noEventsRow.className = 'calendar__row';
          noEventsRow.innerHTML = '<td colspan="7" style="text-align: center; padding: 20px; font-weight: bold;">No economic events scheduled for today</td>';
          calendarTable.appendChild(noEventsRow);
          console.log('Added "No events" message');
        }
      }
    }, days);
    
    // Wait for any animations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotFilePath = path.join(screenshotsDir, `forex-calendar-${timestamp}.png`);
    
    // Take a clean screenshot of just the events table
    try {
      // Find the events table and get its dimensions
      const tableSelector = config.SELECTORS.CALENDAR_TABLE;
      const tableBounds = await page.evaluate((selector) => {
        const table = document.querySelector(selector);
        if (!table) return null;
        
        // Get the position of the table
        const tableRect = table.getBoundingClientRect();
        
        // Get the title element
        const title = document.querySelector('.today-events-title');
        const titleRect = title ? title.getBoundingClientRect() : { y: tableRect.y, height: 0 };
        
        // Calculate the visible bounds to include title and table
        return {
          x: tableRect.x,
          y: titleRect.y, // Start from the title
          width: tableRect.width,
          height: (tableRect.y + tableRect.height) - titleRect.y  // Include both title and table
        };
      }, tableSelector);
      
      // Take screenshot based on the calculated bounds
      if (tableBounds) {
        // Make sure the dimensions are valid
        const clipRegion = {
          x: Math.max(0, tableBounds.x),
          y: Math.max(0, tableBounds.y),
          width: Math.min(tableBounds.width, page.viewport().width - tableBounds.x),
          height: Math.min(tableBounds.height, 1600) // Cap the height to prevent giant images
        };

        // Take screenshot with the calculated dimensions
        await page.screenshot({
          path: screenshotFilePath,
          clip: clipRegion
        });
        
        console.log(`Calendar events screenshot saved with dimensions ${clipRegion.width}x${clipRegion.height}`);
      } else {
        // If we couldn't get the table dimensions, fall back to basic screenshot
        await page.screenshot({ 
          path: screenshotFilePath,
          fullPage: false 
        });
        console.log('Fallback: Took screenshot of visible viewport area');
      }
    } catch (screenshotError) {
      console.error('Error taking event table screenshot:', screenshotError);
      
      // Fallback to taking a screenshot of the visible area
      await page.screenshot({ 
        path: screenshotFilePath,
        fullPage: false
      });
      console.log(`Fallback: Visible area screenshot saved as ${screenshotFilePath}`);
    }
    
    return screenshotFilePath;
  } catch (error) {
    console.error('Error capturing ForexFactory calendar screenshot:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Keep the existing scraping function for backward compatibility
async function scrapeForexFactoryEvents(options = {}) {
  console.log('Scraping mode is now set to screenshot. Using screenshot method instead.');
  const screenshotPath = await scrapeForexFactoryCalendar(options);
  // Return empty array for backward compatibility
  return [];
}

module.exports = {
  scrapeForexFactoryEvents,
  scrapeForexFactoryCalendar
}; 