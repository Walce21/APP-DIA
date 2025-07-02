// js/main.js

import * as canvasManager from './canvasManager.js';
import * as eventBinder from './eventBinder.js';
import * as dom from './domElements.js';
import * as uiManager from './uiManager.js';
import * as chartManager from './chartManager.js';
import * as exportManager from './exportManager.js';
import * as focusModeManager from './focusModeManager.js';
import * as autoRoiDetector from './autoRoiDetector.js';
// --- INÍCIO DA ALTERAÇÃO ---
// Importa o módulo de ações para despachar a mudança de estado inicial.
import * as actions from './stateActions.js';
// --- FIM DA ALTERAÇÃO ---


document.addEventListener('DOMContentLoaded', () => {
    // ETAPA P260625B-02: A primeira ação DEVE ser inicializar as referências do DOM
    // para garantir que todos os módulos subsequentes possam acessá-las com segurança.
    dom.initializeDomElements();

    // Log inicial para marcar o início da execução da aplicação
    log('main', 'info', 'Aplicação iniciada. Evento DOMContentLoaded disparado.');
    
    if (dom.currentYear) {
        dom.currentYear.textContent = new Date().getFullYear();
    }

    // Inicializa os módulos principais
    canvasManager.initializeCanvas();
    canvasManager.resizeCanvasToContainer();
    eventBinder.bindEventListeners();
    chartManager.initializeChart();
    exportManager.initializeExport();
    focusModeManager.initialize();
    autoRoiDetector.initializeAutoRoiDetectorEvents();
    
    // --- INÍCIO DA ALTERAÇÃO ---
    // Define a ferramenta inicial através de uma ação, garantindo o fluxo de dados correto.
    actions.changeCurrentTool('pointer');
    // --- FIM DA ALTERAÇÃO ---
    uiManager.initializeUI();
    
    // Log final para marcar a conclusão bem-sucedida da inicialização
    log('main', 'info', 'Todos os módulos foram inicializados com sucesso. Aplicação pronta.');
});