# Curriculum Live Backup — 20260617-064837

Purpose: Backup before the top 1% curriculum hub upgrade.

Backup branch: backup/live-curriculum-before-top1-20260617-064837
Backup tag:    backup-curriculum-before-top1-20260617-064837
Original main commit: 8bee62eeab17d303d9406646207fca1189717761
Original live URL: https://eduwonderlab.com/curriculum/

## Rollback (this repo deploys via Cloudflare Git integration — push to main IS the deploy)
git switch main
git reset --hard backup-curriculum-before-top1-20260617-064837
git push --force-with-lease origin main   # CF auto-rebuilds & promotes to production

## Safer rollback (revert-style, no history rewrite)
git switch main
git pull origin main
git revert --no-edit <merge-sha>
git push origin main
