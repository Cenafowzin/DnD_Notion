@echo off
:: Verificar se o Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js não encontrado. Por favor, instale o Node.js.
    pause
    exit /b
)

:: Verificar se o npm está instalado
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] npm não encontrado. Instalando o npm...
    npm install -g npm
)

:: Instalar as dependências do projeto
echo Instalando dependências...
npm install

:: Rodar o script
echo Rodando o script...
node seu_arquivo.js

pause
