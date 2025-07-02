// js/autoRoiDetector.js

import * as state from './state.js';
import * as modalManager from './modalManager.js';
import * as roiManager from './roiManager.js';
import * as dom from './domElements.js';
import * as uiManager from './uiManager.js';
import * as drawingHandler from './drawingHandler.js';
import * as sequenceManager from './sequenceManager.js';
import * as actions from './stateActions.js';

function animationLoop() {
    if (state.appMode() !== 'adjustingGrid') return;
    drawingHandler.draw();
    requestAnimationFrame(animationLoop);
}

export function startAdvancedDetection() {
    log('autoRoiDetector', 'info', "Iniciando modo de detecção avançada.");
    if (!state.offscreenCanvas()) {
        modalManager.showGeneralModal("Carregue uma imagem antes de detectar ROIs.");
        return;
    }
    
    actions.changeCurrentTool('pointer');

    const updateSliderValue = (slider, display) => {
        let value = parseFloat(slider.value).toFixed(slider.id.includes('circularity') ? 2 : 0);
        display.textContent = `Valor: ${value}`;
    };

    const sliders = [
        { slider: dom.saturationSlider, display: dom.saturationValue },
        { slider: dom.brightnessSlider, display: dom.brightnessValue },
        { slider: dom.minAreaSlider, display: dom.minAreaValue },
        { slider: dom.circularitySlider, display: dom.circularityValue }
    ];

    sliders.forEach(({ slider, display }) => {
        if (slider && display) {
            updateSliderValue(slider, display);
            slider.oninput = () => updateSliderValue(slider, display);
        }
    });

    const closeModal = () => {
        log('autoRoiDetector', 'info', 'Fechando modal de configurações de detecção avançada.');
        if (dom.autoRoiSettingsModal) dom.autoRoiSettingsModal.dataset.visible = 'false';
        if (dom.runDetectionWithSettings) dom.runDetectionWithSettings.onclick = null;
        if (dom.cancelAutoRoiSettings) dom.cancelAutoRoiSettings.onclick = null;
    };

    if (dom.autoRoiSettingsModal) {
        log('autoRoiDetector', 'info', 'Abrindo modal de configurações de detecção avançada.');
        dom.autoRoiSettingsModal.dataset.visible = 'true';
    }

    if (dom.runDetectionWithSettings) {
        dom.runDetectionWithSettings.onclick = () => {
            const settings = {
                minSaturation: parseFloat(dom.saturationSlider.value),
                minValue: parseFloat(dom.brightnessSlider.value),
                minArea: parseInt(dom.minAreaSlider.value, 10),
                minCircularity: parseFloat(dom.circularitySlider.value)
            };
            closeModal();
            
            modalManager.showLoadingModal('Analisando imagem em segundo plano...');
            
            try {
                const offscreenCanvas = state.offscreenCanvas();
                const ctx = offscreenCanvas.getContext('2d');
                const imageData = ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);

                log('autoRoiDetector', 'info', 'Disparando evento para detecção de círculos no worker.', { settings });

                // Dispara um evento para o workerManager (que será interceptado pelo eventBinder)
                window.dispatchEvent(new CustomEvent('request-circle-detection', {
                    detail: { imageData, settings }
                }));

            } catch (error) {
                log('autoRoiDetector', 'error', "Erro ao preparar dados para o worker:", error);
                modalManager.showGeneralModal("Ocorreu um erro ao preparar a imagem para análise.");
            }
        };
    }

    if (dom.cancelAutoRoiSettings) {
        dom.cancelAutoRoiSettings.onclick = closeModal;
    }
}

export function startGridAnalysis() {
    log('autoRoiDetector', 'info', "Iniciando análise de grade.");
    if (!state.offscreenCanvas()) {
        modalManager.showGeneralModal("Carregue uma imagem antes de iniciar a análise de grade.");
        return;
    }

    actions.changeCurrentTool('pointer');
    askDimensionsAndInitiateSelection();
}

async function askDimensionsAndInitiateSelection() {
    try {
        const { rows, cols } = await modalManager.openGridDimensionsModal();
        log('autoRoiDetector', 'info', `Dimensões da grade definidas: ${rows}x${cols}. Iniciando seleção de cantos.`);
        
        state.setLastGridDims({ rows, cols });
        state.clearGridCornerPoints();
        state.setAppMode('selectingGridCorners');

    } catch (error) {
        log('autoRoiDetector', 'info', "Entrada de dimensões da grade cancelada pelo usuário.");
    }
}

// --- INÍCIO DA ALTERAÇÃO ---
// A lógica de verificação e mudança de estado agora está centralizada aqui.
export function addGridCornerPoint(point) {
    if (state.gridCornerPoints().length >= 4) {
        log('autoRoiDetector', 'warn', 'Tentativa de adicionar um quinto ponto de grade ignorada.');
        return;
    }

    // Adiciona o ponto ao estado. A notificação reativa cuidará do redesenho.
    state.addGridCornerPoint(point);
    log('autoRoiDetector', 'info', `Ponto de canto da grade adicionado:`, point);

    // Imediatamente após adicionar, verifica se a condição de 4 pontos foi atingida.
    // Usamos o getState() para garantir que estamos lendo o valor mais atualizado após a mutação síncrona.
    if (state.getState().gridCornerPoints.length === 4) {
        log('autoRoiDetector', 'info', "Todos os 4 cantos selecionados. Entrando no modo de ajuste.");
        state.setAppMode('adjustingGrid');
        animationLoop();
    }
}

