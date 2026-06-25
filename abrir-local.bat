@echo off
chcp 65001 >nul
title CONECTA - Servidor Local
cd /d "%~dp0"

echo.
echo  Iniciando o CONECTA no seu computador...
echo.

REM Abre o navegador na pagina local apos 2 segundos
start "" /b cmd /c "timeout /t 2 >nul & start http://localhost:8080/"

REM Sobe o servidor (esta janela preta precisa ficar aberta enquanto usa o sistema)
node servidor-local.js

echo.
echo  O servidor parou. Pode fechar esta janela.
pause
