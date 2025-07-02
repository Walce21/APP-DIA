// js/modalManager.js

import * as state from './state.js';
import * as dom from './domElements.js';
// --- INÍCIO DA CORREÇÃO (BUGFIX-CONCENTRATION-FLOW-05) ---
// Removida a importação de uiManager e adicionada a de actions.
import * as actions from './stateActions.js';
// --- FIM DA CORREÇÃO ---
import * as roiManager from './roiManager.js';

/**
 * Encontra a definição de uma métrica pelo seu ID único.
 * @param {string} metricId - O ID da métrica (ex: 'direct_r').
 * @returns {object|null} O objeto da métrica ou null se não for encontrado.
 */
function _findMetricById(metricId) {
    for (const system of Object.values(analyticalEquationsBySystem)) {
        for (const group of Object.values(system)) {
            const metric = group.find(m => m.id === metricId);
            if (metric) return metric;
        }
    }
    return null;
}

function _renderMathIfAvailable(element) {
    if (typeof renderMathInElement === 'function') {
        try {
            log('modalManager', 'info', 'KaTeX encontrado. Renderizando fórmulas matemáticas.');
            renderMathInElement(element, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                ],
                throwOnError: false
            });
        } catch (error) {
            log('modalManager', 'error', 'Ocorreu um erro ao renderizar as fórmulas com KaTeX.', error);
        }
    } else {
        log('modalManager', 'warn', 'Função renderMathInElement (KaTeX) não foi encontrada. As fórmulas não serão renderizadas em formato rico.');
    }
}


// --- Lógica Geral de Modais ---

export function showGeneralModal(message) {
    if (!dom.messageModal) return;
    log('modalManager', 'info', 'Exibindo modal geral:', message);
    dom.modalMessageText.textContent = message;
    dom.loadingSpinner.classList.add('hidden');
    dom.closeGeneralModalButton.style.display = 'block';
    dom.messageModal.dataset.visible = 'true';

    const closeModal = () => {
        dom.messageModal.dataset.visible = 'false';
        dom.closeGeneralModalButton.removeEventListener('click', closeModal);
    };
    dom.closeGeneralModalButton.addEventListener('click', closeModal, { once: true });
    setTimeout(() => dom.closeGeneralModalButton.focus(), 100);
}

export function showLoadingModal(message) {
    if (!dom.messageModal) return;
    log('modalManager', 'info', 'Exibindo modal de carregamento:', message);
    dom.modalMessageText.textContent = message;
    dom.loadingSpinner.classList.remove('hidden');
    dom.closeGeneralModalButton.style.display = 'none';
    dom.messageModal.dataset.visible = 'true';
}


export function hideLoadingModal() {
    if (!dom.messageModal) return;
    log('modalManager', 'info', 'Ocultando modal de carregamento/mensagem.');
    dom.messageModal.dataset.visible = 'false';
}

export function showToast(message) {
    if (!dom.toastNotification) return;
    dom.toastText.textContent = message;
    dom.toastNotification.classList.remove('hidden');
    
    const close = () => {
        dom.toastNotification.classList.add('hidden');
        dom.toastCloseButton.removeEventListener('click', close);
    };
    
    dom.toastCloseButton.addEventListener('click', close, { once: true });
    setTimeout(close, 5000);
}

