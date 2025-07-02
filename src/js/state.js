// js/state.js

const appState = {
    originalImage: { src: null, fileName: '' },
    offscreenCanvas: null,
    viewTransform: { scale: 1, offsetX: 0, offsetY: 0, initialSetupDone: false },
    currentTool: 'pointer',
    isDrawing: false,
    isPanning: false,
    isDraggingRoi: false,
    isResizingRoi: false,
    drawingStartPos: { x: 0, y: 0 },
    lastPanPosition: { x: 0, y: 0 },
    resizeHandle: null,
    dragInitialState: null,
    currentRoi: null,
    rois: [],
    selectionSet: new Set(),
    editingRoiId: null,
    nextRoiId: 1,
    nextCalibrationOrder: 1,
    analyticalWhiteRoiId: null,
    metricsCalculated: false,
    isAnalysisStale: false,
    lastRegressions: [],
    regressionViewMode: 'best',
    visibleRegressionParameters: new Set(),
    regressionDisplayLimit: 5,
    calibrationChart: null,
    currentConcentrationUnit: 'mg/L',
    concentrationQueue: [],
    activeConcentrationModalRoiId: null,
    deferredInstallPrompt: null,
    analysisTitle: '',
    currentTab: 'roi-data',
    appMode: 'idle',
    gridCornerPoints: [],
    draggedCornerIndex: -1,
    currentMousePos: { x: 0, y: 0, dX: 0, dY: 0 },
    lastGridDims: { rows: 3, cols: 5 },
    showMagnifier: false,
    sequencedRois: [],
    isFocusMode: false,
    isMultiSelectMode: false,
    isMagnifierEnabled: false,
    isViewLocked: false,
    isQualityPanelExpanded: false,
    contextMenu: { visible: false, roiId: null, x: 0, y: 0 },
    forceViewRecalculationOnFocusModeToggle: false,
};

const listeners = new Set();

function notify(updateOptions = {}) {
    if (updateOptions.silent) {
        return;
    }
    requestAnimationFrame(() => {
        const typeLog = updateOptions.type ? `(Tipo: ${updateOptions.type})` : '';
        log('state', 'info', `Notificando ${listeners.size} ouvintes sobre a mudança de estado. ${typeLog}`);
        for (const listener of listeners) {
            listener(appState, updateOptions);
        }
    });
}

export function subscribe(callback) {
    listeners.add(callback);
    log('state', 'info', `Um novo ouvinte se inscreveu. Total: ${listeners.size}`);
    return () => {
        listeners.delete(callback);
        log('state', 'info', `Um ouvinte cancelou a inscrição. Restantes: ${listeners.size}`);
    };
}

export const getState = () => ({ ...appState });

export const setState = (updaterFn, updateOptions = {}) => {
    const currentState = getState();
    const updates = updaterFn(currentState);
    Object.assign(appState, updates);
    notify(updateOptions);
};


