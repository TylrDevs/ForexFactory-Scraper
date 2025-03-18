/**
 * Configuration settings for the ForexFactory scraper
 */
module.exports = {
  // Website URLs
  URLS: {
    BASE: 'https://www.forexfactory.com',
    CALENDAR: 'https://www.forexfactory.com/calendar'
  },
  
  // CSS Selectors for scraping
  SELECTORS: {
    CALENDAR_TABLE: '.calendar__table',
    EVENT_ROW: 'tr.calendar__row[data-event-id]',
    DATE_ROW: '.calendar__row--day-breaker',
    TIME: '.calendar__time',
    CURRENCY: '.calendar__currency',
    EVENT_NAME: '.calendar__event-title',
    IMPACT: '.calendar__impact-icon, .calendar__impact',
    ACTUAL: '.calendar__actual',
    FORECAST: '.calendar__forecast',
    PREVIOUS: '.calendar__previous',
    COOKIE_BUTTON: 'button[data-cookiefirst-action="accept"]'
  },
  
  // Impact levels and their corresponding classes
  IMPACT_CLASSES: {
    HIGH: 'icon--ff-impact-red',
    MEDIUM: 'icon--ff-impact-ora',
    LOW: 'icon--ff-impact-yel'
  },
  
  // Discord embed configuration
  DISCORD: {
    COLORS: {
      PRIMARY: '#0099FF',
      ERROR: '#FF0000',
      SUCCESS: '#00FF00'
    },
    EMOJIS: {
      HIGH_IMPACT: '🟥',
      MEDIUM_IMPACT: '🟧',
      LOW_IMPACT: '🟩'
    },
    MAX_EMBEDS_PER_MESSAGE: 1, // Only showing today's events
    MAX_FIELDS_PER_EMBED: 25
  },
  
  // Scraper configuration
  SCRAPER: {
    DEFAULT_DAYS: 7, // Show full week by default
    MAX_DAYS: 14,
    TIMEOUT: 30000,
    WAIT_BETWEEN_REQUESTS: 2000
  }
}; 