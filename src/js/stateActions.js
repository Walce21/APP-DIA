// src/js/stateActions.js

/**
 * Módulo central para todas as ações que modificam o estado da aplicação.
 * Ele atua como uma camada intermediária entre a lógica de negócio e o store de estado,
 * garantindo que as mutações sejam previsíveis e centralizadas.
 */

import { setState, getState, getNextRoiId } from './state.js';
import * as roiManager from './roiManager.js';

// --- Ações de Ferramentas e UI Geral ---

export function changeCurrentTool(tool) {
    log('actions', 'info', `Ação: Mudar ferramenta para '${tool}'.`);
    setState(currentState => {
        if (tool === 'pointer' && currentState.isMultiSelectMode) {
            return { currentTool: tool, isMultiSelectMode: false, editingRoiId: null };
        }
        return { currentTool: tool, editingRoiId: null };
    }, { type: 'tool_change' });
}

export function setAnalysisTitle(title) {
    log('actions', 'info', `Ação: Definir título da análise como "${title}".`);
    setState(() => ({ analysisTitle: title }), { type: 'analysis_update' });
}


// --- Ações relacionadas a ROIs ---

export function addNewRoi(rawRoiObject) {
    const newId = getNextRoiId();
    log('actions', 'info', `Ação: Criar e adicionar nova ROI. ID atribuído: ${newId}.`);

    const newRoi = {
        ...rawRoiObject,
        id: newId,
        name: `ROI ${newId}`,
        customName: null,
        concentration: null,
        calibrationOrder: null,
        isSample: false,
        useInCalibration: false,
        isPositionLocked: false,
        isSizeLocked: false,
        isDetailsExpanded: false,
        analyticalResponse: [],
        predictedConcentrations: [],
        sampleDescription: '',
        pixelCount: 0
    };

    const currentState = getState();
    let updatedRois = [...currentState.rois, newRoi];
    
    updatedRois = roiManager.renumberStandardRois(updatedRois, currentState.analyticalWhiteRoiId);
    
    const finalNewRoi = updatedRois.find(r => r.id === newId) || newRoi;

    setState(() => ({
        rois: updatedRois,
        selectionSet: new Set([newId]),
        editingRoiId: null
    }), { type: 'roi_add', payload: finalNewRoi });

    roiManager.requestRoiDataProcessing(finalNewRoi);
    log('actions', 'info', `Processamento de dados solicitado para a nova ROI ID: ${newId}.`);

    if (getState().metricsCalculated) {
        setAnalysisAsStale(true);
    }
}

export function addBatchRois(newRois) {
    log('actions', 'info', `Ação: Adicionar lote de ${newRois.length} ROIs.`);
    if (newRois.length === 0) return;

    const currentState = getState();
    let updatedRois = [...currentState.rois, ...newRois];

    updatedRois = roiManager.renumberStandardRois(updatedRois, currentState.analyticalWhiteRoiId);
    
    setState(() => ({
        rois: updatedRois
    }), { type: 'roi_add_batch', payload: newRois });
    
    if (getState().metricsCalculated) {
        setAnalysisAsStale(true);
    }
}

export function updateAllRois(newRoisArray) {
    log('actions', 'info', `Ação ATÔMICA: Atualizando ROIs e definindo análise como 'atualizada'.`);
    
    setState(() => ({
        rois: newRoisArray,
        metricsCalculated: true,
        isAnalysisStale: false
    }), { type: 'analysis_update', payload: newRoisArray });
}

export function clearRoiSelection() {
    log('actions', 'info', 'Ação: Limpar seleção de ROIs.');
    setState(() => ({
        selectionSet: new Set(),
        editingRoiId: null
    }), { type: 'selection_change' });
}

export function selectSingleRoi(roiId) {
    log('actions', 'info', `Ação: Selecionar ROI única ID: ${roiId}.`);
    const newSelectionSet = new Set([roiId]);
    setState(() => ({
        selectionSet: newSelectionSet,
        editingRoiId: null
    }), { type: 'selection_change' });
}