// A função onCornerSelected é agora redundante para o fluxo de clique e será removida
// da chamada no roiInteractionHandler.
export function onCornerSelected() {
    // Esta função pode ser mantida para outros propósitos ou removida se não for mais usada.
    // Por enquanto, a deixamos vazia ou com um log para depuração.
    log('autoRoiDetector', 'debug', 'onCornerSelected chamada (atualmente sem ação).');
}
// --- FIM DA ALTERAÇÃO ---

export function confirmGridAndRunAnalysis() {
    log('autoRoiDetector', 'info', "Grade confirmada pelo usuário. Rodando análise...");
    const dims = state.lastGridDims();
    if (dims) {
        runGridAnalysis(dims.rows, dims.cols);
    } else {
        log('autoRoiDetector', 'error', "Não foi possível encontrar as dimensões da grade no estado da aplicação.");
        modalManager.showGeneralModal("Erro: dimensões da grade não encontradas. Por favor, cancele e tente novamente.");
    }
}

export function cancelGridSelection() {
    log('autoRoiDetector', 'info', "Seleção de grade cancelada.");
    state.setAppMode('idle');
    state.clearGridCornerPoints();
}

async function runGridAnalysis(rows, cols) {
    try {
        const points = state.gridCornerPoints();
        if (points.length !== 4) return;
        
        log('autoRoiDetector', 'info', `Gerando grade de ${rows}x${cols} ROIs.`);

        points.sort((a, b) => a.y - b.y);
        const topPoints = [points[0], points[1]].sort((a, b) => a.x - b.x);
        const bottomPoints = [points[2], points[3]].sort((a, b) => a.x - b.x);
        const [tl, tr] = topPoints;
        const [bl, br] = bottomPoints;

        const newRois = [];
        const avgWidth = ((tr.x - tl.x) + (br.x - bl.x)) / 2;
        const avgHeight = ((bl.y - tl.y) + (br.y - tr.y)) / 2;
        const radius = Math.min(avgWidth / (cols - 1), avgHeight / (rows - 1)) / 5.0;

        for (let r = 0; r < rows; r++) {
            const v = (rows > 1) ? (r / (rows - 1)) : 0;
            const p1_x = tl.x + (bl.x - tl.x) * v;
            const p1_y = tl.y + (bl.y - tl.y) * v;
            const p2_x = tr.x + (br.x - tr.x) * v;
            const p2_y = tr.y + (br.y - tr.y) * v;

            for (let c = 0; c < cols; c++) {
                const u = (cols > 1) ? (c / (cols - 1)) : 0;
                const centerX = p1_x + (p2_x - p1_x) * u;
                const centerY = p1_y + (p2_y - p1_y) * u;

                newRois.push({
                    type: 'circle',
                    x: centerX - radius,
                    y: centerY - radius,
                    radius: radius,
                });
            }
        }
        
        if (newRois.length > 0) {
            log('autoRoiDetector', 'info', `${newRois.length} ROIs geradas com sucesso a partir da grade.`);
            const newRoiIds = roiManager.addBatchRois(newRois);
            const newRoiIdSet = new Set(newRoiIds);
            
            cancelGridSelection();
            
            try {
                await sequenceManager.startSequencingMode(newRoiIdSet);
                log('autoRoiDetector', 'info', 'Sequenciamento customizado concluído pelo usuário.');
            } catch (error) {
                log('autoRoiDetector', 'warn', 'Usuário cancelou a ordenação customizada. Aplicando ordenação padrão.', error.message);
                roiManager.renumberStandardRois();
            }
            
            modalManager.showToast(`${newRois.length} ROIs criadas e ordenadas!`);
            
        } else {
            log('autoRoiDetector', 'warn', "Nenhuma ROI foi gerada pela análise de grade.");
            modalManager.showGeneralModal("Nenhuma ROI foi gerada pela análise de grade.");
            cancelGridSelection();
        }

    } catch (error) {
        log('autoRoiDetector', 'error', "Erro na análise de grade:", error);
        modalManager.showGeneralModal("Ocorreu um erro durante a análise de grade.");
        cancelGridSelection();
    } 
}

export function startAreaDetection() {
    log('autoRoiDetector', 'info', "Função 'Detectar em Área' chamada (ainda não implementada).");
    modalManager.showGeneralModal("Função 'Detectar em Área' será implementada em breve!");
}

export function initializeAutoRoiDetectorEvents() {
    if(dom.confirmGridButton) {
        dom.confirmGridButton.addEventListener('click', confirmGridAndRunAnalysis);
    }
    if(dom.cancelGridButton) {
        dom.cancelGridButton.addEventListener('click', cancelGridSelection);
    }
    if(dom.cancelInstructionButton) {
        dom.cancelInstructionButton.addEventListener('click', () => {
            if (state.appMode() === 'sequencingRois') {
                sequenceManager.cancel();
            } else {
                cancelGridSelection();
            }
        });
    }
    log('autoRoiDetector', 'success', 'Eventos do fluxo de detecção de grade vinculados.');
}