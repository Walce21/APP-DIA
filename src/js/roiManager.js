// js/roiManager.js

import * as state from './state.js';
import * as modalManager from './modalManager.js';
import * as analysisManager from './analysisManager.js';
import * as chartManager from './chartManager.js';
import * as actions from './stateActions.js';
import * as workerManager from './workerManager.js';

/**
 * Uma versão "debounced" da função `recalculateAllRoiData`.
 * Atraso de 400ms para agrupar múltiplas chamadas rápidas em uma única execução,
 * melhorando drasticamente a performance ao arrastar ou redimensionar ROIs.
 * A função `debounce` está globalmente disponível a partir de `utils.js`.
 */
export const debouncedRecalculateAllRoiData = debounce(recalculateAllRoiData, 400);

/**
 * Prepara os dados de pixel de uma ROI e despacha uma mensagem para que o worker os processe.
 * @param {object} roi - A ROI para a qual os dados serão extraídos.
 */
export function requestRoiDataProcessing(roi) {
    log('roiManager', 'info', `Solicitando processamento de dados para ROI ID: ${roi.id}`);
    const offscreenCanvas = state.offscreenCanvas();
    if (!offscreenCanvas) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    
    let x, y, w, h;

    if (roi.type === 'rect') {
        x = Math.floor(roi.x);
        y = Math.floor(roi.y);
        w = Math.floor(roi.width);
        h = Math.floor(roi.height);
    } else { // circle
        const centerX = roi.x + roi.radius;
        const centerY = roi.y + roi.radius;
        x = Math.floor(centerX - roi.radius);
        y = Math.floor(centerY - roi.radius);
        w = h = Math.floor(roi.radius * 2);
    }

    if (w <= 0 || h <= 0) return;

    tempCanvas.width = w;
    tempCanvas.height = h;

    tempCtx.drawImage(offscreenCanvas, x, y, w, h, 0, 0, w, h);

    try {
        const imageData = tempCtx.getImageData(0, 0, w, h);
        const roiPayload = JSON.parse(JSON.stringify(roi));
        
        workerManager.sendMessageToWorker({
            type: 'processRoiData',
            payload: { roi: roiPayload, imageData }
        }, [imageData.data.buffer]);

    } catch (e) {
        log('roiManager', 'error', "Falha ao extrair ImageData para a ROI.", { roiId: roi.id, error: e });
    }
}

export function addBatchRois(roiArray) {
    if (!roiArray || roiArray.length === 0) return [];
    log('roiManager', 'info', `Adicionando lote de ${roiArray.length} ROIs.`);
    
    const newRoiIds = [];
    const newRois = [];

    roiArray.forEach(roi => {
        const newId = state.getNextRoiId();
        const newRoi = {
            ...roi, id: newId, name: `ROI ${newId}`, customName: null, concentration: null, calibrationOrder: null,
            isSample: false, useInCalibration: false, isPositionLocked: false, isSizeLocked: false, 
            isDetailsExpanded: false, analyticalResponse: [], predictedConcentrations: [], sampleDescription: '',
            pixelCount: 0
        };
        newRois.push(newRoi);
        newRoiIds.push(newId);
    });

    actions.addBatchRois(newRois);
    newRois.forEach(roi => requestRoiDataProcessing(roi));

    log('roiManager', 'info', `${newRoiIds.length} ROIs do lote foram adicionadas e enviadas para processamento.`);
    return newRoiIds;
}

export function duplicateSelectedRois() {
    const selection = state.selectionSet();
    const roisToDuplicate = Array.from(selection);
    if (roisToDuplicate.length === 0) return;

    const newRois = [];
    const newRoiIds = [];
    
    roisToDuplicate.forEach(roiId => {
        const originalRoi = state.rois().find(r => r.id === roiId);
        if (originalRoi) {
            const newId = state.getNextRoiId();
            const newRoi = {
                type: originalRoi.type, x: originalRoi.x + 25, y: originalRoi.y + 25,
                width: originalRoi.width, height: originalRoi.height, radius: originalRoi.radius,
                id: newId, name: `ROI ${newId}`, customName: null, concentration: null, calibrationOrder: null,
                isSample: false, useInCalibration: false, isPositionLocked: false, isSizeLocked: false, 
                isDetailsExpanded: false, analyticalResponse: [], predictedConcentrations: [], sampleDescription: '',
                pixelCount: 0
            };
            newRois.push(newRoi);
            newRoiIds.push(newId);
        }
    });

    if (newRois.length > 0) {
        actions.addBatchRois(newRois);
        state.setState(() => ({ selectionSet: new Set(newRoiIds), editingRoiId: null }));
        
        newRois.forEach(roi => requestRoiDataProcessing(roi));
        
        modalManager.showToast(`${newRois.length} ROI(s) duplicada(s).`);
    }
}

