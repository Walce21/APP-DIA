// js/globalEventBinder.js

import * as state from './state.js';
import * as dom from './domElements.js';
import * as userProfile from './userProfile.js';
import * as exportManager from './exportManager.js';

/**
 * Lida com o evento 'beforeinstallprompt', salvando o prompt para uso posterior e exibindo o botão de instalação.
 * @param {Event} event - O evento 'beforeinstallprompt' capturado.
 */
function handleBeforeInstallPrompt(event) {
    event.preventDefault();
    state.setDeferredInstallPrompt(event);
    log('globalEventBinder', 'info', "Evento 'beforeinstallprompt' capturado. App pode ser instalado.");
    if (dom.installPwaButton) dom.installPwaButton.style.display = 'block';
    if (dom.pwaInstallInfo) dom.pwaInstallInfo.classList.remove('hidden');
}

/**
 * Lida com o evento 'appinstalled' após a instalação do PWA, limpando a UI de instalação.
 */
function handleAppInstalled() {
    log('globalEventBinder', 'info', "Evento 'appinstalled' detectado. O PWA foi instalado com sucesso.");
    if (dom.installPwaButton) dom.installPwaButton.style.display = 'none';
    if (dom.pwaInstallInfo) dom.pwaInstallInfo.classList.add('hidden');
    state.setDeferredInstallPrompt(null);
}

/**
 * Lida com cliques globais para fechar elementos como modais e menus de contexto quando o usuário clica fora deles.
 * @param {MouseEvent} event - O evento de clique.
 */
function handleGlobalClick(event) {
    // Fecha modais se o clique for no backdrop (fundo)
    if (event.target === dom.settingsModal) userProfile.closeSettingsModal(false);
    if (event.target === dom.reportDetailsModal) exportManager.closeReportDetailsModal();

    // Fecha o menu de detecção se o clique for fora dele
    if (dom.detectionMenu && !dom.detectionMenu.classList.contains('hidden') && !dom.detectionDropdownContainer.contains(event.target)) {
        dom.detectionMenu.classList.add('hidden');
    }

    // Fecha o menu de contexto da ROI se estiver visível e o clique for fora dele
    if (dom.roiContextMenu && state.contextMenu().visible && !dom.roiContextMenu.contains(event.target)) {
        // A atualização da UI agora é reativa à mudança de estado, não precisando ser chamada aqui.
        state.hideContextMenu();
    }
}

/**
 * Vincula todos os event listeners globais ao objeto window.
 * Esta função deve ser chamada uma vez durante a inicialização da aplicação.
 */
export function bindGlobalEvents() {
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('click', handleGlobalClick);

    log('globalEventBinder', 'success', 'Eventos globais (PWA, cliques externos) foram vinculados.');
}