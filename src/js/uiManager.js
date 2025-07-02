// js/uiManager.js

import * as state from './state.js';
import * as dom from './domElements.js';
import * as domRenderer from './domRenderer.js';
import * as drawingHandler from './drawingHandler.js';
import * as roiManager from './roiManager.js';

let cvReadyCheckInterval = null;

// --- Agendador de UI Inteligente ---

let isUpdateScheduled = false;
let pendingUpdates = [];

/**
 * Processa a fila de atualizações de estado pendentes, escolhendo a forma mais
 * otimizada de atualizar a UI.
 */
function executePendingUpdate() {
    if (pendingUpdates.length === 0) {
        isUpdateScheduled = false;
        return;
    }

    log('uiManager', 'perf', `Executando ${pendingUpdates.length} atualizações agendadas.`);
    
    const updatesToProcess = [...pendingUpdates];
    pendingUpdates = [];
    isUpdateScheduled = false;

    if (updatesToProcess.some(u => ['full_reset', 'session_restore', 'roi_add_batch', 'roi_order_change'].includes(u.type))) {
        log('uiManager', 'info', "Atualização completa detectada. Executando updateAllDynamicContent.");
        updateAllDynamicContent();
        return;
    }

    const roisToUpdateData = new Map();
    const roisToUpdateVisuals = new Map();
    let selectionChanged = false;
    let calibrationTableNeedsUpdate = false;
    // --- INÍCIO DA CORREÇÃO (BUGFIX-SAMPLE-RENDER-01) ---
    let samplePredictionNeedsUpdate = false;
    // --- FIM DA CORREÇÃO ---

    updatesToProcess.forEach(update => {
        switch (update.type) {
            case 'roi_add':
                if (update.payload) domRenderer.appendNewRoiCard(update.payload);
                calibrationTableNeedsUpdate = true;
                selectionChanged = true;
                break;
            case 'roi_delete':
                if (update.payload && update.payload.roiIds) {
                    update.payload.roiIds.forEach(id => domRenderer.removeRoiCard(id));
                }
                calibrationTableNeedsUpdate = true;
                break;
            
            case 'analysis_update':
                // --- INÍCIO DA CORREÇÃO (BUGFIX-SAMPLE-RENDER-01) ---
                // Marca que os componentes de predição precisam ser redesenhados.
                samplePredictionNeedsUpdate = true;
                // --- FIM DA CORREÇÃO ---
                // O 'case' continua para também atualizar os dados dos cards.
            case 'roi_data_change':
                if (update.payload) {
                    const rois = Array.isArray(update.payload) ? update.payload : [update.payload];
                    rois.forEach(roi => {
                        if (roi && roi.id) {
                            roisToUpdateData.set(roi.id, roi);
                        }
                    });
                }
                break;
            
            case 'ui_toggle':
            case 'roi_attribute_change':
                if (update.payload) {
                    const rois = Array.isArray(update.payload) ? update.payload : [update.payload];
                    rois.forEach(roi => {
                        if (roi && roi.id) {
                            roisToUpdateVisuals.set(roi.id, roi);
                        }
                    });
                }
                if (update.type === 'roi_attribute_change') {
                    calibrationTableNeedsUpdate = true;
                }
                break;

            case 'selection_change':
                selectionChanged = true;
                break;
        }
    });

    if(selectionChanged) domRenderer.updateRoiCardsSelection();
    roisToUpdateData.forEach(roi => domRenderer.updateRoiCardData(roi));
    roisToUpdateVisuals.forEach(roi => domRenderer.updateRoiCardVisuals(roi));
    
    if (calibrationTableNeedsUpdate) {
        domRenderer.renderCalibrationSetupTable();
    }
    
    // --- INÍCIO DA CORREÇÃO (BUGFIX-SAMPLE-RENDER-01) ---
    // Executa a renderização dos componentes de predição se necessário.
    if (samplePredictionNeedsUpdate) {
        domRenderer.renderSampleIdentificationTable();
        domRenderer.renderSampleResultsCards();
    }
    // --- FIM DA CORREÇÃO ---
    
    updateButtonStates();
    drawingHandler.draw();
    updateAnalysisStepsVisibility();
    
    // --- INÍCIO DA ALTERAÇÃO ---
    // Adicionada a chamada para garantir que o painel de instruções sempre reflita o estado atual do app.
    log('uiManager', 'perf', "Sincronizando painel de instruções.");
    updateInstructionPanel();
    // --- FIM DA ALTERAÇÃO ---
}