export function toggleRoiInSelection(roiId) {
    log('actions', 'info', `Ação: Alternar seleção da ROI ID: ${roiId}.`);
    const currentState = getState();
    const newSelectionSet = new Set(currentState.selectionSet);
    let newEditingId = currentState.editingRoiId;

    if (newSelectionSet.has(roiId)) {
        newSelectionSet.delete(roiId);
        if (newEditingId === roiId) {
            newEditingId = null;
        }
    } else {
        newSelectionSet.add(roiId);
    }

    setState(() => ({
        selectionSet: newSelectionSet,
        editingRoiId: newEditingId
    }), { type: 'selection_change' });
}

export function deleteSelectedRois() {
    const currentState = getState();
    const selection = currentState.selectionSet;
    if (selection.size === 0) return;

    log('actions', 'warn', `Ação: Excluir ${selection.size} ROIs selecionadas.`);
    const deletedIds = Array.from(selection);

    let newRois = currentState.rois.filter(r => !selection.has(r.id));
    let newAnalyticalWhiteId = currentState.analyticalWhiteRoiId;

    if (selection.has(newAnalyticalWhiteId)) {
        newAnalyticalWhiteId = null;
    }

    newRois = roiManager.renumberStandardRois(newRois, newAnalyticalWhiteId);

    setState(() => ({
        rois: newRois,
        selectionSet: new Set(),
        editingRoiId: null,
        analyticalWhiteRoiId: newAnalyticalWhiteId,
    }), { type: 'roi_delete', payload: { roiIds: deletedIds } });

    if (getState().metricsCalculated) {
        setAnalysisAsStale(true);
    }
}

export function deleteAllRois() {
    log('actions', 'warn', `Ação: Excluir TODAS as ROIs e resetar análise.`);
    setState(() => ({
        rois: [],
        selectionSet: new Set(),
        editingRoiId: null,
        analyticalWhiteRoiId: null,
        nextRoiId: 1,
        nextCalibrationOrder: 1,
        lastRegressions: [],
        metricsCalculated: false,
        isAnalysisStale: false,
        isQualityPanelExpanded: false
    }), { type: 'full_reset' });
}

export function toggleAnalyticalWhite(roiId) {
    log('actions', 'info', `Ação: Alternar estado de Branco para ROI ID ${roiId}.`);
    
    const currentState = getState();
    const newWhiteId = currentState.analyticalWhiteRoiId === roiId ? null : roiId;
    
    const tempRois = currentState.rois.map(r => {
        if (r.id === roiId && r.isSample) {
            return { ...r, isSample: false };
        }
        return r;
    });

    const finalRois = roiManager.renumberStandardRois(tempRois, newWhiteId);
    const payloadRoi = finalRois.find(r => r.id === roiId);

    setState(() => ({
        rois: finalRois,
        analyticalWhiteRoiId: newWhiteId
    }), { type: 'roi_attribute_change', payload: payloadRoi });
    
    if (getState().metricsCalculated) {
        setAnalysisAsStale(true);
    }
}

export function toggleSelectedRoisAsSample() {
    const currentState = getState();
    const selection = currentState.selectionSet;
    if (selection.size === 0) return;

    let newWhiteId = currentState.analyticalWhiteRoiId;
    
    const allAreSamples = currentState.rois.filter(r => selection.has(r.id)).every(r => r.isSample);
    const newIsSampleState = !allAreSamples;

    log('actions', 'info', `Ação: Alternar estado de Amostra para ${selection.size} ROIs. Novo estado: ${newIsSampleState}.`);

    const updatedRois = currentState.rois.map(roi => {
        if (selection.has(roi.id)) {
            if (newIsSampleState && roi.id === newWhiteId) {
                newWhiteId = null;
            }
            return { ...roi, isSample: newIsSampleState };
        }
        return roi;
    });

    const finalRois = roiManager.renumberStandardRois(updatedRois, newWhiteId);
    const payloadRois = finalRois.filter(r => selection.has(r.id));

    setState(() => ({ 
        rois: finalRois,
        analyticalWhiteRoiId: newWhiteId
    }), { type: 'roi_attribute_change', payload: payloadRois });
    
    if (getState().metricsCalculated) {
        setAnalysisAsStale(true);
    }
}

