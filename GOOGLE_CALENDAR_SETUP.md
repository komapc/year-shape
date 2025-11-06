# Google Calendar API Setup & Verification Guide

## Overview
Your calendar app is already configured to use Google Calendar API. This guide will help you:
1. Set up Google Cloud Project
2. Configure OAuth consent screen
3. Get verified for production use
4. Configure your app with credentials

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"** or select existing project
3. Name it: `year-shape-calendar` (or your preference)
4. Click **"Create"**

---

## Step 2: Enable Google Calendar API

1. In your project, go to **"APIs & Services" → "Library"**
2. Search for **"Google Calendar API"**
3. Click on it and press **"Enable"**

---

## Step 3: Create OAuth 2.0 Credentials

### 3.1 Create OAuth Client ID

1. Go to **"APIs & Services" → "Credentials"**
2. Click **"+ CREATE CREDENTIALS" → "OAuth client ID"**
3. If prompted, configure OAuth consent screen first (see Step 4)
4. Choose **"Web application"**
5. Name: `Year Shape Calendar Web Client`

### 3.2 Add Authorized JavaScript Origins

For development:
```
http://localhost:5173
```

For production:
```
https://your-domain.com
```

### 3.3 Add Authorized Redirect URIs

For development:
```
http://localhost:5173
```

For production:
```
https://your-domain.com
```

### 3.4 Save Credentials

- **Client ID**: Copy this (looks like: `123456789-abc123.apps.googleusercontent.com`)
- **API Key**: Create one via "CREATE CREDENTIALS" → "API key"

---

## Step 4: Configure OAuth Consent Screen

### 4.1 Basic Configuration

1. Go to **"APIs & Services" → "OAuth consent screen"**
2. Choose **"External"** (for public use) or **"Internal"** (for workspace only)
3. Click **"Create"**

### 4.2 Required Information

**App Information:**
- **App name**: `Year Shape Calendar`
- **User support email**: Your email
- **App logo**: Upload a logo (optional but recommended)

**App domain:**
- **Application home page**: `https://your-domain.com`
- **Application privacy policy link**: `https://your-domain.com/privacy` ⚠️ **REQUIRED for verification**
- **Application terms of service link**: `https://your-domain.com/terms` (recommended)

**Authorized domains:**
- Add your domain: `your-domain.com`

**Developer contact information:**
- Add your email address

### 4.3 Scopes

1. Click **"Add or Remove Scopes"**
2. Add scope: `https://www.googleapis.com/auth/calendar.readonly`
3. This is **non-sensitive** scope, so verification is simpler

### 4.4 Test Users (Before Verification)

While unverified, only test users can sign in:
1. Add test users by email
2. Maximum 100 test users
3. After verification, anyone can use the app

---

## Step 5: Domain Verification (REQUIRED)

### 5.1 Verify Website Ownership

**CRITICAL**: You must verify domain ownership before app verification.

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **"Add Property"**
3. Choose **"Domain"** or **"URL prefix"**
4. Enter your domain: `your-domain.com`

### 5.2 Verification Methods

Choose one method:

**Option A: DNS Record**
```
TXT record: google-site-verification=abc123xyz456
```

**Option B: HTML File Upload**
```
Upload: googleXXXXXXXXXXXXX.html to your site root
```

**Option C: HTML Meta Tag**
```html
<meta name="google-site-verification" content="abc123xyz456" />
```

**Option D: Google Analytics**
- Use existing GA tracking code

**Option E: Google Tag Manager**
- Use existing GTM container

### 5.3 Important Notes

⚠️ **Same Google Account Required**:
- The account verifying the domain in Search Console...
- ...MUST be a **Project Owner** or **Project Editor** in Google Cloud Console
- Use the same email for both!

---

## Step 6: Create Privacy Policy & Terms

### 6.1 Privacy Policy (REQUIRED)

Create `/privacy.html` or `/privacy.md` with:

```markdown
# Privacy Policy for Year Shape Calendar

Last updated: [DATE]

## Information We Collect
- **Google Calendar Data**: When you sign in with Google, we access your 
  calendar events to display them in the calendar visualization.
- **No Storage**: We do NOT store your calendar data on our servers.
- **Read-Only Access**: We only READ your calendar data, we never modify it.

## How We Use Your Information
- Display your events in the calendar interface
- All processing happens in your browser
- No data is sent to our servers

## Third-Party Services
- **Google Calendar API**: We use Google's API to fetch your calendar events
- Subject to Google's Privacy Policy

## Data Security
- All communication with Google is encrypted (HTTPS)
- Your Google credentials are managed by Google's OAuth
- We never see or store your Google password

## Your Rights
- You can revoke access anytime via Google Account settings
- Sign out removes all locally cached data

## Contact
For privacy questions: your-email@domain.com
```

