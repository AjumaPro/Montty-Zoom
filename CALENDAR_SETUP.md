# Calendar Integration Setup Guide

This guide will help you set up Google Calendar integration and other calendar services for Montty Zoom.

## Features

- ✅ Google Calendar OAuth integration
- ✅ Sync meetings to Google Calendar
- ✅ Import events from ICS/iCal files
- ✅ Two-way sync (create/update/delete calendar events)
- ✅ Automatic meeting reminders

## Google Calendar Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" (unless you have a Google Workspace)
   - Fill in app name, user support email, developer email
   - Add scopes: `https://www.googleapis.com/auth/calendar` and `https://www.googleapis.com/auth/calendar.events`
   - Save and continue
4. Create OAuth client ID:
   - Application type: "Web application"
   - Name: "Montty Zoom Calendar"
   - Authorized redirect URIs: `http://localhost:5000/api/calendar/google/callback`
   - For production: Add your production callback URL
   - Click "Create"
5. Copy the Client ID and Client Secret

### Step 3: Configure Environment Variables

Create or update your `.env` file in the root directory:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/google/callback
FRONTEND_URL=http://localhost:3000
```

### Step 4: Restart the Server

Restart your backend server to load the new environment variables:

```bash
npm run server
```

## Using Calendar Integration

### Connect Google Calendar

1. Navigate to Settings page in the web app
2. Scroll to "Calendar Integration" section
3. Click "Connect Google Calendar"
4. Authorize the application in the popup window
5. You'll be redirected back with a success message

### Sync Calendar Events

1. After connecting, click "Sync Now" to fetch events from your Google Calendar
2. Events will be displayed in your calendar view
3. Automatic sync can be configured (feature coming soon)

### Schedule Meetings with Calendar Sync

1. When creating a new meeting, if your calendar is connected, you'll see a "Sync to Calendar" checkbox
2. Check the box to automatically add the meeting to your Google Calendar
3. The meeting will appear in both the app and your Google Calendar

### Import ICS Files

1. In Settings > Calendar Integration, find the "Apple iCal" section
2. Click "Import ICS File"
3. Select an `.ics` or `.ical` file from your computer
4. Events will be imported into the app

## Supported Calendar Services

- **Google Calendar**: Full OAuth integration with sync
- **Microsoft Outlook**: Coming soon
- **Apple iCal**: ICS file import support

## API Endpoints

### Calendar Status
```
GET /api/calendar/status?userId=user-id
```

### Connect Google Calendar
```
GET /api/calendar/google/auth-url?userId=user-id
```

### Sync Calendar Events
```
GET /api/calendar/sync?userId=user-id&startDate=2024-01-01&endDate=2024-12-31
```

### Create Calendar Event
```
POST /api/calendar/events
Body: {
  userId: "user-id",
  title: "Meeting Title",
  description: "Description",
  start: "2024-01-01T10:00:00Z",
  end: "2024-01-01T11:00:00Z",
  location: "Location",
  attendees: ["email1@example.com"],
  timeZone: "America/New_York"
}
```

### Update Calendar Event
```
PUT /api/calendar/events/:eventId
Body: { same as create }
```

### Delete Calendar Event
```
DELETE /api/calendar/events/:eventId?userId=user-id
```

### Disconnect Calendar
```
POST /api/calendar/disconnect
Body: { userId: "user-id" }
```

### Import ICS File
```
POST /api/calendar/import/ics
Body: { icsContent: "ICS_FILE_CONTENT" }
```

## Troubleshooting

### "Google OAuth client not initialized"
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
- Restart the server after adding environment variables

### "Failed to connect calendar"
- Verify the redirect URI matches exactly in Google Cloud Console
- Check that the Google Calendar API is enabled
- Ensure OAuth consent screen is configured

### Events not syncing
- Check calendar connection status in Settings
- Verify you have permission to access the calendar
- Try disconnecting and reconnecting

### CORS errors
- Add your frontend URL to `ALLOWED_ORIGINS` in `.env`
- Ensure the backend server is running

## Production Deployment

When deploying to production:

1. Update the redirect URI in Google Cloud Console to your production URL
2. Update `.env` with production values:
   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/calendar/google/callback
   FRONTEND_URL=https://yourdomain.com
   ```
3. Ensure OAuth consent screen is published (for external users)
4. Consider using environment-specific credentials for staging/production

## Security Notes

- Never commit `.env` file with credentials to version control
- Use environment variables or secure secret management in production
- Regularly rotate OAuth credentials
- Implement proper user authentication before allowing calendar access
- Consider rate limiting for calendar API calls

## Future Enhancements

- [ ] Microsoft Outlook/Office 365 integration
- [ ] Apple Calendar two-way sync
- [ ] Automatic background sync
- [ ] Calendar event conflict detection
- [ ] Multiple calendar support
- [ ] Calendar event templates
- [ ] Recurring event support in calendar sync