/**
 * Função "ouvinte" que é chamada pelo módulo de estado sempre que ele muda.
 * Ela enfileira a mudança e agenda uma única atualização de UI por frame.
 * @param {object} appState - O estado completo atual (não utilizado diretamente aqui).
 * @param {object} updateOptions - Detalhes sobre a atualização, incluindo tipo e payload.
 */
function onStateChange(appState, updateOptions = {}) {
    pendingUpdates.push(updateOptions);

    if (!isUpdateScheduled) {
        isUpdateScheduled = true;
        log('uiManager', 'perf', `Agendando UI update para o próximo frame. Causa: ${updateOptions.type}`);
        requestAnimationFrame(executePendingUpdate);
    }
}


// --- Funções de Controle da UI ---

export function initializeUI() {
    log('uiManager', 'info', 'Inicializando a UI e se inscrevendo para mudanças de estado.');
    state.subscribe(onStateChange);
    updateAllDynamicContent();
}

function updateToolVisuals() {
    log('uiManager', 'info', `Atualizando visuais das ferramentas. Ferramenta: '${state.currentTool()}', Modo App: '${state.appMode()}', MultiSelect: ${state.isMultiSelectMode()}`);
    const isMultiSelect = state.isMultiSelectMode();
    const currentTool = state.currentTool();

    const _updateVisuals = (button, isActive, customText = null) => {
        if (!button) return;
        button.dataset.toolState = isActive ? 'active' : 'inactive';
        if (customText !== null) {
            button.textContent = customText;
        }
    };

    if (isMultiSelect) {
        _updateVisuals(dom.pointerButton, true, 'Sair da Seleção');
        _updateVisuals(dom.rectRoiButton, false);
        _updateVisuals(dom.circleRoiButton, false);
        if (dom.rectRoiButton) dom.rectRoiButton.disabled = true;
        if (dom.circleRoiButton) dom.circleRoiButton.disabled = true;
    } else {
        if (dom.pointerButton) dom.pointerButton.textContent = 'Ponteiro';
        const hasImage = state.hasImage();
        if (dom.rectRoiButton) dom.rectRoiButton.disabled = !hasImage;
        if (dom.circleRoiButton) dom.circleRoiButton.disabled = !hasImage;

        _updateVisuals(dom.pointerButton, currentTool === 'pointer');
        _updateVisuals(dom.rectRoiButton, currentTool === 'rect');
        _updateVisuals(dom.circleRoiButton, currentTool === 'circle');
    }
    
    if (dom.roiCanvas) {
        const cursorMap = { 'rect': 'crosshair', 'circle': 'crosshair', 'pointer': 'grab' };
        dom.roiCanvas.style.cursor = cursorMap[currentTool] || 'default';
    }
}

