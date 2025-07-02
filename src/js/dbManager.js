// js/dbManager.js

const DB_NAME = 'ImageAnalysisDB';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';
let db;

function openDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        log('dbManager', 'info', "Abrindo conexão com IndexedDB...");
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            log('dbManager', 'error', "Erro ao abrir o IndexedDB:", event.target.error);
            reject("Erro de banco de dados.");
        };

        request.onsuccess = (event) => {
            log('dbManager', 'info', "Conexão com IndexedDB estabelecida com sucesso.");
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            log('dbManager', 'info', "Atualizando estrutura do IndexedDB (onupgradeneeded).");
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                log('dbManager', 'info', `Object store '${STORE_NAME}' criado.`);
            }
        };
    });
}

export async function saveSessionToDB(sessionData) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(sessionData);

        request.onsuccess = () => {
            log('dbManager', 'info', "Sessão salva no IndexedDB com sucesso.", sessionData.id);
            resolve();
        };

        request.onerror = (event) => {
            log('dbManager', 'error', "Erro ao salvar no IndexedDB:", event.target.error);
            reject("Falha ao salvar a sessão no banco de dados.");
        };
    });
}

export async function loadSessionFromDB(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            if (request.result) {
                log('dbManager', 'info', "Sessão carregada do IndexedDB com sucesso.", id);
            } else {
                log('dbManager', 'warn', "Nenhuma sessão encontrada no IndexedDB para o id:", id);
            }
            resolve(request.result);
        };

        request.onerror = (event) => {
            log('dbManager', 'error', "Erro ao carregar do IndexedDB:", event.target.error);
            reject("Falha ao carregar a sessão do banco de dados.");
        };
    });
}