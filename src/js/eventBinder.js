// js/eventBinder.js

/**
 * MÓDULO ORQUESTRADOR DE EVENTOS
 * * Este arquivo, antes monolítico, agora atua como um ponto de entrada centralizado.
 * Sua única responsabilidade é importar todos os módulos "binder" especializados e
 * invocar suas funções de inicialização na ordem correta.
 */

// 1. Importa todos os novos módulos binder
import * as workerManager from './workerManager.js';
import * as globalEventBinder from './globalEventBinder.js';
import * as uiControlBinder from './uiControlBinder.js';
import * as roiActionPanelBinder from './roiActionPanelBinder.js';
import * as analysisPanelBinder from './analysisPanelBinder.js';
import * as modalBinder from './modalBinder.js';

// Importa o sessionManager apenas para a verificação inicial, que é uma tarefa de inicialização.
import * as sessionManager from './sessionManager.js';

/**
 * A nova função principal `bindEventListeners`, agora atuando como um orquestrador.
 */
export function bindEventListeners() {
    log('eventBinder', 'info', "Orquestrador de eventos iniciado. Vinculando todos os módulos de binders...");

    // 2. Inicializa cada módulo na sequência apropriada
    workerManager.initWorkerManager();
    globalEventBinder.bindGlobalEvents();
    uiControlBinder.bindUiControls();
    roiActionPanelBinder.bindRoiActionPanelEvents();
    analysisPanelBinder.bindAnalysisPanelEvents();
    modalBinder.bindModalEvents();

    // NOTA DE REATORAÇÃO: Os listeners para eventos customizados da janela (ex: 'generate-regressions')
    // foram removidos. A nova abordagem é que os módulos que precisam enviar tarefas para o worker
    // (como o chartManager) devem agora importar o `workerManager` e usar diretamente a função
    // `workerManager.sendMessageToWorker()`. Isso remove a necessidade de um event bus global na `window`.

    // 3. Executa tarefas de inicialização que estavam no final da função antiga
    sessionManager.checkForSavedSession();
    // A chamada para `userProfile.initializeUserProfile()` foi movida para `uiControlBinder.js`,
    // pois está diretamente ligada a um controle de UI estático (o botão de Configurações).

    log('eventBinder', 'success', "Todos os binders de eventos foram inicializados pelo orquestrador.");
}