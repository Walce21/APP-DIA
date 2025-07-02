// src/js/roiInteractionHandler.js

import * as state from './state.js';
import * as uiManager from './uiManager.js';
import * as roiManager from './roiManager.js';
import * as dom from './domElements.js';
import * as autoRoiDetector from './autoRoiDetector.js';
import * as sequenceManager from './sequenceManager.js';
import * as drawingHandler from './drawingHandler.js';
import * as viewHandler from './viewHandler.js';
import * as actions from './stateActions.js';

// --- Constantes e Estado de Interação do Módulo ---
const LONG_PRESS_DURATION = 400; // ms
const ROI_HANDLE_TOUCH_RADIUS_SCREEN_PX = 10;
const PAN_THROTTLE_LIMIT = 16; // ms, para limitar as atualizações a ~60fps

let longPressTimer = null;
let interactionState = {
    isPanningWithSpace: false,
    startTime: 0,
    startPos: null,
    clickedRoiOnStart: null,
};
let isSelectingWithMarquee = false;
let marqueeRect = { x: 0, y: 0, width: 0, height: 0 };
let isEndingInteraction = false; // Flag de guarda para a condição de corrida

const updatePanStateThrottled = throttle((pos) => {
    if (!state.isPanning() && !interactionState.isPanningWithSpace) return;
    
    const transform = state.viewTransform();
    const lastPanPos = state.lastPanPosition();

    const newOffsetX = transform.offsetX + (pos.clientX - lastPanPos.x);
    const newOffsetY = transform.offsetY + (pos.clientY - lastPanPos.y);

    state.updatePan(newOffsetX, newOffsetY, { x: pos.clientX, y: pos.clientY });

}, PAN_THROTTLE_LIMIT);


// --- Funções Auxiliares de Interação ---

function getRoiAtPos(x, y) {
    const rois = state.rois();
    for (let i = rois.length - 1; i >= 0; i--) {
        if (roiManager.isPointInRoi(x, y, rois[i])) return rois[i];
    }
    return null;
}

function getHandleAtPos(roi, imageX, imageY) {
    if (!roi || roi.isSizeLocked || state.isMultiSelectMode()) return null;
    const detectionRadius = ROI_HANDLE_TOUCH_RADIUS_SCREEN_PX / state.viewTransform().scale;
    const getRectHandles = (r) => [{ x: r.x, y: r.y, type: "nw" },{ x: r.x + r.width / 2, y: r.y, type: "n" },{ x: r.x + r.width, y: r.y, type: "ne" },{ x: r.x + r.width, y: r.y + r.height / 2, type: "e" },{ x: r.x + r.width, y: r.y + r.height, type: "se" },{ x: r.x + r.width / 2, y: r.y + r.height, type: "s" },{ x: r.x, y: r.y + r.height, type: "sw" },{ x: r.x, y: r.y + r.height / 2, type: "w" }];
    const getCircleHandles = (r) => [{ x: r.x + r.radius, y: r.y, type: "n_radius" },{ x: r.x + 2 * r.radius, y: r.y + r.radius, type: "e_radius" },{ x: r.x + r.radius, y: r.y + 2 * r.radius, type: "s_radius" },{ x: r.x, y: r.y + r.radius, type: "w_radius" }];
    const handles = roi.type === 'rect' ? getRectHandles(roi) : getCircleHandles(roi);
    for (const h of handles) if (Math.hypot(imageX - h.x, imageY - h.y) < detectionRadius) return h;
    return null;
}

function getClickedCornerIndex(pos) {
    if (!pos) return -1;
    const points = state.gridCornerPoints();
    const detectionRadius = 15 / state.viewTransform().scale;
    for (let i = 0; i < points.length; i++) {
        if (Math.hypot(pos.x - points[i].x, pos.y - points[i].y) < detectionRadius) {
            return i;
        }
    }
    return -1;
}

function selectRoisInRect(rect, isAdditive) {
    const screenRect = { x: Math.min(rect.x, rect.x + rect.width), y: Math.min(rect.y, rect.y + rect.height), width: Math.abs(rect.width), height: Math.abs(rect.height) };
    if (!isAdditive) actions.clearRoiSelection();
    const transform = state.viewTransform();
    state.rois().forEach(roi => {
        const roiCenterX = (roi.type === 'rect' ? roi.x + roi.width / 2 : roi.x + roi.radius) * transform.scale + transform.offsetX;
        const roiCenterY = (roi.type === 'rect' ? roi.y + roi.height / 2 : roi.y + roi.radius) * transform.scale + transform.offsetY;
        if (roiCenterX >= screenRect.x && roiCenterX <= screenRect.x + screenRect.width &&
            roiCenterY >= screenRect.y && roiCenterY <= screenRect.y + screenRect.height) {
            
            // --- INÍCIO DA ALTERAÇÃO ---
            // Corrigido para chamar a função correta que existe em stateActions.js
            actions.toggleRoiInSelection(roi.id);
            // --- FIM DA ALTERAÇÃO ---
        }
    });
}

