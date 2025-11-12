# How to Redeploy to Cloudflare Pages

## Automatic Redeployment

**Cloudflare Pages automatically redeploys when you push to Git!**

No manual action needed - just commit and push:

```bash
git add .
git commit -m "Your changes"
git push
```

Cloudflare detects the push and redeploys automatically.

---

## Manual Redeployment (Rare)

If you need to redeploy WITHOUT code changes:

### Method 1: Cloudflare Dashboard (Easiest)

1. Go to **https://dash.cloudflare.com/**
2. Navigate to **Pages** → **yearwheel**
3. Go to **Deployments** tab
4. Find the deployment you want to redeploy
5. Click **"..." (three dots)** → **"Retry deployment"**

### Method 2: Git Empty Commit

```bash
# Trigger rebuild without changes
git commit --allow-empty -m "Trigger rebuild"
git push
```

### Method 3: Cloudflare API (Advanced)

Use Cloudflare API to trigger deployment:
```bash
curl -X POST \
  "https://api.cloudflare.com/client/v4/pages/projects/yearwheel/deployments" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Which Branches Auto-Deploy?

**All branches deploy automatically!**

- `main` → Production (https://yearwheel.pages.dev/)
- `staging` → Staging (https://staging.yearwheel.pages.dev/)
- `feature/xyz` → Preview (https://feature-xyz.yearwheel.pages.dev/)
- Any PR → Preview URL

---

## Deployment Status

### Check Status

1. **In Cloudflare Dashboard:**
   - Pages → yearwheel → Deployments
   - Shows all deployments with status

2. **In GitHub:**
   - Commit has Cloudflare status check
   - ✅ Green = deployed
   - 🟡 Yellow = building
   - ❌ Red = failed

3. **In Git Commit:**
   - Click the ✅ check mark
   - See "Cloudflare Pages" status
   - Click "Details" to view build logs

### View Build Logs

If deployment fails:
1. Cloudflare dashboard → Deployments
2. Click the failed deployment
3. View build log
4. See error details

---

## Force Rebuild (If Needed)

### Scenario: Environment Variables Changed

If you updated env vars in Cloudflare:

**Option 1: Push a commit**
```bash
git commit --allow-empty -m "Rebuild with new env vars"
git push
```

**Option 2: Use dashboard**
1. Go to latest deployment
2. Click "Retry deployment"
3. New build uses updated env vars

### Scenario: Cloudflare Platform Update

Sometimes Cloudflare updates their build environment. To rebuild with new platform:

1. Dashboard → Deployments
2. Latest deployment → "..." → "Retry deployment"

---

## Deployment Limits

**Cloudflare Pages FREE tier:**
- ✅ **Unlimited** builds per month
- ✅ **Unlimited** requests
- ✅ **Unlimited** bandwidth
- ✅ 500 deployments retained (older ones pruned)
- ✅ **No credit card required**

**No limits to worry about!** 🎉

---

## Troubleshooting Redeployment

### Build Not Triggering

**Check:**
1. Cloudflare is connected to GitHub
2. Repository settings → GitHub integration active
3. Branch name is correct
4. No failed authorization

**Fix:**
- Cloudflare dashboard → Settings → Git
- Reconnect GitHub if needed

### Build Fails After Push

**Check build logs:**
1. Cloudflare dashboard → Deployments
2. Click failed deployment
3. View logs

**Common issues:**
- Missing environment variables
- TypeScript errors
- Test failures
- Wrong build directory

### Preview URL Not Working

**Check:**
1. PR is open (closed PRs don't deploy)
2. Build succeeded (check status)
3. Branch name doesn't have special characters
4. Wait 2-3 minutes for build to complete

---

## Comparison: GitHub Pages vs Cloudflare

### GitHub Pages Redeployment
```bash
git push origin main
# Wait 5-10 minutes
# GitHub Actions runs
# Deploys to komapc.github.io/year-shape/
```

### Cloudflare Pages Redeployment
```bash
git push origin main
# Wait 2-3 minutes (faster!)
# Cloudflare auto-builds
# Deploys to yearwheel.pages.dev/
```

**Cloudflare is 2-3x faster!** ⚡

---

## Quick Reference

### Trigger Production Deploy
```bash
# Merge PR to main, or:
git checkout main
git push
```

### Trigger Staging Deploy
```bash
git checkout staging  
git push
```

### Trigger Preview Deploy
```bash
# Push any branch or open PR
git checkout -b feature/test
git push -u origin feature/test
gh pr create --base staging
```

### Force Rebuild (No Code Changes)
```bash
git commit --allow-empty -m "Rebuild"
git push
```

---

## Summary

**Normal workflow - NO manual redeployment needed!**

Just `git push` and Cloudflare handles everything:
- ✅ Detects the push
- ✅ Runs build
- ✅ Runs tests
- ✅ Deploys automatically
- ✅ Updates preview URLs
- ✅ Comments on PRs

**You never need to manually trigger deployments!** 🚀