export function recalculateAllRoiData() {
    log('roiManager', 'info', "Solicitando recálculo de dados para todas as ROIs.");
    state.rois().forEach(roi => {
        Object.assign(roi, { pixelCount: 0, rgb: {} });
        requestRoiDataProcessing(roi);
    });
    state.setState(() => ({ rois: state.rois() }));
}

export function updateDrawingRoi(endX, endY) {
    const roi = state.currentRoi();
    const startPos = state.drawingStartPos();
    if (!roi || !startPos) return;

    const newRoi = { ...roi };

    if (newRoi.type === 'rect') {
        newRoi.width = endX - startPos.x;
        newRoi.height = endY - startPos.y;
    } else if (newRoi.type === 'circle') {
        const dx = endX - startPos.x;
        const dy = endY - startPos.y;
        newRoi.radius = Math.hypot(dx, dy) / 2;
        newRoi.x = startPos.x + dx / 2 - newRoi.radius;
        newRoi.y = startPos.y + dy / 2 - newRoi.radius;
    }

    state.setDrawingState(true, startPos, newRoi);
}

export const throttledUpdateDrawingRoi = throttle(updateDrawingRoi, 16);

export function resizeSelectedRoi(currentX, currentY) {
    const selection = state.selectionSet();
    if (selection.size !== 1) return;
    const roiId = selection.values().next().value;
    const roi = state.rois().find(r => r.id === roiId);
    
    if (!roi || roi.isSizeLocked) return;
    
    if (roi.type === 'rect') {
        let { x: newX, y: newY, width: newWidth, height: newHeight } = roi;
        switch (state.resizeHandle()) {
            case 'nw': newWidth = roi.x + roi.width - currentX; newHeight = roi.y + roi.height - currentY; newX = currentX; newY = currentY; break;
            case 'n': newHeight = roi.y + roi.height - currentY; newY = currentY; break;
            case 'ne': newWidth = currentX - roi.x; newHeight = roi.y + roi.height - currentY; newY = currentY; break;
            case 'e': newWidth = currentX - roi.x; break;
            case 'se': newWidth = currentX - roi.x; newHeight = currentY - roi.y; break;
            case 's': newHeight = currentY - roi.y; break;
            case 'sw': newWidth = roi.x + roi.width - currentX; newHeight = currentY - roi.y; newX = currentX; break;
            case 'w': newWidth = roi.x + roi.width - currentX; newX = currentX; break;
        }
        if (newWidth > 1) { roi.x = newX; roi.width = newWidth; }
        if (newHeight > 1) { roi.y = newY; roi.height = newHeight; }
    } else if (roi.type === 'circle') {
        const centerX = roi.x + roi.radius;
        const centerY = roi.y + roi.radius;
        const newRadius = Math.hypot(currentX - centerX, currentY - centerY);
        const oldRadius = roi.radius;
        roi.radius = Math.max(1, newRadius);
        roi.x += oldRadius - roi.radius;
        roi.y += oldRadius - roi.radius;
    }
}

export function resizeSelectedRoisByScale(scaleFactor) {
    const selection = state.selectionSet();
    if (selection.size === 0) return;
    log('roiManager', 'info', `Redimensionando ${selection.size} ROIs pelo fator: ${scaleFactor.toFixed(3)}.`);

    selection.forEach(roiId => {
        const roi = state.rois().find(r => r.id === roiId);
        if (!roi || roi.isSizeLocked) return;

        if (roi.type === 'rect') {
            const centerX = roi.x + roi.width / 2;
            const centerY = roi.y + roi.height / 2;
            const newWidth = roi.width * scaleFactor;
            const newHeight = roi.height * scaleFactor;
            if (newWidth < 3 || newHeight < 3) return;
            roi.width = newWidth;
            roi.height = newHeight;
            roi.x = centerX - newWidth / 2;
            roi.y = centerY - newHeight / 2;
        } else if (roi.type === 'circle') {
            const centerX = roi.x + roi.radius;
            const centerY = roi.y + roi.radius;
            const newRadius = roi.radius * scaleFactor;
            if (newRadius < 2) return;
            roi.radius = newRadius;
            roi.x = centerX - newRadius;
            roi.y = centerY - newRadius;
        }
    });
}

