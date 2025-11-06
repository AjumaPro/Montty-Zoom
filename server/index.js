const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const QRCode = require('qrcode');
const logger = require('./utils/logger');
const { sanitizeString, validatePassword, validateUserName, validateRoomId } = require('./utils/validation');
const calendarService = require('./utils/calendarService');
const streamingService = require('./utils/streamingService');
const emailService = require('./utils/emailService');
const db = require('./utils/database');

// Load environment variables
require('dotenv').config();

const app = express();

// Create HTTP or HTTPS server based on environment
let server;
const isProduction = process.env.NODE_ENV === 'production';
const useHTTPS = isProduction && process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH;

if (useHTTPS) {
  try {
    const options = {
      key: fs.readFileSync(process.env.SSL_KEY_PATH),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH)
    };
    
    // Add CA bundle if provided
    if (process.env.SSL_CA_PATH) {
      options.ca = fs.readFileSync(process.env.SSL_CA_PATH);
    }
    
    server = https.createServer(options, app);
    logger.info('HTTPS server created with SSL certificates');
  } catch (error) {
    logger.error('Failed to create HTTPS server, falling back to HTTP:', error);
    server = http.createServer(app);
  }
} else {
  server = http.createServer(app);
  if (isProduction) {
    logger.warn('Running in production without HTTPS. WebRTC will not work properly. Please configure SSL certificates.');
  }
}

// Configure CORS with environment-based origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  // Use secure transport in production with HTTPS
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// CORS middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`Blocked CORS request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    httpsEnabled: useHTTPS
  });
});

// Create logs directory if it doesn't exist
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// Store active rooms
const rooms = new Map();

// Store scheduled meetings
const scheduledMeetings = new Map();

// Store meeting history
const meetingHistory = new Map();

// Store transcriptions
const transcriptions = new Map();

// Store admin projects
const projects = new Map();

// Store admin reminders
const reminders = new Map();

// Store breakout rooms
const breakoutRooms = new Map(); // roomId -> { rooms: [], assignments: Map }

// Store users (simple in-memory storage)
const users = new Map();

// Helper function to check if user is host or moderator
function isHostOrModerator(room, userId) {
  if (!room) return false;
  return room.mainHost === userId || (room.moderators && room.moderators.includes(userId));
}

