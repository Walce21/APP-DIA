// js/drawingHandler.js

import * as state from './state.js';
import * as dom from './domElements.js';

// Constantes de estilo (assumindo que serão centralizadas futuramente)
const ROI_STROKE_STYLE = 'rgba(255, 220, 0, 0.9)';
const ROI_SELECTED_STROKE_STYLE = 'rgba(255, 100, 100, 1)';
const ROI_ANALYTICAL_WHITE_STROKE_STYLE = 'rgba(0, 255, 255, 1)';
const ROI_SAMPLE_STROKE_STYLE = 'rgba(130, 255, 130, 1)';
const ROI_LINE_WIDTH = 1.5;
const ROI_HANDLE_FILL_STYLE = 'rgba(255, 100, 100, 0.9)';
const ROI_HANDLE_VISUAL_DIAMETER_SCREEN_PX = 8;


// Os contextos de renderização serão inicializados e mantidos aqui.
let imageCtx = null;
let roiCtx = null;
let magnifierCtx = null;

/**
 * Inicializa os contextos de renderização para os canvases.
 * Deve ser chamada uma vez quando a aplicação é carregada.
 */
export function initializeContexts() {
    if (dom.imageCanvas) imageCtx = dom.imageCanvas.getContext('2d');
    if (dom.roiCanvas) roiCtx = dom.roiCanvas.getContext('2d', { willReadFrequently: true });
    if (dom.magnifierCanvas) magnifierCtx = dom.magnifierCanvas.getContext('2d');

    if (!imageCtx || !roiCtx) {
        console.error('Falha crítica: Não foi possível obter os contextos de renderização do canvas.');
    }
}

/**
 * Desenha a lupa (magnifier) em uma posição específica.
 * @param {{x: number, y: number}} pos - A posição (em coordenadas da imagem) para centrar a lupa.
 * @private
 */
function _drawMagnifier(pos) {
    if (!pos || !magnifierCtx || !state.offscreenCanvas() || !dom.magnifierContainer) {
        return;
    }

    const containerSize = dom.magnifierContainer.clientWidth;
    if (dom.magnifierCanvas.width !== containerSize) {
        dom.magnifierCanvas.width = containerSize;
        dom.magnifierCanvas.height = containerSize;
    }
    if (containerSize === 0) return;

    const MAGNIFIER_SIZE = containerSize;
    const ZOOM_FACTOR = 1.2;
    const offscreenCanvas = state.offscreenCanvas();

    magnifierCtx.fillStyle = 'white';
    magnifierCtx.fillRect(0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE);
    magnifierCtx.save();
    magnifierCtx.scale(ZOOM_FACTOR, ZOOM_FACTOR);

    const viewSize = MAGNIFIER_SIZE / ZOOM_FACTOR;
    const sourceX = pos.x - viewSize / 2;
    const sourceY = pos.y - viewSize / 2;

    magnifierCtx.translate(-sourceX, -sourceY);
    magnifierCtx.drawImage(offscreenCanvas, 0, 0);
    magnifierCtx.restore();
}

/**
 * Ordena os 4 pontos de um retângulo para identificar os cantos (tl, tr, bl, br).
 * @param {Array<{x: number, y: number}>} points - Um array com 4 pontos.
 * @returns {{tl: object, tr: object, bl: object, br: object}|null}
 * @private
 */
function _getSortedGridCorners(points) {
    if (points.length !== 4) return null;

    const sums = points.map(p => p.x + p.y);
    const tl = points[sums.indexOf(Math.min(...sums))];
    const br = points[sums.indexOf(Math.max(...sums))];

    const diffs = points.map(p => p.y - p.x);
    const tr = points[diffs.indexOf(Math.min(...diffs))];
    const bl = points[diffs.indexOf(Math.max(...diffs))];

    return { tl, tr, bl, br };
}

/**
 * Calcula os pontos centrais de uma grade baseada nos seus 4 cantos.
 * @param {Array<{x: number, y: number}>} cornerPointsArray - Os 4 pontos do canto.
 * @param {number} rows - O número de linhas da grade.
 * @param {number} cols - O número de colunas da grade.
 * @returns {Array<{x: number, y: number}>}
 * @private
 */
function _getGridPoints(cornerPointsArray, rows, cols) {
    const sortedCorners = _getSortedGridCorners(cornerPointsArray);
    if (!sortedCorners) return [];

    const { tl, tr, bl, br } = sortedCorners;
    const allPoints = [];

    for (let r = 0; r < rows; r++) {
        const v = (rows > 1) ? (r / (rows - 1)) : 0;
        const p1_x = tl.x + (bl.x - tl.x) * v;
        const p1_y = tl.y + (bl.y - tl.y) * v;
        const p2_x = tr.x + (br.x - tr.x) * v;
        const p2_y = tr.y + (br.y - tr.y) * v;

        for (let c = 0; c < cols; c++) {
            const u = (cols > 1) ? (c / (cols - 1)) : 0;
            const centerX = p1_x + (p2_x - p1_x) * u;
            const centerY = p1_y + (p2_y - p1_y) * u;
            allPoints.push({ x: centerX, y: centerY });
        }
    }
    return allPoints;
}

