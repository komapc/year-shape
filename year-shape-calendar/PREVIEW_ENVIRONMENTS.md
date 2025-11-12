# Preview Environments for YearWheel

## The Problem

**GitHub Pages doesn't support preview environments!**
- Only ONE deployment per repository
- No automatic PR previews
- Can't test multiple versions simultaneously

## Solutions

### Option 1: Vercel (Recommended - Free)

**What you get:**
- ✅ Automatic preview URL for EVERY PR
- ✅ Comment on PR with preview link
- ✅ Production deployment from `main`
- ✅ Unlimited free deployments
- ✅ No configuration needed

**Setup (5 minutes):**

#### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with your GitHub account
3. Free forever for personal projects

#### Step 2: Import Project
1. Click "Add New" → "Project"
2. Select `komapc/year-shape` repository
3. **Root Directory:** `year-shape-calendar`
4. **Framework Preset:** Vite
5. **Build Command:** `npm run build`
6. **Output Directory:** `dist`
7. Click "Deploy"

#### Step 3: Configure Environment Variables
In Vercel dashboard → Settings → Environment Variables:
- `VITE_GOOGLE_CLIENT_ID` = (your client ID)
- `VITE_GOOGLE_API_KEY` = (your API key)

#### Step 4: Configure Production Branch
In Vercel → Settings → Git:
- **Production Branch:** `main`
- All other branches → Preview deployments

#### Step 5: Add Vercel Secrets to GitHub (for workflow automation)
Go to GitHub → Settings → Secrets → New secret:
- `VERCEL_TOKEN` - Get from Vercel → Settings → Tokens
- `VERCEL_ORG_ID` - Get from Vercel project settings (Team ID)
- `VERCEL_PROJECT_ID` - Get from Vercel project settings

**That's it!** Now:
- Every PR gets a preview URL automatically
- `main` branch → Production (https://yearwheel.vercel.app)
- `staging` branch → Staging preview
- PR branches → Unique preview URLs

**Workflow created:** `.github/workflows/deploy-preview.yml` (optional, for PR comments)

---

### Option 2: Netlify (Alternative to Vercel)

Very similar to Vercel:
1. Sign up at https://netlify.com
2. Import GitHub repo
3. Set build settings
4. Configure environment variables
5. Done!

**Auto-previews for every PR, same as Vercel.**

---

### Option 3: GitHub Pages with Subdirectories (Complex)

**Not recommended** - requires complex routing:

Deploy each PR to subdirectory:
- `main` → `/year-shape/`
- PR #17 → `/year-shape/pr-17/`
- PR #18 → `/year-shape/pr-18/`

**Problems:**
- Complex GitHub Actions workflow
- Cleanup required after PR merge
- Routing issues with Vite base path
- Not worth the effort

---

### Option 4: Separate Staging Repository

Create `komapc/year-shape-staging` repo:

**Setup:**
1. Create new repo: `komapc/year-shape-staging`
2. Update `.github/workflows/deploy-staging.yml`:
   ```yaml
   - name: Push to staging repo
     run: |
       git clone https://github.com/komapc/year-shape-staging.git staging-deploy
       cp -r dist/* staging-deploy/
       cd staging-deploy
       git add .
       git commit -m "Deploy from staging branch"
       git push
   ```

**Problems:**
- Maintain two repos
- Manual sync
- No PR previews (still only staging vs production)

---

## Comparison

| Feature | GitHub Pages | Vercel | Netlify |
|---------|-------------|--------|---------|
| Free tier | ✅ Yes | ✅ Yes | ✅ Yes |
| PR previews | ❌ No | ✅ Yes | ✅ Yes |
| Custom domain | ✅ Yes | ✅ Yes | ✅ Yes |
| Build minutes | Unlimited | 6000/month | 300/month |
| Bandwidth | 100GB/month | 100GB/month | 100GB/month |
| Setup difficulty | Easy | Very Easy | Very Easy |
| Preview URLs | ❌ No | ✅ Auto | ✅ Auto |

---

## Recommendation: Hybrid Approach

**Best of both worlds:**

1. **Production:** GitHub Pages (free, fast, integrated)
   - Deploy from `main` branch
   - URL: https://komapc.github.io/year-shape/

2. **Staging + PR Previews:** Vercel (free, preview URLs)
   - Auto-deploy from `staging` branch
   - Preview URL for every PR
   - URL: https://yearwheel.vercel.app (or custom domain)

**Why this works:**
- ✅ Keep GitHub Pages for production (no migration)
- ✅ Add Vercel ONLY for staging/previews
- ✅ Zero cost
- ✅ Best developer experience
- ✅ No code changes needed

---

## How to Implement (Hybrid Approach)

### Step 1: Keep GitHub Pages for Production

Current setup stays as-is:
- `.github/workflows/deploy.yml` → Deploys `main` to GitHub Pages
- Production URL: https://komapc.github.io/year-shape/

### Step 2: Add Vercel for Staging

1. **Sign up for Vercel** (free)
2. **Import project:**
   - Root: `year-shape-calendar`
   - Framework: Vite
   - No changes to code needed
3. **Configure:**
   - Production branch: `staging` (NOT main!)
   - This makes Vercel handle staging only
4. **Environment variables:**
   - Add Google API credentials

### Step 3: Update Workflows

**Keep:**
- `.github/workflows/deploy.yml` - Production (GitHub Pages)

**Optional:**
- `.github/workflows/deploy-staging.yml` - Disable or delete (Vercel handles this)

**Add (optional):**
- `.github/workflows/deploy-preview.yml` - Post preview URLs to PRs

### Step 4: Update Documentation

```markdown
## Environments

- **Production:** https://komapc.github.io/year-shape/ (GitHub Pages)
- **Staging:** https://yearwheel.vercel.app (Vercel)
- **PR Previews:** Unique URL for each PR (Vercel)
```

---

## Result

**After setup:**

1. **Create PR to `staging`:**
   - Vercel auto-deploys
   - Posts preview URL in PR comment
   - Test at unique URL

2. **Merge to `staging`:**
   - Vercel deploys to staging URL
   - Everyone can test at https://yearwheel.vercel.app

3. **Create PR from `staging` to `main`:**
   - Vercel creates preview
   - GitHub Actions runs tests

4. **Merge to `main`:**
   - GitHub Pages deploys to production
   - Live at https://komapc.github.io/year-shape/

**You get:**
- ✅ Production on GitHub Pages (familiar, free)
- ✅ Staging on Vercel (preview URLs!)
- ✅ Preview URL for every PR
- ✅ Zero cost
- ✅ Professional workflow

---

## Want Me to Set This Up?

I can:
1. Create Vercel configuration file (`vercel.json`)
2. Update documentation with Vercel setup
3. Create the preview workflow
4. Guide you through Vercel account setup

**Just say "implement Vercel preview" and I'll do it!** 🚀
