// js/chartManager.js

import * as state from './state.js';
import * as dom from './domElements.js';
import * as uiManager from './uiManager.js';
import * as modalManager from './modalManager.js';
import * as domRenderer from './domRenderer.js';
import * as workerManager from './workerManager.js';

const MAX_MODELS_TO_RENDER = 5; // Limite para o modo "Melhores Ajustes"

/**
 * Inicializa a instância do gráfico Chart.js com configurações base.
 */
export function initializeChart() {
    if (state.calibrationChart()) {
        state.calibrationChart().destroy();
    }
    if (!dom.calibrationChartCanvas) return;

    const ctx = dom.calibrationChartCanvas.getContext('2d');
    const chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: !!state.analysisTitle(),
                    text: state.analysisTitle(),
                    font: { size: 16 }
                },
                legend: {
                    display: false // A legenda customizada substitui a nativa
                },
                customCanvasBackgroundColor: {
                    color: '#FFF',
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: `Concentração (${state.currentConcentrationUnit()})`
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Sinal Analítico (SA)'
                    }
                }
            }
        },
        plugins: [{
            id: 'customCanvasBackgroundColor',
            beforeDraw: (chart, args, options) => {
                const {
                    ctx
                } = chart;
                ctx.save();
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = options.color || '#99ffff';
                ctx.fillRect(0, 0, chart.width, chart.height);
                ctx.restore();
            }
        }]
    });
    state.setCalibrationChart(chart);
    log('chartManager', 'success', 'Instância do gráfico criada e salva no estado.');
}

/**
 * Coleta os dados necessários e despacha uma mensagem para o worker calcular as regressões.
 */
export function generateCalibrationCurve() {
    log('chartManager', 'info', 'Iniciando processo para gerar curva de calibração.');
    const selectedParams = uiManager.getYAxisSelectedParams();
    const roisForCalibration = state.rois().filter(r => r.useInCalibration && r.concentration !== null);

    if (roisForCalibration.length < 3) {
        modalManager.showGeneralModal("São necessários pelo menos 3 pontos de calibração para gerar os modelos de regressão (Polinomial e Linear).");
        return;
    }

    modalManager.showLoadingModal("Calculando modelos de regressão...");

    log('chartManager', 'info', `Enviando ${roisForCalibration.length} pontos e ${selectedParams.length} parâmetros para o worker de regressão.`);
    workerManager.sendMessageToWorker({
        type: 'generateRegressions',
        payload: { roisForCalibration, selectedParams }
    });
}


/**
 * Renderiza o gráfico e as equações com base nos dados de regressão recebidos do worker.
 * @param {Array<object>} regressionsData - A nova estrutura de dados com os modelos calculados.
 * @param {Array<object>} chartStyles - O array de estilos (cores, etc.) para o gráfico.
 */
