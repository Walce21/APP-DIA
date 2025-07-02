// js/roiActionPanelBinder.js

// Importações de módulos para funcionalidades
import * as dom from './domElements.js';
import * as state from './state.js';
import * as roiManager from './roiManager.js';
import * as sequenceManager from './sequenceManager.js';
import * as canvasManager from './canvasManager.js';
import * as actions from './stateActions.js';

/**
 * Configura os event listeners para um slider de redimensionamento em massa.
 * @param {HTMLInputElement} sliderElement - O elemento do slider.
 * @param {HTMLElement} valueElement - O elemento para exibir o valor percentual.
 */
function setupResizeSlider(sliderElement, valueElement) {
    if (!sliderElement) return;

    let isSliding = false;
    let lastScale = 1;

    // Redimensiona as ROIs continuamente enquanto o slider é movido.
    sliderElement.addEventListener('input', (e) => {
        isSliding = true;
        const value = e.target.value;
        const scaleFactor = parseFloat(value) / 100;
        const relativeScale = scaleFactor / lastScale; // Calcula a escala relativa à última posição

        actions.resizeSelectedRoisByScale(relativeScale); // Usa a ação para modificar o estado
        lastScale = scaleFactor;

        if (valueElement) {
            valueElement.textContent = `${value}%`;
        }
        // O canvas será redesenhado reativamente pela mudança de estado
    });

    // Handler para quando o usuário solta o slider
    const handleSliderRelease = () => {
        if (isSliding) {
            log('roiActionPanelBinder', 'info', "Slider de redimensionamento liberado. Solicitando recálculo de dados.");
            actions.recalculateSelectedRoisData(); // Usa a ação para notificar sobre a necessidade de recálculo
        }
        // Reseta o slider para a posição inicial
        sliderElement.value = 100;
        lastScale = 1;
        if (valueElement) {
            valueElement.textContent = '100%';
        }
        isSliding = false;
    };

    sliderElement.addEventListener('mouseup', handleSliderRelease);
    sliderElement.addEventListener('touchend', handleSliderRelease);
}


/**
 * Função principal que vincula todos os eventos para o painel de ações de ROI e o menu de contexto.
 */
export function bindRoiActionPanelEvents() {
    log('roiActionPanelBinder', 'info', "Vinculando eventos do painel de ações de ROI.");

    // --- Painel Principal de Ações ---
    if (dom.deleteSelectedRoiButton) dom.deleteSelectedRoiButton.addEventListener('click', () => actions.deleteSelectedRois());
    if (dom.setAsSampleButton) dom.setAsSampleButton.addEventListener('click', () => actions.toggleSelectedRoisAsSample());
    if (dom.duplicateSelectedRoiButton) dom.duplicateSelectedRoiButton.addEventListener('click', () => roiManager.duplicateSelectedRois());

    if (dom.setAnalyticalWhiteButton) {
        dom.setAnalyticalWhiteButton.addEventListener('click', () => {
            const selection = state.selectionSet();
            if (selection.size === 1) {
                // `values().next().value` obtém o primeiro (e único) item de um Set
                actions.toggleAnalyticalWhite(selection.values().next().value);
            }
        });
    }

    if (dom.bulkLockPositionButton) dom.bulkLockPositionButton.addEventListener('click', () => actions.toggleSelectedPositionLock());
    if (dom.bulkLockSizeButton) dom.bulkLockSizeButton.addEventListener('click', () => actions.toggleSelectedSizeLock());

    if (dom.bulkOrderButton) {
        // --- INÍCIO DA ALTERAÇÃO ---
        dom.bulkOrderButton.addEventListener('click', () => {
            const selection = state.selectionSet();
            const roiIdSet = selection.size > 0 ? selection : null;
            sequenceManager.startSequencingMode(roiIdSet)
                .then(result => {
                    log('roiActionPanelBinder', 'info', 'Fluxo de sequenciamento concluído com status:', result.status);
                })
                .catch(err => {
                    log('roiActionPanelBinder', 'info', 'Fluxo de sequenciamento cancelado pelo usuário.', err.message);
                });
        });
        // --- FIM DA ALTERAÇÃO ---
    }
    
    // Configura o slider de redimensionamento em massa
    setupResizeSlider(dom.bulkResizeSlider, dom.bulkResizeValue);


    // --- Menu de Contexto (que é um painel de ações flutuante) ---
    if (dom.contextMenuDelete) {
        dom.contextMenuDelete.addEventListener('click', () => {
            const { roiId } = state.contextMenu();
            if (roiId) actions.deleteSingleRoi(roiId);
            actions.hideContextMenu();
        });
    }
    if (dom.contextMenuSetSample) {
        dom.contextMenuSetSample.addEventListener('click', () => {
            const { roiId } = state.contextMenu();
            if (roiId) actions.toggleSingleRoiAsSample(roiId);
            actions.hideContextMenu();
        });
    }
    if (dom.contextMenuSetWhite) {
        dom.contextMenuSetWhite.addEventListener('click', () => {
            const { roiId } = state.contextMenu();
            if (roiId) actions.toggleAnalyticalWhite(roiId);
            actions.hideContextMenu();
        });
    }
    if (dom.contextMenuLock) {
        dom.contextMenuLock.addEventListener('click', () => {
            const { roiId } = state.contextMenu();
            if (roiId) actions.toggleLockForSingleRoi(roiId);
            actions.hideContextMenu();
        });
    }

    log('roiActionPanelBinder', 'success', 'Eventos do painel de ações de ROI vinculados com sucesso.');
}