// --- Handlers Principais de Interação ---

export function handleInteractionStart(e) {
    // A guarda geral foi removida daqui para permitir o início de interações de ROI mesmo com a vista travada.
    isSelectingWithMarquee = false;

    if (state.contextMenu().visible) actions.hideContextMenu();
    const pos = viewHandler.getMousePos(e);
    if (!pos) return;

    interactionState = {
        isPanningWithSpace: interactionState.isPanningWithSpace,
        startTime: Date.now(),
        startPos: pos,
        clickedRoiOnStart: getRoiAtPos(pos.x, pos.y),
    };

    const currentTool = state.currentTool();
    const isDrawingToolActive = currentTool === 'rect' || currentTool === 'circle';
    
    if (state.isMagnifierEnabled() && (isDrawingToolActive || interactionState.clickedRoiOnStart)) {
        state.setShowMagnifier(true);
    }

    if (state.appMode() === 'adjustingGrid') {
        const cornerIndex = getClickedCornerIndex(pos);
        if (cornerIndex !== -1) state.setDraggedCornerIndex(cornerIndex);
        return;
    }

    if (isDrawingToolActive) {
        state.setDrawingState(true, pos, { type: currentTool, x: pos.x, y: pos.y, width: 0, height: 0, radius: 0 });
    } else { // Ponteiro
        longPressTimer = setTimeout(() => handleLongPress(pos), LONG_PRESS_DURATION);
    }
}

function determineInteractionMode(moveDistance, startPos, clickedRoiOnStart) {
    if (moveDistance < 5) return;
    
    clearTimeout(longPressTimer);
    longPressTimer = null;

    if (clickedRoiOnStart) {
        const handle = (clickedRoiOnStart.id === state.editingRoiId()) ? getHandleAtPos(clickedRoiOnStart, startPos.x, startPos.y) : null;
        if (handle) {
            state.setResizingRoiState(true, handle.type, startPos);
        } else {
            if (!state.selectionSet().has(clickedRoiOnStart.id)) {
                actions.selectSingleRoi(clickedRoiOnStart.id);
            }
            const initialRoiPositions = Array.from(state.selectionSet()).map(id => {
                const r = state.rois().find(roi => roi.id === id);
                return r ? { id: r.id, x: r.x, y: r.y } : null;
            }).filter(Boolean);
            state.setIsDraggingRoi(true);
            state.setDragInitialState({ mousePos: startPos, roiPositions: initialRoiPositions });
        }
    } else { 
        if (state.isViewLocked()) return;
        state.setPanningState(true, { x: startPos.clientX, y: startPos.clientY });
    }
}

export function handleInteractionMove(e) {
    const pos = viewHandler.getMousePos(e);
    if (!pos) return;
    state.setCurrentMousePos(pos);

    if (state.appMode() === 'selectingGridCorners') {
        drawingHandler.draw();
    }

    const isInteracting = state.isDrawing() || state.isDraggingRoi() || state.isResizingRoi() || state.isPanning();
    if (state.isViewLocked() && !isInteracting) return;

    if (state.draggedCornerIndex() !== -1) {
        state.updateGridCornerPoint(state.draggedCornerIndex(), pos);
        return;
    }
    
    if (!isInteracting && interactionState.startPos) {
        const moveDistance = Math.hypot(pos.dX - interactionState.startPos.dX, pos.dY - interactionState.startPos.dY);
        determineInteractionMode(moveDistance, interactionState.startPos, interactionState.clickedRoiOnStart);
    }

    if (isSelectingWithMarquee) {
        marqueeRect.width = pos.dX - marqueeRect.x;
        marqueeRect.height = pos.dY - marqueeRect.y;
        drawingHandler.draw({ isSelectingWithMarquee, marqueeRect });
    } else if (state.isDrawing()) {
        roiManager.throttledUpdateDrawingRoi(pos.x, pos.y);
    } else if (state.isResizingRoi()) {
        roiManager.resizeSelectedRoi(pos.x, pos.y);
    } else if (state.isDraggingRoi()) {
        roiManager.dragSelectedRois(pos.x, pos.y);
    } else if (state.isPanning() || interactionState.isPanningWithSpace) {
        updatePanStateThrottled(pos);
    }
}