export function renderChartWithRegressions(regressionsData, chartStyles) {
    log('chartManager', 'info', `Renderizando gráfico com ${regressionsData.length} parâmetros.`);
    
    let chart = state.calibrationChart();
    if (!chart) {
        log('chartManager', 'warn', 'Instância do gráfico não encontrada. Recriando agora...');
        initializeChart();
        chart = state.calibrationChart(); 

        if (!chart) {
            log('chartManager', 'error', 'Falha crítica ao reinicializar o gráfico.');
            modalManager.showGeneralModal("Ocorreu um erro crítico ao tentar exibir o gráfico.");
            return;
        }
    }

    if (!chartStyles || chartStyles.length === 0) {
        log('chartManager', 'error', 'Estilos do gráfico não fornecidos ou vazios.');
        modalManager.showGeneralModal("Erro de configuração: Estilos do gráfico não foram carregados.");
        return;
    }

    state.setLastRegressions(regressionsData);
    chart.data.datasets = [];

    const viewMode = state.regressionViewMode();
    const displayLimit = state.regressionDisplayLimit();
    let dataToRender = [...regressionsData];
    
    dataToRender.sort((a, b) => {
        const bestR2_A = Math.max(...a.models.map(m => m.r2));
        const bestR2_B = Math.max(...b.models.map(m => m.r2));
        return bestR2_B - bestR2_A;
    });

    const effectiveLimit = viewMode === 'best' ? MAX_MODELS_TO_RENDER : displayLimit;
    if (dataToRender.length > effectiveLimit) {
        dataToRender = dataToRender.slice(0, effectiveLimit);
    }
    
    const visibleParamsSet = state.visibleRegressionParameters();
    const regressionsToShow = dataToRender.filter(reg => visibleParamsSet.has(reg.parameter));
    log('chartManager', 'data', `Total de regressões a serem exibidas no gráfico: ${regressionsToShow.length}`);

    const calibrationPoints = state.rois().filter(r => r.useInCalibration && r.concentration !== null);
    const newDatasets = [];

    regressionsToShow.forEach((regression) => {
        const originalIndex = state.lastRegressions().findIndex(r => r.parameter === regression.parameter);
        const colorSet = chartStyles[originalIndex % chartStyles.length];

        const dataPoints = calibrationPoints.map(roi => {
            const response = roi.analyticalResponse.find(r => r.channel === regression.parameter);
            return response ? { x: roi.concentration, y: response.value } : null;
        }).filter(Boolean);

        newDatasets.push({
            label: regression.parameter,
            data: dataPoints,
            backgroundColor: colorSet.backgroundColor,
            borderColor: colorSet.borderColor,
            pointStyle: colorSet.pointStyle,
            type: 'scatter',
            order: 0
        });

        const linearModel = regression.models.find(m => m.type === 'linear');
        const polyModel = regression.models.find(m => m.type === 'polynomial');

        switch (viewMode) {
            case 'best':
                const bestModel = [linearModel, polyModel].filter(Boolean).reduce((best, current) => (current.r2 > best.r2) ? current : best, {r2: -Infinity});
                if (bestModel.type) newDatasets.push(createLineDataset(bestModel, dataPoints, colorSet.borderColor, 'solid'));
                break;
            case 'linear':
                if (linearModel) newDatasets.push(createLineDataset(linearModel, dataPoints, colorSet.borderColor, 'solid'));
                break;
            case 'polynomial':
                if (polyModel) newDatasets.push(createLineDataset(polyModel, dataPoints, colorSet.borderColor, 'dotted'));
                break;
            case 'comparative':
                if (linearModel) newDatasets.push(createLineDataset(linearModel, dataPoints, colorSet.borderColor, 'solid'));
                if (polyModel) newDatasets.push(createLineDataset(polyModel, dataPoints, colorSet.borderColor, 'dotted'));
                break;
        }
    });

    chart.data.datasets = newDatasets;
    chart.options.scales.x.title.text = `Concentração (${state.currentConcentrationUnit()})`;
    chart.options.plugins.title.text = state.analysisTitle();
    chart.options.plugins.title.display = !!state.analysisTitle();
    chart.update();

    renderRegressionEquations(dataToRender, chartStyles);
    
    const modelsForPanel = dataToRender.flatMap(reg => {
        const linearModel = reg.models.find(m => m.type === 'linear');
        const polyModel = reg.models.find(m => m.type === 'polynomial');
        const bestModel = [linearModel, polyModel].filter(Boolean).reduce((best, current) => (current.r2 > best.r2) ? current : best, { r2: -Infinity });
        
        let modelsToInclude = [];
        switch(viewMode) {
            case 'linear':
                if (linearModel) modelsToInclude.push(linearModel);
                break;
            case 'polynomial':
                if (polyModel) modelsToInclude.push(polyModel);
                break;
            case 'best':
                if (bestModel.type) modelsToInclude.push(bestModel);
                break;
            case 'comparative':
                if (linearModel) modelsToInclude.push(linearModel);
                if (polyModel) modelsToInclude.push(polyModel);
                break;
        }

        return modelsToInclude.map(model => ({ ...model, parameter: reg.parameter }));
    });

    log('chartManager', 'data', `Enviando ${modelsForPanel.length} modelos filtrados para o Painel de Controle de Qualidade.`);
    domRenderer.renderQualityControlPanel(modelsForPanel);
}

