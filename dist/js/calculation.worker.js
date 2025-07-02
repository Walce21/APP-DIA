// public/js/calculation.worker.js

try {
    importScripts(
        '/opencv.js',
        '/js/utils.js',
        '/js/config.js',
        '/js/log.js'
    );
} catch (e) {
    console.error("Erro fatal ao carregar scripts no worker:", e);
    self.postMessage({ type: 'error', task: 'initialization', payload: { message: `Falha ao carregar scripts essenciais: ${e.message}` } });
}

self.onmessage = (e) => {
    if (typeof cv === 'undefined') {
        self.postMessage({ type: 'error', task: 'initialization', payload: { message: 'OpenCV (cv) não está definido no escopo do worker.' } });
        return;
    }
    const { type, payload } = e.data;
    try {
        let result;
        switch (type) {
            case 'detectCircles': {
                const { imageData, settings } = payload;
                const src = cv.matFromImageData(imageData);
                result = findCirclesInMat(src, settings);
                src.delete();
                break;
            }
            case 'generateRegressions': {
                const { roisForCalibration, selectedParams } = payload;
                result = generateAllRegressions(roisForCalibration, selectedParams);
                break;
            }
            case 'calculateMetrics': {
                const { allRois, whiteRoi, imageData } = payload;
                result = calculateAllMetrics(allRois, whiteRoi, imageData);
                break;
            }
            case 'predictConcentrations': {
                const { rois, regressions } = payload;
                result = predictSampleConcentrations(rois, regressions);
                break;
            }
            case 'processRoiData': {
                const { roi, imageData } = payload;
                result = extractDataFromPixels(roi, imageData);
                if (result) result.roiId = roi.id;
                break;
            }
            default: {
                throw new Error(`Tipo de mensagem desconhecido: ${type}`);
            }
        }
        self.postMessage({ type: 'success', task: type, payload: result });
    } catch (error) {
        self.postMessage({ type: 'error', task: type, payload: { message: error.message, stack: error.stack } });
    }
};

function findCirclesInMat(sourceMat, settings) {
    let hsv = new cv.Mat();
    let mask = new cv.Mat();
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    const newRois = [];
    try {
        cv.cvtColor(sourceMat, hsv, cv.COLOR_RGB2HSV, 0);
        const minSaturation = Math.round(settings.minSaturation * 2.55);
        const minValue = Math.round(settings.minValue * 2.55);
        const low = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [0, minSaturation, minValue, 0]);
        const high = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [179, 255, 255, 255]);
        cv.inRange(hsv, low, high, mask);
        low.delete(); high.delete();
        const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(5, 5));
        cv.morphologyEx(mask, mask, cv.MORPH_OPEN, kernel);
        cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, kernel);
        kernel.delete();
        cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        for (let i = 0; i < contours.size(); ++i) {
            const cnt = contours.get(i);
            if (cv.contourArea(cnt) > settings.minArea) {
                const perimeter = cv.arcLength(cnt, true);
                if (perimeter > 0) {
                    const circularity = (4 * Math.PI * cv.contourArea(cnt)) / (perimeter * perimeter);
                    if (circularity > settings.minCircularity) {
                        const circle = cv.minEnclosingCircle(cnt);
                        newRois.push({ type: 'circle', x: circle.center.x - circle.radius, y: circle.center.y - circle.radius, radius: circle.radius });
                    }
                }
            }
            cnt.delete();
        }
    } finally {
        hsv.delete(); mask.delete(); contours.delete(); hierarchy.delete();
    }
    return newRois;
}

function extractDataFromPixels(roi, roiImageData) {
    const data = roiImageData.data;
    const w = roiImageData.width;
    let sumR = 0, sumG = 0, sumB = 0, count = 0;
    let rValues = [], gValues = [], bValues = [];
    for (let i = 0; i < data.length; i += 4) {
        if (roi.type === 'circle') {
            const px = (i / 4) % w, py = Math.floor((i / 4) / w);
            if (Math.hypot(px - w / 2, py - w / 2) > w / 2) continue;
        }
        sumR += data[i]; sumG += data[i + 1]; sumB += data[i + 2];
        rValues.push(data[i]); gValues.push(data[i + 1]); bValues.push(data[i + 2]);
        count++;
    }
    if (count === 0) return null;
    const avgR = sumR / count, avgG = sumG / count, avgB = sumB / count;
    const rgb = { r: avgR, g: avgG, b: avgB };

    return {
        pixelCount: count,
        rgb: { avgR, avgG, avgB, avgRGB: (avgR + avgG + avgB) / 3 },
        rgb_stdDev: { r: standardDeviation(rValues), g: standardDeviation(gValues), b: standardDeviation(bValues) },
        lab: rgbToLab(rgb),
        hsv: rgbToHsv(rgb),
        hsl: rgbToHsl(rgb),
        ycbcr: rgbToYcbcr(rgb),
        cmyk: rgbToCmyk(rgb),
        xyz: rgbToXyz(rgb),
        hunterLab: rgbToHunterLab(rgb)
    };
}

