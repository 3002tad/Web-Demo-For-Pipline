@echo off
setlocal EnableExtensions

set "RABBITMQ_LOCAL_USER=markethub"
set "RABBITMQ_LOCAL_PASS=markethub123"

if "%ERLANG_HOME%"=="" (
  if exist "%ProgramFiles%\Erlang OTP\bin\erl.exe" (
    set "ERLANG_HOME=%ProgramFiles%\Erlang OTP"
  )
)

if "%ERLANG_HOME%"=="" (
  echo ERLANG_HOME is not set and Erlang was not found at "%ProgramFiles%\Erlang OTP".
  echo Install Erlang/OTP first, then rerun this script.
  exit /b 1
)

set "PATH=%ERLANG_HOME%\bin;%PATH%"

set "RABBITMQ_SBIN="
for /d %%D in ("%ProgramFiles%\RabbitMQ Server\rabbitmq_server-*") do set "RABBITMQ_SBIN=%%D\sbin"
if "%RABBITMQ_SBIN%"=="" (
  for /f "delims=" %%D in ('where rabbitmqctl 2^>nul') do set "RABBITMQ_SBIN=%%~dpD"
)

if "%RABBITMQ_SBIN%"=="" (
  echo RabbitMQ sbin was not found.
  echo Install RabbitMQ for Windows, then rerun this script.
  exit /b 1
)

set "RABBITMQ_CTL=%RABBITMQ_SBIN%\rabbitmqctl.bat"
set "RABBITMQ_PLUGINS=%RABBITMQ_SBIN%\rabbitmq-plugins.bat"
set "RABBITMQ_SERVICE=%RABBITMQ_SBIN%\rabbitmq-service.bat"

if not exist "%RABBITMQ_CTL%" (
  echo rabbitmqctl.bat was not found at %RABBITMQ_CTL%
  exit /b 1
)

if exist "%RABBITMQ_SERVICE%" (
  call "%RABBITMQ_SERVICE%" start >nul 2>nul
)

echo Waiting for local RabbitMQ node...
call "%RABBITMQ_CTL%" await_startup
if errorlevel 1 (
  echo RabbitMQ is not running. Start the RabbitMQ Windows service, then rerun this script.
  exit /b 1
)

echo Enabling RabbitMQ management plugin...
call "%RABBITMQ_PLUGINS%" enable rabbitmq_management
if errorlevel 1 (
  echo Could not enable rabbitmq_management.
  exit /b 1
)

echo Creating or updating local user %RABBITMQ_LOCAL_USER%...
call "%RABBITMQ_CTL%" add_user %RABBITMQ_LOCAL_USER% %RABBITMQ_LOCAL_PASS% >nul 2>nul
if errorlevel 1 (
  call "%RABBITMQ_CTL%" change_password %RABBITMQ_LOCAL_USER% %RABBITMQ_LOCAL_PASS%
  if errorlevel 1 (
    echo Could not create or update RabbitMQ user.
    exit /b 1
  )
)

call "%RABBITMQ_CTL%" set_user_tags %RABBITMQ_LOCAL_USER% administrator
if errorlevel 1 exit /b 1

call "%RABBITMQ_CTL%" set_permissions -p / %RABBITMQ_LOCAL_USER% ".*" ".*" ".*"
if errorlevel 1 exit /b 1

echo.
echo Local RabbitMQ is ready.
echo AMQP URL: amqp://%RABBITMQ_LOCAL_USER%:%RABBITMQ_LOCAL_PASS%@localhost:5672
echo UI:       http://localhost:15672
echo Login:    %RABBITMQ_LOCAL_USER% / %RABBITMQ_LOCAL_PASS%
exit /b 0
