# Cloudflare Pages Deployment

YearWheel is deployed using Cloudflare Pages for superior performance and preview environments.

## Live URLs

- **Production:** https://yearwheel.pages.dev/
- **Staging:** https://staging.yearwheel.pages.dev/
- **PR Previews:** Each PR gets: `https://<branch-name>.yearwheel.pages.dev/`

## How It Works

### Automatic Deployments

Cloudflare Pages automatically deploys:

1. **Production** - Every push to `main` branch
   - Runs tests
   - Builds the app
   - Deploys to https://yearwheel.pages.dev/

2. **Staging** - Every push to `staging` branch
   - Deploys to https://staging.yearwheel.pages.dev/

3. **PR Previews** - Every pull request
   - Creates unique preview URL
   - Comments on PR with the URL
   - Updates on every commit

### Build Configuration

**Set in Cloudflare Pages dashboard:**
```
Root directory: year-shape-calendar
Build command: npm install && npm run build
Build output: dist
Framework: Vite (auto-detected)
Node version: 20.x
```

**Environment Variables:**
- `VITE_GOOGLE_CLIENT_ID` - OAuth Client ID
- `VITE_GOOGLE_API_KEY` - Calendar API Key

## Deployment Workflow

### Normal Feature Development

```bash
# 1. Create feature from staging
git checkout staging
git pull
git checkout -b feature/my-feature

# 2. Develop locally
npm run dev

# 3. Push and create PR
git push -u origin feature/my-feature
gh pr create --base staging --title "Feature: My Feature"

# 4. Cloudflare automatically:
#    - Builds your branch
#    - Deploys to preview URL
#    - Comments on PR: "Preview: https://feature-my-feature.yearwheel.pages.dev"

# 5. Test on preview URL before merging!
```

### Promoting to Production

```bash
# When staging is stable
git checkout staging
gh pr create --base main --title "Release: v0.5.2"

# After merge:
# - Cloudflare deploys to https://yearwheel.pages.dev/
```

## Advantages Over GitHub Pages

| Feature | GitHub Pages | Cloudflare Pages |
|---------|-------------|------------------|
| PR Previews | ❌ No | ✅ Yes (automatic) |
| Build Time | 5-10 min | **2-3 min** |
| Bandwidth | 100GB/mo | **Unlimited** |
| Builds/month | Unlimited | **Unlimited** |
| Global CDN | Limited | **200+ locations** |
| Analytics | ❌ | ✅ Free |
| Custom domains | 1 | **Unlimited** |
| SSL | ✅ | ✅ |
| Redirects | Limited | **Full support** |
| Headers | Limited | **Full control** |

## Managing Deployments

### Cloudflare Dashboard

Access at: https://dash.cloudflare.com/

**View:**
- All deployments (production + previews)
- Build logs
- Analytics
- Custom domains
- Environment variables

### Rollback

In Cloudflare dashboard:
1. Go to deployments
2. Find previous successful deployment
3. Click "..." → "Rollback to this deployment"
4. Instant rollback (no rebuild needed)

### Deployment Status

Every commit shows deployment status:
- ✅ Green check = deployed successfully
- ❌ Red X = build failed
- 🟡 Yellow dot = deploying

Click the check to see:
- Preview URL
- Build logs
- Deployment details

## Custom Domain (Optional)

### Add Custom Domain

1. In Cloudflare Pages → **Custom domains**
2. Click **"Set up a custom domain"**
3. Enter your domain (e.g., `yearwheel.com`)
4. Update DNS:
   - **CNAME:** `yearwheel.com` → `yearwheel.pages.dev`
5. SSL automatically provisioned (free)

**Result:**
- Production: https://yearwheel.com
- Staging: https://staging.yearwheel.com
- Previews: https://pr-17.yearwheel.com

## Troubleshooting

### Build Failing

Check Cloudflare dashboard → Deployment → View logs

Common issues:
- Missing environment variables
- Wrong build command
- Wrong output directory
- Node version mismatch

### Preview URL 404

- Check build output directory is correct
- Ensure `vite.config.ts` uses `base: '/'` for Cloudflare
- Clear browser cache

### Google Calendar Not Working

- Verify environment variables are set for **BOTH** Production AND Preview
- Add preview URLs to Google OAuth authorized origins:
  - `https://yearwheel.pages.dev`
  - `https://*.yearwheel.pages.dev`

## Comparison to Previous Setup

### Before (GitHub Pages):
- ❌ Only production deployment
- ❌ No preview URLs
- ❌ Manual testing before merge
- ❌ Risk of breaking production

### After (Cloudflare Pages):
- ✅ Production + staging + unlimited previews
- ✅ Every PR gets its own URL
- ✅ Test safely before merging
- ✅ Zero risk to production
- ✅ Faster builds
- ✅ Better analytics

## GitHub Actions Changes

GitHub Pages workflows are **disabled** (renamed to `.disabled`):
- `.github/workflows/deploy-github-pages.yml.disabled`
- `.github/workflows/deploy-staging.yml.disabled`

Cloudflare handles all deployments automatically through Git integration - no GitHub Actions needed!

## Next Steps

1. ✅ Click "Save and Deploy" in Cloudflare
2. ⏳ Wait for first deployment (2-3 minutes)
3. ✅ Visit https://yearwheel.pages.dev/
4. ✅ Test the application
5. ✅ Update Google OAuth with new URL
6. 🎉 Done!

## Support

**Cloudflare Pages Docs:** https://developers.cloudflare.com/pages/

**Common tasks:**
- View deployments: Dashboard → Pages → yearwheel
- Check analytics: Dashboard → Pages → yearwheel → Analytics
- Manage domains: Dashboard → Pages → yearwheel → Custom domains