function calculateSingleEquation(roi, equation, whiteRoi, systemName) {
    const createName = () => `SA (${systemName} - ${equation.text})`;
    let value = null;
    try {
        switch (equation.type) {
            case 'direct':
                value = roi[equation.system][equation.channel];
                break;
            case 'inverse':
                value = 255 - roi.rgb[equation.channel];
                break;
            case 'delta':
                value = whiteRoi[equation.system][equation.channel] - roi[equation.system][equation.channel];
                break;
            case 'beer':
                const sampleVal = roi[equation.system][equation.channel];
                const whiteVal = whiteRoi[equation.system][equation.channel];
                if (sampleVal > 0 && whiteVal > 0) value = -Math.log10(sampleVal / whiteVal);
                break;
            case 'euclidean_rgb':
                value = Math.hypot(whiteRoi.rgb.avgR - roi.rgb.avgR, whiteRoi.rgb.avgG - roi.rgb.avgG, whiteRoi.rgb.avgB - roi.rgb.avgB);
                break;
            case 'delta_e2000':
                value = ciede2000(whiteRoi.lab, roi.lab);
                break;
            case 'ratio':
                const numerator = roi[equation.system][equation.channels[0]];
                const denominator = roi[equation.system][equation.channels[1]];
                if (denominator !== 0) value = numerator / denominator;
                break;
            case 'ndi':
                const valA = roi[equation.system][equation.channels[0]];
                const valB = roi[equation.system][equation.channels[1]];
                const sum = valA + valB;
                if (sum !== 0) value = (valA - valB) / sum;
                break;
            case 'sum_ratio_rgb':
                const total = roi.rgb.avgR + roi.rgb.avgG + roi.rgb.avgB;
                if (total > 0) value = roi.rgb[equation.channel] / total;
                break;
            case 'cielab_chroma':
                value = roi.derived?.c_star;
                break;
            case 'cielab_hue':
                value = roi.derived?.h_ab;
                break;
            case 'xyz_chromaticity':
                const xyzSum = roi.xyz.x + roi.xyz.y + roi.xyz.z;
                if (xyzSum > 0) value = roi.xyz[equation.channel] / xyzSum;
                break;
            case 'inter_ratio':
                const num_inter = roi[equation.systems[0]][equation.channels[0]];
                const den_inter = roi[equation.systems[1]][equation.channels[1]];
                if (den_inter !== 0) value = num_inter / den_inter;
                break;
            case 'inter_ratio_cstar':
                const c_star_cstar = roi.derived?.c_star;
                const den_cstar = roi[equation.systems[1]][equation.channels[1]];
                if (den_cstar !== 0) value = c_star_cstar / den_cstar;
                break;
            case 'euclidean_generic': {
                let sumOfSquares = 0;
                for (const channel of equation.channels) {
                    const sampleChannelVal = roi[equation.system]?.[channel];
                    const whiteChannelVal = whiteRoi[equation.system]?.[channel];
                    if (typeof sampleChannelVal === 'number' && typeof whiteChannelVal === 'number') {
                        sumOfSquares += Math.pow(whiteChannelVal - sampleChannelVal, 2);
                    }
                }
                value = Math.sqrt(sumOfSquares);
                break;
            }
            case 'cielab_chroma_lightness_ratio': {
                const c_star_clr = roi.derived?.c_star;
                const l_star_clr = roi.lab.l;
                if (l_star_clr !== 0) {
                    value = c_star_clr / l_star_clr;
                }
                break;
            }
            case 'cielab_hue_component': {
                if (equation.subType === 'cos') {
                    value = roi.derived?.h_cos;
                } else if (equation.subType === 'sin') {
                    value = roi.derived?.h_sin;
                }
                break;
            }
            case 'inter_ratio_sum_rgb': {
                const sum_rgb = roi.rgb.avgR + roi.rgb.avgG + roi.rgb.avgB;
                const den_sum_inter = roi[equation.systems[1]][equation.channels[1]];
                if (den_sum_inter !== 0) {
                    value = sum_rgb / den_sum_inter;
                }
                break;
            }
            case 'inter_ratio_rgb_vs_cstar': {
                const num_rgb_cstar = roi[equation.systems[0]][equation.channels[0]];
                const den_rgb_cstar = roi.derived?.c_star;
                if (den_rgb_cstar !== 0 && den_rgb_cstar !== undefined) {
                    value = num_rgb_cstar / den_rgb_cstar;
                }
                break;
            }
        }
    } catch (e) {
        log('calculation.worker', 'error', `Erro ao calcular equação ${equation.id}`, e);
        return null;
    }
    if (value !== null && isFinite(value)) {
        return { channel: createName(), value: value };
    }
    return null;
}

