@echo off
REM ===============================
REM  Assetto Corsa Lap Times Update
REM ===============================

REM 1️⃣ Run Python script to export lap times
echo Running Python script to export lap times...
python export_ac_times.py

REM 2️⃣ Go to project folder
cd /c/acweb-git

REM 3️⃣ Add all changes to Git
echo Adding files to Git...
git add .

REM 4️⃣ Commit changes with timestamp
set commitMsg=Auto-update on %date% at %time%
echo Committing with message: %commitMsg%
git commit -m "%commitMsg%"

REM 5️⃣ Push to GitHub
echo Pushing to GitHub...
git push origin main

echo ✅ Site updated and pushed to GitHub!
pause
