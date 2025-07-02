// js/analysisPanelBinder.js

// Importações de módulos para funcionalidades
import * as dom from './domElements.js';
import * as state from './state.js';
import * as actions from './stateActions.js';
import * as modalManager from './modalManager.js';
import * as domRenderer from './domRenderer.js';
import * as uiManager from './uiManager.js';
import * as roiManager from './roiManager.js';
import * as chartManager from './chartManager.js';
import * as exportManager from './exportManager.js';
import * as workerManager from './workerManager.js';
import * as infoContent from './infoContent.js';


// Estado privado para este módulo
let qualitySortState = { key: 'r2', direction: 'desc' };
let draggedItem = null;

// --- Handlers para controles específicos ---

/**
 * Lida com cliques nos cards de ROI para seleção, edição ou expansão de detalhes.
 * @param {MouseEvent} e - O evento de clique.
 */
function handleRoiCardClick(e) {
    const card = e.target.closest('.roi-card');
    if (!card) return;
    const roiId = parseInt(card.dataset.roiId, 10);

    if (e.target.closest('.edit-name-button-class')) {
        e.stopPropagation();
        modalManager.openEditRoiNameModal(roiId)
            .catch(err => log('analysisPanelBinder', 'info', "Edição de nome de ROI cancelada.", err));
        return;
    }

    const expandButton = e.target.closest('.expand-details-button');
    if (expandButton) {
        e.stopPropagation();
        actions.toggleRoiDetails(roiId);
        return;
    }

    if (e.shiftKey || e.ctrlKey || state.isMultiSelectMode()) {
        actions.toggleRoiInSelection(roiId);
    } else {
        actions.selectSingleRoi(roiId);
    }
}

/**
 * Dispara a tarefa de cálculo de métricas no Web Worker.
 */
function handleCalculateAllMetrics() {
    log('analysisPanelBinder', 'info', 'Disparando cálculo de métricas no Web Worker...');
    const allRois = state.rois();
    if (!allRois || allRois.length === 0) {
        modalManager.showGeneralModal("Crie pelo menos uma ROI para calcular as métricas.");
        return;
    }
    const offscreenCanvas = state.offscreenCanvas();
    if (!offscreenCanvas) {
        modalManager.showGeneralModal("Erro: Imagem não encontrada para processamento.");
        return;
    }
    const ctx = offscreenCanvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    modalManager.showLoadingModal("Calculando métricas em segundo plano...");
    const whiteRoi = allRois.find(r => r.id === state.analyticalWhiteRoiId());
    
    workerManager.sendMessageToWorker({
        type: 'calculateMetrics',
        payload: { allRois, whiteRoi, imageData }
    }, [imageData.data.buffer]);
}

/**
 * Lida com a mudança de valor nos inputs de concentração da tabela de calibração.
 * @param {InputEvent} e - O evento de input.
 */
function handleCalibrationInputChange(e) {
    const input = e.target;
    if (!input.matches('input[type="number"]')) return;
    const roiId = parseInt(input.dataset.roiId, 10);
    actions.updateRoiConcentration(roiId, input.value);
}

/**
 * Lida com a tecla "Enter" nos inputs de concentração para mover o foco.
 * @param {KeyboardEvent} e - O evento de teclado.
 */
function handleCalibrationKeydown(e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const allInputs = Array.from(dom.calibrationSetupTable.querySelectorAll('tbody input[type="number"]'));
    if (allInputs.length === 0) return;

    const currentIndex = allInputs.findIndex(input => input === e.target);
    if (currentIndex === -1) return;

    // Procura o próximo input vazio
    for (let i = currentIndex + 1; i < allInputs.length; i++) {
        if (allInputs[i].value.trim() === '') {
            allInputs[i].focus();
            allInputs[i].select();
            log('analysisPanelBinder', 'info', `Foco movido para o próximo input de concentração (índice ${i}).`);
            return;
        }
    }

    // Se não houver nenhum vazio depois, procura do começo
    const firstEmptyInput = allInputs.find(input => input.value.trim() === '');
    if (firstEmptyInput) {
        firstEmptyInput.focus();
        firstEmptyInput.select();
        log('analysisPanelBinder', 'info', `Foco reiniciado para o primeiro input de concentração vazio.`);
        return;
    }

    log('analysisPanelBinder', 'info', 'Todos os campos de concentração preenchidos. Removendo foco.');
    e.target.blur();
}


/**
 * Lida com cliques nos checkboxes da tabela de calibração.
 * @param {MouseEvent} e - O evento de clique.
 */