export function openConfirmationModal(title, message, options = {}) {
    log('modalManager', 'info', 'Abrindo modal de confirmação:', { title, message });
    return new Promise((resolve, reject) => {
        if (!dom.confirmationModal) {
            return reject(new Error('Modal de confirmação não encontrado no DOM.'));
        }

        dom.confirmationModalTitle.textContent = title;
        dom.confirmationModalMessage.textContent = message;

        dom.confirmConfirmationButton.textContent = options.confirmText || 'Confirmar';
        dom.cancelConfirmationButton.textContent = options.cancelText || 'Cancelar';

        const handleConfirm = () => {
            log('modalManager', 'info', 'Ação confirmada pelo usuário.');
            cleanupAndClose();
            resolve();
        };

        const handleCancel = () => {
            log('modalManager', 'info', 'Ação cancelada pelo usuário.');
            cleanupAndClose();
            reject(new Error('Ação cancelada pelo usuário.'));
        };

        const cleanupAndClose = () => {
            dom.confirmConfirmationButton.removeEventListener('click', handleConfirm);
            dom.cancelConfirmationButton.removeEventListener('click', handleCancel);
            dom.closeConfirmationModalButton.removeEventListener('click', handleCancel);
            dom.confirmationModal.dataset.visible = 'false';
        };

        dom.confirmConfirmationButton.addEventListener('click', handleConfirm, { once: true });
        dom.cancelConfirmationButton.addEventListener('click', handleCancel, { once: true });
        dom.closeConfirmationModalButton.addEventListener('click', handleCancel, { once: true });
        
        dom.confirmationModal.dataset.visible = 'true';
        setTimeout(() => dom.confirmConfirmationButton.focus(), 100);
    });
}


// --- Modal de Edição de Nome ROI ---

export function openEditRoiNameModal(roiId) {
    log('modalManager', 'info', `Abrindo modal para editar nome da ROI ID: ${roiId}`);
    return new Promise((resolve, reject) => {
        const roi = state.rois().find(r => r.id === roiId);
        if (!roi || !dom.editRoiNameModal) return reject('ROI ou modal não encontrado.');

        dom.editRoiNameInput.value = roi.customName || roi.name;
        dom.editRoiNameError.textContent = "";

        const handleConfirm = (event) => {
            event.preventDefault();
            const newName = dom.editRoiNameInput.value.trim();
            if (!newName) {
                dom.editRoiNameError.textContent = "O nome não pode estar em branco.";
                return;
            }
            actions.updateRoiName(roiId, newName);
            cleanupAndClose();
            resolve(newName);
        };

        const handleCancel = () => {
            cleanupAndClose();
            reject('Edição de nome cancelada.');
        };
        
        const cleanupAndClose = () => {
            dom.saveRoiNameButton.removeEventListener('click', handleConfirm);
            dom.cancelEditRoiNameModalButton.removeEventListener('click', handleCancel);
            dom.closeEditRoiNameModalButton.removeEventListener('click', handleCancel);
            dom.editRoiNameModal.dataset.visible = 'false';
        };

        dom.saveRoiNameButton.addEventListener('click', handleConfirm, { once: true });
        dom.cancelEditRoiNameModalButton.addEventListener('click', handleCancel, { once: true });
        dom.closeEditRoiNameModalButton.addEventListener('click', handleCancel, { once: true });

        dom.editRoiNameModal.dataset.visible = 'true';
        dom.editRoiNameInput.focus();
    });
}

// --- Funções de Modal de Informação ---

export function openInfoModal(title, htmlContent) {
    if (!dom.metricInfoModal) {
        log('modalManager', 'error', 'Modal de informações genérico não encontrado no DOM.');
        return;
    }

    log('modalManager', 'info', `Abrindo modal de informações: "${title}"`);

    dom.metricInfoModalTitle.textContent = title;
    const modalBody = dom.metricInfoModal.querySelector('.modal-content > .space-y-4');
    
    if (modalBody) {
        modalBody.innerHTML = `<div class="text-sm text-gray-700 leading-relaxed">${htmlContent}</div>`;
    } else {
        log('modalManager', 'error', 'Corpo do modal de informações não encontrado para inserir conteúdo.');
        return;
    }

    dom.metricInfoModal.dataset.visible = 'true';

    const closeModal = () => {
        dom.metricInfoModal.dataset.visible = 'false';
    };
    dom.closeMetricInfoModalButton.addEventListener('click', closeModal, { once: true });
}


