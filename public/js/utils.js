// public/js/utils.js
// --- REATORADO PARA SCRIPT CLÁSSICO (SEM EXPORT) ---

function cleanVal(val, dec = 2) {
    return (val !== null && val !== undefined && !isNaN(parseFloat(val))) ? parseFloat(val).toFixed(dec) : 'N/D';
}

function linearRegression(data) {
    let n = data.length;
    if (n < 2) return { m: 0, b: 0, r2: 0 };
    let sum_x = 0, sum_y = 0, sum_xy = 0, sum_xx = 0, sum_yy = 0;
    for (let i = 0; i < n; i++) {
        let point = data[i];
        sum_x += point.x;
        sum_y += point.y;
        sum_xy += point.x * point.y;
        sum_xx += point.x * point.x;
        sum_yy += point.y * point.y;
    }
    let m = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
    let b = (sum_y - m * sum_x) / n;
    let r2_numerator = Math.pow(n * sum_xy - sum_x * sum_y, 2);
    let r2_denominator = (n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y);
    
    if (r2_denominator === 0) {
        const result = { m, b, r2: 0 };
        log('utils', 'warn', 'Regressão linear: denominador do R² é zero. Não há variação nos dados.', result);
        return result;
    }

    const result = { m, b, r2: r2_numerator / r2_denominator };
    log('utils', 'info', 'Regressão linear calculada com sucesso.', result);
    return result;
}

function polynomialRegression(data) {
    const n = data.length;
    if (n < 3) {
        log('utils', 'warn', `Regressão polinomial requer pelo menos 3 pontos. Recebidos: ${n}. Retornando modelo nulo.`);
        return { a: 0, b: 0, c: 0, r2: 0 };
    }

    let sum_x = 0, sum_y = 0, sum_x2 = 0, sum_x3 = 0, sum_x4 = 0, sum_xy = 0, sum_x2y = 0;

    for (const point of data) {
        const x = point.x;
        const y = point.y;
        const x2 = x * x;
        const x3 = x * x2;
        const x4 = x2 * x2;

        sum_x += x;
        sum_y += y;
        sum_x2 += x2;
        sum_x3 += x3;
        sum_x4 += x4;
        sum_xy += x * y;
        sum_x2y += x2 * y;
    }

    const A = [
        [sum_x4, sum_x3, sum_x2],
        [sum_x3, sum_x2, sum_x],
        [sum_x2, sum_x, n]
    ];
    const B = [sum_x2y, sum_xy, sum_y];

    for (let i = 0; i < 3; i++) {
        let pivot = i;
        for (let j = i + 1; j < 3; j++) {
            if (Math.abs(A[j][i]) > Math.abs(A[pivot][i])) {
                pivot = j;
            }
        }
        [A[i], A[pivot]] = [A[pivot], A[i]];
        [B[i], B[pivot]] = [B[pivot], B[i]];

        const div = A[i][i];
        if (div === 0) {
            log('utils', 'error', 'Divisão por zero na eliminação gaussiana. A matriz pode ser singular.');
            return { a: 0, b: 0, c: 0, r2: 0 };
        }
        for (let j = i; j < 3; j++) {
            A[i][j] /= div;
        }
        B[i] /= div;

        for (let j = 0; j < 3; j++) {
            if (i !== j) {
                const mult = A[j][i];
                for (let k = i; k < 3; k++) {
                    A[j][k] -= mult * A[i][k];
                }
                B[j] -= mult * B[i];
            }
        }
    }
    
    const a = B[0];
    const b = B[1];
    const c = B[2];

    const y_mean = sum_y / n;
    let ss_tot = 0;
    let ss_res = 0;

    for (const point of data) {
        const y_actual = point.y;
        const y_predicted = a * point.x * point.x + b * point.x + c;
        ss_tot += Math.pow(y_actual - y_mean, 2);
        ss_res += Math.pow(y_actual - y_predicted, 2);
    }
    
    const r2 = (ss_tot === 0) ? 0 : 1 - (ss_res / ss_tot);
    
    log('utils', 'info', 'Regressão polinomial calculada com sucesso.', { a, b, c, r2 });

    return { a, b, c, r2 };
}

function rgbToHsv(rgb) {
    let r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, v = max;
    let d = max - min;
    s = max == 0 ? 0 : d / max;
    if (max == min) {
        h = 0;
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, v: v * 100 };
}

