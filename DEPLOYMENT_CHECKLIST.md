# 🚀 Deployment & Google Verification Checklist

## ✅ What's Already Done

- [x] Privacy Policy created (`/public/privacy.html`)
- [x] Terms of Service created (`/public/terms.html`)
- [x] Footer links added to main page
- [x] Google Calendar integration implemented
- [x] Site hosted on GitHub Pages: https://komapc.github.io/year-shape/

---

## 📋 Next Steps for Full Deployment

### Step 1: Build and Deploy Updated Site

```bash
cd /home/mark/projects

# Build the project (creates dist/ folder)
npm run build

# The public/ folder contents will be copied to dist/
# This includes privacy.html and terms.html

# Commit and push to GitHub
git add .
git commit -m "feat: add privacy policy and terms of service"
git push origin main

# If you have a separate gh-pages branch:
# git checkout gh-pages
# cp -r dist/* .
# git add .
# git commit -m "deploy: update site with privacy policy"
# git push origin gh-pages
```

**⏱ Wait 2-5 minutes** for GitHub Pages to rebuild and deploy.

**✅ Verify:**
- Visit https://komapc.github.io/year-shape/privacy.html
- Visit https://komapc.github.io/year-shape/terms.html
- Check footer links on main page

---

### Step 2: Set Up Google Cloud Project

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com
   - Sign in with your Google account

2. **Create New Project:**
   - Click "Select a project" → "New Project"
   - Project name: `Year Shape Calendar`
   - Click "CREATE"
   - Wait for project creation (~30 seconds)

3. **Enable Google Calendar API:**
   - In the left menu: "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Google Calendar API"
   - Click "ENABLE"

---

### Step 3: Create OAuth Credentials

1. **Configure OAuth Consent Screen:**
   - Go to: "APIs & Services" → "OAuth consent screen"
   - Select **"External"** (for public access)
   - Click "CREATE"

2. **App Information:**
   - **App name:** `Year Shape Calendar`
   - **User support email:** Your email address
   - **App logo:** (optional, can add later)
   - **Application home page:** `https://komapc.github.io/year-shape/`
   - **Application privacy policy link:** `https://komapc.github.io/year-shape/privacy.html`
   - **Application terms of service link:** `https://komapc.github.io/year-shape/terms.html`
   - **Authorized domains:** `komapc.github.io`
   - **Developer contact information:** Your email address
   - Click "SAVE AND CONTINUE"

3. **Scopes:**
   - Click "ADD OR REMOVE SCOPES"
   - Search for: `https://www.googleapis.com/auth/calendar.readonly`
   - Select the checkbox (non-sensitive scope)
   - Click "UPDATE"
   - Click "SAVE AND CONTINUE"

4. **Test Users** (before verification):
   - Click "ADD USERS"
   - Add your email and any beta testers
   - Click "SAVE AND CONTINUE"
   - Click "BACK TO DASHBOARD"

5. **Create OAuth Client ID:**
   - Go to: "APIs & Services" → "Credentials"
   - Click "CREATE CREDENTIALS" → "OAuth client ID"
   - **Application type:** Web application
   - **Name:** `Year Shape Calendar Web Client`
   - **Authorized JavaScript origins:**
     - Add: `https://komapc.github.io`
   - **Authorized redirect URIs:**
     - Add: `https://komapc.github.io/year-shape/`
     - Add: `http://localhost:5173` (for local testing)
   - Click "CREATE"

6. **Save Your Credentials:**
   - Copy the **Client ID** (starts with something like `123456789-xyz.apps.googleusercontent.com`)
   - Copy the **API Key** (if shown)
   - Click "OK"

---

### Step 4: Add Credentials to Your Project

1. **Local Development:**
   ```bash
   cd /home/mark/projects
   
   # Copy the example file
   cp .env.example .env.local
   
   # Edit the file and add your credentials
   nano .env.local
   ```

   ```env
   VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
   VITE_GOOGLE_API_KEY=YOUR_API_KEY_HERE
   ```