function calculateAllMetrics(allRois, whiteRoi, imageData) {
    if (!allRois || allRois.length === 0) return { rois: [], whiteNeededButMissing: false };
    
    allRois.forEach(roi => {
        if (!roi.rgb) {
            log('calculation.worker', 'warn', `ROI ID ${roi.id} está incompleta. Processando dados de cor agora.`);
            
            const roiX = Math.floor(roi.x);
            const roiY = Math.floor(roi.y);
            const roiW = Math.floor(roi.type === 'rect' ? roi.width : roi.radius * 2);
            const roiH = Math.floor(roi.type === 'rect' ? roi.height : roi.radius * 2);

            if (roiW <= 0 || roiH <= 0) return;

            const croppedDataArray = new Uint8ClampedArray(roiW * roiH * 4);
            for (let y = 0; y < roiH; y++) {
                for (let x = 0; x < roiW; x++) {
                    const sourceIdx = ((roiY + y) * imageData.width + (roiX + x)) * 4;
                    const destIdx = (y * roiW + x) * 4;
                    croppedDataArray[destIdx]     = imageData.data[sourceIdx];
                    croppedDataArray[destIdx + 1] = imageData.data[sourceIdx + 1];
                    croppedDataArray[destIdx + 2] = imageData.data[sourceIdx + 2];
                    croppedDataArray[destIdx + 3] = imageData.data[sourceIdx + 3];
                }
            }
            const croppedImageData = new ImageData(croppedDataArray, roiW, roiH);

            const processedData = extractDataFromPixels(roi, croppedImageData);
            if (processedData) {
                Object.assign(roi, processedData);
            }
        }
    });
    
    allRois.forEach(roi => {
        if (roi.lab) {
            roi.derived = {};
            const c_star = Math.hypot(roi.lab.a, roi.lab.b);
            const hue_rad = Math.atan2(roi.lab.b, roi.lab.a);
            let h_ab = (hue_rad * 180) / Math.PI;
            if (h_ab < 0) h_ab += 360;

            roi.derived.c_star = c_star;
            roi.derived.h_ab = h_ab;
            roi.derived.h_cos = Math.cos(hue_rad);
            roi.derived.h_sin = Math.sin(hue_rad);
        }
    });

    if (whiteRoi) {
        whiteRoi = allRois.find(r => r.id === whiteRoi.id);
    }
    
    let whiteNeededButMissing = false;
    allRois.forEach(roi => {
        roi.analyticalResponse = [];
        for (const systemName in analyticalEquationsBySystem) {
            const subGroups = analyticalEquationsBySystem[systemName];
            for (const groupName in subGroups) {
                const equations = subGroups[groupName];
                equations.forEach(equation => {
                    if (equation.needsWhite) {
                        if (!whiteRoi) {
                            whiteNeededButMissing = true;
                            return;
                        }
                        if (roi.id === whiteRoi.id) {
                            return;
                        }
                    }
                    const result = calculateSingleEquation(roi, equation, whiteRoi, systemName);
                    if (result) {
                        roi.analyticalResponse.push(result);
                    }
                });
            }
        }
    });

    return { rois: allRois, whiteNeededButMissing };
}

/**
 * Gera os modelos de regressão (linear e polinomial) para cada parâmetro selecionado,
 * enriquecendo os modelos com parâmetros de qualidade analítica aplicáveis.
 * @param {Array<object>} roisForCalibration - As ROIs marcadas para calibração.
 * @param {Array<string>} selectedParams - Os nomes dos canais/parâmetros a serem analisados.
 * @returns {Array<object>} Um array com os resultados da regressão para cada parâmetro.
 */
