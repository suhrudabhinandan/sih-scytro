@echo off
echo Starting Chrome with disabled web security for camera access...
echo WARNING: This should ONLY be used for local development!
echo.
start chrome --user-data-dir="C:\temp\chrome-dev" --disable-web-security --disable-features=VizDisplayCompositor --allow-running-insecure-content --unsafely-treat-insecure-origin-as-secure=http://localhost:3000
echo.
echo Chrome started with disabled security.
echo You can now access http://localhost:3000 and use the camera.
echo.
pause