### 6.2 Terms of Service (Recommended)

Create `/terms.html` with basic terms of use.

---

## Step 7: Submit for Verification

### 7.1 Start Verification Process

1. Go to **"OAuth consent screen"** in Google Cloud Console
2. Click **"Submit for Verification"** or **"Publish App"**

### 7.2 Verification Dialog (if shown)

If "Verification required" dialog appears:

**What does your app do?**
```
Year Shape Calendar is a visual calendar tool that displays the year as a 
morphing circular shape with weeks arranged in seasonal quadrants. Users can 
sign in with Google to view their calendar events integrated into this unique 
visualization. The app uses read-only access to display events and does not 
modify or store any calendar data.
```

**Why do you need these scopes?**
```
We request calendar.readonly scope to display user's calendar events within 
our visualization. This is read-only access - we never modify user's calendar. 
All processing happens client-side in the browser, and no calendar data is 
stored on our servers.
```

**Links to verify:**
- Homepage URL
- Privacy policy URL
- Terms of service URL
- Domain verification in Search Console

### 7.3 Verification Timeline

- **Non-sensitive scopes** (like `calendar.readonly`): Usually faster, may not require full verification
- **Sensitive/restricted scopes**: Can take 3-6 weeks
- You'll receive email updates about verification status

---

## Step 8: Configure Your App

### 8.1 Create Environment File

Create `.env.local` in your project root:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your-api-key-here
```

### 8.2 Add to .gitignore

Make sure `.env.local` is in your `.gitignore`:

```gitignore
.env.local
.env*.local
```

### 8.3 For Production Deployment

**Vercel/Netlify/Other:**

Add environment variables in your hosting platform:
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_API_KEY`

---

## Step 9: Testing

### 9.1 Before Verification

1. Add test users in OAuth consent screen
2. Test users can sign in and test the app
3. You'll see "This app isn't verified" warning (normal)

### 9.2 After Verification

1. Remove "Testing" status
2. Publish app to "Production"
3. Anyone can sign in
4. No warning messages

---

## Common Issues & Solutions

### ❌ "This app isn't verified"

**Solution**: Submit for verification or keep in testing mode with added test users.

### ❌ "Access blocked: Authorization Error"

**Cause**: OAuth consent screen not configured or app not published.

**Solution**: Complete OAuth consent screen setup and publish (at least to testing).

### ❌ "Redirect URI mismatch"

**Cause**: The URL you're accessing doesn't match authorized URIs.

**Solution**: Add all URLs (dev + prod) to authorized JavaScript origins and redirect URIs.

### ❌ "Domain not verified"

**Cause**: Website ownership not verified in Search Console.

**Solution**: Complete Search Console verification using same Google account as Cloud project owner.

### ❌ "API key not valid"

**Cause**: API key restrictions or not enabled.

**Solution**: 
1. Check API key restrictions in Cloud Console
2. Make sure Calendar API is enabled
3. Add HTTP referrer restrictions for production

---

## Current App Configuration

Your app is already set up in `src/utils/constants.ts`:

```typescript
export const GOOGLE_CALENDAR_CONFIG: GoogleCalendarConfig = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
  discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
  scopes: 'https://www.googleapis.com/auth/calendar.readonly',
};
```

**To enable:**
1. Follow this guide to get credentials
2. Add them to `.env.local`
3. Restart dev server
4. Click "Sign in with Google" button

---

## Security Best Practices

1. ✅ **Never commit credentials** to git
2. ✅ **Use environment variables** for sensitive data
3. ✅ **Restrict API keys** to specific URLs in production
4. ✅ **Use read-only scopes** when possible
5. ✅ **Keep privacy policy updated**
6. ✅ **Monitor API usage** in Google Cloud Console

---

## Next Steps

1. ☐ Create Google Cloud Project
2. ☐ Enable Calendar API
3. ☐ Create OAuth credentials
4. ☐ Configure consent screen
5. ☐ Create privacy policy page
6. ☐ Verify domain ownership in Search Console
7. ☐ Submit for verification
8. ☐ Add credentials to `.env.local`
9. ☐ Test with your Google account

---

## Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 for Web Apps](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
- [OAuth Verification FAQ](https://support.google.com/cloud/answer/9110914)
- [Search Console Help](https://support.google.com/webmasters/answer/9008080)

---

**Questions?** Check the [OAuth Verification FAQ](https://support.google.com/cloud/answer/9110914) or create an issue in the repo.

