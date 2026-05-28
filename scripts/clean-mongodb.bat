@echo off
setlocal EnableExtensions

if "%CLEAN_MONGODB_CONFIRM%" NEQ "yes" (
  echo MongoDB clean script refused to run.
  echo.
  echo Required:
  echo   set CLEAN_MONGODB_CONFIRM=yes
  echo.
  echo Optional:
  echo   set CLEAN_MONGODB_SCOPE=runtime
  echo   set CLEAN_MONGODB_SCOPE=demo
  echo   set CLEAN_MONGODB_SCOPE=all
  echo.
  echo Examples:
  echo   set CLEAN_MONGODB_CONFIRM=yes
  echo   scripts\clean-mongodb.bat
  echo.
  echo   set CLEAN_MONGODB_CONFIRM=yes
  echo   set CLEAN_MONGODB_SCOPE=demo
  echo   scripts\clean-mongodb.bat
  exit /b 1
)

if "%MONGO_URI%"=="" (
  set "MONGO_URI=mongodb://localhost:27017/markethub_demo"
)

if "%CLEAN_MONGODB_SCOPE%"=="" (
  set "CLEAN_MONGODB_SCOPE=runtime"
)

where mongosh >nul 2>nul
if errorlevel 1 (
  echo mongosh was not found in PATH.
  echo Install MongoDB Shell or add mongosh.exe to PATH.
  exit /b 1
)

if /I "%CLEAN_MONGODB_SCOPE%"=="runtime" (
  set "MONGO_CLEAN_JS=db.carts.deleteMany({}); db.demoorders.deleteMany({}); db.trackingdebugevents.deleteMany({}); print('Cleaned runtime collections');"
  goto run_clean
)

if /I "%CLEAN_MONGODB_SCOPE%"=="demo" (
  set "MONGO_CLEAN_JS=db.products.deleteMany({}); db.categories.deleteMany({}); db.suppliers.deleteMany({}); db.carts.deleteMany({}); db.demoorders.deleteMany({}); db.trackingdebugevents.deleteMany({}); db.users.deleteMany({}); print('Cleaned demo collections');"
  goto run_clean
)

if /I "%CLEAN_MONGODB_SCOPE%"=="all" (
  set "MONGO_CLEAN_JS=db.dropDatabase(); print('Dropped database');"
  goto run_clean
)

echo Invalid CLEAN_MONGODB_SCOPE: %CLEAN_MONGODB_SCOPE%
echo Valid scopes: runtime, demo, all
exit /b 1

:run_clean
echo MONGO_URI=%MONGO_URI%
echo CLEAN_MONGODB_SCOPE=%CLEAN_MONGODB_SCOPE%
mongosh "%MONGO_URI%" --quiet --eval "%MONGO_CLEAN_JS%"
if errorlevel 1 (
  echo MongoDB clean failed.
  exit /b 1
)

echo MongoDB clean completed.
exit /b 0