export function openMetricInfoModal(metricId) {
    if (!dom.metricInfoModal) {
        log('modalManager', 'error', 'Elementos do DOM para o modal de informações da métrica não foram encontrados.');
        return;
    }

    const metric = _findMetricById(metricId);

    if (!metric) {
        log('modalManager', 'error', `Métrica com ID "${metricId}" não encontrada para exibir detalhes.`);
        showGeneralModal("Não foi possível encontrar os detalhes para esta métrica.");
        return;
    }

    log('modalManager', 'info', `Abrindo modal de informações para a métrica: ${metric.fullName}`);
    
    const modalBody = dom.metricInfoModal.querySelector('.modal-content > .space-y-4');
    
    dom.metricInfoModalTitle.textContent = metric.fullName;
    
    if(modalBody) {
        modalBody.innerHTML = `
            <div>
                <strong class="block text-sm font-medium text-gray-600">Fórmula:</strong>
                <div class="mt-1 text-sm p-2 bg-gray-100 rounded-md font-mono">${metric.formula || 'N/A'}</div>
            </div>
            <div>
                <strong class="block text-sm font-medium text-gray-600">Descrição e Propósito:</strong>
                <p class="mt-1 text-sm text-gray-700 leading-relaxed">${metric.description || 'Descrição não disponível.'}</p>
            </div>
        `;
        _renderMathIfAvailable(modalBody);
    }

    dom.metricInfoModal.dataset.visible = 'true';
    const closeModal = () => { dom.metricInfoModal.dataset.visible = 'false'; };
    dom.closeMetricInfoModalButton.addEventListener('click', closeModal, { once: true });
}

export function openQualityInfoModal(title, contentBlocks) {
    if (!dom.metricInfoModal) {
        log('modalManager', 'error', 'Modal de informações não encontrado para exibir detalhes de qualidade.');
        return;
    }
    
    log('modalManager', 'info', `Abrindo modal de informações de qualidade: ${title}`);
    
    dom.metricInfoModalTitle.textContent = title;
    const modalBody = dom.metricInfoModal.querySelector('.modal-content > .space-y-4');
    if (!modalBody) {
        log('modalManager', 'error', 'Corpo do modal de informações não encontrado.');
        return;
    }

    modalBody.innerHTML = '';

    contentBlocks.forEach(block => {
        const blockDiv = document.createElement('div');
        blockDiv.className = 'py-3 border-b last:border-b-0';
        
        blockDiv.innerHTML = `
            <h4 class="text-md font-semibold text-sky-800">${block.title}</h4>
            <div class="mt-2 space-y-3 pl-2">
                <div>
                    <strong class="block text-xs font-medium text-gray-500">Descrição e Relevância Analítica:</strong>
                    <p class="mt-1 text-sm text-gray-700 leading-relaxed">${block.description || 'N/A'}</p>
                </div>
                <div>
                    <strong class="block text-xs font-medium text-gray-500">Fórmula:</strong>
                    <div class="mt-1 text-sm p-2 bg-gray-100 rounded-md font-mono">${block.formula || 'N/A'}</div>
                </div>
            </div>
        `;
        modalBody.appendChild(blockDiv);
    });

    dom.metricInfoModal.dataset.visible = 'true';

    const closeModal = () => {
        dom.metricInfoModal.dataset.visible = 'false';
    };
    dom.closeMetricInfoModalButton.addEventListener('click', closeModal, { once: true });
    
    _renderMathIfAvailable(modalBody);
}

// ======================= LÓGICA DO MODAL DE CONCENTRAÇÃO REVISADA =======================

let isProcessingQueue = false;