function handleCalibrationTableClick(e) {
    const checkbox = e.target.closest('.calibration-checkbox');
    if (!checkbox) return;
    const roiId = parseInt(checkbox.dataset.roiId, 10);
    actions.setRoiCalibrationUsage(roiId, checkbox.checked);

    if (checkbox.checked) {
        const roiToUpdate = state.rois().find(r => r.id === roiId);
        if (roiToUpdate && roiToUpdate.concentration === null) {
            const roisForTable = state.rois().filter(r => r.calibrationOrder !== null).sort((a,b) => a.calibrationOrder - b.calibrationOrder);
            const startIndex = roisForTable.findIndex(r => r.id === roiId);
            if (startIndex === -1) return;
            const concentrationQueue = roisForTable.slice(startIndex).filter(r => r.concentration === null).map(r => r.id);
            if (concentrationQueue.length > 0) {
                state.setConcentrationQueue(concentrationQueue);
                modalManager.processConcentrationQueue();
            }
        }
    }
}

/**
 * Lida com o clique no checkbox "Selecionar Todos" do cabeçalho da tabela de calibração.
 * @param {Event} e - O evento de 'change'.
 */
function handleSelectAllForCalibration(e) {
    const isChecked = e.target.checked;
    actions.setAllRoisCalibrationUsage(isChecked);
    if (isChecked) {
        const roisToQueue = state.rois().filter(r => r.calibrationOrder !== null && r.concentration === null).map(r => r.id);
        if (roisToQueue.length > 0) {
            state.setConcentrationQueue(roisToQueue);
            modalManager.processConcentrationQueue();
        }
    }
}

/**
 * Lida com interações nos controles de regressão (filtros, limites de exibição).
 * @param {Event} event - O evento de clique ou teclado.
 */
function handleRegressionControls(event) {
    const { target } = event;
    if (target.matches('.regression-visibility-toggle')) {
        state.toggleVisibleParameter(target.dataset.paramName);
        chartManager.renderChartWithRegressions(state.lastRegressions(), CHART_STYLES);
        return;
    }
    const applyLimit = (limitValue) => {
        state.setRegressionDisplayLimit(limitValue);
        chartManager.renderChartWithRegressions(state.lastRegressions(), CHART_STYLES);
    };
    if (target.matches('#apply-regression-limit')) applyLimit(dom.regressionEquationsContainer.querySelector('#regression-limit-input').value);
    if (target.matches('.limit-shortcut-btn')) applyLimit(target.dataset.limit);
    if (event.type === 'keyup' && event.key === 'Enter' && target.matches('#regression-limit-input')) applyLimit(target.value);
}

// --- INÍCIO DA ALTERAÇÃO ---

/**
 * Lida com interações no conteúdo do Passo 4 (Painel de Qualidade).
 * @param {MouseEvent} event - O evento de clique.
 */
function handleStep4Interaction(event) {
    const infoButton = event.target.closest('#quality-panel-info-button');
    if (infoButton) {
        log('analysisPanelBinder', 'info', 'Botão de ajuda do Painel de Qualidade clicado.');
        event.stopPropagation();
        if (typeof QUALITY_PARAMETERS_INFO !== 'undefined') {
            modalManager.openQualityInfoModal('Parâmetros de Qualidade do Modelo', Object.values(QUALITY_PARAMETERS_INFO));
        } else {
            log('analysisPanelBinder', 'error', 'Objeto QUALITY_PARAMETERS_INFO não está definido. O modal de ajuda não pode ser aberto.');
        }
        return;
    }
    
    if (event.target.closest('#qualityControlPanelContainer .accordion-header')) {
        log('analysisPanelBinder', 'info', 'Clique no cabeçalho do painel de qualidade detectado.');
        event.stopPropagation();
        actions.toggleQualityPanel();
        chartManager.renderChartWithRegressions(state.lastRegressions(), CHART_STYLES);
        return;
    }
    
    const sortHeader = event.target.closest('th[data-sort-by]');
    if (sortHeader) {
        const key = sortHeader.dataset.sortBy;
        let direction = (qualitySortState.key === key && qualitySortState.direction === 'desc') ? 'asc' : 'desc';
        if (qualitySortState.key !== key && ['lod', 'loq', 'Syx'].includes(key)) direction = 'asc';
        qualitySortState = { key, direction };
        // ... (código de ordenação da tabela)
    }
}
// --- FIM DA ALTERAÇÃO ---

/**
 * Lida com interações na tabela de identificação de amostras (Passo 5).
 * @param {MouseEvent} e - O evento de clique.
 */
function handleSampleIdentificationTableInteraction(e) {
    const descriptionDisplay = e.target.closest('.sample-description-display');
    if (descriptionDisplay) {
        e.stopPropagation();
        const roiId = parseInt(descriptionDisplay.dataset.roiId, 10);
        const roi = state.rois().find(r => r.id === roiId);
        if (roi) {
            modalManager.openTextInputModal('Editar Descrição da Amostra', roi.sampleDescription)
                .then(newValue => {
                    roi.sampleDescription = newValue;
                    domRenderer.renderSampleIdentificationTable();
                });
        }
        return;
    }
    const toggleButton = e.target.closest('.toggle-details-btn');
    if (toggleButton) {
        e.stopPropagation();
        const detailRow = toggleButton.closest('.sample-main-row').nextElementSibling;
        detailRow.classList.toggle('hidden');
        toggleButton.classList.toggle('expanded', !detailRow.classList.contains('hidden'));
    }
}

