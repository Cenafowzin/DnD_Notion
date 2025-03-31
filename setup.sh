#!/bin/bash

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null
then
    echo "[ERRO] Node.js não encontrado. Por favor, instale o Node.js."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null
then
    echo "[ERRO] npm não encontrado. Instalando o npm..."
    npm install -g npm
fi

# Instalar as dependências do projeto
echo "Instalando dependências..."
npm install

# Rodar o script
echo "Rodando o script..."
node seu_arquivo.js