function _showModalForSingleRoi(roiId) {
    return new Promise((resolve, reject) => {
        const roi = state.rois().find(r => r.id === roiId);
        if (!roi) {
            log('modalManager', 'warn', `_showModalForSingleRoi: ROI com ID ${roiId} não encontrada na fila.`);
            return reject('ROI não encontrada para o modal.');
        }

        log('modalManager', 'info', `Abrindo modal de concentração para ROI: ${roi.customName || roi.name} (ID: ${roiId})`);
        state.setActiveConcentrationModalRoiId(roiId);
        dom.concentrationModalRoiName.textContent = roi.customName || roi.name;
        dom.concentrationInput.value = roi.concentration ?? '';
        dom.concentrationModalError.textContent = '';
        dom.concentrationModal.dataset.visible = 'true';
        dom.concentrationInput.focus();
        dom.concentrationInput.select();

        const handleConfirm = (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            const value = dom.concentrationInput.value.trim();
            const concentration = value === '' ? null : parseFloat(value.replace(',', '.'));
            
            if (value !== '' && isNaN(concentration)) {
                dom.concentrationModalError.textContent = "Por favor, insira um número válido.";
                return;
            }
            
            log('modalManager', 'data', `Concentração definida para ROI ID ${roiId}: ${concentration}`);
            
            // --- INÍCIO DA CORREÇÃO (BUGFIX-CONCENTRATION-FLOW-05) ---
            // Substitui a mutação direta do estado por uma chamada à camada de Ações.
            // A ação 'updateRoiConcentration' já lida com a lógica de 'useInCalibration'.
            actions.updateRoiConcentration(roiId, concentration);
            // --- FIM DA CORREÇÃO ---
            
            cleanup();
            resolve(true);
        };

        const handleCancel = (event) => {
            event.stopPropagation();
            log('modalManager', 'info', 'Abertura do modal de concentração cancelada pelo usuário.');
            cleanup();
            reject('Modal de concentração cancelado.');
        };

        const cleanup = () => {
            dom.concentrationForm.removeEventListener('submit', handleConfirm);
            dom.cancelConcentrationButton.removeEventListener('click', handleCancel);
            dom.closeConcentrationModalButton.removeEventListener('click', handleCancel);
            dom.concentrationModal.dataset.visible = 'false';
            state.setActiveConcentrationModalRoiId(null);
        };

        dom.concentrationForm.addEventListener('submit', handleConfirm);
        dom.cancelConcentrationButton.addEventListener('click', handleCancel, { once: true });
        dom.closeConcentrationModalButton.addEventListener('click', handleCancel, { once: true });
    });
}

export async function processConcentrationQueue() {
    if (isProcessingQueue) {
        log('modalManager', 'warn', 'Tentativa de processar a fila enquanto já estava em andamento. Ignorado.');
        return;
    }
    
    const queue = state.concentrationQueue();
    if (queue.length === 0) return;

    log('modalManager', 'info', `Iniciando processamento da fila de concentração com ${queue.length} item(ns).`);
    isProcessingQueue = true;

    while (queue.length > 0) {
        const roiId = queue.shift();
        try {
            await _showModalForSingleRoi(roiId);
        } catch (error) {
            log('modalManager', 'info', "Fila de concentração interrompida pelo usuário.", error);
            state.setConcentrationQueue([]);
            break; 
        }
    }
    
    isProcessingQueue = false;
    log('modalManager', 'info', 'Processamento da fila de concentração finalizado.');
    // --- INÍCIO DA CORREÇÃO (BUGFIX-CONCENTRATION-FLOW-05) ---
    // A chamada para uiManager.updateAllDynamicContent() foi removida. A UI agora é
    // atualizada reativamente após cada ação 'updateRoiConcentration'.
    // --- FIM DA CORREÇÃO ---
}
// =========================================================================================


// --- Lógica do Painel de Controle de Ordenação ---

