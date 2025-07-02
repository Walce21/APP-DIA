// src/js/canvasManager.js

import * as state from './state.js';
import * as dom from './domElements.js';
import * as roiManager from './roiManager.js';
import * as drawingHandler from './drawingHandler.js';
import * as viewHandler from './viewHandler.js';
import * as roiInteractionHandler from './roiInteractionHandler.js';

let canvasResizeObserver = null;

/**
 * Redimensiona os elementos canvas e solicita que a imagem seja ajustada ao novo tamanho.
 */
export function resizeCanvasToContainer() {
    if (!dom.canvasContainer || !dom.imageCanvas || !dom.roiCanvas) return;
    const { clientWidth: w, clientHeight: h } = dom.canvasContainer;
    if (w === 0 || h === 0) return;

    if (dom.imageCanvas.width !== w || dom.imageCanvas.height !== h) {
        [dom.imageCanvas, dom.roiCanvas].forEach(canvas => {
            canvas.width = w;
            canvas.height = h;
        });
    }
    
    viewHandler.fitImageToContainer();
    
    // --- INÍCIO DA CORREÇÃO ---
    // Garante que o canvas seja redesenhado imediatamente após o redimensionamento,
    // evitando que a tela fique em branco.
    drawingHandler.draw();
    // --- FIM DA CORREÇÃO ---
}

/**
 * Gira a imagem e as ROIs em 90 graus.
 */
export function rotateImage90() {
    const offscreenCanvas = state.offscreenCanvas();
    if (!offscreenCanvas) return;

    roiManager.rotateRois90(offscreenCanvas.height);

    const { width: w, height: h } = offscreenCanvas;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = h;
    tempCanvas.height = w;
    tempCtx.translate(h / 2, w / 2);
    tempCtx.rotate(Math.PI / 2);
    tempCtx.drawImage(offscreenCanvas, -w / 2, -h / 2);

    state.setOffscreenCanvas(tempCanvas);
    roiManager.recalculateAllRoiData();
}

/**
 * Delega a redefinição da visualização para o viewHandler.
 */
export function resetView() {
    viewHandler.resetView();
    resizeCanvasToContainer();
}

/**
 * Despacha o evento de movimento do toque para o handler apropriado.
 * @param {TouchEvent} e
 */
function handleTouchMove(e) {
    if (e.touches?.cancelable) e.preventDefault();
    
    if (e.touches.length === 1) {
        roiInteractionHandler.handleInteractionMove(e);
    } else if (e.touches.length === 2) {
        viewHandler.handlePinch(e);
    }
}

/**
 * Finaliza uma interação de toque, notificando os handlers apropriados.
 * @param {TouchEvent} e
 */
function handleTouchEnd(e) {
    viewHandler.resetPinchState();
    roiInteractionHandler.handleInteractionEnd(e);
    
    if (e.touches.length === 1) { // Prepara para um novo possível arraste com o dedo restante
        state.resetInteractionState();
        const pos = viewHandler.getMousePos(e.touches[0]);
        if (pos) {
            state.setPanningState(true, { x: pos.clientX, y: pos.clientY });
        }
    }
}

/**
 * Inicializa o orquestrador do canvas, definindo os contextos e vinculando todos os eventos do DOM aos seus handlers.
 */
export function initializeCanvas() {
    log('canvasManager', 'info', '>>> ORQUESTRADOR DE CANVAS INICIADO <<<');
    
    drawingHandler.initializeContexts();

    if (dom.roiCanvas) {
        // --- Eventos de Interação com ROI e Pan/Arrastar ---
        dom.roiCanvas.addEventListener('mousedown', roiInteractionHandler.handleInteractionStart);
        dom.roiCanvas.addEventListener('mousemove', roiInteractionHandler.handleInteractionMove);
        window.addEventListener('mouseup', roiInteractionHandler.handleInteractionEnd);
        
        // --- Eventos de Toque (com despacho para o handler correto) ---
        dom.roiCanvas.addEventListener('touchstart', roiInteractionHandler.handleInteractionStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);

        // --- Evento de Zoom (Visualização) ---
        dom.roiCanvas.addEventListener('wheel', viewHandler.handleWheel, { passive: false });
        
        // --- Eventos de Teclado ---
        window.addEventListener('keydown', roiInteractionHandler.handleKeyDown);
        window.addEventListener('keyup', roiInteractionHandler.handleKeyUp);
        
        // --- Eventos do Canvas/Janela ---
        dom.roiCanvas.addEventListener('mouseleave', roiInteractionHandler.handleInteractionEnd);
        if (!canvasResizeObserver) {
            canvasResizeObserver = new ResizeObserver(resizeCanvasToContainer);
            canvasResizeObserver.observe(dom.canvasContainer);
        }
    }
    log('canvasManager', 'success', '>>> ORQUESTRADOR DE CANVAS PRONTO <<<');
}