function rgbToHsl(rgb) {
    let r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max == min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

function rgbToLab(rgb) {
    let r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    r = r > .04045 ? Math.pow((r + .055) / 1.055, 2.4) : r / 12.92;
    g = g > .04045 ? Math.pow((g + .055) / 1.055, 2.4) : g / 12.92;
    b = b > .04045 ? Math.pow((b + .055) / 1.055, 2.4) : b / 12.92;
    let x = r * .4124 + g * .3576 + b * .1805;
    let y = r * .2126 + g * .7152 + b * .0722;
    let z = r * .0193 + g * .1192 + b * .9505;
    x /= .95047;
    y /= 1;
    z /= 1.08883;
    x = x > .008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
    y = y > .008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
    z = z > .008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
    return { l: 116 * y - 16, a: 500 * (x - y), b: 200 * (y - z) };
}

function ciede2000(lab1, lab2) {
    let l1 = lab1.l, a1 = lab1.a, b1 = lab1.b;
    let l2 = lab2.l, a2 = lab2.a, b2 = lab2.b;
    let c1 = Math.sqrt(a1 * a1 + b1 * b1), c2 = Math.sqrt(a2 * a2 + b2 * b2);
    let c_bar = (c1 + c2) / 2;
    let g = .5 * (1 - Math.sqrt(Math.pow(c_bar, 7) / (Math.pow(c_bar, 7) + Math.pow(25, 7))));
    let a1_prime = (1 + g) * a1, a2_prime = (1 + g) * a2;
    let c1_prime = Math.sqrt(a1_prime * a1_prime + b1 * b1), c2_prime = Math.sqrt(a2_prime * a2_prime + b2 * b2);
    let h1_prime = Math.atan2(b1, a1_prime) * 180 / Math.PI;
    if (h1_prime < 0) h1_prime += 360;
    let h2_prime = Math.atan2(b2, a2_prime) * 180 / Math.PI;
    if (h2_prime < 0) h2_prime += 360;
    let delta_l_prime = l2 - l1, delta_c_prime = c2_prime - c1_prime;
    let delta_h_prime_val = h2_prime - h1_prime;
    let delta_H_prime = 2 * Math.sqrt(c1_prime * c2_prime) * Math.sin(delta_h_prime_val * Math.PI / 180 / 2);
    let L_bar_prime = (l1 + l2) / 2, C_bar_prime = (c1_prime + c2_prime) / 2;
    let h_bar_prime = Math.abs(h1_prime - h2_prime) > 180 ? (h1_prime + h2_prime + 360) / 2 : (h1_prime + h2_prime) / 2;
    let T = 1 - .17 * Math.cos((h_bar_prime - 30) * Math.PI / 180) + .24 * Math.cos(2 * h_bar_prime * Math.PI / 180) + .32 * Math.cos((3 * h_bar_prime + 6) * Math.PI / 180) - .2 * Math.cos((4 * h_bar_prime - 63) * Math.PI / 180);
    let S_L = 1 + .015 * Math.pow(L_bar_prime - 50, 2) / Math.sqrt(20 + Math.pow(L_bar_prime - 50, 2));
    let S_C = 1 + .045 * C_bar_prime;
    let S_H = 1 + .015 * C_bar_prime * T;
    let R_T = -2 * Math.sqrt(Math.pow(C_bar_prime, 7) / (Math.pow(C_bar_prime, 7) + Math.pow(25, 7))) * Math.sin(60 * Math.exp(-Math.pow((h_bar_prime - 275) / 25, 2)) * Math.PI / 180);
    return Math.sqrt(Math.pow(delta_l_prime / S_L, 2) + Math.pow(delta_c_prime / S_C, 2) + Math.pow(delta_H_prime / S_H, 2) + R_T * (delta_c_prime / S_C) * (delta_H_prime / S_H));
}

function rgbToYcbcr(rgb) {
    let r = rgb.r, g = rgb.g, b = rgb.b;
    let y = .299 * r + .587 * g + .114 * b;
    let cb = 128 - .168736 * r - .331264 * g + .5 * b;
    let cr = 128 + .5 * r - .418688 * g - .081312 * b;
    return { y, cb, cr };
}

function standardDeviation(values) {
    if (!values || values.length <= 1) {
        return 0;
    }
    const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
    return Math.sqrt(variance);
}

function triggerVibration(durationInMs = 50) {
    if (navigator.vibrate) {
        log('utils', 'info', `API de vibração encontrada. Tentando vibrar por ${durationInMs}ms.`);
        try {
            navigator.vibrate(durationInMs);
        } catch (e) {
            log('utils', 'warn', "A vibração falhou. Pode ter sido desabilitada pelo usuário ou a permissão foi negada.", e);
        }
    } else {
        log('utils', 'info', "API de vibração (navigator.vibrate) não suportada neste navegador/dispositivo.");
    }
}

function rgbToCmyk(rgb) {
    let r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    let k = 1 - Math.max(r, g, b);
    if (k === 1) {
        return { c: 0, m: 0, y: 0, k: 100 };
    }
    let c = (1 - r - k) / (1 - k);
    let m = (1 - g - k) / (1 - k);
    let y = (1 - b - k) / (1 - k);
    return { c: c * 100, m: m * 100, y: y * 100, k: k * 100 };
}

function _sRgbToLinearRgb(c) {
    return (c > 0.04045) ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
}

function rgbToXyz(rgb) {
    let r_linear = _sRgbToLinearRgb(rgb.r / 255);
    let g_linear = _sRgbToLinearRgb(rgb.g / 255);
    let b_linear = _sRgbToLinearRgb(rgb.b / 255);

    let x = r_linear * 0.4124564 + g_linear * 0.3575761 + b_linear * 0.1804375;
    let y = r_linear * 0.2126729 + g_linear * 0.7151522 + b_linear * 0.0721750;
    let z = r_linear * 0.0193339 + g_linear * 0.1191920 + b_linear * 0.9503041;

    return { x: x * 100, y: y * 100, z: z * 100 };
}

function rgbToHunterLab(rgb) {
    const { x, y, z } = rgbToXyz(rgb);

    const l_hunter = 10 * Math.sqrt(y);
    const a_hunter = (y === 0) ? 0 : 17.5 * (((1.02 * x) - y) / Math.sqrt(y));
    const b_hunter = (y === 0) ? 0 : 7.0 * ((y - (0.847 * z)) / Math.sqrt(y));

    return { l: l_hunter, a: a_hunter, b: b_hunter };
}

function normalizeText(text) {
    if (typeof text !== 'string') {
        return '';
    }
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function calculateRegressionStandardError(data, predictionFunction, numParameters) {
    const n = data.length;
    if (n <= numParameters) {
        log('utils', 'warn', `Não é possível calcular Sy/x: número de pontos (${n}) deve ser maior que o número de parâmetros (${numParameters}).`);
        return null;
    }

    const ss_res = data.reduce((sum, point) => {
        const y_predicted = predictionFunction(point.x);
        return sum + Math.pow(point.y - y_predicted, 2);
    }, 0);

    const degreesOfFreedom = n - numParameters;
    
    const syx = Math.sqrt(ss_res / degreesOfFreedom);
    log('utils', 'info', `Sy/x calculado com sucesso: ${syx}`, { n, numParameters, ss_res });
    return syx;
}

function calculateLinearStandardErrors(data, modelCoefficients) {
    const n = data.length;
    if (n <= 2) return { Syx: 0, Sm: 0, Sb: 0 };

    const { m, b } = modelCoefficients;
    
    const predictionFunction = (x) => m * x + b;
    const Syx = calculateRegressionStandardError(data, predictionFunction, 2);

    if (Syx === null) {
        return { Syx: 0, Sm: 0, Sb: 0 };
    }
    
    let sum_x = 0;
    let sum_xx = 0;
    for (const point of data) {
        sum_x += point.x;
        sum_xx += point.x * point.x;
    }
    const x_mean = sum_x / n;
    const ss_x = data.reduce((sum, point) => sum + Math.pow(point.x - x_mean, 2), 0);

    const Sm = (ss_x > 0) ? Syx / Math.sqrt(ss_x) : Infinity;
    const Sb = (ss_x > 0) ? Syx * Math.sqrt(sum_xx / (n * ss_x)) : Infinity;

    return { Syx, Sm, Sb };
}

function getCalibrationRange(data) {
    if (data.length === 0) return { min: 0, max: 0 };
    const x_values = data.map(p => p.x);
    return {
        min: Math.min(...x_values),
        max: Math.max(...x_values)
    };
}

function debounce(func, delay) {
    let timeoutId;

    return function(...args) {
        const context = this;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}
self.debounce = debounce;

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}
self.throttle = throttle;

// --- INÍCIO DA CORREÇÃO (BUGFIX-LOD-LOQ-CALC-01) ---

/**
 * Calcula os valores de Limite de Detecção (LOD) e Limite de Quantificação (LOQ).
 * @param {number} Syx - O erro padrão da regressão.
 * @param {number} m - O coeficiente angular (sensibilidade) da curva linear.
 * @returns {{lod: number|null, loq: number|null}} Um objeto com os valores calculados.
 */
function calculateLOD_LOQ(Syx, m) {
    // Retorna nulo se os parâmetros de entrada forem inválidos para o cálculo.
    if (m === 0 || Syx === 0 || Syx === null) {
        return { lod: null, loq: null };
    }
    // A sensibilidade é o módulo do coeficiente angular.
    const sensitivity = Math.abs(m);
    const lod = (3.3 * Syx) / sensitivity;
    const loq = (10 * Syx) / sensitivity;
    return { lod, loq };
}
// Anexa a função ao escopo global (self) para ser acessível no Web Worker.
self.calculateLOD_LOQ = calculateLOD_LOQ;

// --- FIM DA CORREÇÃO ---

function findMetricByChannelName(channelName) {
    // Retorna nulo se o nome do canal for inválido ou a configuração global não estiver disponível.
    if (!channelName || typeof analyticalEquationsBySystem === 'undefined') {
        return null;
    }

    // Itera sobre todos os sistemas e grupos para encontrar a correspondência.
    for (const systemName in analyticalEquationsBySystem) {
        const subGroups = analyticalEquationsBySystem[systemName];
        for (const groupName in subGroups) {
            const equations = subGroups[groupName];
            // Encontra a equação cujo nome de canal gerado corresponde ao fornecido.
            const metric = equations.find(m => `SA (${systemName} - ${m.text})` === channelName);
            if (metric) {
                return metric;
            }
        }
    }

    // Retorna nulo se nenhuma métrica for encontrada.
    return null;
}
// Anexa a função ao escopo global (self) para ser acessível em toda a aplicação.
self.findMetricByChannelName = findMetricByChannelName;