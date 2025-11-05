const { google } = require('googleapis');
const ical = require('node-ical');
const logger = require('./logger');

// Store calendar connections (in production, use a database)
const calendarConnections = new Map();

// Google Calendar OAuth2 Client
let oauth2Client = null;

function initializeGoogleClient(clientId, clientSecret, redirectUri) {
  oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
  return oauth2Client;
}

// Get Google Calendar OAuth URL
function getGoogleAuthUrl(userId) {
  if (!oauth2Client) {
    throw new Error('Google OAuth client not initialized. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
  }

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: userId, // Pass userId in state for callback
    prompt: 'consent'
  });

  return url;
}

// Exchange code for tokens
async function exchangeCodeForTokens(code) {
  if (!oauth2Client) {
    throw new Error('Google OAuth client not initialized');
  }

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

// Set credentials for a user
function setUserCredentials(userId, tokens) {
  if (!oauth2Client) {
    throw new Error('Google OAuth client not initialized');
  }

  const client = new google.auth.OAuth2(
    oauth2Client._clientId,
    oauth2Client._clientSecret,
    oauth2Client.redirectUri
  );
  client.setCredentials(tokens);

  calendarConnections.set(userId, {
    provider: 'google',
    tokens,
    client,
    connectedAt: new Date()
  });

  return client;
}

// Get user's calendar client
function getUserCalendarClient(userId) {
  const connection = calendarConnections.get(userId);
  if (!connection || connection.provider !== 'google') {
    return null;
  }

  const client = new google.auth.OAuth2(
    oauth2Client._clientId,
    oauth2Client._clientSecret,
    oauth2Client.redirectUri
  );
  client.setCredentials(connection.tokens);
  return client;
}

// Sync events from Google Calendar
async function syncGoogleCalendar(userId, startDate, endDate) {
  try {
    const auth = getUserCalendarClient(userId);
    if (!auth) {
      throw new Error('Google Calendar not connected');
    }

    const calendar = google.calendar({ version: 'v3', auth });
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate || new Date().toISOString(),
      timeMax: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    
    return events.map(event => ({
      id: event.id,
      title: event.summary || 'No Title',
      description: event.description || '',
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      location: event.location || '',
      attendees: event.attendees?.map(a => a.email) || [],
      provider: 'google',
      providerId: event.id,
      htmlLink: event.htmlLink
    }));
  } catch (error) {
    logger.error('Error syncing Google Calendar:', error);
    throw error;
  }
}

// Create event in Google Calendar
async function createGoogleCalendarEvent(userId, eventData) {
  try {
    const auth = getUserCalendarClient(userId);
    if (!auth) {
      throw new Error('Google Calendar not connected');
    }

    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: eventData.title,
      description: eventData.description || '',
      start: {
        dateTime: eventData.start,
        timeZone: eventData.timeZone || 'UTC',
      },
      end: {
        dateTime: eventData.end,
        timeZone: eventData.timeZone || 'UTC',
      },
      location: eventData.location || '',
      attendees: eventData.attendees?.map(email => ({ email })) || [],
      reminders: {
        useDefault: false,
        overrides: eventData.reminders || [
          { method: 'email', minutes: 30 },
          { method: 'popup', minutes: 10 }
        ]
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return {
      id: response.data.id,
      htmlLink: response.data.htmlLink,
      provider: 'google'
    };
  } catch (error) {
    logger.error('Error creating Google Calendar event:', error);
    throw error;
  }
}

// Update event in Google Calendar
async function updateGoogleCalendarEvent(userId, eventId, eventData) {
  try {
    const auth = getUserCalendarClient(userId);
    if (!auth) {
      throw new Error('Google Calendar not connected');
    }

    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: eventData.title,
      description: eventData.description || '',
      start: {
        dateTime: eventData.start,
        timeZone: eventData.timeZone || 'UTC',
      },
      end: {
        dateTime: eventData.end,
        timeZone: eventData.timeZone || 'UTC',
      },
      location: eventData.location || '',
      attendees: eventData.attendees?.map(email => ({ email })) || [],
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: event,
    });

    return response.data;
  } catch (error) {
    logger.error('Error updating Google Calendar event:', error);
    throw error;
  }
}

// Delete event from Google Calendar
async function deleteGoogleCalendarEvent(userId, eventId) {
  try {
    const auth = getUserCalendarClient(userId);
    if (!auth) {
      throw new Error('Google Calendar not connected');
    }

    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    return { success: true };
  } catch (error) {
    logger.error('Error deleting Google Calendar event:', error);
    throw error;
  }
}

// Parse iCal/ICS file
async function parseICSFile(icsContent) {
  try {
    const events = await ical.async.parseICS(icsContent);
    const parsedEvents = [];

    for (const key in events) {
      const event = events[key];
      if (event.type === 'VEVENT') {
        parsedEvents.push({
          title: event.summary || 'No Title',
          description: event.description || '',
          start: event.start ? event.start.toISOString() : null,
          end: event.end ? event.end.toISOString() : null,
          location: event.location || '',
          attendees: event.attendee ? (Array.isArray(event.attendee) ? event.attendee.map(a => a.params?.CN || a.val) : [event.attendee.params?.CN || event.attendee.val]) : []
        });
      }
    }

    return parsedEvents;
  } catch (error) {
    logger.error('Error parsing ICS file:', error);
    throw error;
  }
}

// Get calendar connection status
function getCalendarConnection(userId) {
  const connection = calendarConnections.get(userId);
  if (!connection) {
    return null;
  }

  return {
    provider: connection.provider,
    connectedAt: connection.connectedAt,
    email: connection.email || null
  };
}

// Disconnect calendar
function disconnectCalendar(userId) {
  calendarConnections.delete(userId);
  return { success: true };
}

module.exports = {
  initializeGoogleClient,
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  setUserCredentials,
  syncGoogleCalendar,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  parseICSFile,
  getCalendarConnection,
  disconnectCalendar
};