export function handleInteractionEnd(e) {
    if (isEndingInteraction) return;
    isEndingInteraction = true;

    const wasInteracting = state.isDrawing() || state.isDraggingRoi() || state.isResizingRoi() || state.isPanning() || isSelectingWithMarquee;
    const isMeaningfulEvent = wasInteracting || interactionState.clickedRoiOnStart || state.appMode() !== 'idle';

    if (!isMeaningfulEvent) {
        log('roiInteractionHandler', 'perf-skip', `Evento '${e.type}' ignorado por falta de interação significativa.`);
        clearTimeout(longPressTimer);
        longPressTimer = null;
        interactionState = {};
        isEndingInteraction = false; 
        return;
    }
    
    const wasTap = !wasInteracting && (Date.now() - interactionState.startTime < LONG_PRESS_DURATION);
    clearTimeout(longPressTimer);
    longPressTimer = null;

    if (state.draggedCornerIndex() !== -1) {
        state.setDraggedCornerIndex(-1);
    }

    if (wasTap) {
        const { clickedRoiOnStart } = interactionState;
        const endPos = viewHandler.getMousePos(e);

        if (state.appMode() === 'selectingGridCorners' && endPos) {
            autoRoiDetector.addGridCornerPoint(endPos);
        } else if (state.appMode() === 'sequencingRois') {
            if (clickedRoiOnStart) sequenceManager.handleRoiSelection(clickedRoiOnStart.id);
        } else if (state.isMultiSelectMode()) {
            if (clickedRoiOnStart) actions.toggleRoiInSelection(clickedRoiOnStart.id);
        } else { // Modo de ponteiro padrão
            if (clickedRoiOnStart) {
                const isSelected = state.selectionSet().has(clickedRoiOnStart.id);
                if (isSelected && state.selectionSet().size === 1) {
                    state.setEditingRoiId(state.editingRoiId() === clickedRoiOnStart.id ? null : (clickedRoiOnStart.isSizeLocked ? null : clickedRoiOnStart.id));
                } else {
                    actions.selectSingleRoi(clickedRoiOnStart.id);
                }
                if (e.pointerType !== 'touch' && endPos) {
                    state.showContextMenu(clickedRoiOnStart.id, endPos.clientX, endPos.clientY);
                }
            } else {
                actions.clearRoiSelection();
            }
        }
    } else { 
        if (isSelectingWithMarquee) {
            selectRoisInRect(marqueeRect, state.isMultiSelectMode());
        } else if (state.isDrawing()) {
            if (state.currentRoi() && (state.currentRoi().width > 2 || state.currentRoi().radius > 1)) {
                actions.addNewRoi(state.currentRoi());
            }
        } else if (state.isResizingRoi() || state.isDraggingRoi()) {
            actions.recalculateSelectedRoisData();
        }
    }

    isSelectingWithMarquee = false;
    state.setShowMagnifier(false);
    state.resetInteractionState();
    interactionState = {};
    
    setTimeout(() => { isEndingInteraction = false; }, 50);
}

function handleLongPress(pos) {
    if (navigator.vibrate) navigator.vibrate(50);
    const { clickedRoiOnStart } = interactionState;

    if (clickedRoiOnStart && state.currentTool() === 'pointer') {
        state.setMultiSelectMode(true);
        state.setEditingRoiId(null);
        if (!state.selectionSet().has(clickedRoiOnStart.id)) {
            // --- INÍCIO DA ALTERAÇÃO ---
            // Corrigido para chamar a função correta que existe em stateActions.js
            actions.toggleRoiInSelection(clickedRoiOnStart.id);
            // --- FIM DA ALTERAÇÃO ---
        }
    } else if (!clickedRoiOnStart && state.currentTool() === 'pointer') {
        isSelectingWithMarquee = true;
        marqueeRect = { x: pos.dX, y: pos.dY, width: 0, height: 0 };
    }
    longPressTimer = null;
}

export function handleKeyUp(e) {
    if (e.key === " ") {
        interactionState.isPanningWithSpace = false;
        if (state.currentTool() === 'pointer' && dom.roiCanvas) dom.roiCanvas.style.cursor = 'grab';
    }
}

export function handleKeyDown(e) {
    if (typeof e.key !== 'string') return;
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

    if (e.key === " " && !interactionState.isPanningWithSpace) {
        if (state.isViewLocked()) return;
        interactionState.isPanningWithSpace = true;
        if(dom.roiCanvas) dom.roiCanvas.style.cursor = 'grabbing';
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectionSet().size > 0) actions.deleteSelectedRois();
    }
    if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        actions.toggleMagnifierEnabled();
    }
}