export function restoreSession(sessionData) {
    log('actions', 'info', 'Ação: Restaurar estado a partir de uma sessão salva.');
    setState(() => ({
        rois: sessionData.rois || [],
        nextRoiId: sessionData.nextRoiId || 1,
        analyticalWhiteRoiId: sessionData.analyticalWhiteRoiId || null,
        analysisTitle: sessionData.analysisTitle || '',
        currentConcentrationUnit: sessionData.currentConcentrationUnit || 'mg/L',
        viewTransform: sessionData.viewTransform || { scale: 1, offsetX: 0, offsetY: 0, initialSetupDone: false },
        metricsCalculated: sessionData.metricsCalculated || false,
        lastRegressions: sessionData.lastRegressions || [],
        selectionSet: new Set(),
        editingRoiId: null,
        isDrawing: false,
        isPanning: false,
        isDraggingRoi: false,
        isResizingRoi: false,
    }), { type: 'session_restore' });
}

export function setupForNewImage(imageData) {
    if (imageData) {
        log('actions', 'info', `Ação: Configurando estado para nova imagem: ${imageData.originalImage.fileName}.`);
    } else {
        log('actions', 'warn', 'Ação: Limpando imagem atual e resetando estado.');
    }
    
    const chart = getState().calibrationChart;
    if (chart) {
        chart.destroy();
    }

    setState(() => ({
        originalImage: imageData ? imageData.originalImage : { src: null, fileName: '' },
        offscreenCanvas: imageData ? imageData.offscreenCanvas : null,
        rois: [],
        selectionSet: new Set(),
        editingRoiId: null,
        analyticalWhiteRoiId: null,
        nextRoiId: 1,
        nextCalibrationOrder: 1,
        metricsCalculated: false,
        isAnalysisStale: false,
        lastRegressions: [],
        regressionViewMode: 'best',
        visibleRegressionParameters: new Set(),
        isQualityPanelExpanded: false,
        analysisTitle: '',
        calibrationChart: null,
        viewTransform: { scale: 1, offsetX: 0, offsetY: 0, initialSetupDone: false },
        appMode: 'idle',
        isViewLocked: false,
        isMultiSelectMode: false,
        sequencedRois: [],
        gridCornerPoints: [],
        draggedCornerIndex: -1,
        isDrawing: false,
        isPanning: false,
        isDraggingRoi: false,
        isResizingRoi: false,
        activeConcentrationModalRoiId: null,
        dragInitialState: null,
        contextMenu: { visible: false, roiId: null, x: 0, y: 0 }
    }), { type: 'full_reset' });
}

export function startManualSequencing() {
    log('actions', 'info', 'Ação: Iniciar modo de sequenciamento manual.');
    setState(() => ({
        appMode: 'sequencingRois',
        sequencedRois: []
    }), { type: 'sequencing_start' });
}

export function addRoiToSequence(roiId) {
    const currentState = getState();
    if (!currentState.sequencedRois.includes(roiId)) {
        log('actions', 'data', `Ação: Adicionar ROI ID ${roiId} à sequência.`);
        const newSequencedRois = [...currentState.sequencedRois, roiId];
        setState(() => ({
            sequencedRois: newSequencedRois
        }), { type: 'sequencing_change' });
    }
}

export function undoLastInSequence() {
    log('actions', 'info', 'Ação: Desfazer última seleção de sequência.');
    const currentState = getState();
    const newSequencedRois = currentState.sequencedRois.slice(0, -1);
    setState(() => ({
        sequencedRois: newSequencedRois
    }), { type: 'sequencing_change' });
}

export function cancelSequencing() {
    log('actions', 'info', 'Ação: Cancelar modo de sequenciamento.');
    setState(() => ({
        appMode: 'idle',
        sequencedRois: []
    }), { type: 'sequencing_end' });
}

export function applyManualSequence() {
    log('actions', 'info', 'Ação: Aplicar sequência manual.');
    const currentState = getState();
    const sequencedIds = currentState.sequencedRois;
    if (sequencedIds.length === 0) {
        cancelSequencing();
        return;
    }
    
    const sequencedSet = new Set(sequencedIds);
    const orderedRois = sequencedIds.map(id => currentState.rois.find(r => r.id === id));
    const remainingRois = currentState.rois.filter(r => !sequencedSet.has(r.id));
    
    setState(() => ({
        rois: [...orderedRois, ...remainingRois],
        appMode: 'idle',
        sequencedRois: []
    }), { type: 'roi_order_change' });
}

