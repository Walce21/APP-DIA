// src/js/viewHandler.js

import * as state from './state.js';
import * as dom from './domElements.js';

// Estado interno do módulo para controle do gesto de pinça
let lastTouchDistance = null;
let lastTouchCenter = null;

/**
 * Calcula a posição do mouse em relação à imagem, considerando a transformação de visualização.
 * @param {MouseEvent|TouchEvent} rawEvent - O evento bruto do DOM.
 * @returns {{x: number, y: number, dX: number, dY: number, clientX: number, clientY: number}|null} Posição do mouse.
 */
// ✨ ALTERAÇÃO: Adicionada a palavra 'export' para tornar a função pública.
export function getMousePos(rawEvent) {
    let evt = rawEvent;
    if (rawEvent.touches && rawEvent.touches.length > 0) {
        evt = rawEvent.touches[0];
    } else if (rawEvent.changedTouches && rawEvent.changedTouches.length > 0) {
        evt = rawEvent.changedTouches[0];
    }

    if (!dom.roiCanvas || typeof evt.clientX === 'undefined') return null;

    const rect = dom.roiCanvas.getBoundingClientRect();
    const screenX = evt.clientX - rect.left;
    const screenY = evt.clientY - rect.top;

    const transform = state.viewTransform();
    const imageX = (screenX - transform.offsetX) / transform.scale;
    const imageY = (screenY - transform.offsetY) / transform.scale;

    return { x: imageX, y: imageY, dX: screenX, dY: screenY, clientX: evt.clientX, clientY: evt.clientY };
}

/**
 * Lida com o evento de zoom da roda do mouse.
 * @param {WheelEvent} e - O evento de wheel.
 */
export function handleWheel(e) {
    if (state.isViewLocked() || !state.hasImage()) return;
    e.preventDefault();

    const pos = getMousePos(e);
    if (!pos) return;

    const transform = state.viewTransform();
    const oldScale = transform.scale;
    const zoomIntensity = 0.1;

    const newScale = e.deltaY < 0 ? oldScale * (1 + zoomIntensity) : oldScale / (1 + zoomIntensity);
    const finalScale = Math.max(0.05, Math.min(newScale, 20));

    // Calcula o novo offset para que o zoom seja centrado no cursor do mouse
    const offsetX = pos.dX - (pos.dX - transform.offsetX) * (finalScale / oldScale);
    const offsetY = pos.dY - (pos.dY - transform.offsetY) * (finalScale / oldScale);

    state.setViewTransform({ scale: finalScale, offsetX, offsetY });
}

/**
 * Lida com o gesto de "pinça" para zoom em telas de toque.
 * @param {TouchEvent} e - O evento de touch.
 */
export function handlePinch(e) {
    if (state.isViewLocked() || e.touches.length !== 2) return;
    e.preventDefault();

    const getTouchCenter = (t1, t2) => {
        const rect = dom.roiCanvas.getBoundingClientRect();
        return {
            x: (t1.clientX + t2.clientX) / 2 - rect.left,
            y: (t1.clientY + t2.clientY) / 2 - rect.top
        };
    };
    const getTouchDistance = (t1, t2) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

    const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
    const currentCenter = getTouchCenter(e.touches[0], e.touches[1]);

    if (lastTouchDistance === null) {
        lastTouchDistance = currentDistance;
        lastTouchCenter = currentCenter;
        return;
    }

    const transform = state.viewTransform();
    const scaleFactor = currentDistance / lastTouchDistance;
    const newScale = Math.max(0.05, Math.min(transform.scale * scaleFactor, 20));

    const newOffsetX = currentCenter.x - (currentCenter.x - transform.offsetX) * (newScale / transform.scale);
    const newOffsetY = currentCenter.y - (currentCenter.y - transform.offsetY) * (newScale / transform.scale);

    state.setViewTransform({ scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY });

    lastTouchDistance = currentDistance;
    lastTouchCenter = currentCenter;
}

/**
 * Reseta o estado do controle de pinça.
 */
export function resetPinchState() {
    lastTouchDistance = null;
    lastTouchCenter = null;
}

/**
 * Recalcula a transformação da imagem para que ela se ajuste perfeitamente ao contêiner.
 */
export function fitImageToContainer() {
    const currentOffscreenCanvas = state.offscreenCanvas();
    const currentTransform = state.viewTransform();
    if (!currentOffscreenCanvas || !dom.canvasContainer) return;

    const containerWidth = dom.canvasContainer.clientWidth;
    const containerHeight = dom.canvasContainer.clientHeight;

    const shouldRecalculateView = !currentTransform.initialSetupDone || state.forceViewRecalculationOnFocusModeToggle();
    if (shouldRecalculateView) {
        const imageRatio = currentOffscreenCanvas.width / currentOffscreenCanvas.height;
        const canvasRatio = containerWidth / containerHeight;

        const scale = (imageRatio > canvasRatio)
            ? (containerWidth / currentOffscreenCanvas.width)
            : (containerHeight / currentOffscreenCanvas.height);

        const offsetX = (containerWidth - currentOffscreenCanvas.width * scale) / 2;
        const offsetY = (containerHeight - currentOffscreenCanvas.height * scale) / 2;

        state.setViewTransform({ scale, offsetX, offsetY, initialSetupDone: true });
        state.setForceViewRecalculationOnFocusModeToggle(false);
    }
}

/**
 * Reseta a visualização (zoom e pan) para o estado inicial.
 */
export function resetView() {
    // Invalida o setup inicial para forçar o recálculo em `fitImageToContainer`
    state.setViewTransform({ initialSetupDone: false });
    
    // A notificação de mudança de estado do 'setViewTransform' irá acionar a UI
    // para redesenhar com a nova visualização através do uiManager.
}