2. **For Production (GitHub Pages):**
   - Since GitHub Pages is static, credentials must be in the built code
   - **Security Note:** Client ID is safe to expose (it's public)
   - **API Key:** Use API Key restrictions (see Step 5)

3. **Rebuild with Credentials:**
   ```bash
   npm run build
   git add dist/
   git commit -m "chore: add Google Calendar credentials"
   git push
   ```

---

### Step 5: Secure Your API Key

1. **Go to Google Cloud Console:**
   - "APIs & Services" → "Credentials"
   - Find your API Key
   - Click the pencil icon (Edit)

2. **API Restrictions:**
   - Select "Restrict key"
   - Check "Google Calendar API"
   - Click "SAVE"

3. **Application Restrictions:**
   - Select "HTTP referrers (websites)"
   - Add referrer:
     - `https://komapc.github.io/*`
     - `http://localhost:5173/*` (for testing)
   - Click "SAVE"

---

### Step 6: Test Before Verification

1. **Visit Your Site:**
   - Go to: https://komapc.github.io/year-shape/
   - Click "Sign in with Google"

2. **Expected Behavior (Unverified App):**
   - You'll see: "Google hasn't verified this app"
   - Click "Advanced"
   - Click "Go to Year Shape Calendar (unsafe)"
   - Grant calendar read permission
   - You should see your events appear

3. **Test All Features:**
   - [ ] Sign in works
   - [ ] Events load and display
   - [ ] Week details show events
   - [ ] "Open in Calendar" button works
   - [ ] Sign out works
   - [ ] Privacy policy link works
   - [ ] Terms link works

---

### Step 7: Domain Verification (REQUIRED for Public Verification)

**⚠️ CRITICAL:** Google requires domain verification before reviewing your app.

#### Option A: If You Own a Custom Domain

If you have a custom domain (e.g., `yearshape.com`):

1. **Set up custom domain in GitHub Pages:**
   - Repo Settings → Pages → Custom domain
   - Add your domain
   - Wait for DNS check

2. **Verify in Google Search Console:**
   - Go to: https://search.google.com/search-console
   - Add property: `https://yourshape.com`
   - Choose verification method (DNS or HTML file)
   - Complete verification

3. **Link to Google Cloud:**
   - Go to Google Cloud Console
   - "APIs & Services" → "OAuth consent screen"
   - "Domain verification" tab
   - Your verified domain should appear

#### Option B: Using github.io Domain

**⚠️ PROBLEM:** You cannot verify `github.io` domains in Google Search Console (GitHub owns it).

**SOLUTIONS:**

1. **Use a Custom Domain** (Recommended)
   - Buy a domain ($10-15/year)
   - Point it to GitHub Pages
   - Verify in Search Console
   - Update all URLs in OAuth consent screen

2. **Apply for Verification WITHOUT Domain Verification**
   - Some apps get approved without verified domains
   - Requires very clear privacy policy and limited scope
   - Lower chance of approval
   - Takes longer (6-8 weeks vs 3-6 weeks)

3. **Keep as "Testing" Mode**
   - Add up to 100 test users manually
   - They won't see "unverified app" warning
   - Good for personal use or small groups
   - No verification needed

---

### Step 8: Submit for Verification (If Using Custom Domain)

1. **Go to OAuth Consent Screen:**
   - "APIs & Services" → "OAuth consent screen"
   - Click "PUBLISH APP"

2. **Prepare for Review:**
   - Click "PREPARE FOR VERIFICATION"
   - Fill out the verification form:
     - **Domain ownership:** Should be auto-verified
     - **Privacy policy URL:** `https://yourdomain.com/privacy.html`
     - **Homepage URL:** `https://yourdomain.com/`
     - **Authorized domains:** `yourdomain.com`

3. **Submit Application:**
   - Answer security questions
   - Explain what your app does:
     ```
     Year Shape Calendar is a unique calendar visualization tool that 
     displays the entire year as an interactive morphing shape (circle 
     to square). It integrates with Google Calendar using read-only 
     access to display user events within the visualization. The app 
     processes all data client-side in the user's browser with no 
     server-side storage, ensuring maximum privacy. Users can view 
     their events, navigate to specific weeks, and jump to Google 
     Calendar for detailed event management.
     ```
   - Explain why you need calendar.readonly scope:
     ```
     We need read-only access to Google Calendar to fetch and display 
     user events within our unique circular year visualization. This 
     allows users to see which weeks contain events and view event 
     details when clicking on a specific week. We use the minimal 
     scope necessary (readonly) as we never modify, create, or delete 
     events.
     ```
   - Upload privacy policy (link)
   - Click "SUBMIT FOR VERIFICATION"

4. **Wait for Review:**
   - ⏱ **Timeline:** 3-6 weeks for first submission
   - You'll receive email updates
   - May need to answer follow-up questions

---

### Step 9: While Waiting for Verification

**Your app is fully functional even while "Unverified":**

1. **Add Test Users:**
   - OAuth consent screen → Test users
   - Add emails of anyone who should test
   - They won't see the warning screen

2. **Promote Your App:**
   - Share the link
   - Explain that "unverified" warning is normal
   - Users can click "Advanced" → "Go to Year Shape Calendar"

3. **Monitor Usage:**
   - Google Cloud Console → APIs & Services → Dashboard
   - View API usage stats
   - Monitor quota (10,000 requests/day default)

---

## 📝 Quick Reference

### Important URLs

| Service | URL |
|---------|-----|
| Your Site | https://komapc.github.io/year-shape/ |
| Privacy Policy | https://komapc.github.io/year-shape/privacy.html |
| Terms | https://komapc.github.io/year-shape/terms.html |
| Google Cloud Console | https://console.cloud.google.com |
| Search Console | https://search.google.com/search-console |
| Revoke Access | https://myaccount.google.com/permissions |

### Key Files

```
/home/mark/projects/
├── public/
│   ├── privacy.html       ← Privacy policy (deployed to root)
│   └── terms.html          ← Terms of service (deployed to root)
├── .env.example            ← Template for credentials
├── .env.local              ← Your actual credentials (git-ignored)
└── src/
    ├── index.html          ← Updated with footer links
    └── utils/
        └── constants.ts    ← Google Calendar config
```

---

## 🎯 Recommended Path

### For Quick Launch (Without Verification)

1. ✅ Build and deploy (Step 1)
2. ✅ Set up Google Cloud project (Step 2)
3. ✅ Create OAuth credentials (Step 3)
4. ✅ Add credentials to project (Step 4)
5. ✅ Secure API key (Step 5)
6. ✅ Test with yourself (Step 6)
7. ✅ Add test users (Step 9, option 1)
8. 🚀 **Launch!** (Users will see "unverified" warning but can proceed)

### For Professional Launch (With Verification)

1. ✅ Buy custom domain ($10-15/year)
2. ✅ Configure GitHub Pages custom domain
3. ✅ Complete Steps 1-6 with new domain
4. ✅ Verify domain in Google Search Console (Step 7)
5. ✅ Submit for verification (Step 8)
6. ⏱ Wait 3-6 weeks
7. 🎉 **Fully verified!** (No warnings for users)

---

## ❓ Troubleshooting

### "Redirect URI mismatch"
- Check OAuth credentials → Authorized redirect URIs
- Must match exactly: `https://komapc.github.io/year-shape/`
- Include trailing slash

### "Sign in failed"
- Check browser console for errors
- Verify CLIENT_ID in `.env.local`
- Rebuild: `npm run build`

### "Access blocked: This app's request is invalid"
- Check OAuth consent screen is published
- Verify scopes are configured
- Check authorized domains

### "Origin not allowed"
- Check OAuth credentials → Authorized JavaScript origins
- Must match: `https://komapc.github.io`
- No trailing slash on origin

---

## 📞 Need Help?

- **Google OAuth Issues:** https://support.google.com/cloud/answer/6158849
- **GitHub Pages:** https://docs.github.com/en/pages
- **Calendar API Docs:** https://developers.google.com/calendar
- **Project Issues:** https://github.com/komapc/year-shape/issues

---

## ✅ Final Checklist Before Going Public

- [ ] Privacy policy accessible and complete
- [ ] Terms of service accessible and complete
- [ ] Footer links working
- [ ] Google OAuth credentials created
- [ ] API key restricted and secured
- [ ] Test users can sign in and see events
- [ ] All features tested and working
- [ ] Source code pushed to GitHub
- [ ] Site built and deployed to GitHub Pages
- [ ] Domain verified (if applying for verification)
- [ ] README updated with setup instructions
- [ ] Changelog updated
- [ ] Consider adding screenshots/demo

**Ready to launch! 🚀**