export function dragSelectedRois(currentX, currentY) {
    const initialState = state.dragInitialState();
    if (!initialState || !initialState.mousePos || !initialState.roiPositions) return;

    const totalDeltaX = currentX - initialState.mousePos.x;
    const totalDeltaY = currentY - initialState.mousePos.y;

    const positionUpdates = initialState.roiPositions.map(initialRoiPos => {
        const currentRoi = state.rois().find(r => r.id === initialRoiPos.id);
        if (currentRoi && !currentRoi.isPositionLocked) {
            return {
                id: initialRoiPos.id,
                x: initialRoiPos.x + totalDeltaX,
                y: initialRoiPos.y + totalDeltaY,
            };
        }
        return null;
    }).filter(Boolean);

    if (positionUpdates.length > 0) {
        state.updateRoiPositions(positionUpdates);
    }
}

export function rotateRois90(imageOriginalHeight) {
    log('roiManager', 'info', `Rotacionando todas as ROIs 90 graus. Altura original da imagem: ${imageOriginalHeight}`);
    const rois = state.rois();
    if (!rois || rois.length === 0) return;
    
    rois.forEach(roi => {
        let cx, cy; 
        if (roi.type === 'rect') {
            cx = roi.x + roi.width / 2;
            cy = roi.y + roi.height / 2;
        } else {
            cx = roi.x + roi.radius;
            cy = roi.y + roi.radius;
        }
        const newCx = imageOriginalHeight - cy;
        const newCy = cx;

        if (roi.type === 'rect') {
            const oldWidth = roi.width;
            roi.width = roi.height;
            roi.height = oldWidth;
            roi.x = newCx - roi.width / 2;
            roi.y = newCy - roi.height / 2;
        } else {
            roi.x = newCx - roi.radius;
            roi.y = newCy - roi.radius;
        }
    });
    
    recalculateAllRoiData();
}

function updateUiAfterModification() {
    log('roiManager', 'info', "Disparando invalidação de análise após modificação de ROIs.");
    analysisManager.invalidateAnalysisIfNecessary();
}

export function deleteRoiAndUpdate(roiId) {
    log('roiManager', 'info', `Solicitando exclusão da ROI ID: ${roiId}`);
    state.setState(currentState => {
        const newRois = currentState.rois.filter(r => r.id !== roiId);
        const selection = new Set(currentState.selectionSet);
        selection.delete(roiId);
        let newWhiteId = currentState.analyticalWhiteRoiId;
        if (newWhiteId === roiId) {
            newWhiteId = null;
        }
        return { rois: newRois, selectionSet: selection, analyticalWhiteRoiId: newWhiteId };
    });
    updateUiAfterModification();
}

export async function deleteSelectedRois() {
    const selectionSize = state.selectionSet().size;
    if (selectionSize === 0) return;

    if (selectionSize > 1) {
        try {
            await modalManager.openConfirmationModal(
                'Confirmar Exclusão Múltipla',
                `Tem certeza que deseja excluir as ${selectionSize} ROIs selecionadas?`
            );
        } catch (error) {
            log('roiManager', 'info', 'Exclusão de múltiplas ROIs cancelada pelo usuário.');
            return;
        }
    }
    
    actions.deleteSelectedRois();
    updateUiAfterModification();
    
    const pluralRois = selectionSize > 1 ? 's' : '';
    const pluralVerb = selectionSize > 1 ? 's' : 'a';
    modalManager.showToast(`${selectionSize} ROI${pluralRois} excluída${pluralVerb}.`);
}

export async function deleteAllRois() {
    try {
        await modalManager.openConfirmationModal(
            'Excluir Todas as ROIs',
            `Tem certeza que deseja excluir TODAS as ${state.rois().length} ROIs? Esta ação não pode ser desfeita.`,
            { confirmText: 'Excluir Tudo' }
        );
        actions.deleteAllRois();
        chartManager.clearChart(true);
        chartManager.initializeChart();
        modalManager.showToast("Todas as ROIs e dados de análise foram limpos.");

    } catch (error) {
        log('roiManager', 'info', 'Exclusão de todas as ROIs cancelada pelo usuário.');
    }
}

