// js/uiControlBinder.js

// Importações de módulos para funcionalidades
import * as dom from './domElements.js';
import * as state from './state.js';
import * as actions from './stateActions.js';
import * as imageLoader from './imageLoader.js';
import * as modalManager from './modalManager.js';
import * as canvasManager from './canvasManager.js';
import * as roiManager from './roiManager.js';
import * as uiManager from './uiManager.js';
import * as autoRoiDetector from './autoRoiDetector.js';
import * as sessionManager from './sessionManager.js';
import * as focusModeManager from './focusModeManager.js';
import * as infoContent from './infoContent.js';
import * as userProfile from './userProfile.js';

// --- Handlers para controles específicos ---

/**
 * Lida com o upload de um arquivo de imagem, acionando o imageLoader.
 * @param {Event} e - O evento de 'change' do input de arquivo.
 */
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    log('uiControlBinder', 'info', "Manipulando upload de imagem:", file.name);
    dom.fileNameDisplay.textContent = `Carregando: ${file.name}`;
    const result = await imageLoader.loadImage(file);
    if (result.success) {
        dom.fileNameDisplay.textContent = result.fileName;
        // A mudança de estado agora dispara as atualizações de UI necessárias.
    } else {
        modalManager.showGeneralModal(result.message);
        dom.fileNameDisplay.textContent = "Nenhum arquivo";
    }
    e.target.value = null; // Reseta o input para permitir o re-upload do mesmo arquivo
}

/**
 * Lida com o clique no botão de excluir imagem, abrindo um modal de confirmação.
 */
async function handleDeleteImage() {
    if (!state.hasImage()) return;
    try {
        await modalManager.openConfirmationModal(
            'Excluir Imagem',
            'Tem certeza que deseja excluir a imagem atual? Todas as ROIs e análises serão perdidas.'
        );
        log('uiControlBinder', 'warn', 'Usuário confirmou a exclusão da imagem.');
        imageLoader.unloadImage();
    } catch (error) {
        log('uiControlBinder', 'info', 'Exclusão de imagem cancelada pelo usuário.');
    }
}

/**
 * Lida com a tentativa de instalação do PWA.
 */
async function handlePwaInstall() {
    const prompt = state.deferredInstallPrompt();
    if (!prompt) {
        log('uiControlBinder', 'warn', "Tentativa de instalação do PWA, mas o prompt não estava disponível.");
        return;
    }
    log('uiControlBinder', 'info', "Exibindo prompt de instalação do PWA.");
    prompt.prompt();
    try {
        const { outcome } = await prompt.userChoice;
        log('uiControlBinder', 'info', `Resultado do prompt de instalação do PWA: ${outcome}.`);
        if (outcome === 'accepted' && dom.pwaInstallInfo) {
            dom.pwaInstallInfo.textContent = "App instalado!";
        }
    } catch (error) {
        log('uiControlBinder', 'error', 'Erro durante o prompt de instalação do PWA.', error);
    }
    state.setDeferredInstallPrompt(null);
    if (dom.installPwaButton) dom.installPwaButton.style.display = 'none';
}

/**
 * Lida com cliques no container de abas para trocar o painel de visualização.
 * @param {MouseEvent} e - O evento de clique.
 */
function handleTabClick(e) {
    if (e.target.classList.contains('tab-button')) {
        uiManager.switchTab(e.target.dataset.tab);
    }
}

/**
 * Lida com o clique no título da análise para abrir o modal de edição.
 * @param {MouseEvent} e - O evento de clique.
 */
function handleAnalysisTitleClick(e) {
    e.preventDefault();
    modalManager.openTextInputModal('Identificação da Análise', state.analysisTitle())
        .then(newValue => {
            actions.setAnalysisTitle(newValue); // Usa a ação para mudar o estado
            const chart = state.calibrationChart();
            if (chart && chart.options.plugins.title) {
                chart.options.plugins.title.text = newValue;
                chart.options.plugins.title.display = !!newValue;
                chart.update('none');
            }
        })
        .catch(err => log('uiControlBinder', 'info', "Edição de título da análise cancelada.", err));
}

/**
 * Função principal que vincula todos os eventos de controles estáticos da UI.
 */
