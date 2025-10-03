@echo off
REM 1️⃣ Run Python script to export lap times
python export_ac_times.py

REM 2️⃣ Add all changes to Git
cd /c/acweb-git
git add .

REM 3️⃣ Commit changes with a message
git commit -m "Automatic update of lap times and files"

REM 4️⃣ Push to GitHub
git push origin main

echo ✅ Site updated and pushed to GitHub!
pause
