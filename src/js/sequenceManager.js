// js/sequenceManager.js

import * as state from './state.js';
import * as uiManager from './uiManager.js';
import * as dom from './domElements.js';
import * as modalManager from './modalManager.js';
import * as roiManager from './roiManager.js';
import * as actions from './stateActions.js';
// --- INÍCIO DA ALTERAÇÃO ---
// Importado o 'drawingHandler' para usar a função de desenho correta.
// O 'canvasManager' é para orquestração de eventos, não para desenho direto.
import * as drawingHandler from './drawingHandler.js';
// --- FIM DA ALTERAÇÃO ---

let sequenceControlsContainer = null;
let roisForSequencing = []; // Armazena as ROIs que estão sendo sequenciadas na sessão atual
let mainPromiseResolve = null;
let mainPromiseReject = null;


/**
 * Ordena um array de ROIs com base em um conjunto complexo de opções de um painel.
 * @param {object} options - As opções de ordenação { pattern, scan, read, serpentine }.
 * @param {Array<number>} roiIds - Os IDs das ROIs a serem ordenadas.
 */
function applyAutoSequence(options, roiIds) {
    log('sequenceManager', 'info', 'Iniciando ordenação automática com opções:', options);
    
    const allCurrentRois = state.rois();
    let roisToSort = roiIds.map(id => allCurrentRois.find(r => r.id === id)).filter(Boolean);
    if (roisToSort.length === 0) {
        log('sequenceManager', 'warn', 'Nenhuma ROI válida encontrada para ordenação.');
        return;
    }

    log('sequenceManager', 'data', `${roisToSort.length} ROIs a serem ordenadas.`);

    const avgRadius = roisToSort.reduce((sum, roi) => sum + (roi.radius || 0), 0) / roisToSort.length || 10;
    const tolerance = avgRadius * 1.5;

    const primaryCoord = options.pattern === 'horizontal' ? 'y' : 'x';
    const secondaryCoord = options.pattern === 'horizontal' ? 'x' : 'y';

    const groups = [];
    let tempRois = [...roisToSort];
    while (tempRois.length > 0) {
        let referenceRoi = tempRois.shift();
        let currentGroup = [referenceRoi];
        let others = [];
        for (const roi of tempRois) {
            if (Math.abs(roi[primaryCoord] - referenceRoi[primaryCoord]) < tolerance) {
                currentGroup.push(roi);
            } else {
                others.push(roi);
            }
        }
        groups.push(currentGroup);
        tempRois = others;
    }

    const scanMultiplier = (options.scan === 'bottom_to_top' || options.scan === 'right_to_left') ? -1 : 1;
    groups.sort((groupA, groupB) => {
        const meanA = groupA.reduce((sum, roi) => sum + roi[primaryCoord], 0) / groupA.length;
        const meanB = groupB.reduce((sum, roi) => sum + roi[primaryCoord], 0) / groupB.length;
        return (meanA - meanB) * scanMultiplier;
    });

    const readMultiplier = (options.read === 'right_to_left' || options.read === 'bottom_to_top') ? -1 : 1;
    const finalSortedRois = [];
    groups.forEach((group, index) => {
        let currentReadMultiplier = readMultiplier;
        if (options.serpentine && index % 2 !== 0) {
            currentReadMultiplier *= -1;
        }
        group.sort((a, b) => (a[secondaryCoord] - b[secondaryCoord]) * currentReadMultiplier);
        finalSortedRois.push(...group);
    });

    actions.applyAutoSequence(finalSortedRois);
    
    log('sequenceManager', 'data', 'Nova ordem de ROIs aplicada via ação.');
}


/**
 * Inicia o modo de sequenciamento manual por toque.
 */