// --- INÍCIO DA ALTERAÇÃO ---
export function applyAutoSequence(orderedRois) {
    log('actions', 'info', 'Ação: Aplicar sequência automática e re-numerar.');
    const currentState = getState();
    const sortedIdSet = new Set(orderedRois.map(r => r.id));
    
    // Mantém as ROIs que não fazem parte da ordenação (amostras, branco)
    const otherRois = currentState.rois.filter(r => !sortedIdSet.has(r.id));
    
    // Cria a lista de ROIs com a nova ordem
    const reorderedRois = [...otherRois, ...orderedRois];

    // Agora, aplica a renumeração na lista já reordenada, que é a etapa que estava faltando
    const finalRois = roiManager.renumberStandardRois(reorderedRois, currentState.analyticalWhiteRoiId);

    setState(() => ({
        rois: finalRois // Atualiza o estado com a lista final e corretamente numerada
    }), { type: 'roi_order_change' });
}
// --- FIM DA ALTERAÇÃO ---

export function setAnalysisAsStale(isStale) {
    const logType = isStale ? 'warn' : 'info';
    const logMessage = `Ação: Definir estado de análise como ${isStale ? "'desatualizado'" : "'atualizado'"}.`;
    log('actions', logType, logMessage);

    setState(() => ({
        isAnalysisStale: isStale
    }), { type: 'analysis_stale_change' });
}

export function setMetricsCalculated(value) {
    setState(() => ({ metricsCalculated: value }), { type: 'analysis_update' });
}

export function setVisibleRegressionParameters(paramSet) {
    setState(() => ({ visibleRegressionParameters: paramSet }), { type: 'analysis_view_change' });
};

export function setLastRegressions(regressions) {
    setState(() => ({ lastRegressions: regressions }), { type: 'analysis_update' });
};

export function setRegressionViewMode(mode) {
    log('actions', 'info', `Ação: Mudar modo de visualização da regressão para '${mode}'.`);
    setState(() => ({ regressionViewMode: mode }), { type: 'analysis_view_change' });
}

export function hideContextMenu() {
    setState(currentState => {
        if (currentState.contextMenu.visible) {
            return { contextMenu: { ...currentState.contextMenu, visible: false } };
        }
        return {};
    }, { type: 'ui_state_change' });
}

export function setCurrentTab(tab) {
    setState(() => ({ currentTab: tab }), { type: 'ui_state_change' });
}

export function toggleViewLock() {
    setState(s => ({ isViewLocked: !s.isViewLocked }), { type: 'ui_toggle' });
}

export function toggleMagnifierEnabled() {
    setState(s => ({ isMagnifierEnabled: !s.isMagnifierEnabled }), { type: 'ui_toggle' });
}

export function setDeferredInstallPrompt(prompt) {
    setState(() => ({ deferredInstallPrompt: prompt }), { type: 'ui_state_change' });
}

export function toggleQualityPanel() {
    log('state', 'data', `Estado do painel de qualidade alterado para: ${!getState().isQualityPanelExpanded ? 'expandido' : 'recolhido'}`);
    setState(s => ({ isQualityPanelExpanded: !s.isQualityPanelExpanded }), { type: 'ui_toggle' });
}

export function sortQualityPanel(key, direction) {
    setState(currentState => {
        const sortedModels = [...currentState.lastRegressions].sort((a, b) => {
            // Lógica de ordenação complexa pode ser implementada aqui
            return 0; // Placeholder
        });
        return { lastRegressions: sortedModels };
    }, { type: 'analysis_view_change' });
}

// --- INÍCIO DA SEÇÃO COM CORREÇÕES DE ESCOPO E IMUTABILIDADE ---
// As funções abaixo foram refatoradas para garantir que o payload da notificação
// seja sempre o objeto correto, e não nulo devido a problemas de escopo.

export function updateRoiProcessedData(payload) {
    const { roiId, ...processedData } = payload;
    log('actions', 'data', `Ação: Atualizar dados processados para ROI ID ${roiId}.`);

    const currentState = getState();
    let payloadRoi = null;

    const newRois = currentState.rois.map(r => {
        if (r.id === roiId) {
            payloadRoi = { ...r, ...processedData };
            return payloadRoi;
        }
        return r;
    });

    setState(() => ({ rois: newRois }), { type: 'roi_data_change', payload: payloadRoi });
}