// --- GETTERS ---
export const rois = () => appState.rois;
export const viewTransform = () => appState.viewTransform;
export const currentTool = () => appState.currentTool;
export const selectionSet = () => appState.selectionSet;
export const editingRoiId = () => appState.editingRoiId;
export const isDrawing = () => appState.isDrawing;
export const isPanning = () => appState.isPanning;
export const drawingStartPos = () => appState.drawingStartPos;
export const lastPanPosition = () => appState.lastPanPosition;
export const currentRoi = () => appState.currentRoi;
export const isDraggingRoi = () => appState.isDraggingRoi;
export const isResizingRoi = () => appState.isResizingRoi;
export const resizeHandle = () => appState.resizeHandle;
export const dragInitialState = () => appState.dragInitialState;
export const offscreenCanvas = () => appState.offscreenCanvas;
export const analyticalWhiteRoiId = () => appState.analyticalWhiteRoiId;
export const hasImage = () => !!appState.originalImage.src;
export const originalImage = () => appState.originalImage;
export const metricsCalculated = () => appState.metricsCalculated;
export const lastRegressions = () => appState.lastRegressions;
export const regressionViewMode = () => appState.regressionViewMode;
export const visibleRegressionParameters = () => appState.visibleRegressionParameters;
export const regressionDisplayLimit = () => appState.regressionDisplayLimit;
export const calibrationChart = () => appState.calibrationChart;
export const currentConcentrationUnit = () => appState.currentConcentrationUnit;
export const concentrationQueue = () => appState.concentrationQueue;
export const getActiveConcentrationModalRoiId = () => appState.activeConcentrationModalRoiId;
export const deferredInstallPrompt = () => appState.deferredInstallPrompt;
export const isAnalysisStale = () => appState.isAnalysisStale;
export const analysisTitle = () => appState.analysisTitle;
export const currentTab = () => appState.currentTab;
export const appMode = () => appState.appMode;
export const gridCornerPoints = () => appState.gridCornerPoints;
export const draggedCornerIndex = () => appState.draggedCornerIndex;
export const currentMousePos = () => appState.currentMousePos;
export const lastGridDims = () => appState.lastGridDims;
export const showMagnifier = () => appState.showMagnifier;
export const sequencedRois = () => appState.sequencedRois;
export const isFocusMode = () => appState.isFocusMode;
export const isMultiSelectMode = () => appState.isMultiSelectMode;
export const isMagnifierEnabled = () => appState.isMagnifierEnabled;
export const isViewLocked = () => appState.isViewLocked;
export const isQualityPanelExpanded = () => appState.isQualityPanelExpanded;
export const contextMenu = () => appState.contextMenu;
export const forceViewRecalculationOnFocusModeToggle = () => appState.forceViewRecalculationOnFocusModeToggle;


// --- SETTERS ---

export const getNextRoiId = () => {
    const id = appState.nextRoiId;
    setState(() => ({ nextRoiId: id + 1 }), { silent: true });
    return id;
};

export const getNextCalibrationOrder = () => {
    const order = appState.nextCalibrationOrder;
    setState(() => ({ nextCalibrationOrder: order + 1 }), { silent: true });
    return order;
};

export const updateRoiPositions = (positionUpdates) => {
    if (!positionUpdates || positionUpdates.length === 0) return;

    setState(currentState => {
        const newRois = currentState.rois.map(roi => {
            const update = positionUpdates.find(p => p.id === roi.id);
            if (update) {
                return { ...roi, x: update.x, y: update.y };
            }
            return roi;
        });
        return { rois: newRois };
    }, { type: 'interaction_state_change' });
};

export const updateRois = (newRoisArray) => {
    log('state', 'data', `Atualizando estado das ROIs. ${newRoisArray.length} ROIs recebidas.`);
    setState(() => ({ rois: newRoisArray }), { type: 'roi_data_change' });
};

export const setViewTransform = (transform) => {
    const newTransform = { ...appState.viewTransform, ...transform };
    setState(() => ({ viewTransform: newTransform }), { type: 'view_transform_change' });
};

// --- INÍCIO DA ALTERAÇÃO ---
/**
 * Atualiza atomicamente todas as propriedades de estado relacionadas ao pan.
 * @param {number} offsetX - O novo deslocamento X da visualização.
 * @param {number} offsetY - O novo deslocamento Y da visualização.
 * @param {{x: number, y: number}} panPosition - A nova posição do cursor para o próximo cálculo de delta.
 */
export const updatePan = (offsetX, offsetY, panPosition) => {
    setState(currentState => ({
        isPanning: true, // Garante que o estado de pan continue ativo
        viewTransform: {
            ...currentState.viewTransform,
            offsetX,
            offsetY
        },
        lastPanPosition: panPosition
    }), { type: 'view_transform_change' }); // Notifica com o tipo de prioridade 1
};
// --- FIM DA ALTERAÇÃO ---

export const setCurrentTool = (tool) => {
    setState(() => ({ currentTool: tool }), { type: 'tool_change' });
};

export const clearSelectionSet = () => {
    setState(() => ({ selectionSet: new Set(), editingRoiId: null }), { type: 'selection_change' });
};

export const addRoiToSelection = (roiId) => {
    const newSet = new Set(appState.selectionSet);
    newSet.add(roiId);
    setState(() => ({ selectionSet: newSet }), { type: 'selection_change' });
};

