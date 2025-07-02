// js/workerManager.js

// Importações de módulos necessários para lidar com os efeitos colaterais das mensagens do worker
import * as state from './state.js';
import * as actions from './stateActions.js';
import * as modalManager from './modalManager.js';
import * as chartManager from './chartManager.js';
import * as uiManager from './uiManager.js';
import * as roiManager from './roiManager.js';
import * as sequenceManager from './sequenceManager.js';
// --- INÍCIO DA CORREÇÃO (BUGFIX-SAMPLE-PREDICTION-01) ---
// Importa o analysisManager para usar a nova função de predição.
import * as analysisManager from './analysisManager.js';
// --- FIM DA CORREÇÃO ---

// A instância única do worker, privada para este módulo
let worker;

/**
 * Envia uma mensagem para o Web Worker. Esta é a interface pública para outros módulos.
 * @param {object} message - O objeto da mensagem a ser enviado para o worker.
 * @param {Array} [transferables] - Um array opcional de objetos transferíveis.
 */
export function sendMessageToWorker(message, transferables = []) {
    if (!worker) {
        console.error('Worker não inicializado. Não é possível enviar a mensagem.');
        modalManager.showGeneralModal("O módulo de cálculo não está pronto.");
        return;
    }
    worker.postMessage(message, transferables);
}

/**
 * Lida com as mensagens recebidas do Web Worker e dispara a lógica correspondente na aplicação.
 * @param {MessageEvent} event - O objeto do evento vindo do worker.
 */
function handleMessageFromWorker(event) {
    const { type, task, payload } = event.data;

    if (type === 'success') {
        log('workerManager', 'info', `[WORKER] Sucesso na tarefa: ${task}`);

        switch (task) {
            case 'calculateMetrics':
                modalManager.hideLoadingModal();
                actions.updateAllRois(payload.rois);
                
                if (payload.whiteNeededButMissing) {
                    modalManager.showGeneralModal("Alguns cálculos foram pulados porque exigem um 'Branco Analítico' que não foi definido.");
                } else {
                    modalManager.showToast("Métricas calculadas com sucesso!");
                }
                break;

            case 'generateRegressions':
                modalManager.hideLoadingModal();
                const newRegressions = payload;

                if (newRegressions.length === 0) {
                    modalManager.showGeneralModal("Não foi possível gerar modelos de regressão para os parâmetros selecionados.");
                    return;
                }

                // --- INÍCIO DA CORREÇÃO (BUGFIX-SAMPLE-PREDICTION-01) ---

                // 1. Com os modelos de regressão recebidos, chama a função para prever as concentrações das amostras.
                const roisWithPredictions = analysisManager.predictSampleConcentrations(newRegressions);
                
                // 2. Atualiza o estado das ROIs com os novos dados de predição.
                // A ação 'updateAllRois' notificará a UI para renderizar os novos dados.
                actions.updateAllRois(roisWithPredictions);
                
                // 3. Define o estado das regressões para a UI (lista de equações, gráfico).
                const allParams = new Set(newRegressions.map(reg => reg.parameter));
                actions.setVisibleRegressionParameters(allParams);
                actions.setLastRegressions(newRegressions);
                log('workerManager', 'info', 'Regressões, predições e visibilidade foram atualizadas no estado.');

                // 4. Renderiza o gráfico. Ele lerá os dados mais recentes do estado.
                if (typeof CHART_STYLES === 'undefined' || !CHART_STYLES) {
                    log('workerManager', 'error', 'Variável global CHART_STYLES de config.js não está disponível.');
                    modalManager.showGeneralModal('Erro de configuração: não foi possível carregar os estilos do gráfico.');
                    return;
                }
                chartManager.renderChartWithRegressions(newRegressions, CHART_STYLES);

                // --- FIM DA CORREÇÃO ---
                break;

            case 'predictConcentrations':
                // Este case era parte de uma implementação antiga e agora é obsoleto,
                // pois a predição acontece no thread principal.
                // A lógica foi movida para o case 'generateRegressions'.
                log('workerManager', 'info', 'Predição de concentrações (agora no main thread) concluída.');
                actions.updateAllRois(payload);
                break;

            case 'processRoiData':
                actions.updateRoiProcessedData(payload);
                break;

            case 'detectCircles':
                modalManager.hideLoadingModal();
                const newRoiIds = roiManager.addBatchRois(payload);
                const newRoiIdSet = new Set(newRoiIds);
                sequenceManager.startSequencingMode(newRoiIdSet)
                    .then(() => {
                        log('workerManager', 'info', 'Sequenciamento pós-detecção concluído com sucesso.');
                        uiManager.updateAllDynamicContent();
                        modalManager.showToast(`${payload.length} ROIs criadas e ordenadas!`);
                    })
                    .catch(error => {
                        log('workerManager', 'warn', 'Sequenciamento pós-detecção cancelado ou falhou. Aplicando ordenação padrão.', error.message);
                        roiManager.renumberStandardRois();
                        uiManager.updateAllDynamicContent();
                        modalManager.showToast(`${payload.length} ROIs criadas com ordenação padrão.`);
                    });
                break;

            default:
                log('workerManager', 'warn', `Tipo de sucesso desconhecido do worker: ${task}`);
                break;
        }

    } else if (type === 'error') {
        log('workerManager', 'error', `[WORKER] Erro na tarefa: ${task}`, payload.message, payload.stack);
        modalManager.hideLoadingModal();
        modalManager.showGeneralModal(`Ocorreu um erro no processamento: ${payload.message}`);
    } else {
        log('workerManager', 'warn', `Tipo de mensagem desconhecido do worker: ${type}`);
    }
}

/**
 * Inicializa o Web Worker, configurando seus handlers de mensagem e erro.
 * Deve ser chamada uma única vez quando a aplicação inicia.
 */
export function initWorkerManager() {
    if (window.Worker) {
        log('workerManager', 'info', 'Web Worker suportado. Instanciando worker de cálculo.');
        try {
            worker = new Worker('/js/calculation.worker.js');
            worker.onmessage = handleMessageFromWorker;
            worker.onerror = (err) => {
                log('workerManager', 'error', 'Erro não tratado no Web Worker:', err);
                modalManager.hideLoadingModal();
                modalManager.showGeneralModal(`Ocorreu um erro fatal no worker de cálculo: ${err.message}`);
            };
            log('workerManager', 'success', 'Worker de cálculo inicializado com sucesso.');
        } catch (e) {
            log('workerManager', 'error', 'Falha ao instanciar o CalculationWorker.', e);
            worker = null; 
        }
    } else {
        log('workerManager', 'error', 'Web Workers não são suportados neste navegador.');
        modalManager.showGeneralModal('Seu navegador não suporta Web Workers, uma tecnologia essencial para este aplicativo.');
    }
}