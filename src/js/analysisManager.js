// js/analysisManager.js
// Este módulo agora é responsável por lógicas de gerenciamento de estado da análise,
// enquanto os cálculos pesados foram movidos para calculation.worker.js.

import * as state from './state.js';
import * as modalManager from './modalManager.js';
import * as actions from './stateActions.js';

export function invalidateAnalysisIfNecessary() {
    if (state.metricsCalculated() && !state.isAnalysisStale()) {
        log('analysisManager', 'warn', "Análise invalidada devido a modificações. Recalcular métricas.");
        
        actions.setAnalysisAsStale(true);
        
        modalManager.showToast("Atenção: A análise está desatualizada. Recalcule as métricas.");
    }
}


// --- INÍCIO DA REFATORAÇÃO (FEAT-PREDICTION-STATUS-01) ---

/**
 * Função auxiliar para resolver uma equação linear e classificar o resultado.
 * @param {number} m - Coeficiente angular.
 * @param {number} b - Intercepto.
 * @param {number} y - Valor do sinal da amostra.
 * @param {Array<number>} calibrationRange - O intervalo [min, max] da curva de calibração.
 * @returns {{value: number|null, status: string}} Objeto com o valor e o status da predição.
 */
function _solveLinearForPrediction(m, b, y, calibrationRange) {
    if (m === 0) {
        return { value: null, status: 'invalid_no_slope' };
    }
    const concentration = (y - b) / m;

    // --- INÍCIO DA ALTERAÇÃO ---
    // Adicionada verificação para concentrações negativas.
    if (concentration < 0) {
        log('analysisManager', 'data', `Concentração negativa (${concentration.toFixed(4)}) calculada. Marcando como inválida.`);
        return { value: concentration, status: 'invalid_negative_result' };
    }
    // --- FIM DA ALTERAÇÃO ---

    const [min, max] = calibrationRange;

    if (concentration >= min && concentration <= max) {
        return { value: concentration, status: 'valid' };
    }
    return {
        value: concentration,
        status: concentration < min ? 'extrapolated_low' : 'extrapolated_high'
    };
}


/**
 * Função auxiliar para resolver uma equação de segundo grau e classificar o resultado.
 * @param {number} a - Coeficiente de x².
 * @param {number} b - Coeficiente de x.
 * @param {number} c - Termo constante (já subtraído do valor y da amostra).
 * @param {Array<number>} calibrationRange - O intervalo [min, max] da curva de calibração.
 * @returns {{value: number|null, status: string}} Objeto com o valor e o status da predição.
 */
function _solveQuadraticForPrediction(a, b, c, calibrationRange) {
    if (a === 0) {
        // Se 'a' é zero, a equação é na verdade linear.
        return _solveLinearForPrediction(b, c, 0, calibrationRange);
    }

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
        return { value: null, status: 'invalid_no_real_solution' };
    }

    const sqrtDiscriminant = Math.sqrt(discriminant);
    const root1 = (-b + sqrtDiscriminant) / (2 * a);
    const root2 = (-b - sqrtDiscriminant) / (2 * a);

    const [min, max] = calibrationRange;
    const isRoot1InRange = root1 >= min && root1 <= max;
    const isRoot2InRange = root2 >= min && root2 <= max;

    if (isRoot1InRange && !isRoot2InRange) {
        // --- INÍCIO DA ALTERAÇÃO ---
        if (root1 < 0) {
            log('analysisManager', 'data', `Raiz válida no range (${root1.toFixed(4)}) é negativa. Marcando como inválida.`);
            return { value: root1, status: 'invalid_negative_result' };
        }
        // --- FIM DA ALTERAÇÃO ---
        return { value: root1, status: 'valid' };
    }
    if (isRoot2InRange && !isRoot1InRange) {
        // --- INÍCIO DA ALTERAÇÃO ---
        if (root2 < 0) {
            log('analysisManager', 'data', `Raiz válida no range (${root2.toFixed(4)}) é negativa. Marcando como inválida.`);
            return { value: root2, status: 'invalid_negative_result' };
        }
        // --- FIM DA ALTERAÇÃO ---
        return { value: root2, status: 'valid' };
    }
    
    // Se ambas ou nenhuma estiver no range, prioriza a de menor valor absoluto como a mais provável.
    const chosenRoot = Math.abs(root1) < Math.abs(root2) ? root1 : root2;

    // --- INÍCIO DA ALTERAÇÃO ---
    // Adicionada verificação final para a raiz escolhida.
    if (chosenRoot < 0) {
        log('analysisManager', 'data', `Raiz escolhida (${chosenRoot.toFixed(4)}) é negativa. Marcando como inválida.`);
        return { value: chosenRoot, status: 'invalid_negative_result' };
    }
    // --- FIM DA ALTERAÇÃO ---

    if (isRoot1InRange && isRoot2InRange) { // Ambas estão no range (raro, mas possível)
        return { value: chosenRoot, status: 'valid' };
    } else { // Nenhuma está no range, portanto é uma extrapolação
        return {
            value: chosenRoot,
            status: chosenRoot < min ? 'extrapolated_low' : 'extrapolated_high'
        };
    }
}