export const removeRoiFromSelection = (roiId) => {
    const newSet = new Set(appState.selectionSet);
    newSet.delete(roiId);
    let newEditingId = appState.editingRoiId;
    if (newEditingId === roiId) {
        newEditingId = null;
    }
    setState(() => ({ selectionSet: newSet, editingRoiId: newEditingId }), { type: 'selection_change' });
};

export const toggleRoiInSelection = (roiId) => {
    const newSet = new Set(appState.selectionSet);
    let newEditingId = appState.editingRoiId;
    if (newSet.has(roiId)) {
        newSet.delete(roiId);
        if (newEditingId === roiId) newEditingId = null;
    } else {
        newSet.add(roiId);
    }
    setState(() => ({ selectionSet: newSet, editingRoiId: newEditingId }), { type: 'selection_change' });
};

export const setEditingRoiId = (id) => {
    setState(() => ({ editingRoiId: id }), { type: 'selection_change' });
};

export const setSelectionSet = (newSet) => {
    setState(() => ({ selectionSet: newSet }), { type: 'selection_change' });
};

export const setDrawingState = (drawing, startPos, roi) => {
    setState(() => ({ isDrawing: drawing, drawingStartPos: startPos, currentRoi: roi }), { type: 'interaction_state_change' });
};

export const setPanningState = (panning, pos) => {
    const updates = { isPanning: panning };
    if (pos) updates.lastPanPosition = pos;
    setState(() => (updates), { type: 'interaction_state_change' });
};

export const setDragInitialState = (state) => {
    setState(() => ({ dragInitialState: state }), { silent: true });
};

export const setIsDraggingRoi = (isDragging) => {
    setState(() => ({ isDraggingRoi: isDragging }), { type: 'interaction_state_change' });
};

export const setResizingRoiState = (resizing, handle, startPos) => {
    setState(() => ({ isResizingRoi: resizing, resizeHandle: handle, drawingStartPos: startPos }), { type: 'interaction_state_change' });
};

export const setAnalyticalWhiteRoiId = (id) => {
    setState(() => ({ analyticalWhiteRoiId: id }), { type: 'roi_data_change' });
};

export const setOffscreenCanvas = (canvas) => {
    setState(() => ({ offscreenCanvas: canvas }), { type: 'image_change' });
};

export const setOriginalImage = (image) => {
    setState(() => ({ originalImage: image }), { type: 'image_change' });
};

export const setMetricsCalculated = (value) => {
    setState(() => ({ metricsCalculated: value }), { type: 'analysis_update' });
};

export const setLastRegressions = (regressions) => {
    setState(() => ({ lastRegressions: regressions }), { type: 'analysis_update' });
};

export const setRegressionViewMode = (mode) => {
    setState(() => ({ regressionViewMode: mode }), { type: 'analysis_view_change' });
};

export const setVisibleRegressionParameters = (paramSet) => {
    setState(() => ({ visibleRegressionParameters: paramSet }), { type: 'analysis_view_change' });
};

export const toggleVisibleParameter = (paramName) => {
    const newSet = new Set(appState.visibleRegressionParameters);
    if (newSet.has(paramName)) {
        newSet.delete(paramName);
        log('state', 'data', `Parâmetro '${paramName}' removido da visualização.`);
    } else {
        newSet.add(paramName);
        log('state', 'data', `Parâmetro '${paramName}' adicionado à visualização.`);
    }
    setState(() => ({ visibleRegressionParameters: newSet }), { type: 'analysis_view_change' });
};

export const setRegressionDisplayLimit = (limit) => {
    const numLimit = parseInt(limit, 10);
    const newLimit = (!isNaN(numLimit) && numLimit > 0) ? numLimit : Infinity;
    log('state', 'data', `Limite de exibição de regressão alterado para: ${newLimit}`);
    setState(() => ({ regressionDisplayLimit: newLimit }), { type: 'analysis_view_change' });
};

export const setCalibrationChart = (chart) => {
    setState(() => ({ calibrationChart: chart }), { type: 'ui_component_change' });
};

export const setCurrentConcentrationUnit = (unit) => {
    setState(() => ({ currentConcentrationUnit: unit }), { type: 'analysis_update' });
};