function startManualTouchSequencing() {
    actions.changeCurrentTool('pointer');

    if (dom.canvasContainer) {
        dom.canvasContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    actions.startManualSequencing();

    setupSequenceControls();
    updateInstructions();
    // --- INÍCIO DA ALTERAÇÃO ---
    // Corrigido para chamar a função de desenho do módulo correto.
    drawingHandler.draw();
    // --- FIM DA ALTERAÇÃO ---
}

/**
 * Ponto de entrada para iniciar o sequenciamento. Abre o painel de controle.
 * Retorna uma Promise que resolve quando o usuário completa a ação ou rejeita ao cancelar.
 * @param {Set<number>|null} roiIdSet - Um conjunto de IDs de ROI para sequenciar (opcional).
 * @returns {Promise<object>} Uma promise que resolve com { status: 'completed' } ou rejeita.
 */
export function startSequencingMode(roiIdSet = null) {
    return new Promise((resolve, reject) => {
        mainPromiseResolve = resolve;
        mainPromiseReject = reject;

        const allCalibrationRois = state.rois().filter(r => !r.isSample && r.id !== state.analyticalWhiteRoiId());

        if (roiIdSet && roiIdSet.size > 0) {
            roisForSequencing = allCalibrationRois.filter(r => roiIdSet.has(r.id));
        } else {
            roisForSequencing = allCalibrationRois;
        }

        if (roisForSequencing.length < 2) {
            modalManager.showGeneralModal("São necessárias pelo menos 2 ROIs de calibração para definir uma ordem.");
            return reject(new Error("ROIs de calibração insuficientes."));
        }

        modalManager.openAdvancedSequenceModal(
            (options) => { // onConfirm (auto)
                const idsToSequence = roisForSequencing.map(r => r.id);
                applyAutoSequence(options, idsToSequence);
                resolve({ status: 'completed' });
            },
            () => { // onManual
                startManualTouchSequencing();
            },
            () => { // onCancel do modal inicial
                reject(new Error("Sequencing modal cancelled by user."));
            }
        );
    });
}

function updateInstructions() {
    const totalToSelect = roisForSequencing.length;
    const currentlySelected = state.sequencedRois().length;
    const nextIndex = currentlySelected + 1;

    if (currentlySelected >= totalToSelect) {
        if(dom.detectionInstructionText) dom.detectionInstructionText.textContent = 'Sequência completa! Clique em "Concluir".';
    } else {
        if(dom.detectionInstructionText) dom.detectionInstructionText.textContent = `Toque na ROI que corresponde ao Ponto de Calibração Nº ${nextIndex}`;
    }
}

function setupSequenceControls() {
    if (!dom.detectionInstructionPanel) return;
    if (dom.cancelInstructionButton) dom.cancelInstructionButton.classList.add('hidden');

    if (sequenceControlsContainer) {
        cleanupSequenceControls();
    }
    
    sequenceControlsContainer = document.createElement('div');
    sequenceControlsContainer.id = 'sequence-controls-container';
    sequenceControlsContainer.className = 'flex items-center gap-2';

    sequenceControlsContainer.innerHTML = `
        <button id="undoSequenceButton" class="px-3 py-1 bg-yellow-500 text-white rounded-md text-xs hover:bg-yellow-600">Desfazer</button>
        <button id="finishSequenceButton" class="px-3 py-1 bg-green-600 text-white rounded-md text-xs hover:bg-green-700">Concluir</button>
        <button id="cancelSequenceButton" class="px-3 py-1 bg-red-500 text-white rounded-md text-xs hover:bg-red-600">Cancelar</button>
    `;
    dom.detectionInstructionPanel.querySelector('.container').appendChild(sequenceControlsContainer);

    document.getElementById('undoSequenceButton').addEventListener('click', undo);
    document.getElementById('finishSequenceButton').addEventListener('click', finish);
    document.getElementById('cancelSequenceButton').addEventListener('click', () => cancel(false));

    sequenceControlsContainer.classList.remove('hidden');
    document.getElementById('undoSequenceButton').disabled = state.sequencedRois().length === 0;
}

function cleanupSequenceControls() {
    if (sequenceControlsContainer) {
        sequenceControlsContainer.remove();
        sequenceControlsContainer = null;
    }
    if (dom.cancelInstructionButton) dom.cancelInstructionButton.classList.remove('hidden');
}

function selectRoi(roiId) {
    if (state.appMode() !== 'sequencingRois') return;

    const isValidTarget = roisForSequencing.some(r => r.id === roiId);
    if (!isValidTarget || state.sequencedRois().includes(roiId)) {
        return;
    }

    actions.addRoiToSequence(roiId);

    updateInstructions();
    document.getElementById('undoSequenceButton').disabled = false;
    // --- INÍCIO DA ALTERAÇÃO ---
    drawingHandler.draw();
    // --- FIM DA ALTERAÇÃO ---
}

function undo() {
    actions.undoLastInSequence();

    updateInstructions();
    document.getElementById('undoSequenceButton').disabled = state.sequencedRois().length === 0;
    // --- INÍCIO DA ALTERAÇÃO ---
    drawingHandler.draw();
    // --- FIM DA ALTERAÇÃO ---
}

function finish() {
    actions.applyManualSequence();
    
    cancel(true);
}

export function cancel(wasCompleted = false) {
    const promiseAction = wasCompleted ? mainPromiseResolve : mainPromiseReject;
    const resolutionValue = wasCompleted ? { status: 'completed' } : new Error('Manual sequencing cancelled.');

    actions.cancelSequencing();

    cleanupSequenceControls();
    // --- INÍCIO DA ALTERAÇÃO ---
    drawingHandler.draw();
    // --- FIM DA ALTERAÇÃO ---

    if (typeof promiseAction === 'function') {
        promiseAction(resolutionValue);
    }
    mainPromiseResolve = null;
    mainPromiseReject = null;
}

export { selectRoi as handleRoiSelection };