// --- INÍCIO DA CORREÇÃO (BUGFIX-QC-PANEL-REFACTOR-03) ---
// A função local 'findMetricByChannelName' foi removida.
// O código agora utilizará a versão global definida em utils.js.
// --- FIM DA CORREÇÃO ---

/**
 * Renderiza a lista de equações e controles acima do gráfico.
 */
function renderRegressionEquations(regressionsData, chartStyles) {
    const container = dom.regressionEquationsContainer;
    if (!container) return;
    
    container.innerHTML = '';
    if (regressionsData.length === 0) {
        container.classList.add('hidden');
        return;
    }

    const totalRegressions = state.lastRegressions().length;
    const viewMode = state.regressionViewMode();
    let limitControlHtml = '';

    if (viewMode !== 'best') {
        const displayLimit = state.regressionDisplayLimit();
        const limitValue = isFinite(displayLimit) ? displayLimit : '';
        const limitText = isFinite(displayLimit) ? `Exibindo <b>${regressionsData.length}</b> de <b>${totalRegressions}</b> melhores modelos.` : `Exibindo todos os <b>${totalRegressions}</b> modelos.`;

        limitControlHtml = `
            <div class="p-2 mb-2 text-xs text-center bg-slate-100 text-slate-700 rounded-md flex items-center justify-center flex-wrap gap-2">
                <span>${limitText}</span>
                <input type="number" id="regression-limit-input" value="${limitValue}" placeholder="Todos" class="form-input w-20 text-xs p-1 mx-1">
                <button id="apply-regression-limit" class="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs">Aplicar</button>
                <div class="hidden sm:inline-block border-l h-4 border-slate-300 mx-1"></div>
                <span class="font-semibold hidden sm:inline">Atalhos:</span>
                <button class="limit-shortcut-btn" data-limit="5">5</button>
                <button class="limit-shortcut-btn" data-limit="10">10</button>
                <button class="limit-shortcut-btn" data-limit="25">25</button>
                <button class="limit-shortcut-btn" data-limit="Infinity">Todos</button>
            </div>
        `;
    }

    let equationsHtml = '';
    const visibleParamsSet = state.visibleRegressionParameters();
    const isComparativeView = viewMode === 'comparative' || (viewMode === 'best' && regressionsData.length > 0);

    regressionsData.forEach((regression) => {
        const originalIndex = state.lastRegressions().findIndex(r => r.parameter === regression.parameter);
        const colorSet = chartStyles[originalIndex % chartStyles.length];
        const linearModel = regression.models.find(m => m.type === 'linear');
        const polyModel = regression.models.find(m => m.type === 'polynomial');
        const bestModel = [linearModel, polyModel].filter(Boolean).reduce((best, current) => (current.r2 > best.r2) ? current : best, { r2: -Infinity });

        const isChecked = visibleParamsSet.has(regression.parameter) ? 'checked' : '';
        const checkboxHtml = `<input type="checkbox" class="regression-visibility-toggle form-checkbox h-4 w-4 mr-3 cursor-pointer" data-param-name="${regression.parameter}" ${isChecked}>`;
        
        // A função findMetricByChannelName agora é chamada globalmente.
        const metricDefinition = findMetricByChannelName(regression.parameter);
        const displayName = metricDefinition ? metricDefinition.fullName : regression.parameter;

        if (isComparativeView) {
            equationsHtml += `<div class="regression-group p-2 my-1 border rounded-md flex items-start" style="border-left-color: ${colorSet.borderColor}; border-left-width: 4px;">
                ${checkboxHtml}
                <div>
                    <strong class="text-sm flex items-center">${displayName}</strong>`;
            if (linearModel) equationsHtml += `<div class="text-xs ml-1 mt-1">${formatEquation(linearModel)} ${linearModel === bestModel ? '⭐' : ''}</div>`;
            if (polyModel) equationsHtml += `<div class="text-xs ml-1 mt-1">${formatEquation(polyModel)} ${polyModel === bestModel ? '⭐' : ''}</div>`;
            equationsHtml += `</div></div>`;
        } else {
            let modelToShow;
            switch(viewMode) {
                case 'linear': modelToShow = linearModel; break;
                case 'polynomial': modelToShow = polyModel; break;
                default: modelToShow = bestModel; // 'best'
            }
            if (modelToShow && modelToShow.type) {
                equationsHtml += `<div class="p-2 my-1 flex items-center" style="border-left: 3px solid ${colorSet.borderColor};">
                    ${checkboxHtml}
                    <div>
                        <strong class="text-sm">${displayName}</strong>
                        <div class="text-xs ml-1 mt-1">${formatEquation(modelToShow)}</div>
                    </div>
                </div>`;
            }
        }
    });

    container.innerHTML = limitControlHtml + equationsHtml;
    container.classList.remove('hidden');
    
    uiManager.updateRegressionViewControls();
}


