// js/modalBinder.js

// Importações para funcionalidades do modal
import * as dom from './domElements.js';
import * as domRenderer from './domRenderer.js';
import * as uiManager from './uiManager.js';
import * as modalManager from './modalManager.js';

// --- Handlers para o Modal Seletor de Sinais ---

/**
 * Filtra as métricas disponíveis com base no termo de busca do usuário.
 * @param {InputEvent} e O evento de input do campo de busca.
 */
function handleSignalSearch(e) {
    // A função 'normalizeText' e a variável 'analyticalEquationsBySystem' são assumidas como globais (de utils.js e config.js)
    const searchTerm = normalizeText(e.target.value.trim());

    if (!dom.signalSelectorContainer) return;

    if (!searchTerm) {
        log('modalBinder', 'info', 'Busca limpa. Restaurando visualização padrão do seletor de sinais.');
        domRenderer.renderYAxisParameterOptions();
        return;
    }

    const filteredMetrics = [];
    for (const systemName in analyticalEquationsBySystem) {
        const subGroups = analyticalEquationsBySystem[systemName];
        for (const groupName in subGroups) {
            const equations = subGroups[groupName];
            equations.forEach(equation => {
                const searchCorpus = normalizeText(`${equation.text} ${equation.fullName} ${systemName} ${groupName}`);
                if (searchCorpus.includes(searchTerm)) {
                    filteredMetrics.push({
                        equation,
                        systemName,
                        groupName,
                        channelName: `SA (${systemName} - ${equation.text})`
                    });
                }
            });
        }
    }
    log('modalBinder', 'info', `Buscando por: "${e.target.value.trim()}". Encontrados ${filteredMetrics.length} resultados.`);
    domRenderer.renderSignalSearchResults(filteredMetrics, e.target.value.trim());
}

/**
 * Marca ou desmarca todos os checkboxes de sinais que estão VISÍVEIS na tela.
 * @param {boolean} shouldBeChecked - True para marcar, false para desmarcar.
 */
function handleSelectVisibleSignals(shouldBeChecked) {
    if (!dom.signalSelectorContainer) return;
    log('modalBinder', 'info', `Marcando sinais visíveis como: ${shouldBeChecked}.`);
    dom.signalSelectorContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        // 'offsetParent !== null' é uma forma de verificar se o elemento está visível no DOM.
        if (cb.offsetParent !== null) {
            cb.checked = shouldBeChecked;
        }
    });
    uiManager.updateAnalysisStepsVisibility();
}

/**
 * Marca TODOS os checkboxes de sinais, visíveis ou não.
 */
function handleSelectAllSignals() {
    if (!dom.signalSelectorContainer) return;
    log('modalBinder', 'info', 'Marcando todos os sinais.');
    dom.signalSelectorContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
    uiManager.updateAnalysisStepsVisibility();
}

/**
 * Desmarca TODOS os checkboxes de sinais.
 */
function handleClearAllSignalSelections() {
    if (!dom.signalSelectorContainer) return;
    log('modalBinder', 'info', 'Limpando todas as seleções de sinais.');
    dom.signalSelectorContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    uiManager.updateAnalysisStepsVisibility();
}

/**
 * Fecha o modal do seletor de sinais e restaura seu estado inicial.
 */
function closeSignalSelectorModal() {
    if (dom.signalSelectorModal) {
        dom.signalSelectorModal.dataset.visible = 'false';
        if (dom.signalSearchInput) {
            dom.signalSearchInput.value = '';
        }
        log('modalBinder', 'info', 'Fechando e restaurando o Painel de Seleção de Sinais.');
        // Renderiza novamente as opções para limpar qualquer resultado de busca.
        domRenderer.renderYAxisParameterOptions();
    }
}

/**
 * Lida com a expansão/recolhimento dos menus sanfona (accordion) dentro do seletor de sinais.
 * @param {MouseEvent} event O evento de clique.
 */
function handleAccordionToggle(event) {
    const header = event.target.closest('.accordion-header');
    if (header) {
        event.stopPropagation();
        const body = header.nextElementSibling;
        const icon = header.querySelector('.accordion-icon');
        if (body && icon) {
            const isExpanding = body.classList.contains('hidden');
            header.classList.toggle('expanded', isExpanding);
            body.classList.toggle('hidden', !isExpanding);
            icon.classList.toggle('rotate-90', isExpanding);
        }
    }
}


/**
 * Função principal que vincula todos os eventos internos dos modais da aplicação.
 */
export function bindModalEvents() {
    log('modalBinder', 'info', "Vinculando eventos internos dos modais.");

    // --- Eventos do Modal Seletor de Sinais ---
    if (dom.signalSelectorModal) {
        if (dom.closeSignalSelectorModalButton) dom.closeSignalSelectorModalButton.addEventListener('click', closeSignalSelectorModal);
        
        if (dom.confirmSignalSelectionButton) {
            dom.confirmSignalSelectionButton.addEventListener('click', () => {
                uiManager.updateAnalysisStepsVisibility();
                closeSignalSelectorModal();
            });
        }
        
        if (dom.signalSearchInput) dom.signalSearchInput.addEventListener('input', handleSignalSearch);
        if (dom.selectAllSignalsButton) dom.selectAllSignalsButton.addEventListener('click', handleSelectAllSignals);
        if (dom.selectAllVisibleSignalsButton) dom.selectAllVisibleSignalsButton.addEventListener('click', () => handleSelectVisibleSignals(true));
        if (dom.unselectAllVisibleSignalsButton) dom.unselectAllVisibleSignalsButton.addEventListener('click', () => handleSelectVisibleSignals(false));
        if (dom.clearAllSignalSelectionsButton) dom.clearAllSignalSelectionsButton.addEventListener('click', handleClearAllSignalSelections);
        
        // Listeners no container principal do seletor
        if (dom.signalSelectorContainer) {
            dom.signalSelectorContainer.addEventListener('click', handleAccordionToggle);

            // Handler para o ícone de informação 'i'
            dom.signalSelectorContainer.addEventListener('click', (e) => {
                const infoIcon = e.target.closest('.metric-info-icon');
                if (infoIcon) {
                    e.preventDefault();
                    e.stopPropagation();
                    const metricId = infoIcon.dataset.metricId;
                    if (metricId) {
                        modalManager.openMetricInfoModal(metricId);
                    }
                }
            });

            // Handler para a mudança de qualquer checkbox
            dom.signalSelectorContainer.addEventListener('input', (e) => {
                if (e.target.matches('input[type="checkbox"]')) {
                    uiManager.updateAnalysisStepsVisibility();
                }
            });
        }
        log('modalBinder', 'success', 'Eventos do Modal Seletor de Sinais vinculados.');
    }
    
    // NOTA: A lógica para outros modais (confirmação, input de texto, etc.) ainda está
    // encapsulada em seus respectivos "open" handlers no modalManager e outros. Uma futura refatoração
    // poderia mover essa lógica para cá, para uma centralização completa.
}