export function updateRoiName(roiId, newName) {
    log('actions', 'info', `Ação: Atualizar nome da ROI ID ${roiId} para "${newName}".`);
    
    const currentState = getState();
    let payloadRoi = null;

    const newRois = currentState.rois.map(r => {
        if (r.id === roiId) {
            payloadRoi = { ...r, customName: newName };
            return payloadRoi;
        }
        return r;
    });

    setState(() => ({ rois: newRois }), { type: 'roi_attribute_change', payload: payloadRoi });
}

export function toggleRoiDetails(roiId) {
    log('actions', 'info', `Ação: Alternar detalhes para ROI ID ${roiId}.`);
    
    const currentState = getState();
    let payloadRoi = null;

    const newRois = currentState.rois.map(r => {
        if (r.id === roiId) {
            payloadRoi = { ...r, isDetailsExpanded: !r.isDetailsExpanded };
            return payloadRoi;
        }
        return r;
    });

    setState(() => ({ rois: newRois }), { type: 'ui_toggle', payload: payloadRoi });
}

export function deleteSingleRoi(roiId) {
    const currentState = getState();
    let newRois = currentState.rois.filter(r => r.id !== roiId);
    
    let newWhiteId = currentState.analyticalWhiteRoiId;
    if (newWhiteId === roiId) newWhiteId = null;

    newRois = roiManager.renumberStandardRois(newRois, newWhiteId);

    const selection = new Set(currentState.selectionSet);
    selection.delete(roiId);

    setState(() => ({
        rois: newRois,
        selectionSet: selection,
        analyticalWhiteRoiId: newWhiteId
    }), { type: 'roi_delete', payload: { roiIds: [roiId] } });

    if (getState().metricsCalculated) {
        setAnalysisAsStale(true);
    }
}

export function toggleSingleRoiAsSample(roiId) {
    const currentState = getState();
    let newWhiteId = currentState.analyticalWhiteRoiId;
    let payloadRoi = null;
    
    const newRoisWithToggle = currentState.rois.map(r => {
        if (r.id === roiId) {
            const newIsSample = !r.isSample;
            if (newIsSample && r.id === newWhiteId) {
                newWhiteId = null;
            }
            payloadRoi = { ...r, isSample: newIsSample };
            return payloadRoi;
        }
        return r;
    });

    const finalRois = roiManager.renumberStandardRois(newRoisWithToggle, newWhiteId);
    
    // Garante que o payload seja a versão final da ROI após a renumeração
    const finalPayload = finalRois.find(r => r.id === roiId) || payloadRoi;

    setState(() => ({
        rois: finalRois,
        analyticalWhiteRoiId: newWhiteId
    }), { type: 'roi_attribute_change', payload: finalPayload });

    if (getState().metricsCalculated) {
        setAnalysisAsStale(true);
    }
}

export function toggleLockForSingleRoi(roiId) {
    const currentState = getState();
    let payloadRoi = null;

    const newRois = currentState.rois.map(r => {
        if (r.id === roiId) {
            const shouldLock = !(r.isPositionLocked && r.isSizeLocked);
            payloadRoi = { ...r, isPositionLocked: shouldLock, isSizeLocked: shouldLock };
            return payloadRoi;
        }
        return r;
    });

    setState(() => ({ rois: newRois }), { type: 'roi_attribute_change', payload: payloadRoi });
}

export function updateRoiConcentration(roiId, concentrationValue) {
    const currentState = getState();
    let payloadRoi = null;

    const newRois = currentState.rois.map(r => {
        if (r.id === roiId) {
            const concentration = concentrationValue === '' ? null : parseFloat(String(concentrationValue).replace(',', '.'));
            if (concentrationValue !== '' && isNaN(concentration)) {
                return r; // Não modifica se o valor for inválido
            }
            const isConcentrationSet = concentration !== null;
            payloadRoi = { ...r, concentration: concentration, useInCalibration: isConcentrationSet };
            return payloadRoi;
        }
        return r;
    });

    setState(() => ({ rois: newRois }), { type: 'roi_attribute_change', payload: payloadRoi });
}