export function updateButtonStates() {
    log('uiManager', 'info', 'Atualizando estado dos botões.');
    updateToolVisuals(); 

    const rois = state.rois();
    const hasRois = rois.length > 0;
    const hasImage = state.hasImage();
    const selectionSet = state.selectionSet();
    const selectionSize = selectionSet.size;

    if (dom.deleteImageButton) dom.deleteImageButton.disabled = !hasImage;
    if (dom.resetViewButton) dom.resetViewButton.disabled = !hasImage;
    if (dom.rotateImageButton) dom.rotateImageButton.disabled = !hasImage;
    if (dom.deleteAllRoisButton) dom.deleteAllRoisButton.disabled = !hasRois;
    if (dom.saveSessionButton) dom.saveSessionButton.disabled = !hasImage;
    
    if (dom.detectionMenuButton) {
        const isCvReady = typeof cv !== 'undefined' && cv.Mat;
        dom.detectionMenuButton.disabled = !hasImage || !isCvReady || state.isMultiSelectMode();
        dom.detectionMenuButton.title = !isCvReady && hasImage ? "Aguardando carregamento do OpenCV..." : "Detecção Automática de ROIs";
    }

    if (dom.dynamicActionsPanel) {
        const fieldset = document.getElementById('dynamicActionsFieldset');
        if (fieldset) fieldset.disabled = (selectionSize === 0);
        
        if (selectionSize > 0) {
            const selectedRois = Array.from(selectionSet).map(id => rois.find(r => r.id === id)).filter(Boolean);
            if (selectedRois.length === selectionSize) {
                const isSingleSelection = selectionSize === 1;
                dom.setAsSampleButton.textContent = selectedRois.every(r => r.isSample) ? 'Remover Amostra' : 'Definir Amostra';
                dom.setAnalyticalWhiteButton.disabled = !isSingleSelection;
                if(isSingleSelection) dom.setAnalyticalWhiteButton.textContent = (selectedRois[0].id === state.analyticalWhiteRoiId()) ? 'Remover Branco' : 'Definir Branco';
                dom.bulkLockPositionButton.textContent = selectedRois.every(r => r.isPositionLocked) ? 'Desbloq. Posição' : 'Travar Posição';
                dom.bulkLockSizeButton.textContent = selectedRois.every(r => r.isSizeLocked) ? 'Desbloq. Tamanho' : 'Travar Tamanho';
                dom.bulkOrderButton.disabled = selectedRois.filter(r => !r.isSample).length < 2;
            }
        }
    }
    
    const hasMetrics = state.metricsCalculated();
    const hasRegressions = state.lastRegressions().length > 0;
    
    if (dom.exportXlsxButton) dom.exportXlsxButton.disabled = !hasMetrics;
    if (dom.exportPdfButton) dom.exportPdfButton.disabled = !hasRegressions;
    if (dom.clearChartButton) dom.clearChartButton.disabled = !hasRegressions;
    if (dom.defineRoiOrderButton) dom.defineRoiOrderButton.disabled = rois.filter(r => !r.isSample && r.id !== state.analyticalWhiteRoiId()).length < 2;
}


function updateAnalysisTabs() {
    log('uiManager', 'info', 'Atualizando abas de análise.');
    updateAnalysisStepsVisibility();
    domRenderer.renderCalibrationSetupTable();
    domRenderer.renderSampleIdentificationTable();
    domRenderer.renderSampleResultsCards();
}

function updateUiChrome() {
    log('uiManager', 'info', 'Atualizando chrome da UI (painéis, overlays).');
    updateInstructionPanel();
    updateCanvasButtonsState();
    updateContextMenu();
    
    const isInMultiSelectMode = state.isMultiSelectMode();
    const isInEditMode = state.editingRoiId() !== null;

    if (dom.canvasContainer) {
        let interactionStateValue = 'idle';
        if (isInMultiSelectMode) {
            interactionStateValue = 'multiselect';
        } else if (isInEditMode) {
            interactionStateValue = 'editing';
        }
        dom.canvasContainer.dataset.interactionState = interactionStateValue;
        log('uiManager', 'data', `Estado de interação do canvas definido como: '${interactionStateValue}'`);
    }
}

function updateAllDynamicContent() {
    updateUiChrome();
    updateButtonStates();
    domRenderer.renderRoiCards();
    updateAnalysisTabs();
    drawingHandler.draw(); 
}


// --- Funções de UI Específicas ---

export function switchTab(targetTab) {
    if (state.currentTab() === targetTab) return;
    log('uiManager', 'info', `Trocando para a aba: ${targetTab}`);
    
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.toggle('active', button.dataset.tab === targetTab);
    });
    dom.tabPanes.forEach(pane => {
        pane.classList.toggle('hidden', pane.id !== `tab-${targetTab}`);
    });
    
    state.setCurrentTab(targetTab);
}

const cornerInstructions = [
    "Toque no centro do poço do CANTO SUPERIOR ESQUERDO (Ponto 1)",
    "Toque no centro do poço do CANTO SUPERIOR DIREITO (Ponto 2)",
    "Toque no centro do poço do CANTO INFERIOR DIREITO (Ponto 3)",
    "Toque no centro do poço do CANTO INFERIOR ESQUERDO (Ponto 4)",
    "Ajuste os cantos arrastando-os e clique em [Confirmar Grade]"
];

