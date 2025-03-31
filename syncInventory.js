import { Client } from "@notionhq/client";
import dotenv from "dotenv";

dotenv.config();

// Configurar Notion API
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// IDs das databases
const INVENTORY_DB_ID = process.env.INVENTORY_DB_ID;
const CHARACTERS_DB_ID = process.env.CHARACTERS_DB_ID;

// Busca todos os itens do inventário
async function getInventoryItems() {
    const response = await notion.databases.query({ database_id: INVENTORY_DB_ID });
    return response.results;
}

// Busca todos os personagens
async function getCharacters() {
    const response = await notion.databases.query({ database_id: CHARACTERS_DB_ID });
    return response.results;
}

// Cria um novo personagem caso não exista
async function createCharacter(name) {
    const response = await notion.pages.create({
        parent: { database_id: CHARACTERS_DB_ID },
        properties: {
            "Nome": { title: [{ text: { content: name } }] },
            "Limite Peso": { number: 100 }, // Peso limite padrão
            "Itens": { relation: [] }, // Inicia sem itens
            "Peso Total": { number: 0 }
        }
    });

    console.log(`🆕 Criado novo personagem: ${name} (ID: ${response.id})`);
    return response.id;
}

// Atualiza a relação entre "Pessoa" e personagens no Notion
async function updateInventoryRelations() {
    const inventoryItems = await getInventoryItems();
    const characters = await getCharacters();

    const characterMap = characters.reduce((map, char) => {
        const charName = char.properties["Nome"].title[0]?.text.content;
        if (charName) map[charName] = char.id;
        return map;
    }, {});

    for (const item of inventoryItems) {
        const personName = item.properties["Pessoa"].select?.name;
        const currentRelation = item.properties["Dono"].relation;

        if (personName) {
            let characterId = characterMap[personName];

            if (!characterId) {
                characterId = await createCharacter(personName);
                characterMap[personName] = characterId;
            }

            if (currentRelation.length > 0 && currentRelation[0].id === characterId) {
                continue;
            }

            await notion.pages.update({
                page_id: item.id,
                properties: {
                    "Dono": { relation: [{ id: characterId }] }
                }
            });

            console.log(`🔗 Atualizado: Item ${item.id} agora pertence ao personagem ${personName}.`);
        }
    }
}

// Atualiza a relação do personagem com os itens que ele possui
async function updateCharacterItems() {
    const inventoryItems = await getInventoryItems();
    const characters = await getCharacters();

    let characterItemsMap = {};

    inventoryItems.forEach((item) => {
        const owner = item.properties["Dono"].relation[0]?.id;
        if (owner) {
            if (!characterItemsMap[owner]) characterItemsMap[owner] = [];
            characterItemsMap[owner].push({ id: item.id });
        }
    });

    for (const [charId, items] of Object.entries(characterItemsMap)) {
        await notion.pages.update({
            page_id: charId,
            properties: {
                "Itens": { relation: items }
            }
        });

        console.log(`✅ Atualizado: Personagem ${charId} agora possui ${items.length} itens.`);
    }
}

// Função para verificar mudanças a cada intervalo de 1 minuto
let isPolling = false; // Flag para controlar a execução

async function startPolling() {
    setInterval(async () => {
        if (isPolling) {
            console.log("Uma verificação já está em andamento. Aguardando a conclusão...");
            return;
        }

        isPolling = true; // Inicia a execução
        console.log("Verificando mudanças no Notion...");
        await updateInventoryRelations();
        await updateCharacterItems();
        isPolling = false; // Conclui a execução
    }, 60000); // Intervalo de 60 segundos (1 minuto)
}

// Começar o polling
startPolling();