export function toggleAnalyticalWhite(roiId) {
    actions.toggleAnalyticalWhite(roiId);
    updateUiAfterModification();
}

export function toggleSetAsSample(roiId) {
    const roi = state.rois().find(r => r.id === roiId);
    if (!roi) return;
    roi.isSample = !roi.isSample;
    if (roi.isSample && roi.id === state.analyticalWhiteRoiId()) {
        state.setAnalyticalWhiteRoiId(null);
    }
    updateUiAfterModification();
}

export function toggleSelectedRoisAsSample() {
    actions.toggleSelectedRoisAsSample();
    updateUiAfterModification();
}

// --- INÍCIO DA CORREÇÃO (BUGFIX-CONCENTRATION-FLOW-05) ---

export function clearAllConcentrations() {
    // A lógica desta função foi movida para stateActions.js (clearAllCalibrationConcentrations)
    // para centralizar as mutações de estado e garantir o fluxo de dados reativo.
    // O event listener no analysisPanelBinder.js será atualizado para chamar a nova ação.
    log('roiManager', 'info', 'A função clearAllConcentrations foi chamada, mas sua lógica agora está centralizada em stateActions.');
}

// --- FIM DA CORREÇÃO ---

export function updateRoiName(roiId, newName) {
    actions.updateRoiName(roiId, newName);
}

export function toggleLockForSingleRoi(roiId) {
    const roi = state.rois().find(r => r.id === roiId);
    if (!roi) return;
    const shouldLock = !(roi.isPositionLocked && roi.isSizeLocked);
    
    state.setState(currentState => {
        const r = currentState.rois.find(r => r.id === roiId);
        if (r) {
            r.isPositionLocked = shouldLock;
            r.isSizeLocked = shouldLock;
        }
        return {}; 
    });
    log('roiManager', 'info', `Trava de Posição/Tamanho para ROI ID ${roiId} definida como: ${shouldLock}.`);
}

export function toggleSelectedPositionLock() {
    actions.toggleSelectedPositionLock();
}

export function toggleSelectedSizeLock() {
    actions.toggleSelectedSizeLock();
}

/**
 * Revisa e consolida a ordem de calibração para ROIs padrão.
 * Esta é uma função "pura": ela recebe um estado e retorna um novo estado, sem efeitos colaterais.
 * @param {Array<object>} currentRois - O array atual de todas as ROIs.
 * @param {number|null} analyticalWhiteRoiId - O ID da ROI de branco analítico.
 * @returns {Array<object>} Um novo array de ROIs com a ordem de calibração atualizada.
 */
export function renumberStandardRois(currentRois, analyticalWhiteRoiId) {
    log('roiManager', 'logic', "Executando lógica de renumeração para ROIs padrão.");
    
    const roisCopy = JSON.parse(JSON.stringify(currentRois));

    const standardRois = [];
    const otherRois = [];

    roisCopy.forEach(roi => {
        if (!roi.isSample && roi.id !== analyticalWhiteRoiId) {
            standardRois.push(roi);
        } else {
            otherRois.push(roi);
        }
    });

    // --- INÍCIO DA ALTERAÇÃO ---
    // A linha abaixo, que reordenava as ROIs por ID, foi removida.
    // A função agora confia na ordem em que as ROIs são recebidas.
    // standardRois.sort((a, b) => a.id - b.id);
    // --- FIM DA ALTERAÇÃO ---

    standardRois.forEach((roi, index) => {
        const newOrder = index + 1;
        roi.calibrationOrder = newOrder;
        if (!roi.customName) {
            roi.name = `Padrão ${newOrder}`;
        }
    });

    otherRois.forEach(roi => {
        roi.calibrationOrder = null;
    });

    return [...standardRois, ...otherRois];
}

export function isPointInRoi(x, y, roi) {
    if (roi.type === 'rect') {
        return x >= roi.x && x <= roi.x + roi.width && y >= roi.y && y <= roi.y + roi.height;
    } else {
        const centerX = roi.x + roi.radius;
        const centerY = roi.y + roi.radius;
        return Math.hypot(x - centerX, y - centerY) <= roi.radius;
    }
}