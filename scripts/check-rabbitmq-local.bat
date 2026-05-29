@echo off
setlocal EnableExtensions

if "%ERLANG_HOME%"=="" (
  if exist "%ProgramFiles%\Erlang OTP\bin\erl.exe" (
    set "ERLANG_HOME=%ProgramFiles%\Erlang OTP"
  )
)

if "%ERLANG_HOME%"=="" (
  echo ERLANG_HOME is not set and Erlang was not found.
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
  exit /b 1
)

call "%RABBITMQ_SBIN%\rabbitmqctl.bat" status
if errorlevel 1 (
  echo RabbitMQ local node is not reachable.
  exit /b 1
)

echo.
echo RabbitMQ local node is reachable.
exit /b 0