/**
 * Cria um objeto de dataset para uma linha de regressão.
 */
function createLineDataset(model, dataPoints, color, style) {
    if (dataPoints.length === 0) return {};
    const xValues = dataPoints.map(p => p.x);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const range = maxX - minX;
    
    const steps = model.type === 'polynomial' ? 50 : 20;

    const lineData = [];
    for (let i = 0; i <= steps; i++) {
        const x = minX + (range * i) / steps;
        let y;
        if (model.type === 'linear') {
            const { m, b } = model.coefficients;
            y = m * x + b;
        } else {
            const { a, b, c } = model.coefficients;
            y = a * x * x + b * x + c;
        }
        lineData.push({ x, y });
    }

    return {
        label: `${model.type.charAt(0).toUpperCase() + model.type.slice(1)} Model`,
        data: lineData,
        type: 'line',
        borderColor: color,
        borderWidth: 2,
        borderDash: style === 'dotted' ? [5, 5] : [],
        pointRadius: 0,
        fill: false,
        tension: model.type === 'polynomial' ? 0.1 : 0,
        order: 1
    };
}


/**
 * Formata um objeto de modelo de regressão em uma string de equação legível.
 */
function formatEquation(model) {
    let equationStr = '';
    const typeInitial = model.type === 'linear' ? 'L' : 'P';

    if (model.type === 'linear') {
        const { m, b } = model.coefficients;
        equationStr = `y = ${m.toFixed(4)}x ${b >= 0 ? '+' : '-'} ${Math.abs(b).toFixed(4)}`;
    } else {
        const { a, b, c } = model.coefficients;
        equationStr = `y = ${a.toFixed(4)}x² ${b >= 0 ? '+' : '-'} ${Math.abs(b).toFixed(4)}x ${c >= 0 ? '+' : '-'} ${Math.abs(c).toFixed(4)}`;
    }
    return `<span class="font-mono">[${typeInitial}] ${equationStr} (R² = ${model.r2.toFixed(4)})</span>`;
}


/**
 * Limpa o gráfico e os dados de regressão do estado e da UI.
 */
export function clearChart(destroyInstance = true) {
    const chart = state.calibrationChart();
    if (chart) {
        if (destroyInstance) {
            chart.destroy();
            state.setCalibrationChart(null);
        } else {
            chart.data.datasets = [];
            chart.options.plugins.title.text = '';
            chart.options.plugins.title.display = false;
            chart.update();
        }
    }
    if (dom.regressionEquationsContainer) {
        dom.regressionEquationsContainer.innerHTML = '';
        dom.regressionEquationsContainer.classList.add('hidden');
    }
    state.setLastRegressions([]);
    uiManager.updateAnalysisStepsVisibility();
}