// /tests/utils.test.js

// O caminho foi atualizado para apontar para a nova pasta 'src/js/'
import * as utils from '../src/js/utils.js';

// --- Micro-framework de teste para organização ---
const testResults = {
    passed: 0,
    failed: 0,
};

function describe(suiteName, fn) {
    console.group(suiteName);
    fn();
    console.groupEnd();
}

function it(testName, fn) {
    try {
        fn();
        console.log(`%c✔ PASSOU: ${testName}`, 'color: #4ade80;');
        testResults.passed++;
    } catch (e) {
        console.error(`%c✖ FALHOU: ${testName}`, 'color: #f87171;');
        console.error(e);
        testResults.failed++;
    }
}

const TOLERANCE = 0.01;

function assertAlmostEqual(actual, expected, message) {
    const isEqual = Math.abs(actual - expected) < TOLERANCE;
    console.assert(isEqual, `Falha: ${message}. Esperado: ${expected}, Recebido: ${actual}`);
    if (!isEqual) throw new Error(message);
}

// --- Início dos Testes ---

describe('Módulo: utils.js', () => {

    describe('Função: linearRegression', () => {
        it('deve calcular corretamente uma regressão linear perfeita', () => {
            const data = [{x: 1, y: 1}, {x: 2, y: 2}, {x: 3, y: 3}];
            const result = utils.linearRegression(data);
            assertAlmostEqual(result.m, 1, 'Coeficiente angular (m)');
            assertAlmostEqual(result.b, 0, 'Intercepto (b)');
            assertAlmostEqual(result.r2, 1, 'Coeficiente de correlação (R²)');
        });

        it('deve calcular corretamente uma regressão com dados não perfeitos', () => {
            const data = [{x: 1, y: 1.1}, {x: 2, y: 1.9}, {x: 3, y: 3.2}, {x: 4, y: 4.0}];
            const result = utils.linearRegression(data);
            // Valores de referência calculados externamente
            assertAlmostEqual(result.m, 0.95, 'Coeficiente angular (m)');
            assertAlmostEqual(result.b, 0.125, 'Intercepto (b)');
            assertAlmostEqual(result.r2, 0.986, 'Coeficiente de correlação (R²)');
        });
    });

    describe('Função: standardDeviation', () => {
        it('deve calcular o desvio padrão corretamente', () => {
            const values = [2, 4, 4, 4, 5, 5, 7, 9];
            // Valor de referência calculado externamente (DP populacional)
            const result = utils.standardDeviation(values);
            assertAlmostEqual(result, 2, 'Desvio Padrão');
        });

        it('deve retornar 0 para um único valor', () => {
            assertAlmostEqual(utils.standardDeviation([5]), 0, 'Desvio Padrão de 1 elemento');
        });
    });

    describe('Funções de Conversão de Cor', () => {
        const red = { r: 255, g: 0, b: 0 };
        const grey = { r: 128, g: 128, b: 128 };
        const blue = { r: 45, g: 85, b: 210 }; // Cor arbitrária

        it('deve converter RGB para HSV corretamente', () => {
            const hsvRed = utils.rgbToHsv(red);
            assertAlmostEqual(hsvRed.h, 0, 'HSV H (Vermelho)');
            assertAlmostEqual(hsvRed.s, 100, 'HSV S (Vermelho)');
            assertAlmostEqual(hsvRed.v, 100, 'HSV V (Vermelho)');

            const hsvGrey = utils.rgbToHsv(grey);
            assertAlmostEqual(hsvGrey.h, 0, 'HSV H (Cinza)');
            assertAlmostEqual(hsvGrey.s, 0, 'HSV S (Cinza)');
            assertAlmostEqual(hsvGrey.v, 50.2, 'HSV V (Cinza)');
        });

        it('deve converter RGB para HSL corretamente', () => {
            const hslRed = utils.rgbToHsl(red);
            assertAlmostEqual(hslRed.h, 0, 'HSL H (Vermelho)');
            assertAlmostEqual(hslRed.s, 100, 'HSL S (Vermelho)');
            assertAlmostEqual(hslRed.l, 50, 'HSL L (Vermelho)');

            const hslGrey = utils.rgbToHsl(grey);
            assertAlmostEqual(hslGrey.h, 0, 'HSL H (Cinza)');
            assertAlmostEqual(hslGrey.s, 0, 'HSL S (Cinza)');
            assertAlmostEqual(hslGrey.l, 50.2, 'HSL L (Cinza)');
        });

        it('deve converter RGB para LAB corretamente', () => {
            // Valores de referência de https://www.easyrgb.com/en/convert.php
            const labRed = utils.rgbToLab(red);
            assertAlmostEqual(labRed.l, 53.24, 'LAB L (Vermelho)');
            assertAlmostEqual(labRed.a, 80.09, 'LAB a (Vermelho)');
            assertAlmostEqual(labRed.b, 67.20, 'LAB b (Vermelho)');

            const labBlue = utils.rgbToLab(blue);
            assertAlmostEqual(labBlue.l, 40.57, 'LAB L (Azul)');
            assertAlmostEqual(labBlue.a, 9.64, 'LAB a (Azul)');
            assertAlmostEqual(labBlue.b, -61.34, 'LAB b (Azul)');
        });

        it('deve converter RGB para YCbCr corretamente', () => {
            const ycbcrRed = utils.rgbToYcbcr(red);
            assertAlmostEqual(ycbcrRed.y, 76.245, 'YCbCr Y (Vermelho)');
            assertAlmostEqual(ycbcrRed.cb, 84.97, 'YCbCr Cb (Vermelho)');
            assertAlmostEqual(ycbcrRed.cr, 255.5, 'YCbCr Cr (Vermelho)');
        });
    });

    describe('Função: ciede2000', () => {
        it('deve calcular a diferença de cor (Delta E 2000) corretamente', () => {
            // Valores de referência do paper original e calculadoras online
            const lab1 = { l: 50, a: 2.6772, b: -79.7751 };
            const lab2 = { l: 50, a: 0.0000, b: -82.7485 };
            const deltaE = utils.ciede2000(lab1, lab2);
            assertAlmostEqual(deltaE, 2.0425, 'Delta E 2000');
        });
    });
});