function setInstructionText(text) {
    if (dom.detectionInstructionText) { dom.detectionInstructionText.textContent = text; }
}

function updateInstructionPanel() {
    const mode = state.appMode();
    const isVisible = (mode === 'selectingGridCorners' || mode === 'adjustingGrid' || mode === 'sequencingRois');

    if (dom.detectionInstructionPanel) {
        dom.detectionInstructionPanel.classList.toggle('hidden', !isVisible);
        dom.detectionInstructionPanel.classList.toggle('instruction-bar', isVisible);
    } else {
        return; 
    }

    if (dom.gridAdjustmentControls) dom.gridAdjustmentControls.classList.add('hidden');
    if (dom.cancelInstructionButton) dom.cancelInstructionButton.classList.add('hidden');
    const sequenceControls = document.getElementById('sequence-controls-container');
    if (sequenceControls) sequenceControls.classList.add('hidden');


    switch (mode) {
        case 'selectingGridCorners': {
            const pointCount = state.gridCornerPoints().length;
            setInstructionText(cornerInstructions[pointCount] || "Clique para definir os cantos da grade.");
            if (dom.cancelInstructionButton) dom.cancelInstructionButton.classList.remove('hidden');
            break;
        }
        case 'adjustingGrid': {
            setInstructionText(cornerInstructions[4]);
            if (dom.gridAdjustmentControls) dom.gridAdjustmentControls.classList.remove('hidden');
            break;
        }
        case 'sequencingRois': {
            if (sequenceControls) sequenceControls.classList.remove('hidden');
            const totalToSelect = state.rois().filter(r => r.calibrationOrder !== null).length;
            const currentlySelected = state.sequencedRois().length;
            if (currentlySelected >= totalToSelect) {
                setInstructionText('Sequência completa! Clique em "Concluir".');
            } else {
                setInstructionText(`Toque na ROI que corresponde ao Ponto de Calibração Nº ${currentlySelected + 1}`);
            }
            break;
        }
    }
}