export const setConcentrationQueue = (queue) => {
    setState(() => ({ concentrationQueue: queue }));
};

export const setActiveConcentrationModalRoiId = (id) => {
    setState(() => ({ activeConcentrationModalRoiId: id }), { silent: true });
};

export const setDeferredInstallPrompt = (prompt) => {
    setState(() => ({ deferredInstallPrompt: prompt }), { type: 'ui_state_change' });
};

export const setAnalysisStale = (value) => {
    setState(() => ({ isAnalysisStale: value }), { type: 'analysis_update' });
};

export const setAnalysisTitle = (title) => {
    setState(() => ({ analysisTitle: title }), { type: 'analysis_update' });
};

export const setCurrentTab = (tab) => {
    setState(() => ({ currentTab: tab }), { type: 'ui_state_change' });
};

export const setAppMode = (mode) => {
    setState(() => ({ appMode: mode }), { type: 'app_mode_change' });
};

export const setMultiSelectMode = (isActive) => {
    setState(() => ({ isMultiSelectMode: isActive }), { type: 'app_mode_change' });
};

export const addGridCornerPoint = (point) => {
    if (appState.gridCornerPoints.length < 4) {
        setState(s => ({ gridCornerPoints: [...s.gridCornerPoints, point] }), { type: 'grid_corner_add' });
    }
};

export const updateGridCornerPoint = (index, point) => {
    if (appState.gridCornerPoints[index]) {
        const newPoints = [...appState.gridCornerPoints];
        newPoints[index] = point;
        setState(() => ({ gridCornerPoints: newPoints }), { type: 'interaction_state_change' });
    }
};

export const clearGridCornerPoints = () => {
    setState(() => ({ gridCornerPoints: [] }), { type: 'interaction_state_change' });
};

export const setDraggedCornerIndex = (index) => {
    setState(() => ({ draggedCornerIndex: index }), { silent: true });
};

export const setCurrentMousePos = (pos) => {
    setState(() => ({ currentMousePos: pos }), { silent: true });
};

export const setLastGridDims = (dims) => {
    setState(() => ({ lastGridDims: dims }));
};

export const setShowMagnifier = (value) => {
    setState(() => ({ showMagnifier: value }), { silent: true });
};

export const toggleFocusMode = () => {
    setState(s => ({ isFocusMode: !s.isFocusMode, forceViewRecalculationOnFocusModeToggle: true }), { type: 'ui_mode_change' });
};

export const toggleMagnifierEnabled = () => {
    setState(s => ({ isMagnifierEnabled: !s.isMagnifierEnabled }), { type: 'ui_toggle' });
};

export const toggleViewLock = () => {
    setState(s => ({ isViewLocked: !s.isViewLocked }), { type: 'ui_toggle' });
};

export const toggleQualityPanel = () => {
    log('state', 'data', `Estado do painel de qualidade alterado para: ${!appState.isQualityPanelExpanded ? 'expandido' : 'recolhido'}`);
    setState(s => ({ isQualityPanelExpanded: !s.isQualityPanelExpanded }), { type: 'ui_toggle' });
};

export const setForceViewRecalculationOnFocusModeToggle = (value) => {
    setState(() => ({ forceViewRecalculationOnFocusModeToggle: value }), { silent: true });
};

export const showContextMenu = (roiId, x, y) => {
    setState(() => ({ contextMenu: { visible: true, roiId, x, y } }), { type: 'ui_state_change' });
};

export const hideContextMenu = () => {
    if (appState.contextMenu.visible) {
        setState(s => ({ contextMenu: { ...s.contextMenu, visible: false } }), { type: 'ui_state_change' });
    }
};

export function resetInteractionState() {
    setState(() => ({
        isDrawing: false,
        isPanning: false,
        isResizingRoi: false,
        currentRoi: null,
        draggedCornerIndex: -1,
        showMagnifier: false,
        activeConcentrationModalRoiId: null,
        dragInitialState: null,
        isDraggingRoi: false,
        contextMenu: { visible: false, roiId: null, x: 0, y: 0 }
    }), { type: 'interaction_state_change' });
}