function generateAllRegressions(roisForCalibration, selectedParams) {
    log('calculation.worker', 'info', `Iniciando geração de ${selectedParams.length} regressões.`);
    const newRegressions = [];

    selectedParams.forEach(param => {
        const dataPoints = roisForCalibration.map(roi => {
            const response = roi.analyticalResponse.find(r => r.channel === param);
            return response ? { x: roi.concentration, y: response.value } : null;
        }).filter(Boolean);

        if (dataPoints.length < 2) return;
        
        // --- INÍCIO DA ALTERAÇÃO (Etapa A-02) ---

        // 1. Modelos de Regressão (cálculo inalterado)
        const linearModelRaw = linearRegression(dataPoints);
        const polynomialModelRaw = polynomialRegression(dataPoints);

        // 2. Cálculos de Qualidade para o Modelo Linear (lógica inalterada)
        let linearQualityParams = {};
        if (dataPoints.length > 2) {
            const standardErrors = calculateLinearStandardErrors(dataPoints, linearModelRaw);
            const limits = calculateLOD_LOQ(standardErrors.Syx, linearModelRaw.m);
            const range = getCalibrationRange(dataPoints);
            linearQualityParams = { ...standardErrors, ...limits, range };
        }
        
        // 3. Cálculos de Qualidade para o Modelo Polinomial (NOVA LÓGICA)
        let polynomialQualityParams = {};
        if (dataPoints.length > 3) { // Sy/x para polinomial requer n > 3
            const { a, b, c } = polynomialModelRaw;
            const predictionFunction = (x) => (a * x * x) + (b * x) + c;
            const syxPoly = calculateRegressionStandardError(dataPoints, predictionFunction, 3); // 3 parâmetros (a, b, c)
            
            polynomialQualityParams = {
                Syx: syxPoly,
                // LOD e LOQ não são aplicáveis a modelos polinomiais desta forma.
                lod: null, 
                loq: null,
                range: getCalibrationRange(dataPoints)
            };
        }

        // 4. Montagem dos Objetos Finais com os dados de qualidade
        const linearModelFinal = { 
            type: 'linear', 
            coefficients: { m: linearModelRaw.m, b: linearModelRaw.b }, 
            r2: linearModelRaw.r2,
            quality: linearQualityParams 
        };

        const polynomialModelFinal = { 
            type: 'polynomial', 
            coefficients: { a: polynomialModelRaw.a, b: polynomialModelRaw.b, c: polynomialModelRaw.c }, 
            r2: polynomialModelRaw.r2,
            quality: polynomialQualityParams // Anexa os parâmetros de qualidade calculados
        };

        // --- FIM DA ALTERAÇÃO ---

        newRegressions.push({
            parameter: param,
            models: [linearModelFinal, polynomialModelFinal]
        });
    });
    
    log('calculation.worker', 'success', `${newRegressions.length} parâmetros foram regredidos com sucesso e enriquecidos com dados de validação.`);
    return newRegressions;
}

function solveQuadraticForPrediction(a, b, c, calibrationRange) {
    if (a === 0) {
        return (b !== 0) ? -c / b : null;
    }

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return null;

    const sqrtDiscriminant = Math.sqrt(discriminant);
    const root1 = (-b + sqrtDiscriminant) / (2 * a);
    const root2 = (-b - sqrtDiscriminant) / (2 * a);

    const [min, max] = calibrationRange;
    const root1_in_range = root1 >= min && root1 <= max;
    const root2_in_range = root2 >= min && root2 <= max;

    if (root1_in_range && !root2_in_range) return root1;
    if (root2_in_range && !root1_in_range) return root2;
    
    return Math.abs(root1) < Math.abs(root2) ? root1 : root2;
}

function predictSampleConcentrations(rois, regressions) {
    if (!regressions || regressions.length === 0) {
        rois.filter(r => r.isSample).forEach(roi => roi.predictedConcentrations = []);
        return rois;
    }
    
    const calibrationRois = rois.filter(r => r.useInCalibration && r.concentration !== null);
    const concentrationValues = calibrationRois.map(r => r.concentration);
    const calibrationRange = (concentrationValues.length > 0) ? [Math.min(...concentrationValues), Math.max(...concentrationValues)] : [0, 0];

    const sampleRois = rois.filter(r => r.isSample);
    sampleRois.forEach(roi => {
        roi.predictedConcentrations = [];
        regressions.forEach(reg => {
            const response = roi.analyticalResponse.find(r => r.channel === reg.parameter);
            if (!response) return;

            const bestModel = reg.models.reduce((best, current) => (current.r2 > best.r2) ? current : best, {r2: -1});
            
            if (bestModel.r2 === -1) return;

            let concentration = null;
            let equation = '';

            if (bestModel.type === 'linear') {
                const { m, b } = bestModel.coefficients;
                if (m !== 0) {
                    concentration = (response.value - b) / m;
                    equation = `y = ${m.toFixed(4)}x + ${b.toFixed(4)}`;
                }
            } else if (bestModel.type === 'polynomial') {
                const { a, b, c } = bestModel.coefficients;
                concentration = solveQuadraticForPrediction(a, b, c - response.value, calibrationRange);
                equation = `y = ${a.toFixed(4)}x² + ${b.toFixed(4)}x + ${c.toFixed(4)}`;
            }

            if (concentration !== null) {
                roi.predictedConcentrations.push({
                    concentration: concentration,
                    parameter: reg.parameter,
                    modelUsed: bestModel.type,
                    r2: bestModel.r2,
                    equation: equation,
                    system: reg.parameter.substring(reg.parameter.indexOf('(') + 1, reg.parameter.indexOf(' - '))
                });
            }
        });
    });
    return rois;
}