function updateCanvasButtonsState() {
    if (!dom.magnifierToggleButton || !dom.focusModeButton || !dom.viewLockButton) return;
    dom.magnifierToggleButton.classList.toggle('active', state.isMagnifierEnabled());
    const isLocked = state.isViewLocked();
    dom.viewLockButton.classList.toggle('active', isLocked);
    if (dom.viewLockIcon) {
        dom.viewLockIcon.innerHTML = isLocked ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>` : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path>`;
    }
    const isInFocusMode = state.isFocusMode();
    if (dom.focusModeButton.querySelector('svg')) {
        dom.focusModeButton.querySelector('svg').innerHTML = isInFocusMode ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7"></path>` : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1v4m0 0h-4m4 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5"></path>`;
    }
    const isInstructionPanelVisible = dom.detectionInstructionPanel && !dom.detectionInstructionPanel.classList.contains('hidden');
    const overlay = dom.canvasContainer.querySelector('#canvas-controls-overlay');
    if (overlay) {
        let topOffset = 8;
        if (isInFocusMode && isInstructionPanelVisible) topOffset += dom.detectionInstructionPanel.clientHeight;
        overlay.style.top = `${topOffset}px`;
    }
    if (dom.magnifierContainer) {
        dom.magnifierContainer.classList.toggle('displaced-by-bar', isInFocusMode && isInstructionPanelVisible);
    }
}

function updateContextMenu() {
    const menuState = state.contextMenu();
    const menuElement = dom.roiContextMenu;
    if (!menuElement) return;

    if (state.isMultiSelectMode()) {
        menuElement.classList.add('hidden');
        return;
    }

    if (menuState.visible && menuState.roiId !== null) {
        const roi = state.rois().find(r => r.id === menuState.roiId);
        if (!roi) {
            menuElement.classList.add('hidden');
            return;
        }
        
        const lockIconContainer = dom.contextMenuLock.querySelector('svg');
        if (lockIconContainer) {
            const isLocked = roi.isPositionLocked && roi.isSizeLocked;
            lockIconContainer.innerHTML = isLocked ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>` : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path>`;
        }

        dom.contextMenuSetWhite.disabled = roi.isSample;
        dom.contextMenuSetWhite.style.opacity = roi.isSample ? '0.5' : '1';
        dom.contextMenuSetWhite.style.cursor = roi.isSample ? 'not-allowed' : 'pointer';

        const offsetX = 15, offsetY = 10;
        const menuRect = menuElement.getBoundingClientRect();
        const bodyRect = document.body.getBoundingClientRect();

        let left = menuState.x + offsetX;
        let top = menuState.y + offsetY;

        if (left + menuRect.width > bodyRect.width) {
            left = menuState.x - menuRect.width - offsetX;
        }
        if (top + menuRect.height > bodyRect.height) {
            top = menuState.y - menuRect.height;
        }

        menuElement.style.left = `${left}px`;
        menuElement.style.top = `${top}px`;
        menuElement.classList.remove('hidden');
    } else {
        menuElement.classList.add('hidden');
    }
}


export function updateAnalysisStepsVisibility() {
    log('uiManager', 'info', 'Atualizando visibilidade dos passos de análise com lógica encadeada.');
    
    const analysisIsReady = state.metricsCalculated() && !state.isAnalysisStale();
    
    setStepState(2, analysisIsReady);
    
    const anyParamSelected = getYAxisSelectedParams().length > 0;
    const step3Enabled = analysisIsReady && anyParamSelected;
    setStepState(3, step3Enabled);
    
    updateCalibrationButtonState();
    
    const regressionsGenerated = state.lastRegressions().length > 0;
    const step5Enabled = regressionsGenerated;
    setStepState(5, step5Enabled);
    
    if (dom.finalActionsWrapper) dom.finalActionsWrapper.classList.toggle('hidden', !state.metricsCalculated());
    if (dom.analysisStaleWarning) dom.analysisStaleWarning.classList.toggle('hidden', !state.isAnalysisStale());
    
    updateRegressionViewControls();
}

function setStepState(stepNumber, enabled) {
    const wrapper = dom[`step${stepNumber}Wrapper`];
    const content = dom[`step${stepNumber}Content`];
    const blocker = dom[`step${stepNumber}Blocker`];
    if (wrapper) wrapper.disabled = !enabled;
    if (content) content.classList.toggle('hidden', !enabled);
    if (blocker) blocker.classList.toggle('hidden', enabled);
}

export function getYAxisSelectedParams() {
    if (!dom.signalSelectorContainer) return [];
    return Array.from(dom.signalSelectorContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
}

function updateCalibrationButtonState() {
    const step3Enabled = dom.step3Wrapper && !dom.step3Wrapper.disabled;
    const calibrationPoints = state.rois().filter(r => r.useInCalibration && r.concentration !== null).length;
    const enabled = step3Enabled && calibrationPoints >= 2;
    
    log('uiManager', 'info', `Verificando estado do botão de calibração. Passo 3 habilitado: ${step3Enabled}, Pontos válidos: ${calibrationPoints}. Passo 4 Habilitado: ${enabled}.`);
    setStepState(4, enabled);
}

export function updateRegressionViewControls() {
    if (!dom.regressionViewModeContainer) return;
    const regressions = state.lastRegressions();
    const shouldBeVisible = regressions.length > 0;
    dom.regressionViewModeContainer.classList.toggle('hidden', !shouldBeVisible);
    if (shouldBeVisible) {
        const currentMode = state.regressionViewMode();
        const radioToSelect = dom.regressionViewModeContainer.querySelector(`input[value="${currentMode}"]`);
        if (radioToSelect) {
            radioToSelect.checked = true;
        }
    }
}

export function startCvReadyCheck() {
    if (cvReadyCheckInterval) { clearInterval(cvReadyCheckInterval); }
    cvReadyCheckInterval = setInterval(() => {
        const isCvReady = typeof cv !== 'undefined' && cv.Mat;
        if (isCvReady) {
            updateButtonStates();
            clearInterval(cvReadyCheckInterval);
            cvReadyCheckInterval = null;
        }
    }, 250);
    setTimeout(() => { if (cvReadyCheckInterval) clearInterval(cvReadyCheckInterval); }, 10000);
}