// Helper function to generate a random password
function generateRandomPassword(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Generate room ID
app.post('/api/room/create', async (req, res) => {
  try {
    // Check subscription if userId provided
    const userId = req.body.userId || req.headers['user-id'];
    if (userId) {
      const subscriptionService = require('./utils/subscriptionService');
      const subscription = await subscriptionService.getUserSubscription(userId);
      
      // Check call minutes for non-unlimited plans
      if (subscription.callMinutes !== -1) {
        const checkResult = await subscriptionService.checkCallMinutesLimit(userId, 0);
        if (!checkResult.allowed) {
          return res.status(403).json({ 
            error: 'Insufficient call minutes. Please upgrade your plan.',
            upgradeRequired: true
          });
        }
      }
    }

  const roomId = uuidv4();
    const rawPassword = req.body.password;
    
    // Always generate a password if none is provided
    let password;
    if (rawPassword && rawPassword.trim()) {
      // Validate password if provided
      if (!validatePassword(rawPassword)) {
        logger.warn('Invalid password format in room creation request');
        return res.status(400).json({ error: 'Invalid password format' });
      }
      password = sanitizeString(rawPassword, 50);
    } else {
      // Generate random password if none provided
      password = generateRandomPassword(8);
    }
    
  rooms.set(roomId, {
    id: roomId,
    mainHost: null, // Will be set when first user joins
    originalHost: null, // Track original host for rejoin
    hostId: null, // Legacy support - will be set when first user joins
    moderators: [], // Array of moderator userIds (max 5)
    participants: [],
    waitingRoom: [],
    createdAt: new Date(),
    isRecording: false,
    isStreaming: false,
    streamingInfo: null,
    chat: [],
    password: password,
    polls: [],
    files: [],
    startedAt: null,
    meetingStatus: 'waiting', // 'waiting', 'started', 'ended'
    reactions: []
  });
    
    logger.info(`Room created: ${roomId}`);
    res.json({ roomId, roomUrl: `${req.protocol}://${req.get('host')}/room/${roomId}`, password });
  } catch (error) {
    logger.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get room info
app.get('/api/room/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  // Return room info including password (for authenticated users who created the room)
  const roomInfo = {
    ...room,
    password: room.password || null // Include password if available
  };
  
  res.json(roomInfo);
});

// Generate QR code for room
app.get('/api/room/:roomId/qr', async (req, res) => {
  const roomId = req.params.roomId;
  const customUrl = req.query.url;
  const room = rooms.get(roomId);
  
  // Use custom URL if provided, otherwise generate default
  let roomUrl;
  if (customUrl) {
    roomUrl = customUrl;
  } else {
    roomUrl = `${req.protocol}://${req.get('host')}/room/${roomId}`;
    // Include password if room has one
    if (room && room.password) {
      const url = new URL(roomUrl);
      url.searchParams.append('password', room.password);
      roomUrl = url.toString();
    }
  }
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(roomUrl);
    res.json({ qrCode: qrCodeDataUrl, roomUrl });
  } catch (error) {
    logger.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Generate QR code with custom URL (POST endpoint for flexibility)
app.post('/api/room/qr-generate', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url);
    res.json({ qrCode: qrCodeDataUrl, url });
  } catch (error) {
    logger.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Authentication API
// Sign in with email (accepts any email - private, corporate, etc.)
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    // Validate inputs
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const sanitizedEmail = sanitizeString(email.trim().toLowerCase(), 100);
    const sanitizedName = sanitizeString(name.trim(), 50);
    
    // Generate or get user ID
    let userId = users.get(sanitizedEmail)?.userId;
    const isNewUser = !userId;
    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Store or update user
    const existingUser = users.get(sanitizedEmail);
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'infoajumapro@gmail.com';
    // Auto-approve super admin, otherwise set status based on existing or new user
    const userStatus = sanitizedEmail === SUPER_ADMIN_EMAIL.toLowerCase() 
      ? 'approved' 
      : (existingUser?.status || (isNewUser ? 'pending' : 'approved'));
    
    users.set(sanitizedEmail, {
      userId,
      email: sanitizedEmail,
      name: sanitizedName,
      lastSignedIn: new Date().toISOString(),
      createdAt: existingUser?.createdAt || new Date().toISOString(),
      status: userStatus // pending, approved, rejected, suspended
    });
    
    // Check account status before allowing sign-in (super admin always allowed)
    if (userStatus === 'pending' && sanitizedEmail !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ 
        error: 'Your account is pending approval. Please wait for admin approval before accessing the platform.',
        accountStatus: 'pending'
      });
    }
    
    if (userStatus === 'rejected') {
      return res.status(403).json({ 
        error: 'Your account has been rejected. Please contact support for assistance.',
        accountStatus: 'rejected'
      });
    }
    
    if (userStatus === 'suspended') {
      return res.status(403).json({ 
        error: 'Your account has been suspended. Please contact support for assistance.',
        accountStatus: 'suspended'
      });
    }
    
    // Auto-activate free plan for new users or if subscription doesn't exist
    try {
      const hasSubscription = await subscriptionService.hasSubscription(userId);
      if (!hasSubscription) {
        await subscriptionService.activateFreePlan(userId);
        logger.info(`Free plan auto-activated for user: ${userId}`);
      }
    } catch (subscriptionError) {
      logger.warn('Failed to activate free plan on signin:', subscriptionError);
      // Don't fail sign-in if subscription activation fails
    }
    
    logger.info(`User signed in: ${sanitizedEmail}`);
    
    res.json({
      userId,
      email: sanitizedEmail,
      name: sanitizedName,
      message: 'Signed in successfully',
      freePlanActivated: isNewUser
    });
  } catch (error) {
    logger.error('Error signing in:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// Get user info
app.get('/api/auth/user', (req, res) => {
  try {
    const email = req.query.email || req.headers['user-email'];
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const user = users.get(email.trim().toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    logger.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Scheduled Meetings API
// Create a scheduled meeting
app.post('/api/meetings/schedule', async (req, res) => {
  try {
    // Check subscription for calendar integration if syncToCalendar is requested
    const userId = req.body.userId || req.headers['user-id'];
    const syncToCalendar = req.body.syncToCalendar;
    
    if (syncToCalendar && userId) {
      const subscriptionService = require('./utils/subscriptionService');
      const canSync = await subscriptionService.canPerformAction(userId, 'calendarIntegration');
      if (!canSync) {
        return res.status(403).json({ 
          error: 'Calendar integration is only available in Pro and Yearly plans.',
          upgradeRequired: true
        });
      }
    }

  const {
    title,
    description,
    scheduledDate,
    scheduledTime,
    duration,
    roomPassword,
    reminderTime,
    participants,
    isRecurring,
    recurrencePattern,
    recurrenceEndDate,
    recurrenceCount
  } = req.body;

  if (!title || !scheduledDate || !scheduledTime) {
    return res.status(400).json({ error: 'Title, date, and time are required' });
  }

  // Create a room for this scheduled meeting
  const roomId = uuidv4();
  
  // Always generate a password if none is provided
  const finalPassword = roomPassword && roomPassword.trim() 
    ? sanitizeString(roomPassword, 50) 
    : generateRandomPassword(8);
  
  rooms.set(roomId, {
    id: roomId,
    mainHost: null,
    originalHost: null,
    hostId: null,
    moderators: [],
    participants: [],
    waitingRoom: [],
    createdAt: new Date(),
    isRecording: false,
    isStreaming: false,
    streamingInfo: null,
    chat: [],
    password: finalPassword,
    polls: [],
    files: [],
    startedAt: null,
    meetingStatus: 'waiting',
    reactions: []
  });

  const meetingId = uuidv4();
  const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
  
  const meeting = {
    id: meetingId,
    title: title || 'Untitled Meeting',
    description: description || '',
    scheduledDate,
    scheduledTime,
    scheduledDateTime: scheduledDateTime.toISOString(),
    duration: duration || 60, // minutes
    roomId,
    roomPassword: finalPassword, // Always include password
    reminderTime: reminderTime || null, // minutes before meeting
    participants: participants || [],
    isRecurring: isRecurring || false,
    recurrencePattern: recurrencePattern || 'none',
    recurrenceEndDate: recurrenceEndDate || '',
    recurrenceCount: recurrenceCount || null,
    createdAt: new Date().toISOString(),
    status: 'scheduled' // 'scheduled', 'active', 'completed', 'cancelled'
  };

  scheduledMeetings.set(meetingId, meeting);
  
  // Send email invites to participants (async, don't block response)
  if (meeting.participants && meeting.participants.length > 0) {
    const participantEmails = meeting.participants.map(p => 
      typeof p === 'string' ? p : (p.email || p)
    ).filter(email => email && email.includes('@'));
    
    if (participantEmails.length > 0) {
      emailService.sendMeetingInvite(meeting, participantEmails).catch(err => {
        logger.error('Error sending meeting invites:', err);
      });
    }
  }
  
  // Schedule reminder email (async, don't block response)
  if (meeting.reminderTime && meeting.reminderTime > 0) {
    const reminderTime = meeting.reminderTime * 60000; // Convert to milliseconds
    const meetingTime = new Date(meeting.scheduledDateTime);
    const reminderDateTime = new Date(meetingTime.getTime() - reminderTime);
    const now = new Date();
    
    if (reminderDateTime > now) {
      const delay = reminderDateTime.getTime() - now.getTime();
      setTimeout(() => {
        const participantEmails = meeting.participants.map(p => 
          typeof p === 'string' ? p : (p.email || p)
        ).filter(email => email && email.includes('@'));
        
        participantEmails.forEach(email => {
          emailService.sendMeetingReminder(meeting, email).catch(err => {
            logger.error('Error sending reminder email:', err);
          });
        });
      }, delay);
    }
  }
  
  res.json(meeting);
  } catch (error) {
    logger.error('Error scheduling meeting:', error);
    res.status(500).json({ error: 'Failed to schedule meeting' });
  }
});

// Get all scheduled meetings
app.get('/api/meetings', (req, res) => {
  const meetings = Array.from(scheduledMeetings.values())
    .sort((a, b) => new Date(a.scheduledDateTime) - new Date(b.scheduledDateTime));
  res.json(meetings);
});

// Get a specific scheduled meeting
app.get('/api/meetings/:meetingId', (req, res) => {
  const meeting = scheduledMeetings.get(req.params.meetingId);
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }
  res.json(meeting);
});

// Update a scheduled meeting
app.put('/api/meetings/:meetingId', (req, res) => {
  const meeting = scheduledMeetings.get(req.params.meetingId);
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }

  const {
    title,
    description,
    scheduledDate,
    scheduledTime,
    duration,
    reminderTime,
    participants,
    isRecurring,
    recurrencePattern,
    recurrenceEndDate,
    recurrenceCount
  } = req.body;

  if (title) meeting.title = title;
  if (description !== undefined) meeting.description = description;
  if (scheduledDate) meeting.scheduledDate = scheduledDate;
  if (scheduledTime) meeting.scheduledTime = scheduledTime;
  if (duration) meeting.duration = duration;
  if (reminderTime !== undefined) meeting.reminderTime = reminderTime;
  if (participants) meeting.participants = participants;
  if (isRecurring !== undefined) meeting.isRecurring = isRecurring;
  if (recurrencePattern !== undefined) meeting.recurrencePattern = recurrencePattern;
  if (recurrenceEndDate !== undefined) meeting.recurrenceEndDate = recurrenceEndDate;
  if (recurrenceCount !== undefined) meeting.recurrenceCount = recurrenceCount;

  if (scheduledDate || scheduledTime) {
    const scheduledDateTime = new Date(`${meeting.scheduledDate}T${meeting.scheduledTime}`);
    meeting.scheduledDateTime = scheduledDateTime.toISOString();
  }

  scheduledMeetings.set(req.params.meetingId, meeting);
  res.json(meeting);
});

// Delete a scheduled meeting
app.delete('/api/meetings/:meetingId', (req, res) => {
  const meeting = scheduledMeetings.get(req.params.meetingId);
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }

  scheduledMeetings.delete(req.params.meetingId);
  // Optionally delete the associated room
  if (rooms.has(meeting.roomId)) {
    rooms.delete(meeting.roomId);
  }

  res.json({ message: 'Meeting deleted successfully' });
});

// Get meeting history
app.get('/api/meetings/history', (req, res) => {
  try {
    const history = Array.from(meetingHistory.values());
    // Sort by date (most recent first)
    history.sort((a, b) => new Date(b.createdAt || b.scheduledDateTime) - new Date(a.createdAt || a.scheduledDateTime));
    res.json(history);
  } catch (error) {
    logger.error('Error getting meeting history:', error);
    res.status(500).json({ error: 'Failed to get meeting history' });
  }
});

// Save meeting to history (called when meeting ends)
app.post('/api/meetings/history', (req, res) => {
  try {
    const { meetingId, title, duration, participantsCount, status, roomId } = req.body;
    
    const historyEntry = {
      id: meetingId || uuidv4(),
      title: title || 'Untitled Meeting',
      duration: duration || 0,
      participantsCount: participantsCount || 0,
      status: status || 'completed',
      createdAt: new Date().toISOString(),
      roomId: roomId || null
    };

    meetingHistory.set(historyEntry.id, historyEntry);
    res.json(historyEntry);
  } catch (error) {
    logger.error('Error saving meeting history:', error);
    res.status(500).json({ error: 'Failed to save meeting history' });
  }
});

// Transcriptions API
app.post('/api/transcriptions', (req, res) => {
  try {
    const { roomId, userId, userName, transcript, timestamp } = req.body;
    
    const transcriptionId = uuidv4();
    const transcription = {
      id: transcriptionId,
      roomId,
      userId,
      userName,
      transcript,
      timestamp: timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    transcriptions.set(transcriptionId, transcription);
    res.json(transcription);
  } catch (error) {
    logger.error('Error saving transcription:', error);
    res.status(500).json({ error: 'Failed to save transcription' });
  }
});

app.get('/api/transcriptions/:roomId', (req, res) => {
  try {
    const roomId = req.params.roomId;
    const roomTranscriptions = Array.from(transcriptions.values())
      .filter(t => t.roomId === roomId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    res.json(roomTranscriptions);
  } catch (error) {
    logger.error('Error getting transcriptions:', error);
    res.status(500).json({ error: 'Failed to get transcriptions' });
  }
});

// Translation API endpoints
// Simple translation endpoint using MyMemory API (free fallback)
// For production, integrate with Google Translate API or Azure Translator
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLang, sourceLang = 'auto' } = req.body;

    if (!text || !targetLang) {
      return res.status(400).json({ error: 'Text and target language are required' });
    }

    // Use MyMemory API as fallback (free)
    // For production, use Google Translate API or Azure Translator
    const langPair = sourceLang === 'auto' 
      ? `en|${targetLang}` 
      : `${sourceLang}|${targetLang}`;

    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`
    );

    if (!response.ok) {
      throw new Error('Translation API error');
    }

    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
      res.json({
        translatedText: data.responseData.translatedText,
        detectedSourceLanguage: sourceLang === 'auto' ? 'en' : sourceLang
      });
    } else {
      throw new Error('Translation failed');
    }
  } catch (error) {
    logger.error('Error translating text:', error);
    res.status(500).json({ error: 'Failed to translate text' });
  }
});

// Language detection endpoint
app.post('/api/translate/detect', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Simple language detection using first few characters
    // For production, use Google Cloud Translation API or Azure Translator
    // This is a basic fallback
    res.json({
      language: 'en' // Default to English, can be enhanced with proper detection API
    });
  } catch (error) {
    logger.error('Error detecting language:', error);
    res.status(500).json({ error: 'Failed to detect language' });
  }
});

// Initialize Google Calendar OAuth client
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // Use explicit redirect URI or construct from backend URL (not frontend)
  // The redirect URI must point to the backend server callback route
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${backendUrl}/api/calendar/google/callback`;
  calendarService.initializeGoogleClient(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
  logger.info('Google Calendar OAuth client initialized', { redirectUri });
} else {
  logger.warn('Google Calendar OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
}

// Calendar Integration API
// Get Google Calendar OAuth URL
app.get('/api/calendar/google/auth-url', async (req, res) => {
  try {
    const userId = req.query.userId || req.headers['user-id'] || 'default-user';
    
    // Check subscription for calendar integration
    if (userId !== 'default-user') {
      const subscriptionService = require('./utils/subscriptionService');
      const canSync = await subscriptionService.canPerformAction(userId, 'calendarIntegration');
      if (!canSync) {
        return res.status(403).json({ 
          error: 'Calendar integration is only available in Pro and Yearly plans.',
          upgradeRequired: true
        });
      }
    }
    
    const authUrl = calendarService.getGoogleAuthUrl(userId);
    res.json({ authUrl });
  } catch (error) {
    logger.error('Error generating Google auth URL:', error);
    res.status(500).json({ error: error.message || 'Failed to generate auth URL' });
  }
});

// Google Calendar OAuth callback
app.get('/api/calendar/google/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    const tokens = await calendarService.exchangeCodeForTokens(code);
    calendarService.setUserCredentials(userId, tokens);

    // Redirect to frontend with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/settings?calendar=connected`);
  } catch (error) {
    logger.error('Error in Google Calendar callback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/settings?calendar=error`);
  }
});

// Get calendar connection status
app.get('/api/calendar/status', (req, res) => {
  try {
    const userId = req.query.userId || req.headers['user-id'] || 'default-user';
    const connection = calendarService.getCalendarConnection(userId);
    res.json({ connected: !!connection, connection });
  } catch (error) {
    logger.error('Error getting calendar status:', error);
    res.status(500).json({ error: error.message || 'Failed to get calendar status' });
  }
});

// Disconnect calendar
app.post('/api/calendar/disconnect', (req, res) => {
  try {
    const userId = req.body.userId || req.headers['user-id'] || 'default-user';
    calendarService.disconnectCalendar(userId);
    res.json({ success: true, message: 'Calendar disconnected' });
  } catch (error) {
    logger.error('Error disconnecting calendar:', error);
    res.status(500).json({ error: error.message || 'Failed to disconnect calendar' });
  }
});

// Sync calendar events
app.get('/api/calendar/sync', async (req, res) => {
  try {
    const userId = req.query.userId || req.headers['user-id'] || 'default-user';
    
    // Check subscription for calendar integration
    if (userId !== 'default-user') {
      const subscriptionService = require('./utils/subscriptionService');
      const canSync = await subscriptionService.canPerformAction(userId, 'calendarIntegration');
      if (!canSync) {
        return res.status(403).json({ 
          error: 'Calendar integration is only available in Pro and Yearly plans.',
          upgradeRequired: true
        });
      }
    }
    
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const events = await calendarService.syncGoogleCalendar(userId, startDate, endDate);
    res.json({ events });
  } catch (error) {
    logger.error('Error syncing calendar:', error);
    res.status(500).json({ error: error.message || 'Failed to sync calendar' });
  }
});

// Create event in calendar
app.post('/api/calendar/events', async (req, res) => {
  try {
    const userId = req.body.userId || req.headers['user-id'] || 'default-user';
    const { title, description, start, end, location, attendees, timeZone, reminders } = req.body;

    if (!title || !start || !end) {
      return res.status(400).json({ error: 'Title, start, and end are required' });
    }

    const event = await calendarService.createGoogleCalendarEvent(userId, {
      title,
      description,
      start,
      end,
      location,
      attendees,
      timeZone,
      reminders
    });

    res.json({ event });
  } catch (error) {
    logger.error('Error creating calendar event:', error);
    res.status(500).json({ error: error.message || 'Failed to create calendar event' });
  }
});

// Update event in calendar
app.put('/api/calendar/events/:eventId', async (req, res) => {
  try {
    const userId = req.body.userId || req.headers['user-id'] || 'default-user';
    const { eventId } = req.params;
    const { title, description, start, end, location, attendees, timeZone } = req.body;

    const event = await calendarService.updateGoogleCalendarEvent(userId, eventId, {
      title,
      description,
      start,
      end,
      location,
      attendees,
      timeZone
    });

    res.json({ event });
  } catch (error) {
    logger.error('Error updating calendar event:', error);
    res.status(500).json({ error: error.message || 'Failed to update calendar event' });
  }
});

// Delete event from calendar
app.delete('/api/calendar/events/:eventId', async (req, res) => {
  try {
    const userId = req.query.userId || req.headers['user-id'] || 'default-user';
    const { eventId } = req.params;

    await calendarService.deleteGoogleCalendarEvent(userId, eventId);
    res.json({ success: true, message: 'Event deleted from calendar' });
  } catch (error) {
    logger.error('Error deleting calendar event:', error);
    res.status(500).json({ error: error.message || 'Failed to delete calendar event' });
  }
});

// Import ICS file
app.post('/api/calendar/import/ics', async (req, res) => {
  try {
    const { icsContent } = req.body;
    if (!icsContent) {
      return res.status(400).json({ error: 'ICS content is required' });
    }

    const events = await calendarService.parseICSFile(icsContent);
    res.json({ events, count: events.length });
  } catch (error) {
    logger.error('Error importing ICS file:', error);
    res.status(500).json({ error: error.message || 'Failed to import ICS file' });
  }
});

// Streaming API endpoints
// Start streaming a meeting
app.post('/api/streaming/start', async (req, res) => {
  try {
    const { roomId, rtmpUrl, streamKey, platform, userId, recordWhileStreaming } = req.body;
    
    if (!roomId || !rtmpUrl) {
      return res.status(400).json({ error: 'Room ID and RTMP URL are required' });
    }

    if (!rooms.has(roomId)) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = rooms.get(roomId);
    
    // Only host can start streaming
    if (room.mainHost !== userId) {
      return res.status(403).json({ error: 'Only the host can start streaming' });
    }

    // Validate stream key for YouTube
    if (platform && platform.toLowerCase().includes('youtube') && !streamKey) {
      return res.status(400).json({ 
        error: 'Stream key is required for YouTube Live. Please configure it in Settings > Social Media Accounts or in your .env file.' 
      });
    }

    // Start streaming (now async)
    const streamInfo = await streamingService.startStreaming(roomId, rtmpUrl, streamKey, { platform });
    
    // Update room state
    room.isStreaming = true;
    room.streamingInfo = {
      platform: streamInfo.platform,
      startedAt: streamInfo.startedAt,
      rtmpUrl: streamInfo.rtmpUrl,
      recordWhileStreaming: recordWhileStreaming || false
    };
    rooms.set(roomId, room);

    // Notify all participants
    io.to(roomId).emit('streaming-started', {
      platform: streamInfo.platform,
      startedAt: streamInfo.startedAt,
      recordWhileStreaming: recordWhileStreaming || false
    });

    res.json({ 
      success: true, 
      message: `Streaming started to ${streamInfo.platform}`,
      streamInfo: {
        platform: streamInfo.platform,
        startedAt: streamInfo.startedAt,
        rtmpUrl: streamInfo.rtmpUrl
      }
    });
  } catch (error) {
    logger.error('Error starting stream:', error);
    // Provide helpful error messages
    let errorMessage = error.message || 'Failed to start streaming';
    
    if (errorMessage.includes('FFmpeg is not installed')) {
      errorMessage = 'FFmpeg is not installed. Please install FFmpeg:\n\nmacOS: brew install ffmpeg\nUbuntu/Debian: sudo apt-get install ffmpeg\nWindows: Download from https://ffmpeg.org/download.html';
    } else if (errorMessage.includes('Stream key')) {
      errorMessage = 'Stream key is required for YouTube Live. Please configure it in Settings > Social Media Accounts or check your .env file.';
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// Stop streaming a meeting
app.post('/api/streaming/stop', (req, res) => {
  try {
    const { roomId, userId } = req.body;
    
    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }

    if (!rooms.has(roomId)) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = rooms.get(roomId);
    
    // Only host can stop streaming
    if (room.mainHost !== userId) {
      return res.status(403).json({ error: 'Only the host can stop streaming' });
    }

    // Stop streaming
    streamingService.stopStreaming(roomId);
    
    // Update room state
    room.isStreaming = false;
    room.streamingInfo = null;
    rooms.set(roomId, room);

    // Notify all participants
    io.to(roomId).emit('streaming-stopped');

    res.json({ success: true, message: 'Streaming stopped' });
  } catch (error) {
    logger.error('Error stopping stream:', error);
    res.status(500).json({ error: error.message || 'Failed to stop streaming' });
  }
});

// Get streaming status
app.get('/api/streaming/status/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    
    if (!rooms.has(roomId)) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = rooms.get(roomId);
    const streamStatus = streamingService.getStreamStatus(roomId);

    res.json({
      isStreaming: streamStatus.isStreaming,
      platform: streamStatus.platform,
      startedAt: streamStatus.startedAt,
      roomStreaming: room.isStreaming || false
    });
  } catch (error) {
    logger.error('Error getting stream status:', error);
    res.status(500).json({ error: error.message || 'Failed to get stream status' });
  }
});

// Get supported streaming platforms
app.get('/api/streaming/platforms', (req, res) => {
  res.json({
    platforms: [
      {
        id: 'youtube',
        name: 'YouTube Live',
        rtmpUrl: process.env.YOUTUBE_RTMP_URL || 'rtmp://a.rtmp.youtube.com/live2',
        backupRtmpUrl: process.env.YOUTUBE_BACKUP_RTMP_URL || 'rtmp://b.rtmp.youtube.com/live2?backup=1',
        requiresStreamKey: true,
        defaultStreamKey: process.env.YOUTUBE_STREAM_KEY || null,
        instructions: '1. Go to YouTube Studio > Go Live > Stream settings. 2. Under "Stream key", select "Default stream key (RTMP, Variable)". 3. Copy the Stream key (the long string like "pday-ydjq-p2uc-f7cu-2q53") and paste it below. 4. The Stream URL is already set to: rtmp://a.rtmp.youtube.com/live2'
      },
      {
        id: 'facebook',
        name: 'Facebook Live',
        rtmpUrl: 'rtmp://rtmp-api.facebook.com:80/rtmp',
        requiresStreamKey: true,
        instructions: 'Get your stream key from Facebook Creator Studio > Live Producer'
      },
      {
        id: 'twitch',
        name: 'Twitch',
        rtmpUrl: 'rtmp://live.twitch.tv/app',
        requiresStreamKey: true,
        instructions: 'Get your stream key from Twitch Dashboard > Settings > Stream'
      },
      {
        id: 'custom',
        name: 'Custom RTMP',
        rtmpUrl: '',
        requiresStreamKey: true,
        instructions: 'Enter your custom RTMP server URL and stream key'
      }
    ]
  });
});

// Get WebRTC TURN/STUN server configuration
app.get('/api/webrtc/config', (req, res) => {
  try {
    const turnServers = process.env.REACT_APP_TURN_SERVERS 
      ? JSON.parse(process.env.REACT_APP_TURN_SERVERS)
      : [];
    
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      ...turnServers.map(server => ({
        urls: server.url,
        username: server.username || undefined,
        credential: server.credential || undefined
      }))
    ];

    res.json({
      iceServers,
      iceCandidatePoolSize: 10
    });
  } catch (error) {
    logger.error('Error getting WebRTC config:', error);
    // Return default STUN servers only if TURN config is invalid
    res.json({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    });
  }
});

const subscriptionService = require('./utils/subscriptionService');

// Subscription API endpoints
// Get user subscription
app.get('/api/subscription', async (req, res) => {
  try {
    const userId = req.query.userId || req.headers['user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if subscription exists in database
    const hasSubscription = await subscriptionService.hasSubscription(userId);
    
    if (!hasSubscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const subscription = await subscriptionService.getUserSubscription(userId);
    res.json(subscription);
  } catch (error) {
    logger.error('Error getting subscription:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// Activate free plan
app.post('/api/subscription/activate-free', async (req, res) => {
  try {
    const userId = req.body.userId || req.headers['user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const subscription = await subscriptionService.activateFreePlan(userId);
    res.json({ success: true, subscription });
  } catch (error) {
    logger.error('Error activating free plan:', error);
    res.status(500).json({ error: 'Failed to activate free plan' });
  }
});

// Create checkout session (for Stripe integration)
app.post('/api/subscription/create-checkout', async (req, res) => {
  try {
    const { planId, billingCycle } = req.body;
    const userId = req.body.userId || req.headers['user-id'];
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    // TODO: Integrate with Stripe
    // For now, return a mock checkout URL
    // In production, use Stripe Checkout API
    
    const plans = {
      basic: { price: 199, name: 'Basic Plan' }, // $1.99 in cents
      pro: { price: 499, name: 'Pro Plan' }, // $4.99 in cents
      yearly: { price: 5000, name: 'Yearly Plan' } // $50.00 in cents
    };

    const plan = plans[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    // Mock checkout URL - replace with actual Stripe checkout
    const checkoutUrl = `/checkout?plan=${planId}&userId=${userId}`;
    
    res.json({
      checkoutUrl,
      planId,
      price: plan.price,
      message: 'Stripe integration required. Update this endpoint with Stripe Checkout.'
    });
  } catch (error) {
    logger.error('Error creating checkout:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Track call minutes usage
app.post('/api/subscription/track-usage', async (req, res) => {
  try {
    const { userId, minutes } = req.body;
    
    if (!userId || !minutes) {
      return res.status(400).json({ error: 'User ID and minutes are required' });
    }

    const result = await subscriptionService.trackCallMinutes(userId, minutes);
    res.json(result);
  } catch (error) {
    logger.error('Error tracking usage:', error);
    res.status(500).json({ error: 'Failed to track usage' });
  }
});

// Cancel subscription
app.post('/api/subscription/cancel', async (req, res) => {
  try {
    const userId = req.body.userId || req.headers['user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await subscriptionService.cancelSubscription(userId);
    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (error) {
    logger.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Get billing history
app.get('/api/subscription/billing-history', async (req, res) => {
  try {
    const userId = req.query.userId || req.headers['user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get subscription to determine plan
    const subscription = await subscriptionService.getUserSubscription(userId);
    
    // Mock billing history - in production, fetch from payment provider (Stripe)
    const billingHistory = [];
    
    if (subscription.planId !== 'free' && subscription.startedAt) {
      // Add current subscription as billing entry
      const plans = {
        basic: { price: 1.99, name: 'Basic Plan' },
        pro: { price: 4.99, name: 'Pro Plan' },
        yearly: { price: 50, name: 'Yearly Plan' }
      };
      
      const plan = plans[subscription.planId];
      if (plan) {
        billingHistory.push({
          date: subscription.startedAt,
          description: `${plan.name} - ${subscription.billingCycle === 'yearly' ? 'Annual' : 'Monthly'} subscription`,
          amount: plan.price,
          status: subscription.status,
          receiptUrl: null // Will be populated when Stripe is integrated
        });
      }
    }

    res.json({ history: billingHistory });
  } catch (error) {
    logger.error('Error getting billing history:', error);
    res.status(500).json({ error: 'Failed to get billing history' });
  }
});

// Check if user can perform action
app.post('/api/subscription/check-feature', async (req, res) => {
  try {
    const userId = req.body.userId || req.headers['user-id'];
    const { action } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    const canPerform = await subscriptionService.canPerformAction(userId, action);
    const subscription = await subscriptionService.getUserSubscription(userId);
    
    res.json({
      allowed: canPerform,
      action,
      planId: subscription.planId,
      features: subscription.features
    });
  } catch (error) {
    logger.error('Error checking feature:', error);
    res.status(500).json({ error: 'Failed to check feature' });
  }
});

// Check call minutes limit
app.post('/api/subscription/check-minutes', async (req, res) => {
  try {
    const userId = req.body.userId || req.headers['user-id'];
    const { requiredMinutes } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const checkResult = await subscriptionService.checkCallMinutesLimit(userId, requiredMinutes || 0);
    
    res.json(checkResult);
  } catch (error) {
    logger.error('Error checking minutes:', error);
    res.status(500).json({ error: 'Failed to check minutes' });
  }
});

// Admin API Endpoints
// Super admin email (should be in environment variable in production)
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'infoajumapro@gmail.com';
const activityLogger = require('./utils/activityLogger');

// Middleware to check if user is super admin
const checkAdminAccess = (req, res, next) => {
  const userEmail = req.headers['user-email'] || req.query.email || req.body.email;
  if (userEmail === SUPER_ADMIN_EMAIL) {
    req.adminEmail = userEmail;
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
};

// Middleware to log admin activities
const logAdminActivity = (action, entityType = null) => {
  return async (req, res, next) => {
    // Log after successful response
    const originalSend = res.json;
    res.json = function(data) {
      if (res.statusCode < 400) {
        const userId = req.body.userId || req.params.userId || 'system';
        activityLogger.logActivity(
          userId,
          req.adminEmail || 'system',
          action,
          entityType,
          req.params.id || req.params.userId || req.params.planId || null,
          { method: req.method, path: req.path },
          req
        );
      }
      return originalSend.call(this, data);
    };
    next();
  };
};

// Check if user is admin
app.get('/api/admin/check', checkAdminAccess, (req, res) => {
  res.json({ isAdmin: true });
});

// Get admin dashboard stats
app.get('/api/admin/stats', checkAdminAccess, async (req, res) => {
  try {
    const subscriptionService = require('./utils/subscriptionService');
    
    // Get all users count
    const totalUsers = users.size;
    
    // Get active rooms count
    const activeMeetings = Array.from(rooms.values()).filter(room => 
      room.participants && room.participants.length > 0
    ).length;
    
    // Get subscriptions count
    let totalSubscriptions = 0;
    let revenue = 0;
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const subscriptionsResult = await db.db.query(
        'SELECT plan_id, COUNT(*) as count FROM user_subscriptions WHERE status = $1 GROUP BY plan_id',
        ['active']
      );
      totalSubscriptions = subscriptionsResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
      
      // Calculate revenue based on plan prices
      const planPrices = { free: 0, basic: 1.99, pro: 4.99, yearly: 50 };
      subscriptionsResult.rows.forEach(row => {
        const planId = row.plan_id;
        const count = parseInt(row.count);
        revenue += (planPrices[planId] || 0) * count;
      });
    } else {
      // Fallback for in-memory storage
      totalSubscriptions = subscriptionService.subscriptions ? subscriptionService.subscriptions.size : 0;
    }
    
    // Calculate changes (mock data for now)
    const usersChange = Math.floor(Math.random() * 10);
    const meetingsChange = Math.floor(Math.random() * 5);
    const subscriptionsChange = Math.floor(Math.random() * 3);
    const revenueChange = Math.floor(Math.random() * 100);
    
    // Analytics data (daily meetings)
    const dailyMeetings = [12, 19, 15, 25, 22, 18, 14];
    
    // Progress data
    const progress = [41, 35, 24];
    
    // Get projects and reminders (if they exist)
    const projectsList = projects ? Array.from(projects.values()).slice(0, 5) : [];
    const remindersList = reminders ? Array.from(reminders.values())
      .filter(r => !r.completed)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5) : [];
    
    res.json({
      totalUsers,
      usersChange,
      activeMeetings,
      meetingsChange,
      totalSubscriptions,
      subscriptionsChange,
      revenue: Math.round(revenue * 100) / 100,
      revenueChange,
      analytics: {
        dailyMeetings
      },
      progress,
      reminders: remindersList,
      projects: projectsList,
      teamMembers: []
    });
  } catch (error) {
    logger.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// Get all users
app.get('/api/admin/users', checkAdminAccess, (req, res) => {
  try {
    const usersList = Array.from(users.values());
    res.json(usersList);
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all subscriptions
app.get('/api/admin/subscriptions', checkAdminAccess, async (req, res) => {
  try {
    const subscriptionService = require('./utils/subscriptionService');
    const subscriptionsList = [];
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const result = await db.db.query(
        'SELECT * FROM user_subscriptions ORDER BY created_at DESC'
      );
      subscriptionsList.push(...result.rows);
    } else {
      // Fallback for in-memory storage
      if (subscriptionService.subscriptions) {
        subscriptionService.subscriptions.forEach((sub, userId) => {
          subscriptionsList.push({ ...sub, userId });
        });
      }
    }
    
    res.json(subscriptionsList);
  } catch (error) {
    logger.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Get all rooms
app.get('/api/admin/rooms', checkAdminAccess, (req, res) => {
  try {
    const roomsList = Array.from(rooms.entries()).map(([roomId, room]) => ({
      roomId,
      ...room,
      participantCount: room.participants ? room.participants.length : 0
    }));
    res.json(roomsList);
  } catch (error) {
    logger.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Delete a user
app.delete('/api/admin/users/:userId', checkAdminAccess, (req, res) => {
  try {
    const { userId } = req.params;
    users.delete(userId);
    logger.info(`User deleted by admin: ${userId}`);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Update user
app.put('/api/admin/users/:userId', checkAdminAccess, (req, res) => {
  try {
    const { userId } = req.params;
    const { email, name } = req.body;
    if (users.has(userId)) {
      const user = users.get(userId);
      if (email) user.email = email;
      if (name) user.name = name;
      users.set(userId, user);
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Approve user account
app.post('/api/admin/users/:userId/approve', checkAdminAccess, (req, res) => {
  try {
    const { userId } = req.params;
    let userFound = null;
    
    // Find user by userId in the users Map
    for (const [email, user] of users.entries()) {
      if (user.userId === userId) {
        user.status = 'approved';
        user.approvedAt = new Date().toISOString();
        user.approvedBy = req.headers['user-email'] || 'admin';
        users.set(email, user);
        userFound = user;
        logger.info(`User approved: ${email} by ${user.approvedBy}`);
        break;
      }
    }
    
    if (!userFound) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User approved successfully', user: userFound });
  } catch (error) {
    logger.error('Error approving user:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// Reject user account
app.post('/api/admin/users/:userId/reject', checkAdminAccess, (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    let userFound = null;
    
    // Find user by userId in the users Map
    for (const [email, user] of users.entries()) {
      if (user.userId === userId) {
        user.status = 'rejected';
        user.rejectedAt = new Date().toISOString();
        user.rejectedBy = req.headers['user-email'] || 'admin';
        user.rejectionReason = reason || '';
        users.set(email, user);
        userFound = user;
        logger.info(`User rejected: ${email} by ${user.rejectedBy}, reason: ${reason || 'No reason provided'}`);
        break;
      }
    }
    
    if (!userFound) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User rejected successfully', user: userFound });
  } catch (error) {
    logger.error('Error rejecting user:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

// Suspend user account
app.post('/api/admin/users/:userId/suspend', checkAdminAccess, (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    let userFound = null;
    
    // Find user by userId in the users Map
    for (const [email, user] of users.entries()) {
      if (user.userId === userId) {
        user.status = 'suspended';
        user.suspendedAt = new Date().toISOString();
        user.suspendedBy = req.headers['user-email'] || 'admin';
        user.suspensionReason = reason || '';
        users.set(email, user);
        userFound = user;
        logger.info(`User suspended: ${email} by ${user.suspendedBy}, reason: ${reason || 'No reason provided'}`);
        break;
      }
    }
    
    if (!userFound) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User suspended successfully', user: userFound });
  } catch (error) {
    logger.error('Error suspending user:', error);
    res.status(500).json({ error: 'Failed to suspend user' });
  }
});

// Unsuspend user account (reactivate)
app.post('/api/admin/users/:userId/unsuspend', checkAdminAccess, (req, res) => {
  try {
    const { userId } = req.params;
    let userFound = null;
    
    // Find user by userId in the users Map
    for (const [email, user] of users.entries()) {
      if (user.userId === userId) {
        user.status = 'approved';
        user.unsuspendedAt = new Date().toISOString();
        user.unsuspendedBy = req.headers['user-email'] || 'admin';
        users.set(email, user);
        userFound = user;
        logger.info(`User unsuspended: ${email} by ${user.unsuspendedBy}`);
        break;
      }
    }
    
    if (!userFound) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User account reactivated successfully', user: userFound });
  } catch (error) {
    logger.error('Error unsuspending user:', error);
    res.status(500).json({ error: 'Failed to reactivate user' });
  }
});

// Get pending accounts (accounts awaiting approval)
app.get('/api/admin/users/pending', checkAdminAccess, (req, res) => {
  try {
    const pendingUsers = Array.from(users.values()).filter(user => 
      user.status === 'pending' || !user.status
    );
    res.json(pendingUsers);
  } catch (error) {
    logger.error('Error fetching pending users:', error);
    res.status(500).json({ error: 'Failed to fetch pending users' });
  }
});

// Grant premium subscription to user (admin only)
app.post('/api/admin/users/:userId/grant-premium', checkAdminAccess, async (req, res) => {
  try {
    const { userId } = req.params;
    const subscriptionService = require('./utils/subscriptionService');
    
    // Find user by userId
    let userFound = false;
    for (const [email, user] of users.entries()) {
      if (user.userId === userId) {
        userFound = true;
        break;
      }
    }
    
    if (!userFound) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const subscription = await subscriptionService.grantPremiumSubscription(userId);
    logger.info(`Premium subscription granted to user: ${userId} by admin`);
    
    res.json({ 
      success: true, 
      message: 'Premium subscription granted successfully', 
      subscription 
    });
  } catch (error) {
    logger.error('Error granting premium subscription:', error);
    res.status(500).json({ error: 'Failed to grant premium subscription' });
  }
});

// Pricing Plans CRUD Operations
// Store pricing plans in memory (fallback if no database)
const pricingPlans = new Map();

// Initialize default plans
function initializeDefaultPlans() {
  const defaultPlans = [
    {
      planId: 'free',
      name: 'Free',
      price: 0,
      billing: 'monthly',
      description: 'Perfect for trying out Montty Zoom',
      features: [
        '2 hours of call minutes per month',
        'Unlimited participants per meeting',
        'HD video quality',
        'Screen sharing',
        'Chat messaging',
        'Google advertising included',
        'Basic meeting features'
      ],
      limitations: {
        maxParticipants: -1,
        maxCallMinutes: 120,
        maxMeetingsPerMonth: 10,
        recording: false,
        customBranding: false,
        prioritySupport: false,
        advancedFeatures: false,
        apiAccess: false
      },
      callMinutes: 120,
      popular: false,
      active: true
    },
    {
      planId: 'basic',
      name: 'Basic',
      price: 1.99,
      billing: 'monthly',
      description: 'For individuals and small teams',
      features: [
        '10 hours of call minutes per month',
        'Unlimited participants per meeting',
        'HD video quality',
        'Screen sharing',
        'Chat messaging',
        'Recording (local)',
        'No advertising',
        'Email support',
        'Meeting scheduling'
      ],
      limitations: {
        maxParticipants: -1,
        maxCallMinutes: 600,
        maxMeetingsPerMonth: 50,
        recording: true,
        customBranding: false,
        prioritySupport: false,
        advancedFeatures: false,
        apiAccess: false
      },
      callMinutes: 600,
      popular: false,
      active: true
    },
    {
      planId: 'pro',
      name: 'Pro',
      price: 4.99,
      billing: 'monthly',
      description: 'For large organizations with all features',
      features: [
        'Unlimited call minutes',
        'Unlimited participants per meeting',
        'HD video quality',
        'Screen sharing',
        'Chat messaging',
        'Cloud recording',
        'Custom branding',
        'Priority support',
        'Advanced features',
        'Calendar integration',
        'Live streaming',
        'Breakout rooms',
        'Meeting analytics',
        'Get every new update',
        'API access'
      ],
      limitations: {
        maxParticipants: -1,
        maxCallMinutes: -1,
        maxMeetingsPerMonth: -1,
        recording: true,
        customBranding: true,
        prioritySupport: true,
        advancedFeatures: true,
        apiAccess: true
      },
      callMinutes: -1,
      popular: true,
      active: true
    },
    {
      planId: 'yearly',
      name: 'Yearly',
      price: 50,
      billing: 'yearly',
      description: 'Best value - Save 17% compared to monthly',
      features: [
        'Unlimited call minutes',
        'Unlimited participants per meeting',
        'HD video quality',
        'Screen sharing',
        'Chat messaging',
        'Cloud recording',
        'Custom branding',
        'Priority support',
        'Advanced features',
        'Calendar integration',
        'Live streaming',
        'Breakout rooms',
        'Meeting analytics',
        'Get every new update',
        'API access',
        'Same as Pro plan'
      ],
      limitations: {
        maxParticipants: -1,
        maxCallMinutes: -1,
        maxMeetingsPerMonth: -1,
        recording: true,
        customBranding: true,
        prioritySupport: true,
        advancedFeatures: true,
        apiAccess: true
      },
      callMinutes: -1,
      popular: false,
      active: true
    }
  ];

  defaultPlans.forEach(plan => {
    pricingPlans.set(plan.planId, plan);
  });
}

// Initialize default plans on server start
initializeDefaultPlans();

// Get all pricing plans
app.get('/api/admin/packages', checkAdminAccess, async (req, res) => {
  try {
    let plansList = [];

    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const result = await db.db.query(
        'SELECT * FROM pricing_plans ORDER BY price ASC, created_at DESC'
      );
      plansList = result.rows.map(row => ({
        planId: row.plan_id,
        name: row.name,
        price: parseFloat(row.price),
        billing: row.billing,
        description: row.description,
        features: row.features || [],
        limitations: row.limitations || {},
        callMinutes: row.call_minutes,
        popular: row.popular,
        active: row.active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } else {
      // Fallback to in-memory storage
      plansList = Array.from(pricingPlans.values());
    }

    res.json(plansList);
  } catch (error) {
    logger.error('Error fetching pricing plans:', error);
    res.status(500).json({ error: 'Failed to fetch pricing plans' });
  }
});

// Get a specific pricing plan
app.get('/api/admin/packages/:planId', checkAdminAccess, async (req, res) => {
  try {
    const { planId } = req.params;
    let plan = null;

    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const result = await db.db.query(
        'SELECT * FROM pricing_plans WHERE plan_id = $1',
        [planId]
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        plan = {
          planId: row.plan_id,
          name: row.name,
          price: parseFloat(row.price),
          billing: row.billing,
          description: row.description,
          features: row.features || [],
          limitations: row.limitations || {},
          callMinutes: row.call_minutes,
          popular: row.popular,
          active: row.active,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }
    } else {
      plan = pricingPlans.get(planId) || null;
    }

    if (!plan) {
      return res.status(404).json({ error: 'Pricing plan not found' });
    }

    res.json(plan);
  } catch (error) {
    logger.error('Error fetching pricing plan:', error);
    res.status(500).json({ error: 'Failed to fetch pricing plan' });
  }
});

// Create a new pricing plan
app.post('/api/admin/packages', checkAdminAccess, async (req, res) => {
  try {
    const {
      planId,
      name,
      price,
      billing,
      description,
      features,
      limitations,
      callMinutes,
      popular
    } = req.body;

    if (!planId || !name || price === undefined || callMinutes === undefined) {
      return res.status(400).json({ error: 'Missing required fields: planId, name, price, callMinutes' });
    }

    const plan = {
      planId,
      name,
      price: parseFloat(price),
      billing: billing || 'monthly',
      description: description || '',
      features: features || [],
      limitations: limitations || {},
      callMinutes: parseInt(callMinutes),
      popular: popular || false,
      active: true
    };

    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      await db.db.query(
        `INSERT INTO pricing_plans 
         (plan_id, name, price, billing, description, features, limitations, call_minutes, popular, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (plan_id) DO UPDATE SET
         name = EXCLUDED.name,
         price = EXCLUDED.price,
         billing = EXCLUDED.billing,
         description = EXCLUDED.description,
         features = EXCLUDED.features,
         limitations = EXCLUDED.limitations,
         call_minutes = EXCLUDED.call_minutes,
         popular = EXCLUDED.popular,
         active = EXCLUDED.active,
         updated_at = NOW()`,
        [
          plan.planId,
          plan.name,
          plan.price,
          plan.billing,
          plan.description,
          JSON.stringify(plan.features),
          JSON.stringify(plan.limitations),
          plan.callMinutes,
          plan.popular,
          plan.active
        ]
      );
    } else {
      pricingPlans.set(planId, plan);
    }

    logger.info(`Pricing plan created/updated: ${planId} by admin`);
    res.json({ success: true, message: 'Pricing plan created successfully', plan });
  } catch (error) {
    logger.error('Error creating pricing plan:', error);
    res.status(500).json({ error: 'Failed to create pricing plan' });
  }
});

// Update a pricing plan
app.put('/api/admin/packages/:planId', checkAdminAccess, async (req, res) => {
  try {
    const { planId } = req.params;
    const {
      name,
      price,
      billing,
      description,
      features,
      limitations,
      callMinutes,
      popular,
      active
    } = req.body;

    let plan = null;

    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      // Check if plan exists
      const checkResult = await db.db.query(
        'SELECT * FROM pricing_plans WHERE plan_id = $1',
        [planId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Pricing plan not found' });
      }

      await db.db.query(
        `UPDATE pricing_plans SET
         name = COALESCE($1, name),
         price = COALESCE($2, price),
         billing = COALESCE($3, billing),
         description = COALESCE($4, description),
         features = COALESCE($5, features),
         limitations = COALESCE($6, limitations),
         call_minutes = COALESCE($7, call_minutes),
         popular = COALESCE($8, popular),
         active = COALESCE($9, active),
         updated_at = NOW()
         WHERE plan_id = $10`,
        [
          name,
          price !== undefined ? parseFloat(price) : null,
          billing,
          description,
          features ? JSON.stringify(features) : null,
          limitations ? JSON.stringify(limitations) : null,
          callMinutes !== undefined ? parseInt(callMinutes) : null,
          popular,
          active,
          planId
        ]
      );

      const result = await db.db.query(
        'SELECT * FROM pricing_plans WHERE plan_id = $1',
        [planId]
      );
      const row = result.rows[0];
      plan = {
        planId: row.plan_id,
        name: row.name,
        price: parseFloat(row.price),
        billing: row.billing,
        description: row.description,
        features: row.features || [],
        limitations: row.limitations || {},
        callMinutes: row.call_minutes,
        popular: row.popular,
        active: row.active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } else {
      plan = pricingPlans.get(planId);
      if (!plan) {
        return res.status(404).json({ error: 'Pricing plan not found' });
      }

      if (name !== undefined) plan.name = name;
      if (price !== undefined) plan.price = parseFloat(price);
      if (billing !== undefined) plan.billing = billing;
      if (description !== undefined) plan.description = description;
      if (features !== undefined) plan.features = features;
      if (limitations !== undefined) plan.limitations = limitations;
      if (callMinutes !== undefined) plan.callMinutes = parseInt(callMinutes);
      if (popular !== undefined) plan.popular = popular;
      if (active !== undefined) plan.active = active;

      pricingPlans.set(planId, plan);
    }

    logger.info(`Pricing plan updated: ${planId} by admin`);
    res.json({ success: true, message: 'Pricing plan updated successfully', plan });
  } catch (error) {
    logger.error('Error updating pricing plan:', error);
    res.status(500).json({ error: 'Failed to update pricing plan' });
  }
});

// Delete a pricing plan (soft delete by setting active=false)
app.delete('/api/admin/packages/:planId', checkAdminAccess, async (req, res) => {
  try {
    const { planId } = req.params;

    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const result = await db.db.query(
        'UPDATE pricing_plans SET active = FALSE, updated_at = NOW() WHERE plan_id = $1',
        [planId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Pricing plan not found' });
      }
    } else {
      const plan = pricingPlans.get(planId);
      if (!plan) {
        return res.status(404).json({ error: 'Pricing plan not found' });
      }
      plan.active = false;
      pricingPlans.set(planId, plan);
    }

    logger.info(`Pricing plan deleted (deactivated): ${planId} by admin`);
    res.json({ success: true, message: 'Pricing plan deleted successfully' });
  } catch (error) {
    logger.error('Error deleting pricing plan:', error);
    res.status(500).json({ error: 'Failed to delete pricing plan' });
  }
});

// Get meeting history
app.get('/api/admin/meetings/history', checkAdminAccess, (req, res) => {
  try {
    const history = Array.from(meetingHistory.values());
    history.sort((a, b) => new Date(b.createdAt || b.scheduledDateTime) - new Date(a.createdAt || a.scheduledDateTime));
    res.json(history);
  } catch (error) {
    logger.error('Error fetching meeting history:', error);
    res.status(500).json({ error: 'Failed to fetch meeting history' });
  }
});

// Delete a meeting
app.delete('/api/admin/meetings/:meetingId', checkAdminAccess, (req, res) => {
  try {
    const { meetingId } = req.params;
    scheduledMeetings.delete(meetingId);
    logger.info(`Meeting deleted by admin: ${meetingId}`);
    res.json({ success: true, message: 'Meeting deleted successfully' });
  } catch (error) {
    logger.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// Delete a room
app.delete('/api/admin/rooms/:roomId', checkAdminAccess, (req, res) => {
  try {
    const { roomId } = req.params;
    rooms.delete(roomId);
    logger.info(`Room deleted by admin: ${roomId}`);
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    logger.error('Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// Projects CRUD
// Get all projects
app.get('/api/admin/projects', checkAdminAccess, (req, res) => {
  try {
    const projectsList = Array.from(projects.values()).sort((a, b) => 
      new Date(a.dueDate) - new Date(b.dueDate)
    );
    res.json(projectsList);
  } catch (error) {
    logger.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create a project
app.post('/api/admin/projects', checkAdminAccess, (req, res) => {
  try {
    const { title, description, dueDate, status, priority } = req.body;
    if (!title || !dueDate) {
      return res.status(400).json({ error: 'Title and due date are required' });
    }
    const projectId = uuidv4();
    const project = {
      id: projectId,
      title,
      description: description || '',
      dueDate,
      status: status || 'pending',
      priority: priority || 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    projects.set(projectId, project);
    res.json(project);
  } catch (error) {
    logger.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update a project
app.put('/api/admin/projects/:projectId', checkAdminAccess, (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, dueDate, status, priority } = req.body;
    if (!projects.has(projectId)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = projects.get(projectId);
    if (title) project.title = title;
    if (description !== undefined) project.description = description;
    if (dueDate) project.dueDate = dueDate;
    if (status) project.status = status;
    if (priority) project.priority = priority;
    project.updatedAt = new Date().toISOString();
    projects.set(projectId, project);
    res.json(project);
  } catch (error) {
    logger.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete a project
app.delete('/api/admin/projects/:projectId', checkAdminAccess, (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projects.has(projectId)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    projects.delete(projectId);
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    logger.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Reminders CRUD
// Get all reminders
app.get('/api/admin/reminders', checkAdminAccess, (req, res) => {
  try {
    const remindersList = Array.from(reminders.values()).sort((a, b) => 
      new Date(a.dueDate) - new Date(b.dueDate)
    );
    res.json(remindersList);
  } catch (error) {
    logger.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Create a reminder
app.post('/api/admin/reminders', checkAdminAccess, (req, res) => {
  try {
    const { title, description, dueDate, type } = req.body;
    if (!title || !dueDate) {
      return res.status(400).json({ error: 'Title and due date are required' });
    }
    const reminderId = uuidv4();
    const reminder = {
      id: reminderId,
      title,
      description: description || '',
      dueDate,
      type: type || 'general',
      completed: false,
      createdAt: new Date().toISOString()
    };
    reminders.set(reminderId, reminder);
    res.json(reminder);
  } catch (error) {
    logger.error('Error creating reminder:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// Update a reminder
app.put('/api/admin/reminders/:reminderId', checkAdminAccess, (req, res) => {
  try {
    const { reminderId } = req.params;
    const { title, description, dueDate, type, completed } = req.body;
    if (!reminders.has(reminderId)) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    const reminder = reminders.get(reminderId);
    if (title) reminder.title = title;
    if (description !== undefined) reminder.description = description;
    if (dueDate) reminder.dueDate = dueDate;
    if (type) reminder.type = type;
    if (completed !== undefined) reminder.completed = completed;
    reminders.set(reminderId, reminder);
    res.json(reminder);
  } catch (error) {
    logger.error('Error updating reminder:', error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

// Delete a reminder
app.delete('/api/admin/reminders/:reminderId', checkAdminAccess, (req, res) => {
  try {
    const { reminderId } = req.params;
    if (!reminders.has(reminderId)) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    reminders.delete(reminderId);
    res.json({ success: true, message: 'Reminder deleted successfully' });
  } catch (error) {
    logger.error('Error deleting reminder:', error);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

// Enhanced analytics
app.get('/api/admin/analytics', checkAdminAccess, async (req, res) => {
  try {
    const subscriptionService = require('./utils/subscriptionService');
    
    // Get daily meeting counts for the last 7 days
    const dailyMeetings = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = Array.from(meetingHistory.values()).filter(m => {
        const meetingDate = m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : null;
        return meetingDate === dateStr;
      }).length;
      dailyMeetings.push(count);
    }
    
    // Get subscription distribution
    let subscriptionDistribution = { free: 0, basic: 0, pro: 0, yearly: 0 };
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const result = await db.db.query(
        'SELECT plan_id, COUNT(*) as count FROM user_subscriptions WHERE status = $1 GROUP BY plan_id',
        ['active']
      );
      result.rows.forEach(row => {
        subscriptionDistribution[row.plan_id] = parseInt(row.count);
      });
    } else {
      if (subscriptionService.subscriptions) {
        subscriptionService.subscriptions.forEach((sub) => {
          if (subscriptionDistribution[sub.planId] !== undefined) {
            subscriptionDistribution[sub.planId]++;
          }
        });
      }
    }
    
    // Get active users in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = Array.from(users.values()).filter(user => {
      if (!user.lastSignedIn) return false;
      return new Date(user.lastSignedIn) >= thirtyDaysAgo;
    }).length;
    
    // Get total meeting duration
    const totalDuration = Array.from(meetingHistory.values()).reduce((sum, meeting) => {
      return sum + (meeting.duration || 0);
    }, 0);
    
    res.json({
      dailyMeetings,
      subscriptionDistribution,
      activeUsers,
      totalDuration,
      totalMeetings: meetingHistory.size,
      totalRooms: rooms.size
    });
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ============================================
// COMPREHENSIVE ADMIN ENDPOINTS
// ============================================

// 1. SUBSCRIPTIONS MANAGEMENT
// Get subscription details with revenue
app.get('/api/admin/subscriptions/detailed', checkAdminAccess, async (req, res) => {
  try {
    const subscriptionService = require('./utils/subscriptionService');
    const subscriptionsList = [];
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const result = await db.db.query(
        `SELECT us.*, u.email, u.name 
         FROM user_subscriptions us
         LEFT JOIN users u ON us.user_id = u.user_id
         ORDER BY us.created_at DESC`
      );
      subscriptionsList.push(...result.rows);
    } else {
      if (subscriptionService.subscriptions) {
        subscriptionService.subscriptions.forEach((sub, userId) => {
          const user = Array.from(users.values()).find(u => u.userId === userId);
          subscriptionsList.push({ ...sub, userId, email: user?.email, name: user?.name });
        });
      }
    }
    
    // Calculate revenue
    const revenue = subscriptionsList.reduce((sum, sub) => {
      const planPrices = { free: 0, basic: 1.99, pro: 4.99, yearly: 50 };
      return sum + (planPrices[sub.plan_id] || 0);
    }, 0);
    
    res.json({ subscriptions: subscriptionsList, totalRevenue: revenue });
  } catch (error) {
    logger.error('Error fetching detailed subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// 2. ACTIVITY LOGS
app.get('/api/admin/activity-logs', checkAdminAccess, async (req, res) => {
  try {
    const filters = {
      userId: req.query.userId,
      action: req.query.action,
      entityType: req.query.entityType,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: parseInt(req.query.limit) || 1000
    };
    const logs = await activityLogger.getActivityLogs(filters);
    res.json(logs);
  } catch (error) {
    logger.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// 3. PAYMENT TRANSACTIONS
// Store payment transactions in memory (fallback)
const paymentTransactions = new Map();

app.get('/api/admin/payments', checkAdminAccess, async (req, res) => {
  try {
    let transactions = [];
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const result = await db.db.query(
        `SELECT pt.*, u.email, u.name 
         FROM payment_transactions pt
         LEFT JOIN users u ON pt.user_id = u.user_id
         ORDER BY pt.created_at DESC
         LIMIT $1`,
        [parseInt(req.query.limit) || 1000]
      );
      transactions = result.rows;
    } else {
      transactions = Array.from(paymentTransactions.values());
    }
    
    res.json(transactions);
  } catch (error) {
    logger.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

app.post('/api/admin/payments', checkAdminAccess, async (req, res) => {
  try {
    const { userId, amount, planId, billingCycle, transactionId, status } = req.body;
    
    const transaction = {
      userId,
      transactionId: transactionId || `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: parseFloat(amount),
      currency: 'USD',
      status: status || 'completed',
      paymentMethod: 'stripe',
      planId,
      billingCycle,
      createdAt: new Date()
    };
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      await db.db.query(
        `INSERT INTO payment_transactions 
         (user_id, transaction_id, amount, currency, status, payment_method, plan_id, billing_cycle, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          transaction.userId,
          transaction.transactionId,
          transaction.amount,
          transaction.currency,
          transaction.status,
          transaction.paymentMethod,
          transaction.planId,
          transaction.billingCycle,
          transaction.createdAt
        ]
      );
    } else {
      paymentTransactions.set(transaction.transactionId, transaction);
    }
    
    res.json({ success: true, transaction });
  } catch (error) {
    logger.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// 4. REPORTS & EXPORTS
app.get('/api/admin/reports/revenue', checkAdminAccess, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    let revenueData = [];
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      let query = `
        SELECT 
          DATE(created_at) as date,
          plan_id,
          COUNT(*) as count,
          SUM(
            CASE plan_id
              WHEN 'free' THEN 0
              WHEN 'basic' THEN 1.99
              WHEN 'pro' THEN 4.99
              WHEN 'yearly' THEN 50
              ELSE 0
            END
          ) as revenue
        FROM user_subscriptions
        WHERE status = 'active'
      `;
      
      if (startDate) query += ` AND created_at >= $1`;
      if (endDate) query += ` ${startDate ? 'AND' : 'WHERE'} created_at <= $${startDate ? 2 : 1}`;
      
      query += ` GROUP BY DATE(created_at), plan_id ORDER BY date DESC`;
      
      const params = [];
      if (startDate) params.push(startDate);
      if (endDate) params.push(endDate);
      
      const result = await db.db.query(query, params);
      revenueData = result.rows;
    }
    
    res.json(revenueData);
  } catch (error) {
    logger.error('Error fetching revenue report:', error);
    res.status(500).json({ error: 'Failed to fetch revenue report' });
  }
});

app.get('/api/admin/reports/users', checkAdminAccess, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let report = {
      totalUsers: users.size,
      newUsers: 0,
      activeUsers: 0,
      subscriptionDistribution: {}
    };
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      let query = `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN created_at >= $1 THEN 1 END) as new_users
        FROM users`;
      
      const params = [startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()];
      if (endDate) {
        query += ` WHERE created_at <= $2`;
        params.push(endDate);
      }
      
      const userResult = await db.db.query(query, params);
      report.newUsers = parseInt(userResult.rows[0].new_users);
      
      const subResult = await db.db.query(
        `SELECT plan_id, COUNT(*) as count 
         FROM user_subscriptions 
         WHERE status = 'active' 
         GROUP BY plan_id`
      );
      subResult.rows.forEach(row => {
        report.subscriptionDistribution[row.plan_id] = parseInt(row.count);
      });
    }
    
    res.json(report);
  } catch (error) {
    logger.error('Error fetching user report:', error);
    res.status(500).json({ error: 'Failed to fetch user report' });
  }
});

// 5. SYSTEM HEALTH MONITORING
app.get('/api/admin/system/health', checkAdminAccess, async (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    // Use RSS (Resident Set Size) for more accurate memory reporting
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    
    // Calculate percentage based on heap usage (more accurate than RSS)
    // Heap usage > 90% is concerning, but RSS can be higher normally
    const heapPercentage = heapTotalMB > 0 ? ((heapUsedMB / heapTotalMB) * 100).toFixed(1) : 0;
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: heapUsedMB,
        total: heapTotalMB,
        rss: rssMB, // Total memory used by process
        available: heapTotalMB - heapUsedMB
      },
      database: {
        connected: false,
        status: 'using_in_memory',
        type: db.dbType || 'in-memory'
      },
      activeRooms: rooms.size,
      activeUsers: users.size,
      activeSubscriptions: 0
    };
    
    // Check database connection based on type
    if (db.useDatabase) {
      if (db.dbType === 'supabase' && db.db) {
        // Test Supabase connection
        try {
          const { error } = await db.db.from('rooms').select('id').limit(1);
          if (!error) {
            health.database.connected = true;
            health.database.status = 'connected';
            
            // Try to get subscription count
            try {
              const { count, error: countError } = await db.db.from('user_subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');
              if (!countError && count !== null) {
                health.activeSubscriptions = count;
              }
            } catch (e) {
              // Subscription table might not exist, ignore
            }
          } else {
            health.database.status = 'error';
            health.database.error = error.message;
          }
        } catch (error) {
          health.database.status = 'error';
          health.database.error = error.message;
        }
      } else if (db.db && db.db.constructor.name === 'Pool') {
        // PostgreSQL connection pool
        try {
          await db.db.query('SELECT 1');
          health.database.connected = true;
          health.database.status = 'connected';
          
          const subResult = await db.db.query(
            'SELECT COUNT(*) as count FROM user_subscriptions WHERE status = $1',
            ['active']
          );
          health.activeSubscriptions = parseInt(subResult.rows[0].count);
        } catch (dbError) {
          health.database.status = 'error';
          health.database.error = dbError.message;
        }
      } else if (db.db && db.db.constructor.name === 'MongoClient') {
        // MongoDB connection
        try {
          await db.db.db().admin().ping();
          health.database.connected = true;
          health.database.status = 'connected';
        } catch (dbError) {
          health.database.status = 'error';
          health.database.error = dbError.message;
        }
      }
    }
    
    res.json(health);
  } catch (error) {
    logger.error('Error fetching system health:', error);
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
});

// 6. EMAIL TEMPLATES
const emailTemplates = new Map();

app.get('/api/admin/email-templates', checkAdminAccess, async (req, res) => {
  try {
    let templates = [];
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const result = await db.db.query('SELECT * FROM email_templates ORDER BY created_at DESC');
      templates = result.rows;
    } else {
      templates = Array.from(emailTemplates.values());
    }
    
    res.json(templates);
  } catch (error) {
    logger.error('Error fetching email templates:', error);
    res.status(500).json({ error: 'Failed to fetch email templates' });
  }
});

app.post('/api/admin/email-templates', checkAdminAccess, async (req, res) => {
  try {
    const { name, subject, body, type } = req.body;
    
    const template = {
      name,
      subject,
      body,
      type: type || 'general',
      active: true,
      createdAt: new Date()
    };
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      await db.db.query(
        `INSERT INTO email_templates (name, subject, body, type, active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (name) DO UPDATE SET
         subject = EXCLUDED.subject,
         body = EXCLUDED.body,
         type = EXCLUDED.type,
         active = EXCLUDED.active,
         updated_at = NOW()`,
        [template.name, template.subject, template.body, template.type, template.active, template.createdAt]
      );
    } else {
      emailTemplates.set(name, template);
    }
    
    res.json({ success: true, template });
  } catch (error) {
    logger.error('Error creating email template:', error);
    res.status(500).json({ error: 'Failed to create email template' });
  }
});

app.post('/api/admin/email/send', checkAdminAccess, async (req, res) => {
  try {
    const { to, subject, body, templateId } = req.body;
    const emailService = require('./utils/emailService');
    
    // Send email using email service
    await emailService.sendEmail(to, subject, body);
    
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    logger.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// 7. CONTENT MANAGEMENT
const contentItems = new Map();

app.get('/api/admin/content', checkAdminAccess, async (req, res) => {
  try {
    let items = [];
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const type = req.query.type;
      let query = 'SELECT * FROM content_items';
      const params = [];
      
      if (type) {
        query += ' WHERE type = $1';
        params.push(type);
      }
      
      query += ' ORDER BY created_at DESC';
      const result = await db.db.query(query, params);
      items = result.rows;
    } else {
      items = Array.from(contentItems.values());
      if (req.query.type) {
        items = items.filter(item => item.type === req.query.type);
      }
    }
    
    res.json(items);
  } catch (error) {
    logger.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

app.post('/api/admin/content', checkAdminAccess, async (req, res) => {
  try {
    const { type, title, content, slug, published } = req.body;
    
    const item = {
      type,
      title,
      content,
      slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
      published: published || false,
      author: req.adminEmail,
      createdAt: new Date()
    };
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      await db.db.query(
        `INSERT INTO content_items (type, title, content, slug, published, author, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         content = EXCLUDED.content,
         published = EXCLUDED.published,
         updated_at = NOW()`,
        [item.type, item.title, item.content, item.slug, item.published, item.author, item.createdAt]
      );
    } else {
      contentItems.set(item.slug, item);
    }
    
    res.json({ success: true, item });
  } catch (error) {
    logger.error('Error creating content:', error);
    res.status(500).json({ error: 'Failed to create content' });
  }
});

// 8. FEATURE FLAGS
const featureFlags = new Map();

app.get('/api/admin/feature-flags', checkAdminAccess, async (req, res) => {
  try {
    let flags = [];
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const result = await db.db.query('SELECT * FROM feature_flags ORDER BY created_at DESC');
      flags = result.rows;
    } else {
      flags = Array.from(featureFlags.values());
    }
    
    res.json(flags);
  } catch (error) {
    logger.error('Error fetching feature flags:', error);
    res.status(500).json({ error: 'Failed to fetch feature flags' });
  }
});

app.post('/api/admin/feature-flags', checkAdminAccess, async (req, res) => {
  try {
    const { name, description, enabled, targetUsers, targetPercentage } = req.body;
    
    const flag = {
      name,
      description: description || '',
      enabled: enabled || false,
      targetUsers: targetUsers || [],
      targetPercentage: targetPercentage || 100,
      createdAt: new Date()
    };
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      await db.db.query(
        `INSERT INTO feature_flags (name, description, enabled, target_users, target_percentage, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (name) DO UPDATE SET
         description = EXCLUDED.description,
         enabled = EXCLUDED.enabled,
         target_users = EXCLUDED.target_users,
         target_percentage = EXCLUDED.target_percentage,
         updated_at = NOW()`,
        [flag.name, flag.description, flag.enabled, JSON.stringify(flag.targetUsers), flag.targetPercentage, flag.createdAt]
      );
    } else {
      featureFlags.set(name, flag);
    }
    
    res.json({ success: true, flag });
  } catch (error) {
    logger.error('Error creating feature flag:', error);
    res.status(500).json({ error: 'Failed to create feature flag' });
  }
});

// 9. API KEYS MANAGEMENT
const apiKeys = new Map();

app.get('/api/admin/api-keys', checkAdminAccess, async (req, res) => {
  try {
    let keys = [];
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const result = await db.db.query('SELECT id, key_name, user_id, rate_limit, permissions, active, last_used, created_at, expires_at FROM api_keys ORDER BY created_at DESC');
      keys = result.rows.map(row => ({
        ...row,
        apiKey: '***' + row.api_key?.substring(row.api_key.length - 4) // Mask key
      }));
    } else {
      keys = Array.from(apiKeys.values()).map(key => ({
        ...key,
        apiKey: '***' + key.apiKey?.substring(key.apiKey.length - 4)
      }));
    }
    
    res.json(keys);
  } catch (error) {
    logger.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

app.post('/api/admin/api-keys', checkAdminAccess, async (req, res) => {
  try {
    const { keyName, userId, rateLimit, permissions } = req.body;
    const crypto = require('crypto');
    const apiKey = `mtz_${crypto.randomBytes(32).toString('hex')}`;
    
    const key = {
      keyName,
      apiKey,
      userId: userId || null,
      rateLimit: rateLimit || 1000,
      permissions: permissions || {},
      active: true,
      createdAt: new Date()
    };
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      await db.db.query(
        `INSERT INTO api_keys (key_name, api_key, user_id, rate_limit, permissions, active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [key.keyName, key.apiKey, key.userId, key.rateLimit, JSON.stringify(key.permissions), key.active, key.createdAt]
      );
    } else {
      apiKeys.set(apiKey, key);
    }
    
    res.json({ success: true, apiKey, key: { ...key, apiKey } });
  } catch (error) {
    logger.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// 10. SUPPORT TICKETS
const supportTickets = new Map();
const ticketMessages = new Map();

app.get('/api/admin/support-tickets', checkAdminAccess, async (req, res) => {
  try {
    let tickets = [];
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const status = req.query.status;
      let query = 'SELECT * FROM support_tickets';
      const params = [];
      
      if (status) {
        query += ' WHERE status = $1';
        params.push(status);
      }
      
      query += ' ORDER BY created_at DESC';
      const result = await db.db.query(query, params);
      tickets = result.rows;
    } else {
      tickets = Array.from(supportTickets.values());
      if (req.query.status) {
        tickets = tickets.filter(t => t.status === req.query.status);
      }
    }
    
    res.json(tickets);
  } catch (error) {
    logger.error('Error fetching support tickets:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

app.post('/api/admin/support-tickets/:ticketId/messages', checkAdminAccess, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    
    const ticketMessage = {
      ticketId: parseInt(ticketId),
      userId: req.adminEmail,
      message,
      isAdmin: true,
      createdAt: new Date()
    };
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      await db.db.query(
        `INSERT INTO ticket_messages (ticket_id, user_id, message, is_admin, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [ticketMessage.ticketId, ticketMessage.userId, ticketMessage.message, ticketMessage.isAdmin, ticketMessage.createdAt]
      );
      
      // Update ticket status
      await db.db.query(
        `UPDATE support_tickets SET status = $1, updated_at = NOW() WHERE id = $2`,
        ['in_progress', ticketId]
      );
    } else {
      if (!ticketMessages.has(ticketId)) {
        ticketMessages.set(ticketId, []);
      }
      ticketMessages.get(ticketId).push(ticketMessage);
      
      const ticket = supportTickets.get(ticketId);
      if (ticket) {
        ticket.status = 'in_progress';
        supportTickets.set(ticketId, ticket);
      }
    }
    
    res.json({ success: true, message: ticketMessage });
  } catch (error) {
    logger.error('Error adding ticket message:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

app.put('/api/admin/support-tickets/:ticketId', checkAdminAccess, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, priority, assignedTo } = req.body;
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      await db.db.query(
        `UPDATE support_tickets SET 
         status = COALESCE($1, status),
         priority = COALESCE($2, priority),
         assigned_to = COALESCE($3, assigned_to),
         updated_at = NOW(),
         resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE resolved_at END
         WHERE id = $4`,
        [status, priority, assignedTo, ticketId]
      );
    } else {
      const ticket = supportTickets.get(parseInt(ticketId));
      if (ticket) {
        if (status) ticket.status = status;
        if (priority) ticket.priority = priority;
        if (assignedTo) ticket.assignedTo = assignedTo;
        if (status === 'resolved') ticket.resolvedAt = new Date();
        supportTickets.set(parseInt(ticketId), ticket);
      }
    }
    
    res.json({ success: true, message: 'Ticket updated successfully' });
  } catch (error) {
    logger.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// 11. BACKUP & RESTORE
app.post('/api/admin/backup/create', checkAdminAccess, async (req, res) => {
  try {
    const { backupType = 'full' } = req.body;
    const backupId = `backup_${Date.now()}`;
    
    const backupRecord = {
      backupType,
      filePath: `/backups/${backupId}.json`,
      fileSize: 0,
      status: 'pending',
      createdBy: req.adminEmail,
      createdAt: new Date()
    };
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      await db.db.query(
        `INSERT INTO backup_records (backup_type, file_path, status, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [backupRecord.backupType, backupRecord.filePath, backupRecord.status, backupRecord.createdBy, backupRecord.createdAt]
      );
    }
    
    // In a real implementation, you would actually create the backup file here
    // For now, we'll just return success
    
    res.json({ success: true, backupId, message: 'Backup initiated' });
  } catch (error) {
    logger.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

app.get('/api/admin/backup/list', checkAdminAccess, async (req, res) => {
  try {
    let backups = [];
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const result = await db.db.query('SELECT * FROM backup_records ORDER BY created_at DESC LIMIT 50');
      backups = result.rows;
    }
    
    res.json(backups);
  } catch (error) {
    logger.error('Error fetching backups:', error);
    res.status(500).json({ error: 'Failed to fetch backups' });
  }
});

// 12. SYSTEM SETTINGS
const systemSettings = new Map();

app.get('/api/admin/settings', checkAdminAccess, async (req, res) => {
  try {
    let settings = {};
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const result = await db.db.query('SELECT * FROM system_settings');
      result.rows.forEach(row => {
        settings[row.setting_key] = {
          value: row.setting_value,
          type: row.setting_type,
          category: row.category,
          description: row.description
        };
      });
    } else {
      settings = Object.fromEntries(systemSettings);
    }
    
    res.json(settings);
  } catch (error) {
    logger.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/admin/settings/:key', checkAdminAccess, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, type, category, description } = req.body;
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      await db.db.query(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (setting_key) DO UPDATE SET
         setting_value = EXCLUDED.setting_value,
         setting_type = COALESCE(EXCLUDED.setting_type, system_settings.setting_type),
         category = COALESCE(EXCLUDED.category, system_settings.category),
         description = COALESCE(EXCLUDED.description, system_settings.description),
         updated_at = NOW()`,
        [key, value, type || 'string', category, description]
      );
    } else {
      systemSettings.set(key, { value, type: type || 'string', category, description });
    }
    
    res.json({ success: true, message: 'Setting updated successfully' });
  } catch (error) {
    logger.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// 13. BULK OPERATIONS
app.post('/api/admin/bulk/users/action', checkAdminAccess, async (req, res) => {
  try {
    const { userIds, action, data } = req.body;
    const results = { success: [], failed: [] };
    
    for (const userId of userIds) {
      try {
        if (action === 'approve') {
          const user = Array.from(users.values()).find(u => u.userId === userId);
          if (user) {
            user.status = 'approved';
            results.success.push(userId);
          }
        } else if (action === 'suspend') {
          const user = Array.from(users.values()).find(u => u.userId === userId);
          if (user) {
            user.status = 'suspended';
            results.success.push(userId);
          }
        } else if (action === 'grant-premium') {
          const subscriptionService = require('./utils/subscriptionService');
          await subscriptionService.grantPremiumSubscription(userId);
          results.success.push(userId);
        }
      } catch (error) {
        results.failed.push({ userId, error: error.message });
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    logger.error('Error performing bulk action:', error);
    res.status(500).json({ error: 'Failed to perform bulk action' });
  }
});

app.post('/api/admin/bulk/email/send', checkAdminAccess, async (req, res) => {
  try {
    const { userIds, subject, body } = req.body;
    const emailService = require('./utils/emailService');
    const results = { sent: [], failed: [] };
    
    for (const userId of userIds) {
      try {
        const user = Array.from(users.values()).find(u => u.userId === userId);
        if (user && user.email) {
          await emailService.sendEmail(user.email, subject, body);
          results.sent.push(userId);
        }
      } catch (error) {
        results.failed.push({ userId, error: error.message });
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    logger.error('Error sending bulk emails:', error);
    res.status(500).json({ error: 'Failed to send bulk emails' });
  }
});

// 14. ADVANCED ANALYTICS
app.get('/api/admin/analytics/advanced', checkAdminAccess, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const analytics = {
      revenue: {
        daily: [],
        monthly: [],
        total: 0
      },
      users: {
        growth: [],
        retention: 0,
        churn: 0
      },
      meetings: {
        averageDuration: 0,
        peakHours: [],
        popularDays: []
      },
      conversions: {
        freeToPaid: 0,
        trialToPaid: 0
      }
    };
    
    // Calculate revenue
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const revenueResult = await db.db.query(
        `SELECT 
          DATE(created_at) as date,
          SUM(
            CASE plan_id
              WHEN 'free' THEN 0
              WHEN 'basic' THEN 1.99
              WHEN 'pro' THEN 4.99
              WHEN 'yearly' THEN 50
              ELSE 0
            END
          ) as daily_revenue
         FROM user_subscriptions
         WHERE status = 'active' AND created_at >= $1
         GROUP BY DATE(created_at)
         ORDER BY date DESC`,
        [startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()]
      );
      
      analytics.revenue.daily = revenueResult.rows;
      analytics.revenue.total = revenueResult.rows.reduce((sum, row) => sum + parseFloat(row.daily_revenue || 0), 0);
    }
    
    res.json(analytics);
  } catch (error) {
    logger.error('Error fetching advanced analytics:', error);
    res.status(500).json({ error: 'Failed to fetch advanced analytics' });
  }
});

// 15. ROLE MANAGEMENT
const adminRoles = new Map();
const userRoles = new Map();

app.get('/api/admin/roles', checkAdminAccess, async (req, res) => {
  try {
    let roles = [];
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const result = await db.db.query('SELECT * FROM admin_roles ORDER BY created_at DESC');
      roles = result.rows;
    } else {
      roles = Array.from(adminRoles.values());
    }
    
    res.json(roles);
  } catch (error) {
    logger.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

app.post('/api/admin/roles', checkAdminAccess, async (req, res) => {
  try {
    const { roleName, permissions, description } = req.body;
    
    const role = {
      roleName,
      permissions: permissions || {},
      description: description || '',
      createdAt: new Date()
    };
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      await db.db.query(
        `INSERT INTO admin_roles (role_name, permissions, description, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (role_name) DO UPDATE SET
         permissions = EXCLUDED.permissions,
         description = EXCLUDED.description,
         updated_at = NOW()`,
        [role.roleName, JSON.stringify(role.permissions), role.description, role.createdAt]
      );
    } else {
      adminRoles.set(roleName, role);
    }
    
    res.json({ success: true, role });
  } catch (error) {
    logger.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

app.post('/api/admin/roles/assign', checkAdminAccess, async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      await db.db.query(
        `INSERT INTO user_admin_roles (user_id, role_id, assigned_by, assigned_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, role_id) DO NOTHING`,
        [userId, roleId, req.adminEmail]
      );
    } else {
      const key = `${userId}_${roleId}`;
      userRoles.set(key, { userId, roleId, assignedBy: req.adminEmail, assignedAt: new Date() });
    }
    
    res.json({ success: true, message: 'Role assigned successfully' });
  } catch (error) {
    logger.error('Error assigning role:', error);
    res.status(500).json({ error: 'Failed to assign role' });
  }
});

// 16. CUSTOMER CALL CENTER & SERVICE
const customerServiceCalls = new Map();
const customerExperience = new Map();
const callCenterAgents = new Map();

// ============================================
// WEBHOOK ENDPOINTS FOR AUTOMATIC CALL DETECTION
// ============================================

// Webhook endpoint for incoming calls (Twilio, etc.)
app.post('/api/webhooks/call/incoming', async (req, res) => {
  try {
    const { 
      CallSid, 
      From, 
      To, 
      CallStatus, 
      Direction,
      CallDuration,
      RecordingUrl,
      // Custom fields
      userId,
      userEmail,
      subject,
      description,
      priority 
    } = req.body;

    // Create call record automatically
    const callId = CallSid || `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const call = {
      callId,
      userId: userId || From,
      userEmail: userEmail || `user_${From}@unknown.com`,
      agentId: null,
      agentName: null,
      callType: Direction === 'inbound' ? 'inbound' : 'outbound',
      status: CallStatus === 'ringing' || CallStatus === 'in-progress' ? 'in_progress' : 'pending',
      priority: priority || (CallStatus === 'ringing' ? 'high' : 'medium'),
      subject: subject || `Call from ${From}`,
      description: description || `Incoming call from ${From} to ${To}. Duration: ${CallDuration || 0} seconds.${RecordingUrl ? ` Recording: ${RecordingUrl}` : ''}`,
      duration: CallDuration ? Math.round(CallDuration / 60) : 0,
      createdAt: new Date(),
      phoneNumber: From,
      callSid: CallSid,
      recordingUrl: RecordingUrl || null
    };

    // Save to database
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      await db.db.query(
        `INSERT INTO customer_service_calls 
         (call_id, user_id, user_email, agent_id, agent_name, call_type, status, priority, subject, description, duration, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (call_id) DO UPDATE SET
         status = EXCLUDED.status,
         duration = EXCLUDED.duration`,
        [
          call.callId,
          call.userId,
          call.userEmail,
          call.agentId,
          call.agentName,
          call.callType,
          call.status,
          call.priority,
          call.subject,
          call.description,
          call.duration,
          call.createdAt
        ]
      );
    } else {
      customerServiceCalls.set(callId, call);
    }

    // Emit real-time notification to all connected admin clients
    io.emit('new-call', {
      call,
      message: `New ${call.callType} call from ${From}`,
      timestamp: new Date()
    });

    // Log activity
    await activityLogger.logActivity(
      'system',
      'system@callcenter',
      'call_received',
      'customer_service_call',
      callId,
      { 
        phoneNumber: From,
        callType: call.callType,
        status: call.status 
      }
    );

    // Return Twilio-compatible response (if using Twilio)
    res.type('text/xml');
    res.send(`
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say>Thank you for calling. Please hold while we connect you to an agent.</Say>
        <Dial>
          <Queue>support</Queue>
        </Dial>
      </Response>
    `);
  } catch (error) {
    logger.error('Error processing incoming call webhook:', error);
    res.status(500).json({ error: 'Failed to process call webhook' });
  }
});

// Webhook for call status updates (completed, ended, etc.)
app.post('/api/webhooks/call/status', async (req, res) => {
  try {
    const { CallSid, CallStatus, CallDuration, RecordingUrl } = req.body;

    if (!CallSid) {
      return res.status(400).json({ error: 'CallSid is required' });
    }

    let status = 'pending';
    if (CallStatus === 'completed') {
      status = 'resolved';
    } else if (CallStatus === 'busy' || CallStatus === 'no-answer' || CallStatus === 'failed') {
      status = 'closed';
    } else if (CallStatus === 'in-progress') {
      status = 'in_progress';
    }

    const duration = CallDuration ? Math.round(CallDuration / 60) : 0;

    // Update call in database
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      await db.db.query(
        `UPDATE customer_service_calls SET 
         status = $1,
         duration = $2,
         ended_at = CASE WHEN $1 IN ('resolved', 'closed') THEN NOW() ELSE ended_at END,
         resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE resolved_at END
         WHERE call_id = $3`,
        [status, duration, CallSid]
      );
    } else {
      const call = customerServiceCalls.get(CallSid);
      if (call) {
        call.status = status;
        call.duration = duration;
        if (status === 'resolved' || status === 'closed') {
          call.endedAt = new Date();
        }
        if (status === 'resolved') {
          call.resolvedAt = new Date();
        }
        customerServiceCalls.set(CallSid, call);
      }
    }

    // Emit real-time update
    io.emit('call-status-updated', {
      callId: CallSid,
      status,
      duration,
      timestamp: new Date()
    });

    res.json({ success: true, status, duration });
  } catch (error) {
    logger.error('Error processing call status webhook:', error);
    res.status(500).json({ error: 'Failed to process call status webhook' });
  }
});

// Public endpoint for customers to create support requests (can be called from frontend)
app.post('/api/customer/support-request', async (req, res) => {
  try {
    const { userId, userEmail, subject, description, priority, phoneNumber } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const call = {
      callId,
      userId: userId || `user_${Date.now()}`,
      userEmail: userEmail || 'anonymous@example.com',
      agentId: null,
      agentName: null,
      callType: 'inbound',
      status: 'pending',
      priority: priority || 'medium',
      subject,
      description,
      duration: 0,
      phoneNumber: phoneNumber || null,
      createdAt: new Date()
    };

    // Save to database
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      await db.db.query(
        `INSERT INTO customer_service_calls 
         (call_id, user_id, user_email, agent_id, agent_name, call_type, status, priority, subject, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          call.callId,
          call.userId,
          call.userEmail,
          call.agentId,
          call.agentName,
          call.callType,
          call.status,
          call.priority,
          call.subject,
          call.description,
          call.createdAt
        ]
      );
    } else {
      customerServiceCalls.set(callId, call);
    }

    // Emit real-time notification
    io.emit('new-support-request', {
      call,
      message: `New support request: ${subject}`,
      timestamp: new Date()
    });

    // Log activity
    await activityLogger.logActivity(
      call.userId,
      call.userEmail,
      'support_request_created',
      'customer_service_call',
      callId,
      { subject, priority }
    );

    res.json({ 
      success: true, 
      callId,
      message: 'Support request created successfully. An agent will contact you soon.' 
    });
  } catch (error) {
    logger.error('Error creating support request:', error);
    res.status(500).json({ error: 'Failed to create support request' });
  }
});

// Get all customer service calls
app.get('/api/admin/customer-service/calls', checkAdminAccess, async (req, res) => {
  try {
    let calls = [];
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const status = req.query.status;
      let query = 'SELECT * FROM customer_service_calls';
      const params = [];
      
      if (status) {
        query += ' WHERE status = $1';
        params.push(status);
      }
      
      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
      params.push(parseInt(req.query.limit) || 1000);
      
      const result = await db.db.query(query, params);
      calls = result.rows;
    } else {
      calls = Array.from(customerServiceCalls.values());
      if (req.query.status) {
        calls = calls.filter(c => c.status === req.query.status);
      }
    }
    
    res.json(calls);
  } catch (error) {
    logger.error('Error fetching customer service calls:', error);
    res.status(500).json({ error: 'Failed to fetch customer service calls' });
  }
});

// Create customer service call
app.post('/api/admin/customer-service/calls', checkAdminAccess, async (req, res) => {
  try {
    const { userId, userEmail, agentId, agentName, callType, priority, subject, description } = req.body;
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const call = {
      callId,
      userId,
      userEmail,
      agentId: agentId || null,
      agentName: agentName || null,
      callType: callType || 'inbound',
      status: 'pending',
      priority: priority || 'medium',
      subject,
      description,
      duration: 0,
      createdAt: new Date()
    };
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      await db.db.query(
        `INSERT INTO customer_service_calls 
         (call_id, user_id, user_email, agent_id, agent_name, call_type, status, priority, subject, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          call.callId,
          call.userId,
          call.userEmail,
          call.agentId,
          call.agentName,
          call.callType,
          call.status,
          call.priority,
          call.subject,
          call.description,
          call.createdAt
        ]
      );
    } else {
      customerServiceCalls.set(callId, call);
    }
    
    res.json({ success: true, call });
  } catch (error) {
    logger.error('Error creating customer service call:', error);
    res.status(500).json({ error: 'Failed to create customer service call' });
  }
});

// Update customer service call
app.put('/api/admin/customer-service/calls/:callId', checkAdminAccess, async (req, res) => {
  try {
    const { callId } = req.params;
    const { status, agentId, agentName, resolution, rating, feedback, duration } = req.body;
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      await db.db.query(
        `UPDATE customer_service_calls SET 
         status = COALESCE($1, status),
         agent_id = COALESCE($2, agent_id),
         agent_name = COALESCE($3, agent_name),
         resolution = COALESCE($4, resolution),
         rating = COALESCE($5, rating),
         feedback = COALESCE($6, feedback),
         duration = COALESCE($7, duration),
         started_at = CASE WHEN $1 = 'in_progress' AND started_at IS NULL THEN NOW() ELSE started_at END,
         ended_at = CASE WHEN $1 IN ('resolved', 'closed') AND ended_at IS NULL THEN NOW() ELSE ended_at END,
         resolved_at = CASE WHEN $1 = 'resolved' AND resolved_at IS NULL THEN NOW() ELSE resolved_at END
         WHERE call_id = $8`,
        [status, agentId, agentName, resolution, rating, feedback, duration, callId]
      );
    } else {
      const call = customerServiceCalls.get(callId);
      if (call) {
        if (status) call.status = status;
        if (agentId) call.agentId = agentId;
        if (agentName) call.agentName = agentName;
        if (resolution) call.resolution = resolution;
        if (rating) call.rating = rating;
        if (feedback) call.feedback = feedback;
        if (duration) call.duration = duration;
        if (status === 'in_progress' && !call.startedAt) call.startedAt = new Date();
        if (status === 'resolved' && !call.resolvedAt) call.resolvedAt = new Date();
        customerServiceCalls.set(callId, call);
      }
    }
    
    res.json({ success: true, message: 'Call updated successfully' });
  } catch (error) {
    logger.error('Error updating customer service call:', error);
    res.status(500).json({ error: 'Failed to update call' });
  }
});

// Get customer experience metrics
app.get('/api/admin/customer-service/experience', checkAdminAccess, async (req, res) => {
  try {
    let experiences = [];
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const result = await db.db.query(
        `SELECT * FROM customer_experience ORDER BY created_at DESC LIMIT $1`,
        [parseInt(req.query.limit) || 1000]
      );
      experiences = result.rows;
      
      // Calculate aggregate metrics
      const metricsResult = await db.db.query(
        `SELECT 
          AVG(satisfaction_score) as avg_satisfaction,
          AVG(nps_score) as avg_nps,
          AVG(csat_score) as avg_csat,
          COUNT(*) as total_interactions
         FROM customer_experience`
      );
      
      const metrics = metricsResult.rows[0] || {};
      
      res.json({ experiences, metrics });
    } else {
      experiences = Array.from(customerExperience.values());
      const metrics = {
        avgSatisfaction: experiences.length > 0 
          ? experiences.reduce((sum, e) => sum + (e.satisfactionScore || 0), 0) / experiences.length 
          : 0,
        avgNps: experiences.length > 0
          ? experiences.reduce((sum, e) => sum + (e.npsScore || 0), 0) / experiences.length
          : 0,
        avgCsat: experiences.length > 0
          ? experiences.reduce((sum, e) => sum + (e.csatScore || 0), 0) / experiences.length
          : 0,
        totalInteractions: experiences.length
      };
      
      res.json({ experiences, metrics });
    }
  } catch (error) {
    logger.error('Error fetching customer experience:', error);
    res.status(500).json({ error: 'Failed to fetch customer experience' });
  }
});

// Create customer experience record
app.post('/api/admin/customer-service/experience', checkAdminAccess, async (req, res) => {
  try {
    const { userId, callId, interactionType, satisfactionScore, npsScore, csatScore, feedback, tags, agentId } = req.body;
    
    const experience = {
      userId,
      callId: callId || null,
      interactionType: interactionType || 'call',
      satisfactionScore: satisfactionScore || null,
      npsScore: npsScore || null,
      csatScore: csatScore || null,
      feedback: feedback || null,
      tags: tags || [],
      agentId: agentId || null,
      createdAt: new Date()
    };
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      await db.db.query(
        `INSERT INTO customer_experience 
         (user_id, call_id, interaction_type, satisfaction_score, nps_score, csat_score, feedback, tags, agent_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          experience.userId,
          experience.callId,
          experience.interactionType,
          experience.satisfactionScore,
          experience.npsScore,
          experience.csatScore,
          experience.feedback,
          JSON.stringify(experience.tags),
          experience.agentId,
          experience.createdAt
        ]
      );
    } else {
      const expId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      customerExperience.set(expId, { ...experience, id: expId });
    }
    
    res.json({ success: true, experience });
  } catch (error) {
    logger.error('Error creating customer experience:', error);
    res.status(500).json({ error: 'Failed to create customer experience record' });
  }
});

// Get call center agents
app.get('/api/admin/call-center/agents', checkAdminAccess, async (req, res) => {
  try {
    let agents = [];
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const result = await db.db.query('SELECT * FROM call_center_agents ORDER BY created_at DESC');
      agents = result.rows;
    } else {
      agents = Array.from(callCenterAgents.values());
    }
    
    res.json(agents);
  } catch (error) {
    logger.error('Error fetching call center agents:', error);
    res.status(500).json({ error: 'Failed to fetch call center agents' });
  }
});

// Create call center agent
app.post('/api/admin/call-center/agents', checkAdminAccess, async (req, res) => {
  try {
    const { agentId, name, email, phone, department, status } = req.body;
    
    const agent = {
      agentId: agentId || `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      phone: phone || null,
      department: department || 'support',
      status: status || 'active',
      totalCalls: 0,
      avgRating: 0,
      createdAt: new Date()
    };
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      await db.db.query(
        `INSERT INTO call_center_agents 
         (agent_id, name, email, phone, department, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (agent_id) DO UPDATE SET
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         department = EXCLUDED.department,
         status = EXCLUDED.status,
         updated_at = NOW()`,
        [agent.agentId, agent.name, agent.email, agent.phone, agent.department, agent.status, agent.createdAt]
      );
    } else {
      callCenterAgents.set(agent.agentId, agent);
    }
    
    res.json({ success: true, agent });
  } catch (error) {
    logger.error('Error creating call center agent:', error);
    res.status(500).json({ error: 'Failed to create call center agent' });
  }
});

// Get call center stats
app.get('/api/admin/call-center/stats', checkAdminAccess, async (req, res) => {
  try {
    let stats = {
      totalCalls: 0,
      activeCalls: 0,
      resolvedCalls: 0,
      avgCallDuration: 0,
      avgRating: 0,
      totalAgents: 0,
      activeAgents: 0
    };
    
    if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
      const callsResult = await db.db.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
          AVG(duration) as avg_duration,
          AVG(rating) as avg_rating
         FROM customer_service_calls`
      );
      
      const agentsResult = await db.db.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active
         FROM call_center_agents`
      );
      
      const callsData = callsResult.rows[0];
      const agentsData = agentsResult.rows[0];
      
      stats = {
        totalCalls: parseInt(callsData.total) || 0,
        activeCalls: parseInt(callsData.active) || 0,
        resolvedCalls: parseInt(callsData.resolved) || 0,
        avgCallDuration: parseFloat(callsData.avg_duration) || 0,
        avgRating: parseFloat(callsData.avg_rating) || 0,
        totalAgents: parseInt(agentsData.total) || 0,
        activeAgents: parseInt(agentsData.active) || 0
      };
    } else {
      stats.totalCalls = customerServiceCalls.size;
      stats.activeCalls = Array.from(customerServiceCalls.values()).filter(c => c.status === 'in_progress').length;
      stats.resolvedCalls = Array.from(customerServiceCalls.values()).filter(c => c.status === 'resolved').length;
      stats.totalAgents = callCenterAgents.size;
      stats.activeAgents = Array.from(callCenterAgents.values()).filter(a => a.status === 'active').length;
    }
    
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching call center stats:', error);
    res.status(500).json({ error: 'Failed to fetch call center stats' });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info('User connected', { socketId: socket.id, ip: socket.handshake.address });

  // ============================================
  // CALL CENTER REAL-TIME EVENT HANDLERS
  // ============================================
  
  // Join admin room for call notifications
  socket.on('join-call-center', (data) => {
    const userEmail = data.userEmail;
    if (userEmail === SUPER_ADMIN_EMAIL) {
      socket.join('call-center-admin');
      logger.info('Admin joined call center room:', userEmail);
    }
  });

  // Handle agent assignment via socket
  socket.on('assign-call-to-agent', async (data) => {
    const { callId, agentId, agentName } = data;
    
    try {
      if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
        await db.db.query(
          `UPDATE customer_service_calls SET 
           agent_id = $1,
           agent_name = $2,
           status = 'in_progress',
           started_at = CASE WHEN started_at IS NULL THEN NOW() ELSE started_at END
           WHERE call_id = $3`,
          [agentId, agentName, callId]
        );
      } else {
        const call = customerServiceCalls.get(callId);
        if (call) {
          call.agentId = agentId;
          call.agentName = agentName;
          call.status = 'in_progress';
          if (!call.startedAt) call.startedAt = new Date();
          customerServiceCalls.set(callId, call);
        }
      }

      // Notify all admins
      io.to('call-center-admin').emit('call-assigned', {
        callId,
        agentId,
        agentName,
        timestamp: new Date()
      });

      // Notify the specific agent if they're connected
      socket.to(`agent-${agentId}`).emit('call-assigned-to-you', {
        callId,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error assigning call:', error);
      socket.emit('error', { message: 'Failed to assign call' });
    }
  });

  socket.on('join-room', (data) => {
    const { roomId, userId, userName, password } = data;
    
    // Validate inputs
    if (!validateRoomId(roomId)) {
      logger.warn('Invalid room ID provided', { roomId, socketId: socket.id });
      socket.emit('room-error', { message: 'Invalid room ID format' });
      return;
    }
    
    if (!validateUserName(userName)) {
      logger.warn('Invalid user name provided', { userName, socketId: socket.id });
      socket.emit('room-error', { message: 'Invalid user name' });
      return;
    }
    
    const sanitizedUserName = sanitizeString(userName, 50);
    const sanitizedPassword = password ? sanitizeString(password, 50) : null;
    
    if (!rooms.has(roomId)) {
      logger.warn('Room not found', { roomId, socketId: socket.id });
      socket.emit('room-error', { message: 'Room not found' });
      return;
    }

    const room = rooms.get(roomId);
    
    // Check password if room has one
    if (room.password && room.password !== sanitizedPassword) {
      logger.warn('Incorrect password for room', { roomId, socketId: socket.id });
      socket.emit('room-error', { message: 'Incorrect password' });
      return;
    }

    // Check waiting room setting (only after first participant has joined)
    // If there's a mainHost, all subsequent non-host users go to waiting room
    const requiresApproval = room.mainHost && !isHostOrModerator(room, userId);
    if (requiresApproval) {
      // Add to waiting room
      const waitingParticipant = {
        id: userId,
        socketId: socket.id,
        userName: userName || `User ${userId.substring(0, 8)}`,
        joinedAt: new Date()
      };
      room.waitingRoom.push(waitingParticipant);
      rooms.set(roomId, room);
      
      socket.emit('waiting-room', { message: 'Waiting for host approval' });
      
      // Notify hosts and moderators in the room
      // Emit to all sockets in the room - clients will filter based on host/moderator status
      io.to(roomId).emit('waiting-room-request', waitingParticipant);
      
      // Also notify hosts/moderators directly via their participant socketIds
      room.participants.forEach(participant => {
        if (participant.id === room.mainHost || (room.moderators && room.moderators.includes(participant.id))) {
          const hostSocket = io.sockets.sockets.get(participant.socketId);
          if (hostSocket) {
            hostSocket.emit('waiting-room-request', waitingParticipant);
          }
        }
      });
      
      return;
    }

    socket.join(roomId);
    
    // Set mainHost and originalHost if this is the first participant (room creator)
    if (!room.mainHost && room.participants.length === 0) {
      room.mainHost = userId;
      room.originalHost = userId; // Store original host
      room.hostId = userId; // Legacy support
    }
    
    // If original host is rejoining, restore their host status
    if (room.originalHost === userId && room.originalHost !== room.mainHost) {
      // Transfer host back to original host
      const previousHost = room.mainHost;
      room.mainHost = userId;
      room.hostId = userId;
      
      // Notify participants about host change
      io.to(roomId).emit('host-changed', {
        newHost: userId,
        newHostName: sanitizedUserName,
        previousHost: previousHost,
        reason: 'Original host rejoined'
      });
    }
    
    // Add participant
    const isMainHost = room.mainHost === userId;
    const isModerator = room.moderators && room.moderators.includes(userId);
    const participant = {
      id: userId,
      socketId: socket.id,
      userName: sanitizedUserName || `User ${userId.substring(0, 8)}`,
      joinedAt: new Date(),
      isHost: isMainHost || isModerator,
      isMainHost: isMainHost,
      isModerator: isModerator,
      role: isMainHost ? 'mainHost' : (isModerator ? 'moderator' : 'participant'),
      isVideoEnabled: true,
      isAudioEnabled: true
    };
    
    room.participants.push(participant);
    
    // Update room state
    rooms.set(roomId, room);

    // Notify others in the room
    socket.to(roomId).emit('user-joined', participant);
    
    // Only send existing users if meeting has started
    if (room.meetingStatus === 'started') {
      const otherParticipants = room.participants.filter(p => p.id !== userId);
      socket.emit('existing-users', otherParticipants);
    }
    
    // Send room info
    socket.emit('room-info', {
      mainHost: room.mainHost,
      originalHost: room.originalHost,
      hostId: room.hostId || room.mainHost, // Legacy support
      moderators: room.moderators || [],
      participants: room.participants,
      chat: room.chat.slice(-50), // Last 50 messages
      startedAt: room.startedAt,
      meetingStatus: room.meetingStatus,
      password: !!room.password,
      isMainHost: isMainHost,
      isModerator: isModerator
    });

    logger.info(`User joined room`, { userId, roomId, userName, isMainHost });
  });

  socket.on('chat-message', (data) => {
    const { roomId, userId, userName, message } = data;
    const room = rooms.get(roomId);
    if (room) {
      // Validate and sanitize chat message
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        socket.emit('chat-error', { message: 'Invalid message' });
        return;
      }
      
      const sanitizedMessage = sanitizeString(message, 500);
      const sanitizedUserName = sanitizeString(userName, 50);
      
      const chatMessage = {
        id: uuidv4(),
        userId,
        userName: sanitizedUserName,
        message: sanitizedMessage,
        timestamp: new Date()
      };
      room.chat.push(chatMessage);
      // Keep only last 100 messages
      if (room.chat.length > 100) {
        room.chat = room.chat.slice(-100);
      }
      io.to(roomId).emit('chat-message', chatMessage);
    }
  });

  socket.on('mute-all', (data) => {
    const { roomId, userId } = data;
    const room = rooms.get(roomId);
    if (room && isHostOrModerator(room, userId)) {
      io.to(roomId).emit('mute-all-participants');
    }
  });

  // Mute individual participant (host/moderator only)
  socket.on('mute-participant', (data) => {
    const { roomId, userId, targetUserId } = data;
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('mute-error', { message: 'Room not found' });
      return;
    }
    
    if (!isHostOrModerator(room, userId)) {
      socket.emit('mute-error', { message: 'Only hosts and moderators can mute participants' });
      return;
    }
    
    if (targetUserId === room.mainHost) {
      socket.emit('mute-error', { message: 'Cannot mute the main host' });
      return;
    }
    
    // Find the target participant's socket
    const targetParticipant = room.participants.find(p => p.id === targetUserId);
    if (!targetParticipant) {
      socket.emit('mute-error', { message: 'Participant not found' });
      return;
    }
    
    const targetSocket = io.sockets.sockets.get(targetParticipant.socketId);
    if (targetSocket) {
      targetSocket.emit('force-mute', { muted: true });
      // Update participant state
      targetParticipant.isAudioEnabled = false;
      rooms.set(roomId, room);
      
      // Notify all participants
      io.to(roomId).emit('participant-muted', { 
        targetUserId, 
        muted: true,
        userName: targetParticipant.userName
      });
    }
  });

  // Unmute individual participant (host/moderator only)
  socket.on('unmute-participant', (data) => {
    const { roomId, userId, targetUserId } = data;
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('mute-error', { message: 'Room not found' });
      return;
    }
    
    if (!isHostOrModerator(room, userId)) {
      socket.emit('mute-error', { message: 'Only hosts and moderators can unmute participants' });
      return;
    }
    
    // Find the target participant's socket
    const targetParticipant = room.participants.find(p => p.id === targetUserId);
    if (!targetParticipant) {
      socket.emit('mute-error', { message: 'Participant not found' });
      return;
    }
    
    const targetSocket = io.sockets.sockets.get(targetParticipant.socketId);
    if (targetSocket) {
      targetSocket.emit('force-unmute', { unmuted: true });
      // Update participant state
      targetParticipant.isAudioEnabled = true;
      rooms.set(roomId, room);
      
      // Notify all participants
      io.to(roomId).emit('participant-unmuted', { 
        targetUserId, 
        unmuted: true,
        userName: targetParticipant.userName
      });
    }
  });

  socket.on('kick-user', (data) => {
    const { roomId, userId, targetUserId } = data;
    const room = rooms.get(roomId);
    // Only allow kicking if user is host/moderator and target is not main host
    if (room && isHostOrModerator(room, userId) && room.mainHost !== targetUserId) {
      io.to(roomId).emit('user-kicked', { targetUserId });
      const targetSocket = Array.from(io.sockets.sockets.values())
        .find(s => room.participants.find(p => p.id === targetUserId && p.socketId === s.id));
      if (targetSocket) {
        targetSocket.emit('kicked-from-room');
      }
    }
  });

  socket.on('approve-waiting-user', (data) => {
    const { roomId, userId, targetUserId } = data;
    const room = rooms.get(roomId);
    if (room && isHostOrModerator(room, userId)) {
      const waitingParticipant = room.waitingRoom.find(p => p.id === targetUserId);
      if (waitingParticipant) {
        room.waitingRoom = room.waitingRoom.filter(p => p.id !== targetUserId);
        waitingParticipant.isHost = false;
        waitingParticipant.isVideoEnabled = true;
        waitingParticipant.isAudioEnabled = true;
        room.participants.push(waitingParticipant);
        rooms.set(roomId, room);
        
        const targetSocket = io.sockets.sockets.get(waitingParticipant.socketId);
        if (targetSocket) {
          targetSocket.join(roomId);
          targetSocket.emit('approved-to-join', { roomId });
          targetSocket.emit('existing-users', room.participants.filter(p => p.id !== targetUserId));
        }
        
        io.to(roomId).emit('user-joined', waitingParticipant);
        socket.emit('waiting-room-updated', room.waitingRoom);
      }
    }
  });

  socket.on('reject-waiting-user', (data) => {
    const { roomId, userId, targetUserId } = data;
    const room = rooms.get(roomId);
    if (room && isHostOrModerator(room, userId)) {
      room.waitingRoom = room.waitingRoom.filter(p => p.id !== targetUserId);
      rooms.set(roomId, room);
      
      const targetSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.id === room.waitingRoom.find(p => p.id === targetUserId)?.socketId);
      if (targetSocket) {
        targetSocket.emit('rejected-from-room');
      }
      
      socket.emit('waiting-room-updated', room.waitingRoom);
    }
  });

  socket.on('send-reaction', (data) => {
    const { roomId, userId, userName, reaction } = data;
    io.to(roomId).emit('reaction', {
      userId,
      userName,
      reaction,
      timestamp: new Date()
    });
  });

  socket.on('raise-hand', (data) => {
    const { roomId, userId, userName } = data;
    io.to(roomId).emit('hand-raised', {
      userId,
      userName,
      timestamp: new Date()
    });
  });

  socket.on('lower-hand', (data) => {
    const { roomId, userId } = data;
    io.to(roomId).emit('hand-lowered', { userId });
  });

  // Caption events
  socket.on('caption', (data) => {
    const { roomId, userId, userName, text, timestamp } = data;
    // Broadcast caption to all participants in the room
    io.to(roomId).emit('caption', {
      userId,
      userName,
      text,
      timestamp
    });
  });

  socket.on('caption-interim', (data) => {
    const { roomId, userId, userName, text } = data;
    // Broadcast interim caption (optional, for real-time preview)
    io.to(roomId).emit('caption-interim', {
      userId,
      userName,
      text
    });
  });

  socket.on('caption-started', (data) => {
    const { roomId, userId, userName } = data;
    // Notify all participants that someone started captions
    io.to(roomId).emit('caption-started', {
      userId,
      userName
    });
  });

  socket.on('caption-stopped', (data) => {
    const { roomId, userId, userName } = data;
    // Notify all participants that someone stopped captions
    io.to(roomId).emit('caption-stopped', {
      userId,
      userName
    });
  });

  socket.on('file-shared', (data) => {
    const { roomId, userId, userName, file } = data;
    // Broadcast file to all participants in the room
    io.to(roomId).emit('file-shared', {
      userId,
      userName,
      file
    });
  });

  socket.on('transcription', (data) => {
    const { roomId, userId, userName, text, timestamp } = data;
    // Broadcast transcription to all participants
    io.to(roomId).emit('transcription', {
      userId,
      userName,
      text,
      timestamp
    });
  });

  // Translation events
  socket.on('translation-enabled', (data) => {
    const { roomId, userId, userName, targetLanguages } = data;
    // Broadcast translation enabled event
    io.to(roomId).emit('translation-enabled', {
      userId,
      userName,
      targetLanguages,
      timestamp: Date.now()
    });
  });

  socket.on('translation-disabled', (data) => {
    const { roomId, userId, userName } = data;
    // Broadcast translation disabled event
    io.to(roomId).emit('translation-disabled', {
      userId,
      userName,
      timestamp: Date.now()
    });
  });

  socket.on('translation', (data) => {
    const { roomId, userId, userName, originalText, translations, timestamp } = data;
    // Broadcast translation to all participants
    io.to(roomId).emit('translation', {
      userId,
      userName,
      originalText,
      translations,
      timestamp: timestamp || Date.now()
    });
  });

  // Breakout Rooms handlers
  socket.on('create-breakout-room', (data) => {
    const { roomId, userId, roomName } = data;
    const room = rooms.get(roomId);
    if (!room || !isHostOrModerator(room, userId)) {
      socket.emit('breakout-error', { message: 'Unauthorized' });
      return;
    }

    if (!breakoutRooms.has(roomId)) {
      breakoutRooms.set(roomId, { rooms: [], assignments: new Map() });
    }

    const breakout = breakoutRooms.get(roomId);
    const newRoom = {
      id: uuidv4(),
      name: roomName,
      createdAt: new Date()
    };

    breakout.rooms.push(newRoom);
    breakoutRooms.set(roomId, breakout);

    io.to(roomId).emit('breakout-rooms-updated', {
      rooms: breakout.rooms,
      assignments: Array.from(breakout.assignments.entries())
    });
  });

  socket.on('delete-breakout-room', (data) => {
    const { roomId, userId, breakoutRoomId } = data;
    const room = rooms.get(roomId);
    if (!room || !isHostOrModerator(room, userId)) {
      socket.emit('breakout-error', { message: 'Unauthorized' });
      return;
    }

    const breakout = breakoutRooms.get(roomId);
    if (breakout) {
      breakout.rooms = breakout.rooms.filter(r => r.id !== breakoutRoomId);
      // Remove assignments for this room
      breakout.assignments.forEach((assignedRoomId, participantId) => {
        if (assignedRoomId === breakoutRoomId) {
          breakout.assignments.delete(participantId);
        }
      });
      breakoutRooms.set(roomId, breakout);

      io.to(roomId).emit('breakout-rooms-updated', {
        rooms: breakout.rooms,
        assignments: Array.from(breakout.assignments.entries())
      });
    }
  });

  socket.on('assign-to-breakout-room', (data) => {
    const { roomId, userId, participantId, breakoutRoomId } = data;
    const room = rooms.get(roomId);
    if (!room || !isHostOrModerator(room, userId)) {
      socket.emit('breakout-error', { message: 'Unauthorized' });
      return;
    }

    const breakout = breakoutRooms.get(roomId);
    if (breakout) {
      breakout.assignments.set(participantId, breakoutRoomId);
      breakoutRooms.set(roomId, breakout);

      io.to(roomId).emit('breakout-rooms-updated', {
        rooms: breakout.rooms,
        assignments: Array.from(breakout.assignments.entries())
      });
    }
  });

  socket.on('join-breakout-room', (data) => {
    const { roomId, userId, breakoutRoomId } = data;
    const breakout = breakoutRooms.get(roomId);
    if (breakout) {
      const breakoutRoom = breakout.rooms.find(r => r.id === breakoutRoomId);
      if (breakoutRoom) {
        breakout.assignments.set(userId, breakoutRoomId);
        breakoutRooms.set(roomId, breakout);

        socket.emit('breakout-room-joined', {
          roomName: breakoutRoom.name,
          breakoutRoomId
        });

        io.to(roomId).emit('breakout-rooms-updated', {
          rooms: breakout.rooms,
          assignments: Array.from(breakout.assignments.entries())
        });
      }
    }
  });

  socket.on('close-breakout-rooms', (data) => {
    const { roomId, userId } = data;
    const room = rooms.get(roomId);
    if (!room || !isHostOrModerator(room, userId)) {
      socket.emit('breakout-error', { message: 'Unauthorized' });
      return;
    }

    breakoutRooms.delete(roomId);
    io.to(roomId).emit('breakout-rooms-closed');
    io.to(roomId).emit('breakout-rooms-updated', {
      rooms: [],
      assignments: []
    });
  });

  socket.on('create-poll', (data) => {
    const { roomId, userId, question, options } = data;
    const room = rooms.get(roomId);
    if (room && isHostOrModerator(room, userId)) {
      const poll = {
        id: uuidv4(),
        question,
        options: options.map(opt => ({ text: opt, votes: 0 })),
        votes: {},
        createdBy: userId,
        createdAt: new Date()
      };
      room.polls.push(poll);
      rooms.set(roomId, room);
      io.to(roomId).emit('poll-created', poll);
    }
  });

  socket.on('vote-poll', (data) => {
    const { roomId, userId, pollId, optionIndex } = data;
    const room = rooms.get(roomId);
    if (room) {
      const poll = room.polls.find(p => p.id === pollId);
      if (poll && !poll.votes[userId]) {
        poll.votes[userId] = optionIndex;
        poll.options[optionIndex].votes++;
        rooms.set(roomId, room);
        io.to(roomId).emit('poll-updated', poll);
      }
    }
  });

  socket.on('upload-file', (data) => {
    const { roomId, userId, fileName, fileSize, fileType } = data;
    const room = rooms.get(roomId);
    if (room) {
      const file = {
        id: uuidv4(),
        fileName,
        fileSize,
        fileType,
        uploadedBy: userId,
        uploadedAt: new Date()
      };
      room.files.push(file);
      rooms.set(roomId, room);
      io.to(roomId).emit('file-uploaded', file);
    }
  });

  socket.on('get-waiting-room', (data) => {
    const { roomId, userId } = data;
    const room = rooms.get(roomId);
    if (room && isHostOrModerator(room, userId)) {
      socket.emit('waiting-room-list', room.waitingRoom);
    }
  });

  // Promote user to moderator (only main host can do this)
  socket.on('promote-to-moderator', (data) => {
    const { roomId, userId, targetUserId } = data;
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('promote-error', { message: 'Room not found' });
      return;
    }
    
    // Only main host can promote
    if (room.mainHost !== userId) {
      socket.emit('promote-error', { message: 'Only the main host can promote users' });
      return;
    }
    
    // Check if target is main host
    if (room.mainHost === targetUserId) {
      socket.emit('promote-error', { message: 'Main host cannot be promoted' });
      return;
    }
    
    // Check if already a moderator
    if (room.moderators && room.moderators.includes(targetUserId)) {
      socket.emit('promote-error', { message: 'User is already a moderator' });
      return;
    }
    
    // Check moderator limit (max 5)
    if (room.moderators && room.moderators.length >= 5) {
      socket.emit('promote-error', { message: 'Maximum of 5 moderators allowed' });
      return;
    }
    
    // Add to moderators array
    if (!room.moderators) {
      room.moderators = [];
    }
    room.moderators.push(targetUserId);
    rooms.set(roomId, room);
    
    // Update participant role
    const targetParticipant = room.participants.find(p => p.id === targetUserId);
    if (targetParticipant) {
      targetParticipant.isModerator = true;
      targetParticipant.isHost = true;
      targetParticipant.role = 'moderator';
    }
    
    // Notify all users
    io.to(roomId).emit('user-promoted', {
      userId: targetUserId,
      userName: targetParticipant?.userName,
      role: 'moderator'
    });
    
    // Send updated room info
    io.to(roomId).emit('room-info', {
      mainHost: room.mainHost,
      hostId: room.hostId || room.mainHost,
      moderators: room.moderators,
      participants: room.participants,
      chat: room.chat.slice(-50),
      startedAt: room.startedAt,
      meetingStatus: room.meetingStatus,
      password: !!room.password
    });
    
    socket.emit('promote-success', { targetUserId });
  });

  // Demote moderator (only main host can do this)
  socket.on('demote-moderator', (data) => {
    const { roomId, userId, targetUserId } = data;
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('demote-error', { message: 'Room not found' });
      return;
    }
    
    // Only main host can demote
    if (room.mainHost !== userId) {
      socket.emit('demote-error', { message: 'Only the main host can demote moderators' });
      return;
    }
    
    // Remove from moderators
    if (room.moderators) {
      room.moderators = room.moderators.filter(id => id !== targetUserId);
      rooms.set(roomId, room);
    }
    
    // Update participant role
    const targetParticipant = room.participants.find(p => p.id === targetUserId);
    if (targetParticipant) {
      targetParticipant.isModerator = false;
      targetParticipant.isHost = false;
      targetParticipant.role = 'participant';
    }
    
    // Notify all users
    io.to(roomId).emit('user-demoted', {
      userId: targetUserId,
      userName: targetParticipant?.userName,
      role: 'participant'
    });
    
    // Send updated room info
    io.to(roomId).emit('room-info', {
      mainHost: room.mainHost,
      hostId: room.hostId || room.mainHost,
      moderators: room.moderators,
      participants: room.participants,
      chat: room.chat.slice(-50),
      startedAt: room.startedAt,
      meetingStatus: room.meetingStatus,
      password: !!room.password
    });
    
    socket.emit('demote-success', { targetUserId });
  });

  // Start meeting (main host only)
  socket.on('start-meeting', (data) => {
    const { roomId, userId } = data;
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('meeting-error', { message: 'Room not found' });
      return;
    }
    
    // Only main host can start the meeting
    if (room.mainHost !== userId) {
      socket.emit('meeting-error', { message: 'Only the main host can start the meeting' });
      return;
    }
    
    if (room.meetingStatus === 'started') {
      socket.emit('meeting-error', { message: 'Meeting has already started' });
      return;
    }
    
    if (room.meetingStatus === 'ended') {
      socket.emit('meeting-error', { message: 'Meeting has ended' });
      return;
    }
    
    // Start the meeting
    room.meetingStatus = 'started';
    room.startedAt = new Date();
    rooms.set(roomId, room);
    
    // Notify all participants
    io.to(roomId).emit('meeting-started', {
      startedAt: room.startedAt,
      mainHost: room.mainHost
    });
    
    // Send existing users to all participants to establish connections
    const allParticipants = room.participants;
    allParticipants.forEach(participant => {
      const participantSocket = io.sockets.sockets.get(participant.socketId);
      if (participantSocket) {
        const otherParticipants = allParticipants.filter(p => p.id !== participant.id);
        participantSocket.emit('existing-users', otherParticipants);
      }
    });
    
    socket.emit('start-meeting-success');
  });

  // End meeting (main host only)
  socket.on('end-meeting', (data) => {
    const { roomId, userId } = data;
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('meeting-error', { message: 'Room not found' });
      return;
    }
    
    // Only main host can end the meeting
    if (room.mainHost !== userId) {
      socket.emit('meeting-error', { message: 'Only the main host can end the meeting' });
      return;
    }
    
    if (room.meetingStatus === 'ended') {
      socket.emit('meeting-error', { message: 'Meeting has already ended' });
      return;
    }
    
    // End the meeting
    room.meetingStatus = 'ended';
    rooms.set(roomId, room);
    
    // Notify all participants
    io.to(roomId).emit('meeting-ended', {
      message: 'The host has ended the meeting',
      mainHost: room.mainHost
    });
    
    // Close all peer connections for participants
    room.participants.forEach(participant => {
      const participantSocket = io.sockets.sockets.get(participant.socketId);
      if (participantSocket) {
        participantSocket.emit('meeting-ended-by-host');
      }
    });
    
    socket.emit('end-meeting-success');
  });

  socket.on('whiteboard-draw', (data) => {
    socket.to(data.roomId).emit('whiteboard-draw', {
      userId: data.userId,
      x0: data.x0,
      y0: data.y0,
      x1: data.x1,
      y1: data.y1,
      color: data.color,
      lineWidth: data.lineWidth
    });
  });

  socket.on('whiteboard-clear', (data) => {
    socket.to(data.roomId).emit('whiteboard-clear');
  });

  socket.on('offer', (data) => {
    socket.to(data.roomId).emit('offer', {
      offer: data.offer,
      from: data.userId
    });
  });

  socket.on('answer', (data) => {
    socket.to(data.roomId).emit('answer', {
      answer: data.answer,
      from: data.userId
    });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.roomId).emit('ice-candidate', {
      candidate: data.candidate,
      from: data.userId
    });
  });

  socket.on('toggle-video', (data) => {
    socket.to(data.roomId).emit('user-video-toggle', {
      userId: data.userId,
      isVideoEnabled: data.isVideoEnabled
    });
  });

  socket.on('toggle-audio', (data) => {
    socket.to(data.roomId).emit('user-audio-toggle', {
      userId: data.userId,
      isAudioEnabled: data.isAudioEnabled
    });
  });

  socket.on('start-recording', (data) => {
    const room = rooms.get(data.roomId);
    if (room) {
      room.isRecording = true;
      io.to(data.roomId).emit('recording-started');
    }
  });

  socket.on('stop-recording', (data) => {
    const room = rooms.get(data.roomId);
    if (room) {
      room.isRecording = false;
      io.to(data.roomId).emit('recording-stopped');
    }
  });

  socket.on('leave-room', (data) => {
    const { roomId, userId } = data;
    
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      const leavingParticipant = room.participants.find(p => p.id === userId);
      const wasMainHost = room.mainHost === userId;
      
      // Remove participant from room
      room.participants = room.participants.filter(p => p.id !== userId);
      
      // If the main host is leaving, transfer host to another participant
      if (wasMainHost && room.participants.length > 0) {
        // First, try to transfer to a moderator
        const moderator = room.participants.find(p => room.moderators && room.moderators.includes(p.id));
        
        if (moderator) {
          room.mainHost = moderator.id;
          room.hostId = moderator.id;
          io.to(roomId).emit('host-changed', {
            newHost: moderator.id,
            newHostName: moderator.userName,
            previousHost: userId,
            reason: 'Host left, transferred to moderator'
          });
        } else {
          // Transfer to first participant
          const newHost = room.participants[0];
          room.mainHost = newHost.id;
          room.hostId = newHost.id;
          io.to(roomId).emit('host-changed', {
            newHost: newHost.id,
            newHostName: newHost.userName,
            previousHost: userId,
            reason: 'Host left, transferred to participant'
          });
        }
      }
      
      if (room.participants.length === 0) {
        // Delete room if empty
        rooms.delete(roomId);
      } else {
        rooms.set(roomId, room);
        // Notify remaining participants
        io.to(roomId).emit('user-left', { userId, wasMainHost });
      }
    }
    
    socket.leave(roomId);
  });

  socket.on('disconnect', () => {
    logger.info('User disconnected', { socketId: socket.id });
    // Clean up participant from all rooms
    rooms.forEach((room, roomId) => {
      const participant = room.participants.find(p => p.socketId === socket.id);
      if (participant) {
        const wasMainHost = room.mainHost === participant.id;
        room.participants = room.participants.filter(p => p.id !== participant.id);
        
        // If the main host disconnected, transfer host to another participant
        if (wasMainHost && room.participants.length > 0) {
          // First, try to transfer to a moderator
          const moderator = room.participants.find(p => room.moderators && room.moderators.includes(p.id));
          
          if (moderator) {
            room.mainHost = moderator.id;
            room.hostId = moderator.id;
            io.to(roomId).emit('host-changed', {
              newHost: moderator.id,
              newHostName: moderator.userName,
              previousHost: participant.id,
              reason: 'Host disconnected, transferred to moderator'
            });
          } else {
            // Transfer to first participant
            const newHost = room.participants[0];
            room.mainHost = newHost.id;
            room.hostId = newHost.id;
            io.to(roomId).emit('host-changed', {
              newHost: newHost.id,
              newHostName: newHost.userName,
              previousHost: participant.id,
              reason: 'Host disconnected, transferred to participant'
            });
          }
        }
        
        if (room.participants.length === 0) {
          rooms.delete(roomId);
        } else {
          io.to(roomId).emit('user-left', { userId: participant.id, wasMainHost });
        }
      }
    });
  });
});

// Serve React app build files in production (after all API routes)
if (isProduction) {
  const path = require('path');
  const buildPath = path.join(__dirname, '../web-app/build');
  
  // Check if build directory exists
  if (fs.existsSync(buildPath)) {
    // Serve static files from React build
    app.use(express.static(buildPath));
    
    // Handle React routing - return all non-API requests to React app
    app.get('*', (req, res) => {
      // Don't serve React app for API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      res.sendFile(path.join(buildPath, 'index.html'));
    });
    
    logger.info(`Serving React app from: ${buildPath}`);
  } else {
    logger.warn(`React build directory not found at: ${buildPath}. Frontend will not be served.`);
  }
}

const PORT = process.env.PORT || 5000;
const protocol = useHTTPS ? 'https' : 'http';
server.listen(PORT, () => {
  logger.info(`Server running on ${protocol}://localhost:${PORT}`, { 
    env: process.env.NODE_ENV || 'development',
    protocol: protocol.toUpperCase(),
    httpsEnabled: useHTTPS,
    allowedOrigins 
  });
});