/**
 * Função principal que vincula todos os eventos da aba de Análise.
 */
export function bindAnalysisPanelEvents() {
    log('analysisPanelBinder', 'info', "Vinculando eventos da aba de Análise.");

    if (dom.roiCardsContainer) dom.roiCardsContainer.addEventListener('click', handleRoiCardClick);
    if (dom.calculateAllMetricsButton) dom.calculateAllMetricsButton.addEventListener('click', handleCalculateAllMetrics);
    if (dom.openSignalSelectorModalButton) dom.openSignalSelectorModalButton.addEventListener('click', () => {
        domRenderer.renderYAxisParameterOptions();
        if(dom.signalSelectorModal) dom.signalSelectorModal.dataset.visible = 'true';
    });
    if (dom.concentrationUnitSelect) dom.concentrationUnitSelect.addEventListener('change', (e) => actions.setCurrentConcentrationUnit(e.target.value));
    
    if (dom.clearConcentrationsButton) dom.clearConcentrationsButton.addEventListener('click', actions.clearAllCalibrationConcentrations);

    const calibWrapper = document.getElementById('calibrationTableWrapper');
    if (calibWrapper) {
        calibWrapper.addEventListener('input', handleCalibrationInputChange);
        calibWrapper.addEventListener('keydown', handleCalibrationKeydown);
        calibWrapper.addEventListener('click', handleCalibrationTableClick);
        calibWrapper.addEventListener('change', (e) => { if (e.target.matches('#selectAllForCalibration')) handleSelectAllForCalibration(e); });
        
        calibWrapper.addEventListener('dragstart', (e) => {
            const row = e.target.closest('.calibration-row');
            if (row) {
                draggedItem = row;
                setTimeout(() => draggedItem.classList.add('dragging'), 0);
            }
        });
        calibWrapper.addEventListener('dragover', (e) => {
            e.preventDefault();
            const targetRow = e.target.closest('.calibration-row');
            if (!targetRow || !draggedItem || targetRow === draggedItem) return;
            const rect = targetRow.getBoundingClientRect();
            const isAfter = e.clientY > rect.top + rect.height / 2;
            calibWrapper.querySelectorAll('.calibration-row').forEach(row => row.classList.remove('drag-over-top', 'drag-over-bottom'));
            targetRow.classList.toggle('drag-over-bottom', isAfter);
            targetRow.classList.toggle('drag-over-top', !isAfter);
        });
        calibWrapper.addEventListener('dragend', () => {
            if (draggedItem) draggedItem.classList.remove('dragging');
            draggedItem = null;
            calibWrapper.querySelectorAll('.calibration-row').forEach(r => r.classList.remove('drag-over-top', 'drag-over-bottom'));
        });
        calibWrapper.addEventListener('drop', (e) => {
            if (draggedItem && e.target.closest('.calibration-row') && e.target.closest('.calibration-row') !== draggedItem) {
                actions.reorderCalibrationRois(parseInt(draggedItem.dataset.roiId, 10), parseInt(e.target.closest('.calibration-row').dataset.roiId, 10));
            }
        });
    }
    if (dom.generateCalibrationCurveButton) dom.generateCalibrationCurveButton.addEventListener('click', chartManager.generateCalibrationCurve);
    if (dom.clearChartButton) dom.clearChartButton.addEventListener('click', chartManager.clearChart);
    
    if (dom.regressionViewModeContainer) {
        dom.regressionViewModeContainer.addEventListener('change', (e) => {
            const newMode = e.target.value;
            actions.setRegressionViewMode(newMode);
            log('analysisPanelBinder', 'info', `Modo de visualização alterado para '${newMode}'. Forçando re-renderização do gráfico.`);
            chartManager.renderChartWithRegressions(state.lastRegressions(), CHART_STYLES);
        });
    }

    if (dom.regressionEquationsContainer) {
        dom.regressionEquationsContainer.addEventListener('click', handleRegressionControls);
        dom.regressionEquationsContainer.addEventListener('keyup', handleRegressionControls);
    }
    if (dom.step4Content) dom.step4Content.addEventListener('click', handleStep4Interaction);
    if (dom.sampleIdentificationContainer) dom.sampleIdentificationContainer.addEventListener('click', handleSampleIdentificationTableInteraction);
    if (dom.exportXlsxButton) dom.exportXlsxButton.addEventListener('click', exportManager.exportToXlsx);
    if (dom.exportPdfButton) dom.exportPdfButton.addEventListener('click', exportManager.openReportDetailsModal);

    if (dom.predictionInfoButton) {
        dom.predictionInfoButton.addEventListener('click', () => {
            modalManager.openInfoModal(infoContent.predictionStatusHelp.title, infoContent.predictionStatusHelp.htmlContent);
        });
    }

    log('analysisPanelBinder', 'success', 'Eventos da aba de Análise vinculados com sucesso.');
}