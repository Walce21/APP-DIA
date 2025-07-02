// js/focusModeManager.js

import * as state from './state.js';
import * as dom from './domElements.js';
import * as canvasManager from './canvasManager.js';
import * as uiManager from './uiManager.js';

// --- INÍCIO DA ALTERAÇÃO ---

// Variáveis para armazenar os painéis originais dos conteúdos das ferramentas
let toolsContentParent = null;
let roiToolsContentParent = null;

// Variáveis para armazenar os próprios conteúdos que serão movidos
let toolsContentWrapper = null;
let roiToolsContentWrapper = null;

let initialized = false;

/**
 * Guarda as referências dos painéis originais e seus conteúdos.
 * Executado apenas uma vez.
 */
function initializeIfNeeded() {
    if (initialized) return;

    // Busca os painéis que contêm as ferramentas
    const toolsPanel = document.getElementById('tools-panel');
    const roiToolsPanel = document.getElementById('roi-tools-panel');

    if (toolsPanel && roiToolsPanel) {
        // Guarda a referência dos painéis-pai
        toolsContentParent = toolsPanel;
        roiToolsContentParent = roiToolsPanel;
        
        // Guarda a referência dos conteúdos que serão movidos
        toolsContentWrapper = toolsPanel.querySelector('.panel-content-wrapper');
        roiToolsContentWrapper = roiToolsPanel.querySelector('.panel-content-wrapper');
        
        if (toolsContentWrapper && roiToolsContentWrapper) {
            initialized = true;
            log('focusModeManager', 'info', 'Focus Mode Manager inicializado com sucesso.');
        } else {
            log('focusModeManager', 'error', 'Wrappers de conteúdo dos painéis de ferramentas não encontrados.');
        }
    } else {
        log('focusModeManager', 'error', 'Painéis de ferramentas originais não encontrados no DOM.');
    }
}

/**
 * Alterna o estado e a interface do Modo Foco, movendo os painéis de ferramentas
 * para uma barra flutuante otimizada.
 */
export function toggleFocusMode() {
    initializeIfNeeded();
    if (!initialized || !dom.focusModeToolbar) {
        log('focusModeManager', 'error', 'Modo Foco não pode ser ativado: inicialização falhou ou a barra de ferramentas não foi encontrada.');
        return;
    }

    state.toggleFocusMode();
    const isInFocusMode = state.isFocusMode();
    log('focusModeManager', 'info', `Alternando Modo Foco para: ${isInFocusMode ? 'ATIVADO' : 'DESATIVADO'}.`);
    
    document.body.classList.toggle('focus-mode-on', isInFocusMode);

    if (isInFocusMode) {
        // Move os conteúdos dos painéis originais para a barra de ferramentas flutuante
        dom.focusModeToolbar.appendChild(toolsContentWrapper);
        dom.focusModeToolbar.appendChild(roiToolsContentWrapper);
        
        // Exibe a barra de ferramentas
        dom.focusModeToolbar.classList.remove('hidden');
        log('focusModeManager', 'dom', 'Conteúdo das ferramentas movido para a barra flutuante.');

    } else {
        // Move os conteúdos de volta para seus painéis originais
        toolsContentParent.appendChild(toolsContentWrapper);
        roiToolsContentParent.appendChild(roiToolsContentWrapper);

        // Oculta a barra de ferramentas
        dom.focusModeToolbar.classList.add('hidden');
        log('focusModeManager', 'dom', 'Conteúdo das ferramentas restaurado aos painéis originais.');
    }
    
    // Solicita um quadro de animação para garantir que o DOM seja atualizado
    // antes de redimensionar o canvas. Isso previne bugs de layout.
    requestAnimationFrame(() => {
        canvasManager.resizeCanvasToContainer();
        uiManager.updateAllDynamicContent();
    });
}

/**
 * Função de inicialização do módulo.
 * A inicialização agora é "lazy" (preguiçosa), ocorrendo na primeira
 * vez que o modo foco é ativado para garantir que todos os elementos do DOM estejam prontos.
 */
export function initialize() {
    // A inicialização foi movida para initializeIfNeeded() para maior robustez.
}

// --- FIM DA ALTERAÇÃO ---