/**
 * Desenha os helpers visuais para seleção e ajuste da grade de detecção.
 * @param {CanvasRenderingContext2D} ctx - O contexto do canvas.
 * @param {object} transform - O objeto de transformação da visualização.
 */
function drawDetectionHelpers(ctx, transform) {
    const mode = state.appMode();
    if (mode !== 'selectingGridCorners' && mode !== 'adjustingGrid') return;

    const cornerPoints = state.gridCornerPoints();
    const draggedIndex = state.draggedCornerIndex();

    ctx.save();
    ctx.setLineDash([6, 3]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1 / transform.scale;

    if (cornerPoints.length === 4) {
        const sortedCorners = _getSortedGridCorners(cornerPoints);
        if (sortedCorners) {
            const { tl, tr, bl, br } = sortedCorners;
            ctx.beginPath();
            ctx.moveTo(tl.x, tl.y); ctx.lineTo(tr.x, tr.y);
            ctx.lineTo(br.x, br.y); ctx.lineTo(bl.x, bl.y);
            ctx.closePath();
            ctx.stroke();

            const dims = state.lastGridDims();
            const allGridPoints = _getGridPoints(cornerPoints, dims.rows, dims.cols);
            const avgWidth = ((tr.x - tl.x) + (br.x - bl.x)) / 2;
            const avgHeight = ((bl.y - tl.y) + (br.y - tr.y)) / 2;
            const previewRadius = Math.min(avgWidth / (dims.cols - 1), avgHeight / (dims.rows - 1)) / 5.0;

            ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
            allGridPoints.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, previewRadius, 0, 2 * Math.PI);
                ctx.fill();
            });
        }
    } else if (mode === 'selectingGridCorners' && cornerPoints.length > 0) {
        const lastPoint = cornerPoints[cornerPoints.length - 1];
        const mousePos = state.currentMousePos();
        if (mousePos) {
            ctx.beginPath();
            ctx.moveTo(lastPoint.x, lastPoint.y);
            ctx.lineTo(mousePos.x, mousePos.y);
            ctx.stroke();
        }
    }

    ctx.setLineDash([]);
    const baseRadius = 5 / transform.scale;
    const pulseFactor = 1 + Math.sin(Date.now() / 200) * 0.2;

    cornerPoints.forEach((p, index) => {
        const radius = baseRadius * (draggedIndex === index ? 1.8 : 1) * pulseFactor;
        ctx.fillStyle = (draggedIndex === index) ? 'rgba(255, 100, 100, 1)' : 'rgba(255, 255, 0, 0.9)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1 / transform.scale;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    });

    ctx.restore();
}

/**
 * Desenha as alças de redimensionamento para uma ROI específica.
 * @param {object} roi - A ROI para a qual as alças serão desenhadas.
 */
function drawResizeHandles(roi) {
    if (!roiCtx || roi.isSizeLocked) return;

    const visualDiameter = Math.max(ROI_HANDLE_VISUAL_DIAMETER_SCREEN_PX / state.viewTransform().scale, 6);
    roiCtx.fillStyle = ROI_HANDLE_FILL_STYLE;

    const getRectHandles = (r) => [
        { x: r.x, y: r.y, type: "nw" }, { x: r.x + r.width / 2, y: r.y, type: "n" },
        { x: r.x + r.width, y: r.y, type: "ne" }, { x: r.x + r.width, y: r.y + r.height / 2, type: "e" },
        { x: r.x + r.width, y: r.y + r.height, type: "se" }, { x: r.x + r.width / 2, y: r.y + r.height, type: "s" },
        { x: r.x, y: r.y + r.height, type: "sw" }, { x: r.x, y: r.y + r.height / 2, type: "w" }
    ];
    const getCircleHandles = (r) => [
        { x: r.x + r.radius, y: r.y, type: "n_radius" }, { x: r.x + 2 * r.radius, y: r.y + r.radius, type: "e_radius" },
        { x: r.x + r.radius, y: r.y + 2 * r.radius, type: "s_radius" }, { x: r.x, y: r.y + r.radius, type: "w_radius" }
    ];

    const handles = roi.type === 'rect' ? getRectHandles(roi) : getCircleHandles(roi);
    handles.forEach(handle => {
        if (roi.type === 'rect') {
            roiCtx.fillRect(handle.x - visualDiameter / 2, handle.y - visualDiameter / 2, visualDiameter, visualDiameter);
        } else {
            roiCtx.beginPath();
            roiCtx.arc(handle.x, handle.y, visualDiameter / 2, 0, 2 * Math.PI);
            roiCtx.fill();
        }
    });
}

/**
  * Função principal de desenho. Limpa e redesenha toda a cena nos canvases.
 * Esta função apenas lê o estado atual e o renderiza.
 * @param {object} interactionParams - Parâmetros do estado de interação atual.
 * @param {boolean} interactionParams.isSelectingWithMarquee - Se o usuário está desenhando um retângulo de seleção.
 * @param {object} interactionParams.marqueeRect - As dimensões do retângulo de seleção.
 */
export function draw(interactionParams = {}) {
    const { isSelectingWithMarquee = false, marqueeRect = {} } = interactionParams;

    if (!imageCtx || !roiCtx) {
        console.error('Tentativa de desenhar, mas os contextos do canvas não estão inicializados.');
        return;
    }

    const currentOffscreenCanvas = state.offscreenCanvas();
    const transform = state.viewTransform();

    // 1. Limpeza e Desenho do Fundo
    if (!currentOffscreenCanvas) {
        imageCtx.fillStyle = "#f0f0f0";
        imageCtx.fillRect(0, 0, dom.imageCanvas.width, dom.imageCanvas.height);
        roiCtx.clearRect(0, 0, dom.roiCanvas.width, dom.roiCanvas.height);
        return;
    }

    imageCtx.fillStyle = state.isFocusMode() ? "#111827" : "#f0f0f0";
    imageCtx.fillRect(0, 0, dom.imageCanvas.width, dom.imageCanvas.height);
    roiCtx.clearRect(0, 0, dom.roiCanvas.width, dom.roiCanvas.height);

    // 2. Desenho da Imagem Principal com Pan e Zoom
    imageCtx.save();
    imageCtx.translate(transform.offsetX, transform.offsetY);
    imageCtx.scale(transform.scale, transform.scale);
    imageCtx.drawImage(currentOffscreenCanvas, 0, 0);
    imageCtx.restore();

    // 3. Desenho do Retângulo de Seleção (Marquee)
    if (isSelectingWithMarquee) {
        roiCtx.save();
        roiCtx.fillStyle = 'rgba(0, 100, 255, 0.2)';
        roiCtx.strokeStyle = 'rgba(0, 100, 255, 0.7)';
        roiCtx.lineWidth = 1;
        roiCtx.fillRect(marqueeRect.x, marqueeRect.y, marqueeRect.width, marqueeRect.height);
        roiCtx.strokeRect(marqueeRect.x, marqueeRect.y, marqueeRect.width, marqueeRect.height);
        roiCtx.restore();
    }

    // 4. Desenho das ROIs e Helpers (com transformação aplicada)
    roiCtx.save();
    roiCtx.translate(transform.offsetX, transform.offsetY);
    roiCtx.scale(transform.scale, transform.scale);

    drawDetectionHelpers(roiCtx, transform);

    const selectionSet = state.selectionSet();
    const sampleRois = state.rois().filter(r => r.isSample).sort((a, b) => a.id - b.id);

    state.rois().forEach((roi) => {
        roiCtx.save();
        let strokeStyle = 'rgba(255, 220, 0, 0.9)'; // ROI_STROKE_STYLE
        let lineWidth = 1.5 / transform.scale; // ROI_LINE_WIDTH

        if (roi.id === state.analyticalWhiteRoiId()) strokeStyle = 'rgba(0, 255, 255, 1)'; // ROI_ANALYTICAL_WHITE_STROKE_STYLE
        if (roi.isSample) strokeStyle = 'rgba(130, 255, 130, 1)'; // ROI_SAMPLE_STROKE_STYLE

        const isSelected = selectionSet.has(roi.id);
        if (isSelected) {
            strokeStyle = 'rgba(255, 100, 100, 1)'; // ROI_SELECTED_STROKE_STYLE
            lineWidth = (1.5 + 1.5) / transform.scale;
        }

        roiCtx.fillStyle = 'rgba(0,0,0,0.001)';
        roiCtx.strokeStyle = strokeStyle;
        roiCtx.lineWidth = lineWidth;

        // Lógica de estilo para modos específicos
        const isSequencingMode = state.appMode() === 'sequencingRois';
        let isSelectedInSequence = false;
        let sequenceIndex = -1;

        if (isSequencingMode) {
            const sequencedIds = state.sequencedRois();
            sequenceIndex = sequencedIds.indexOf(roi.id);
            isSelectedInSequence = sequenceIndex !== -1;
            const isEligible = !roi.isSample && roi.id !== state.analyticalWhiteRoiId();
            if (isEligible) {
                roiCtx.fillStyle = isSelectedInSequence ? 'rgba(22, 163, 74, 0.4)' : 'rgba(59, 130, 246, 0.25)';
            } else {
                roiCtx.globalAlpha = 0.3;
            }
        } else if (state.isMultiSelectMode()) {
            roiCtx.globalAlpha = isSelected ? 1.0 : 0.5;
            roiCtx.fillStyle = isSelected ? 'rgba(0, 123, 255, 0.2)' : 'rgba(100, 120, 140, 0.1)';
        }

        // Desenho da forma da ROI
        if (roi.type === 'rect') {
            roiCtx.fillRect(roi.x, roi.y, roi.width, roi.height);
            roiCtx.strokeRect(roi.x, roi.y, roi.width, roi.height);
        } else if (roi.type === 'circle') {
            roiCtx.beginPath();
            roiCtx.arc(roi.x + roi.radius, roi.y + roi.radius, roi.radius, 0, 2 * Math.PI);
            roiCtx.fill();
            roiCtx.stroke();
        }

        // Desenho de textos e números
        if (isSelectedInSequence) {
            const sequenceNumber = sequenceIndex + 1;
            const centerX = roi.type === 'rect' ? roi.x + roi.width / 2 : roi.x + roi.radius;
            const centerY = roi.type === 'rect' ? roi.y + roi.height / 2 : roi.y + roi.radius;
            const roiSize = roi.type === 'rect' ? Math.min(roi.width, roi.height) : roi.radius * 2;
            const fontSize = Math.max(12 / transform.scale, roiSize * 0.6);
            
            roiCtx.globalAlpha = 1.0;
            roiCtx.font = `bold ${fontSize}px Arial`;
            roiCtx.textAlign = 'center';
            roiCtx.textBaseline = 'middle';
            roiCtx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            roiCtx.lineWidth = fontSize / 12;
            roiCtx.strokeText(sequenceNumber, centerX, centerY);
            roiCtx.fillStyle = 'white';
            roiCtx.fillText(sequenceNumber, centerX, centerY);
        } else {
            let labelText = roi.customName || roi.name;
            if (roi.id === state.analyticalWhiteRoiId()) {
                labelText = `⭐ BRANCO`;
            } else if (roi.isSample) {
                const sampleIndex = sampleRois.findIndex(r => r.id === roi.id);
                labelText = `🧪 Amostra ${sampleIndex !== -1 ? sampleIndex + 1 : ''}`;
                if (roi.customName) labelText += ` (${roi.customName})`;
            }

            if (labelText) {
                const fontSize = Math.max(8, 12 / transform.scale);
                roiCtx.font = `bold ${fontSize}px Arial`;
                roiCtx.fillStyle = strokeStyle;
                roiCtx.textAlign = 'center';
                roiCtx.textBaseline = 'bottom';
                roiCtx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                roiCtx.shadowBlur = 2 / transform.scale;
                roiCtx.shadowOffsetX = 1 / transform.scale;
                roiCtx.shadowOffsetY = 1 / transform.scale;
                const centerX = roi.type === 'rect' ? roi.x + roi.width / 2 : roi.x + roi.radius;
                const textY = roi.y - (fontSize * 0.3);
                roiCtx.fillText(labelText, centerX, textY);
            }
        }

        // Desenho das alças de redimensionamento
        if (selectionSet.size === 1 && isSelected && roi.id === state.editingRoiId()) {
            drawResizeHandles(roi);
        }
        roiCtx.restore();
    });

    // 5. Desenho da ROI em processo de criação
    const currentDrawingRoi = state.currentRoi();
    if (state.isDrawing() && currentDrawingRoi) {
        roiCtx.strokeStyle = 'rgba(255, 100, 100, 1)'; // ROI_SELECTED_STROKE_STYLE;
        roiCtx.lineWidth = 1.5 / transform.scale; // ROI_LINE_WIDTH
        if (currentDrawingRoi.type === 'rect') {
            roiCtx.strokeRect(currentDrawingRoi.x, currentDrawingRoi.y, currentDrawingRoi.width, currentDrawingRoi.height);
        } else if (currentDrawingRoi.type === 'circle') {
            roiCtx.beginPath();
            roiCtx.arc(currentDrawingRoi.x + currentDrawingRoi.radius, currentDrawingRoi.y + currentDrawingRoi.radius, currentDrawingRoi.radius, 0, 2 * Math.PI);
            roiCtx.stroke();
        }
    }
    roiCtx.restore(); // Restaura o estado original do roiCtx

    // 6. Desenho da Lupa (Magnifier)
    if (dom.magnifierContainer) {
        const isVisible = state.showMagnifier() && state.isMagnifierEnabled();
        dom.magnifierContainer.classList.toggle('hidden', !isVisible);
    }
    if (state.showMagnifier() && state.isMagnifierEnabled()) {
        _drawMagnifier(state.currentMousePos());
    }
}