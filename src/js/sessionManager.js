// js/sessionManager.js

import * as state from './state.js';
import * as imageLoader from './imageLoader.js';
import * as modalManager from './modalManager.js';
import * as dom from './domElements.js';
import * as dbManager from './dbManager.js';
import * as actions from './stateActions.js';

const SESSION_ID = 'lastSession';

export async function saveSession() {
    const originalImage = state.originalImage();
    if (!originalImage || !originalImage.src) {
        log('sessionManager', 'warn', "Salvamento de sessão abortado: nenhuma imagem carregada.");
        modalManager.showGeneralModal("Não há imagem carregada para salvar na sessão.");
        return;
    }

    log('sessionManager', 'info', "Iniciando salvamento da sessão...");
    modalManager.showLoadingModal("Salvando sessão...");

    try {
        const response = await fetch(originalImage.src);
        const imageBlob = await response.blob();

        const sessionData = {
            id: SESSION_ID,
            image: {
                blob: imageBlob,
                fileName: originalImage.fileName
            },
            rois: state.rois(),
            nextRoiId: state.getState().nextRoiId, // Usa getState para obter o valor atual
            analyticalWhiteRoiId: state.analyticalWhiteRoiId(),
            analysisTitle: state.analysisTitle(),
            currentConcentrationUnit: state.currentConcentrationUnit(),
            viewTransform: state.viewTransform(),
            metricsCalculated: state.metricsCalculated(),
            lastRegressions: state.lastRegressions(),
        };

        await dbManager.saveSessionToDB(sessionData);
        log('sessionManager', 'info', "Sessão salva com sucesso!");
        modalManager.showGeneralModal("Sessão salva com sucesso!");
        checkForSavedSession();

    } catch (error) {
        log('sessionManager', 'error', "Erro ao salvar a sessão:", error);
        modalManager.showGeneralModal(`Ocorreu um erro ao salvar: ${error.message}`);
    }
}


export async function loadSession() {
    log('sessionManager', 'info', "Iniciando carregamento da sessão salva...");
    modalManager.showLoadingModal("Carregando sessão...");

    try {
        const sessionData = await dbManager.loadSessionFromDB(SESSION_ID);
        
        if (!sessionData || !sessionData.image || !sessionData.image.blob) {
            log('sessionManager', 'warn', "Nenhuma sessão válida foi encontrada para carregar.");
            modalManager.showGeneralModal("Nenhuma sessão salva foi encontrada.");
            return;
        }
        
        const file = new File([sessionData.image.blob], sessionData.image.fileName, { type: sessionData.image.blob.type });
        const result = await imageLoader.loadImage(file);
        
        if (result.success) {
            // --- INÍCIO DA REATORAÇÃO ---
            // O bloco de múltiplos setters foi substituído por uma única ação.
            actions.restoreSession(sessionData);
            // A chamada ao uiManager foi removida. A UI será atualizada automaticamente.
            // --- FIM DA REATORAÇÃO ---
            
            log('sessionManager', 'info', "Sessão carregada e estado restaurado com sucesso.");
            modalManager.showGeneralModal("Sessão carregada com sucesso!");
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        log('sessionManager', 'error', "Erro ao carregar a sessão:", error);
        modalManager.showGeneralModal(`Ocorreu um erro ao carregar a sessão: ${error.message}`);
    }
}


export async function checkForSavedSession() {
    try {
        const session = await dbManager.loadSessionFromDB(SESSION_ID);
        if (session) {
            log('sessionManager', 'info', "Sessão salva encontrada. Botão de carregar habilitado.");
            dom.loadSessionButton.disabled = false;
            dom.loadSessionButton.classList.remove('disabled:bg-gray-400');
        } else {
            log('sessionManager', 'info', "Nenhuma sessão salva encontrada.");
            dom.loadSessionButton.disabled = true;
            dom.loadSessionButton.classList.add('disabled:bg-gray-400');
        }
    } catch (error) {
        log('sessionManager', 'warn', "Não foi possível verificar sessão salva:", error);
        dom.loadSessionButton.disabled = true;
        dom.loadSessionButton.classList.add('disabled:bg-gray-400');
    }
}