/**
 * Aplica os modelos de regressão calculados às ROIs de amostra para prever suas concentrações.
 * @param {Array<object>} regressionModels - Os modelos de regressão retornados pelo worker.
 * @returns {Array<object>} Um novo array de todas as ROIs, com as ROIs de amostra atualizadas.
 */
export function predictSampleConcentrations(regressionModels) {
    log('analysisManager', 'info', 'Iniciando predição de concentração para amostras.');

    const allRois = state.rois();
    const sampleRois = allRois.filter(r => r.isSample);
    
    if (sampleRois.length === 0 || !regressionModels || regressionModels.length === 0) {
        log('analysisManager', 'info', 'Nenhuma amostra ou modelo de regressão para processar.');
        return allRois;
    }
    
    const calibrationRois = allRois.filter(r => r.useInCalibration && r.concentration !== null);
    const concentrationValues = calibrationRois.map(r => r.concentration);
    const calibrationRange = (concentrationValues.length > 0) ? [Math.min(...concentrationValues), Math.max(...concentrationValues)] : null;
    
    const updatedRois = allRois.map(roi => {
        if (!roi.isSample) {
            return roi;
        }

        const updatedRoi = { ...roi, predictedConcentrations: [] };

        regressionModels.forEach(reg => {
            const response = updatedRoi.analyticalResponse.find(r => r.channel === reg.parameter);
            if (!response) return;

            const bestModel = reg.models.reduce((best, current) => (current.r2 > best.r2) ? current : best, { r2: -Infinity });
            if (bestModel.r2 === -Infinity) return;

            let predictionResult = { value: null, status: 'invalid_calculation_failed' };
            let equation = '';

            if (bestModel.type === 'linear') {
                const { m, b } = bestModel.coefficients;
                predictionResult = _solveLinearForPrediction(m, b, response.value, calibrationRange);
                equation = `y = ${m.toFixed(4)}x + ${b.toFixed(4)}`;

            } else if (bestModel.type === 'polynomial') {
                const { a, b, c } = bestModel.coefficients;
                if (calibrationRange) {
                    predictionResult = _solveQuadraticForPrediction(a, b, c - response.value, calibrationRange);
                }
                equation = `y = ${a.toFixed(4)}x² + ${b.toFixed(4)}x + ${c.toFixed(4)}`;
            }

            const metricDef = findMetricByChannelName(reg.parameter);
            updatedRoi.predictedConcentrations.push({
                concentration: predictionResult.value,
                status: predictionResult.status,
                parameter: reg.parameter,
                modelUsed: bestModel.type,
                r2: bestModel.r2,
                equation: equation,
                system: metricDef ? metricDef.system : 'Desconhecido'
            });
        });

        return updatedRoi;
    });

    return updatedRois;
}
// --- FIM DA REFATORAÇÃO ---