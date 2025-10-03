@echo off
echo Running Python script to export lap times...
python "C:\Users\pizza\Desktop\acweb-git\export_ac_times.py"

cd "C:\Users\pizza\Desktop\acweb-git"

echo Pulling remote changes...
git pull origin main --rebase

echo Adding files to Git...
git add .

echo Committing...
git commit -m "Auto-update on %date% at %time%"

echo Pushing to GitHub...
git push origin main

echo ✅ Site updated and pushed!
pause