export function bindUiControls() {
    log('uiControlBinder', 'info', "Vinculando eventos dos controles estáticos da UI.");

    // Controles de Imagem
    if (dom.imageUpload) dom.imageUpload.addEventListener('change', handleImageUpload);
    if (dom.deleteImageButton) dom.deleteImageButton.addEventListener('click', handleDeleteImage);
    if (dom.rotateImageButton) dom.rotateImageButton.addEventListener('click', canvasManager.rotateImage90);
    if (dom.resetViewButton) dom.resetViewButton.addEventListener('click', canvasManager.resetView);

    // Controles de Ferramentas e ROIs
    if (dom.rectRoiButton) dom.rectRoiButton.addEventListener('click', () => actions.changeCurrentTool('rect'));
    if (dom.circleRoiButton) dom.circleRoiButton.addEventListener('click', () => actions.changeCurrentTool('circle'));
    if (dom.pointerButton) dom.pointerButton.addEventListener('click', () => actions.changeCurrentTool('pointer'));
    if (dom.deleteAllRoisButton) dom.deleteAllRoisButton.addEventListener('click', roiManager.deleteAllRois);

    // Menu de Detecção Automática
    if (dom.detectionMenuButton) dom.detectionMenuButton.addEventListener('click', (e) => { e.stopPropagation(); dom.detectionMenu.classList.toggle('hidden'); });
    const closeDetectionMenu = () => dom.detectionMenu.classList.add('hidden');
    if (dom.startGridAnalysisButton) dom.startGridAnalysisButton.addEventListener('click', (e) => { e.preventDefault(); autoRoiDetector.startGridAnalysis(); closeDetectionMenu(); });
    if (dom.startAreaDetectionButton) dom.startAreaDetectionButton.addEventListener('click', (e) => { e.preventDefault(); autoRoiDetector.startAreaDetection(); closeDetectionMenu(); });
    if (dom.startAdvancedDetectionButton) dom.startAdvancedDetectionButton.addEventListener('click', (e) => { e.preventDefault(); autoRoiDetector.startAdvancedDetection(); closeDetectionMenu(); });
    
    // Controles do Canvas
    if (dom.focusModeButton) dom.focusModeButton.addEventListener('click', focusModeManager.toggleFocusMode);
    if (dom.magnifierToggleButton) dom.magnifierToggleButton.addEventListener('click', () => actions.toggleMagnifierEnabled());
    if (dom.viewLockButton) dom.viewLockButton.addEventListener('click', () => actions.toggleViewLock());

    // Abas Principais
    if (dom.colorTabsContainer) dom.colorTabsContainer.addEventListener('click', handleTabClick);

    // Sessão e PWA
    if (dom.saveSessionButton) dom.saveSessionButton.addEventListener('click', sessionManager.saveSession);
    if (dom.loadSessionButton) dom.loadSessionButton.addEventListener('click', sessionManager.loadSession);
    if (dom.installPwaButton) dom.installPwaButton.addEventListener('click', handlePwaInstall);

    // Título da Análise
    if (dom.analysisTitleInput) dom.analysisTitleInput.addEventListener('click', handleAnalysisTitleClick);

    // Botões de Ajuda/Informação
    if (dom.mainControlsInfoButton) dom.mainControlsInfoButton.addEventListener('click', () => modalManager.openInfoModal(infoContent.imageControlsHelp.title, infoContent.imageControlsHelp.htmlContent));
    if (dom.toolsInfoButton) dom.toolsInfoButton.addEventListener('click', () => modalManager.openInfoModal(infoContent.toolsAndCanvasHelp.title, infoContent.toolsAndCanvasHelp.htmlContent));
    if (dom.roiActionsInfoButton) dom.roiActionsInfoButton.addEventListener('click', () => modalManager.openInfoModal(infoContent.roiActionsHelp.title, infoContent.roiActionsHelp.htmlContent));
    if (dom.orderRoisInfoButton) dom.orderRoisInfoButton.addEventListener('click', () => modalManager.openInfoModal(infoContent.orderRoisHelp.title, infoContent.orderRoisHelp.htmlContent));

    // Inicializa a lógica de perfil de usuário (que vincula o botão de configurações)
    userProfile.initializeUserProfile();

    log('uiControlBinder', 'success', 'Eventos de controles estáticos vinculados com sucesso.');
}