function _updateDirectionOptions() {
    if (!dom.advancedSequenceForm) return;

    const isHorizontal = dom.sequencePatternHorizontal.checked;
    const isSerpentine = dom.sequenceSerpentineToggle.checked;
    const fieldsetRead = dom.advancedSequenceForm.querySelector('#readDirectionFieldset');

    const scanOptionsHTML = isHorizontal 
        ? `<label class="flex items-center p-2 border rounded-lg cursor-pointer flex-1 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300"><input type="radio" name="scan_direction" value="top_to_bottom" class="form-radio mr-2" checked> De Cima para Baixo</label>
           <label class="flex items-center p-2 border rounded-lg cursor-pointer flex-1 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300"><input type="radio" name="scan_direction" value="bottom_to_top" class="form-radio mr-2"> De Baixo para Cima</label>`
        : `<label class="flex items-center p-2 border rounded-lg cursor-pointer flex-1 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300"><input type="radio" name="scan_direction" value="left_to_right" class="form-radio mr-2" checked> Da Esquerda para Direita</label>
           <label class="flex items-center p-2 border rounded-lg cursor-pointer flex-1 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300"><input type="radio" name="scan_direction" value="right_to_left" class="form-radio mr-2"> Da Direita para Esquerda</label>`;

    const readOptionsHTML = isHorizontal
        ? `<label class="flex items-center p-2 border rounded-lg cursor-pointer flex-1 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300"><input type="radio" name="read_direction" value="left_to_right" class="form-radio mr-2" checked> Da Esquerda para Direita</label>
           <label class="flex items-center p-2 border rounded-lg cursor-pointer flex-1 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300"><input type="radio" name="read_direction" value="right_to_left" class="form-radio mr-2"> Da Direita para Esquerda</label>`
        : `<label class="flex items-center p-2 border rounded-lg cursor-pointer flex-1 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300"><input type="radio" name="read_direction" value="top_to_bottom" class="form-radio mr-2" checked> De Cima para Baixo</label>
           <label class="flex items-center p-2 border rounded-lg cursor-pointer flex-1 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300"><input type="radio" name="read_direction" value="bottom_to_top" class="form-radio mr-2"> De Baixo para Cima</label>`;
    
    dom.scanDirectionContainer.innerHTML = scanOptionsHTML;
    dom.readDirectionContainer.innerHTML = readOptionsHTML;

    if (fieldsetRead) {
        fieldsetRead.disabled = isSerpentine;
        fieldsetRead.style.opacity = isSerpentine ? 0.5 : 1;
    }
}

export function openAdvancedSequenceModal(onConfirm, onManual, onCancel) {
    if (!dom.advancedSequenceModal) return;
    log('modalManager', 'info', "Abrindo modal avançado de sequenciamento.");

    _updateDirectionOptions();

    const handleConfirm = (e) => {
        e.preventDefault();
        const formData = new FormData(dom.advancedSequenceForm);
        const options = {
            pattern: formData.get('sequence_pattern'),
            scan: formData.get('scan_direction'),
            read: formData.get('read_direction'),
            serpentine: dom.sequenceSerpentineToggle.checked
        };
        onConfirm(options);
        cleanupAndClose();
    };

    const handleManual = () => {
        onManual();
        cleanupAndClose();
    };
    
    const handleCancel = () => {
        if(onCancel) onCancel();
        cleanupAndClose();
    };
    
    const advancedSequenceFormChangeHandler = (event) => {
        if (event.target.name === 'sequence_pattern' || event.target.id === 'sequenceSerpentineToggle') {
            _updateDirectionOptions();
        }
    };
    
    const cleanupAndClose = () => {
        dom.advancedSequenceForm.removeEventListener('change', advancedSequenceFormChangeHandler);
        dom.advancedSequenceForm.removeEventListener('submit', handleConfirm);
        dom.cancelAdvancedSequenceButton.removeEventListener('click', handleCancel);
        dom.closeAdvancedSequenceModalButton.removeEventListener('click', handleCancel);
        dom.advancedSequenceByTouch.removeEventListener('click', handleManual);
        dom.advancedSequenceModal.dataset.visible = 'false';
    };
    
    dom.advancedSequenceForm.addEventListener('change', advancedSequenceFormChangeHandler);
    dom.advancedSequenceForm.addEventListener('submit', handleConfirm);
    dom.cancelAdvancedSequenceButton.addEventListener('click', handleCancel, { once: true });
    dom.closeAdvancedSequenceModalButton.addEventListener('click', handleCancel, { once: true });
    dom.advancedSequenceByTouch.addEventListener('click', handleManual, { once: true });

    dom.advancedSequenceModal.dataset.visible = 'true';
}


