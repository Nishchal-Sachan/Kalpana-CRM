@echo off
echo Starting Kalpana Solar Application...
echo.
echo Starting Backend (Port 5000)...
start "Kalpana Solar Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 3 /nobreak > nul
echo Starting Frontend (Port 5173)...
start "Kalpana Solar Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo.
echo Kalpana Solar is starting!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:5000/api
echo.
echo To seed the database (first time only):
echo   cd backend && npm run seed
pause