export function setRoiCalibrationUsage(roiId, isChecked) {
    const currentState = getState();
    let payloadRoi = null;

    const newRois = currentState.rois.map(r => {
        if (r.id === roiId) {
            payloadRoi = { ...r, useInCalibration: isChecked };
            return payloadRoi;
        }
        return r;
    });

    setState(() => ({ rois: newRois }), { type: 'roi_attribute_change', payload: payloadRoi });
}

export function setAllRoisCalibrationUsage(isChecked) {
    const currentState = getState();
    const roisForTableIds = new Set(currentState.rois.filter(r => r.calibrationOrder !== null).map(r => r.id));

    const newRois = currentState.rois.map(roi => {
        if (roisForTableIds.has(roi.id) && roi.concentration !== null) {
            return { ...roi, useInCalibration: isChecked };
        }
        return roi;
    });

    const payloadRois = newRois.filter(r => roisForTableIds.has(r.id));

    setState(() => ({ rois: newRois }), { type: 'roi_attribute_change', payload: payloadRois });
}

export function resizeSelectedRoisByScale(relativeScale) {
    const currentState = getState();
    const selection = currentState.selectionSet;
    if (selection.size === 0) return;

    let roisToUpdate = [];
    const newRois = currentState.rois.map(roi => {
        if (selection.has(roi.id) && !roi.isSizeLocked) {
            let newRoi = { ...roi };
            if (roi.type === 'rect') {
                const centerX = roi.x + roi.width / 2;
                const centerY = roi.y + roi.height / 2;
                const newWidth = roi.width * relativeScale;
                const newHeight = roi.height * relativeScale;
                if (newWidth >= 3 && newHeight >= 3) {
                    newRoi.width = newWidth;
                    newRoi.height = newHeight;
                    newRoi.x = centerX - newWidth / 2;
                    newRoi.y = centerY - newHeight / 2;
                }
            } else if (roi.type === 'circle') {
                const centerX = roi.x + roi.radius;
                const centerY = roi.y + roi.radius;
                const newRadius = roi.radius * relativeScale;
                if (newRadius >= 2) {
                    newRoi.radius = newRadius;
                    newRoi.x = centerX - newRadius;
                    newRoi.y = centerY - newRadius;
                }
            }
            roisToUpdate.push(newRoi);
            return newRoi;
        }
        return roi;
    });

    setState(() => ({ rois: newRois }), { type: 'roi_data_change', payload: roisToUpdate });
}

export function recalculateSelectedRoisData() {
    const currentState = getState();
    const selection = currentState.selectionSet;
    if (selection.size === 0) return;
    
    let roisToRecalculate = [];
    const newRois = currentState.rois.map(roi => {
        if (selection.has(roi.id)) {
            const updatedRoi = { ...roi, rgb: {}, pixelCount: 0 };
            roisToRecalculate.push(updatedRoi);
            return updatedRoi;
        }
        return roi;
    });

    setState(() => ({ rois: newRois }), { type: 'roi_data_change', payload: roisToRecalculate });

    roisToRecalculate.forEach(roi => roiManager.requestRoiDataProcessing(roi));

    if (getState().metricsCalculated) {
        setAnalysisAsStale(true);
    }
}
// --- INÍCIO DA CORREÇÃO (BUGFIX-CONCENTRATION-FLOW-05) ---

export function clearAllCalibrationConcentrations() {
    log('actions', 'warn', 'Ação: Limpando todas as concentrações de calibração.');

    const currentState = getState();
    const roisToClearIds = new Set(
        currentState.rois.filter(r => r.calibrationOrder !== null).map(r => r.id)
    );

    if (roisToClearIds.size === 0) return;

    const payloadRois = [];
    const newRois = currentState.rois.map(roi => {
        if (roisToClearIds.has(roi.id)) {
            const updatedRoi = { ...roi, concentration: null, useInCalibration: false };
            payloadRois.push(updatedRoi);
            return updatedRoi;
        }
        return roi;
    });
    
    // Notifica a UI sobre as ROIs que mudaram e também invalida o estado da análise
    setState(() => ({
        rois: newRois,
        isAnalysisStale: true
    }), { type: 'roi_attribute_change', payload: payloadRois });
}

// --- FIM DA CORREÇÃO ---
// --- FIM DA SEÇÃO COM CORREÇÕES ---