// --- Modal de Dimensões da Grade ---

export function openGridDimensionsModal() {
    log('modalManager', 'info', "Abrindo modal para definir dimensões da grade.");
    return new Promise((resolve, reject) => {
        if (!dom.gridDimensionsModal) return reject('Modal não encontrado.');

        const lastDims = state.lastGridDims();
        dom.gridRowsInput.value = lastDims.rows;
        dom.gridColsInput.value = lastDims.cols;
        dom.gridDimensionsError.classList.add('hidden');

        const handleConfirm = (e) => {
            e.preventDefault();
            const rows = parseInt(dom.gridRowsInput.value, 10);
            const cols = parseInt(dom.gridColsInput.value, 10);
            if (isNaN(rows) || isNaN(cols) || rows < 2 || cols < 2) {
                dom.gridDimensionsError.textContent = "Linhas e colunas devem ser números maiores que 1.";
                dom.gridDimensionsError.classList.remove('hidden');
                return;
            }
            cleanupAndClose();
            resolve({ rows, cols });
        };

        const handleCancel = () => {
            cleanupAndClose();
            reject('Cancelado pelo usuário.');
        };
        
        const cleanupAndClose = () => {
            dom.gridDimensionsForm.removeEventListener('submit', handleConfirm);
            dom.cancelGridDimensionsButton.removeEventListener('click', handleCancel);
            dom.closeGridDimensionsModalButton.removeEventListener('click', handleCancel);
            dom.gridDimensionsModal.dataset.visible = 'false';
        };

        dom.gridDimensionsForm.addEventListener('submit', handleConfirm);
        dom.cancelGridDimensionsButton.addEventListener('click', handleCancel, { once: true });
        dom.closeGridDimensionsModalButton.addEventListener('click', handleCancel, { once: true });

        dom.gridDimensionsModal.dataset.visible = 'true';
        dom.gridRowsInput.focus();
    });
}


// --- Modal de Input de Texto Genérico ---

export function openTextInputModal(title, initialValue) {
    log('modalManager', 'info', 'Abrindo modal de input de texto:', title);
    return new Promise((resolve, reject) => {
        if (!dom.textInputModal) return reject('Modal de texto não encontrado');

        dom.textInputModalTitle.textContent = title;
        dom.textInputModalInput.value = initialValue || '';
        dom.textInputModalError.textContent = '';
        
        const handleConfirm = (e) => {
            e.preventDefault();
            const value = dom.textInputModalInput.value;
            cleanupAndClose();
            resolve(value);

        };

        const handleCancel = () => {
            cleanupAndClose();
            reject('Input de texto cancelado.');
        };

        const cleanupAndClose = () => {
            dom.textInputForm.removeEventListener('submit', handleConfirm);
            dom.cancelTextInputModalButton.removeEventListener('click', handleCancel);
            dom.closeTextInputModalButton.removeEventListener('click', handleCancel);
            dom.textInputModal.dataset.visible = 'false';
        };

        dom.textInputForm.addEventListener('submit', handleConfirm);
        dom.cancelTextInputModalButton.addEventListener('click', handleCancel, { once: true });
        dom.closeTextInputModalButton.addEventListener('click', handleCancel, { once: true });
        
        dom.textInputModal.dataset.visible = 'true';
        dom.textInputModalInput.focus();
        dom.textInputModalInput.select();
    });
}