// js/domElements.js

// --- MÓDULO CENTRAL DE ELEMENTOS DO DOM ---
// As variáveis são exportadas mas inicializadas como undefined.
// A função initializeDomElements() deve ser chamada após o DOM estar pronto.

// --- Controles Principais ---
export let mainControlsPanel;
export let autoActionsContainer;
export let roiToolsContainer;

// --- Controles de Imagem e ROI ---
export let imageUpload;
export let fileNameDisplay;
export let deleteImageButton;
export let rotateImageButton;
export let resetViewButton;
export let rectRoiButton;
export let circleRoiButton;
export let pointerButton;
export let deleteAllRoisButton;

// --- Botões do Painel de Ação Dinâmico ---
export let duplicateSelectedRoiButton;
export let deleteSelectedRoiButton;
export let setAnalyticalWhiteButton;
export let setAsSampleButton;
export let bulkResizeSlider;
export let bulkResizeValue;
export let bulkLockPositionButton;
export let bulkLockSizeButton;
export let bulkOrderButton;
export let orderRoisInfoButton;

// --- Detecção Automática (Menu e Controles de Grade) ---
export let detectionDropdownContainer;
export let detectionMenuButton;
export let detectionMenu;
export let startGridAnalysisButton;
export let startAreaDetectionButton;
export let startAdvancedDetectionButton;
export let gridAdjustmentControls;
export let confirmGridButton;
export let cancelGridButton;
export let detectionInstructionPanel;
export let detectionInstructionText;
export let cancelInstructionButton;

// --- Canvas, Lupa e Menu de Contexto ---
export let canvasContainer;
export let imageCanvas;
export let roiCanvas;
export let focusModeButton;
export let magnifierToggleButton;
export let viewLockButton;
export let viewLockIcon;
export let magnifierContainer;
export let magnifierCanvas;
export let roiContextMenu;
export let contextMenuSetSample;
export let contextMenuSetWhite;
export let contextMenuLock;
export let contextMenuDelete;

// --- Abas e Conteúdo Principal ---
export let colorTabsContainer;
export let tabPanes;
export let roiCardsContainer;
export let analyticalResultsCardsContainer;
export let calibrationSetupTableBody;
export let regressionEquationsContainer;
export let concentrationUnitSelect;
export let sampleIdentificationContainer;
export let sampleResultsContainer;
export let calibrationChartCanvas;

// --- Botões de Ação da Aba de Análise ---
export let calculateAllMetricsButton;
export let generateCalibrationCurveButton;
export let clearChartButton;
export let clearConcentrationsButton;
export let selectAllForCalibration;
export let exportPdfButton;
export let exportXlsxButton;
export let defineRoiOrderButton;

// --- Controles de Visualização da Regressão (P260625I-3) ---
export let regressionViewModeContainer;
export let viewModeBest;
export let viewModeLinear;
export let viewModePoly;
export let viewModeBoth;

// --- Wrappers de Etapas da Aba de Análise ---
export let step1Wrapper;
export let step2Wrapper;
export let step2Content;
export let step2Blocker;
export let step3Wrapper;
export let step3Content;
export let step3Blocker;
export let step4Wrapper;
export let step4Content;
export let step4Blocker;
export let step5Wrapper;
export let step5Content;
export let step5Blocker;
export let finalActionsWrapper;
export let analysisStaleWarning;
export let noRoiMessage;

// --- Painel de Ações Dinâmico ---
export let dynamicActionsPanel;

// --- Modais Globais ---
export let messageModal;
export let modalMessageText;
export let loadingSpinner;
export let closeGeneralModalButton;
export let toastNotification;
export let toastText;
export let toastCloseButton;

// --- Modal de Edição de Nome ROI ---
export let editRoiNameModal;
export let editRoiNameInput;
export let editRoiNameError;
export let saveRoiNameButton;
export let cancelEditRoiNameModalButton;
export let closeEditRoiNameModalButton;

// --- Modal de Concentração ---
export let concentrationModal;
export let concentrationForm;
export let concentrationInput;
export let concentrationModalRoiName;
export let concentrationModalError;
export let confirmConcentrationButton;
export let cancelConcentrationButton;
export let closeConcentrationModalButton;

// --- Modal de Input de Texto Genérico ---
export let textInputModal;
export let textInputModalTitle;
export let textInputModalInput;
export let textInputModalError;
export let textInputForm;
export let confirmTextInputModalButton;
export let cancelTextInputModalButton;
export let closeTextInputModalButton;

// --- Botões de Ajuda ---
export let mainControlsInfoButton;
export let toolsInfoButton;
export let roiActionsInfoButton;
// --- INÍCIO DA ADIÇÃO (FEAT-RESULT-GROUPING-01) ---
export let predictionInfoButton;
// --- FIM DA ADIÇÃO ---


// --- Modal de Confirmação ---
export let confirmationModal;
export let confirmationModalTitle;
export let confirmationModalMessage;
export let closeConfirmationModalButton;
export let cancelConfirmationButton;
export let confirmConfirmationButton;

// --- Modal de Informações da Métrica ---
export let metricInfoModal;
export let closeMetricInfoModalButton;
export let metricInfoModalTitle;
export let metricInfoFormula;
export let metricInfoDescription;

// --- Modal de Dimensões da Grade ---
export let gridDimensionsModal;
export let gridDimensionsForm;
export let gridRowsInput;
export let gridColsInput;
export let gridDimensionsError;
export let confirmGridDimensionsButton;
export let cancelGridDimensionsButton;
export let closeGridDimensionsModalButton;

// --- Modal de Seleção de Sinais ---
export let openSignalSelectorModalButton;
export let signalSelectorModal;
export let closeSignalSelectorModalButton;
export let signalSearchInput;
export let selectAllSignalsButton;
export let selectAllVisibleSignalsButton;
export let unselectAllVisibleSignalsButton;
export let clearAllSignalSelectionsButton;
export let signalSelectorContainer;
export let confirmSignalSelectionButton;

// --- Sessão e Perfil (Configurações) ---
export let saveSessionButton;
export let loadSessionButton;
export let settingsButton;
export let settingsModal;
export let closeSettingsModalButton;
export let cancelSettingsButton;
export let saveSettingsButton;
export let analystNameInput;
export let operatorRoleInput;
export let labNameInput;
export let institutionNameInput;
export let labLogoUpload;
export let institutionLogoUpload;
export let labLogoPreview;
export let institutionLogoPreview;
export let contactEmailInput;
export let contactPhoneInput;

// --- Modal de Detalhes do Relatório PDF ---
export let reportDetailsModal;
export let closeReportDetailsModalButton;
export let cancelReportDetailsButton;
export let confirmAndGeneratePdfButton;
export let sampleIdInput;
export let reportIdInput;
export let analysisLocationInput;
export let applicationAreaInput;
export let reportDetailsError;
export let includeImageInReportCheckbox;

// --- Modal Avançado de Ordenação (Painel de Controle) ---
export let advancedSequenceModal;
export let advancedSequenceForm;
export let closeAdvancedSequenceModalButton;
export let cancelAdvancedSequenceButton;
export let confirmAdvancedSequenceButton;
export let advancedSequenceByTouch;
export let sequencePatternHorizontal;
export let sequencePatternVertical;
export let sequenceSerpentineToggle;
export let scanDirectionContainer;
export let readDirectionContainer;

// --- Outros ---
export let pwaInstallInfo;
export let installPwaButton;
export let currentYear;
export let analysisTitleInput;

// --- Modal de Configurações da Detecção Avançada ---
export let autoRoiSettingsModal;
export let saturationSlider;
export let saturationValue;
export let brightnessSlider;
export let brightnessValue;
export let minAreaSlider;
export let minAreaValue;
export let circularitySlider;
export let circularityValue;
export let cancelAutoRoiSettings;
export let runDetectionWithSettings;

// --- Barra de Ferramentas do Modo Foco ---
export let focusModeToolbar;


/**
 * Função de Inicialização que atribui os elementos do DOM às variáveis exportadas.
 * DEVE ser chamada após o evento DOMContentLoaded.
 */
export function initializeDomElements() {
    mainControlsPanel = document.querySelector('[data-id-for-focus-mode="mainControlsPanel"]');
    autoActionsContainer = document.getElementById('autoActionsContainer');
    roiToolsContainer = document.getElementById('roiToolsContainer');
    imageUpload = document.getElementById('imageUpload');
    fileNameDisplay = document.getElementById('fileNameDisplay');
    deleteImageButton = document.getElementById('deleteImageButton');
    rotateImageButton = document.getElementById('rotateImageButton');
    resetViewButton = document.getElementById('resetViewButton');
    rectRoiButton = document.getElementById('rectRoiButton');
    circleRoiButton = document.getElementById('circleRoiButton');
    pointerButton = document.getElementById('pointerButton');
    deleteAllRoisButton = document.getElementById('deleteAllRoisButton');
    duplicateSelectedRoiButton = document.getElementById('duplicateSelectedRoiButton');
    deleteSelectedRoiButton = document.getElementById('deleteSelectedRoiButton');
    setAnalyticalWhiteButton = document.getElementById('setAnalyticalWhiteButton');
    setAsSampleButton = document.getElementById('setAsSampleButton');
    bulkResizeSlider = document.getElementById('bulkResizeSlider');
    bulkResizeValue = document.getElementById('bulkResizeValue');
    bulkLockPositionButton = document.getElementById('bulkLockPositionButton');
    bulkLockSizeButton = document.getElementById('bulkLockSizeButton');
    bulkOrderButton = document.getElementById('bulkOrderButton');
    orderRoisInfoButton = document.getElementById('orderRoisInfoButton');
    detectionDropdownContainer = document.getElementById('detectionDropdownContainer');
    detectionMenuButton = document.getElementById('detectionMenuButton');
    detectionMenu = document.getElementById('detectionMenu');
    startGridAnalysisButton = document.getElementById('startGridAnalysisButton');
    startAreaDetectionButton = document.getElementById('startAreaDetectionButton');
    startAdvancedDetectionButton = document.getElementById('startAdvancedDetectionButton');
    gridAdjustmentControls = document.getElementById('gridAdjustmentControls');
    confirmGridButton = document.getElementById('confirmGridButton');
    cancelGridButton = document.getElementById('cancelGridButton');
    detectionInstructionPanel = document.getElementById('detectionInstructionPanel');
    detectionInstructionText = document.getElementById('detectionInstructionText');
    cancelInstructionButton = document.getElementById('cancelInstructionButton');
    canvasContainer = document.getElementById('canvasContainer');
    imageCanvas = document.getElementById('imageCanvas');
    roiCanvas = document.getElementById('roiCanvas');
    focusModeButton = document.getElementById('focusModeButton');
    magnifierToggleButton = document.getElementById('magnifierToggleButton');
    viewLockButton = document.getElementById('viewLockButton');
    viewLockIcon = document.getElementById('viewLockIcon');
    magnifierContainer = document.getElementById('magnifier-container');
    magnifierCanvas = document.getElementById('magnifier-canvas');
    roiContextMenu = document.getElementById('roiContextMenu');
    contextMenuSetSample = document.getElementById('contextMenuSetSample');
    contextMenuSetWhite = document.getElementById('contextMenuSetWhite');
    contextMenuLock = document.getElementById('contextMenuLock');
    contextMenuDelete = document.getElementById('contextMenuDelete');
    colorTabsContainer = document.getElementById('colorTabsContainer');
    tabPanes = document.querySelectorAll('.tab-pane');
    roiCardsContainer = document.getElementById('roiCardsContainer');
    analyticalResultsCardsContainer = document.getElementById('analyticalResultsCardsContainer');
    calibrationSetupTableBody = document.getElementById('calibrationSetupTableBody');
    regressionEquationsContainer = document.getElementById('regressionEquationsContainer');
    concentrationUnitSelect = document.getElementById('concentrationUnitSelect');
    sampleIdentificationContainer = document.getElementById('sampleIdentificationContainer');
    sampleResultsContainer = document.getElementById('sampleResultsContainer');
    calibrationChartCanvas = document.getElementById('calibrationChartCanvas');
    calculateAllMetricsButton = document.getElementById('calculateAllMetricsButton');
    generateCalibrationCurveButton = document.getElementById('generateCalibrationCurveButton');
    clearChartButton = document.getElementById('clearChartButton');
    clearConcentrationsButton = document.getElementById('clearConcentrationsButton');
    selectAllForCalibration = document.getElementById('selectAllForCalibration');
    exportPdfButton = document.getElementById('exportPdfButton');
    exportXlsxButton = document.getElementById('exportXlsxButton');
    defineRoiOrderButton = document.getElementById('defineRoiOrderButton');
    step1Wrapper = document.getElementById('step1Wrapper');
    step2Wrapper = document.getElementById('step2Wrapper');
    step2Content = document.getElementById('step2Content');
    step2Blocker = document.getElementById('step2Blocker');
    step3Wrapper = document.getElementById('step3Wrapper');
    step3Content = document.getElementById('step3Content');
    step3Blocker = document.getElementById('step3Blocker');
    step4Wrapper = document.getElementById('step4Wrapper');
    step4Content = document.getElementById('step4Content');
    step4Blocker = document.getElementById('step4Blocker');
    step5Wrapper = document.getElementById('step5Wrapper');
    step5Content = document.getElementById('step5Content');
    step5Blocker = document.getElementById('step5Blocker');
    finalActionsWrapper = document.getElementById('finalActionsWrapper');
    analysisStaleWarning = document.getElementById('analysisStaleWarning');
    noRoiMessage = document.getElementById('noRoiMessage');
    dynamicActionsPanel = document.getElementById('roi-tools-panel');
    messageModal = document.getElementById('messageModal');
    modalMessageText = document.getElementById('modalMessageText');
    loadingSpinner = document.getElementById('loadingSpinner');
    closeGeneralModalButton = document.getElementById('closeGeneralModalButton');
    toastNotification = document.getElementById('toast-notification');
    toastText = document.getElementById('toast-text');
    toastCloseButton = document.getElementById('toast-close-button');
    editRoiNameModal = document.getElementById('editRoiNameModal');
    editRoiNameInput = document.getElementById('editRoiNameInput');
    editRoiNameError = document.getElementById('editRoiNameError');
    saveRoiNameButton = document.getElementById('saveRoiNameButton');
    cancelEditRoiNameModalButton = document.getElementById('cancelEditRoiNameModalButton');
    closeEditRoiNameModalButton = document.getElementById('closeEditRoiNameModalButton');
    concentrationModal = document.getElementById('concentrationModal');
    concentrationForm = document.getElementById('concentrationForm');
    concentrationInput = document.getElementById('concentrationInput');
    concentrationModalRoiName = document.getElementById('concentrationModalRoiName');
    concentrationModalError = document.getElementById('concentrationModalError');
    confirmConcentrationButton = document.getElementById('confirmConcentrationButton');
    cancelConcentrationButton = document.getElementById('cancelConcentrationButton');
    closeConcentrationModalButton = document.getElementById('closeConcentrationModalButton');
    textInputModal = document.getElementById('textInputModal');
    textInputModalTitle = document.getElementById('textInputModalTitle');
    textInputModalInput = document.getElementById('textInputModalInput');
    textInputModalError = document.getElementById('textInputModalError');
    textInputForm = document.getElementById('textInputForm');
    confirmTextInputModalButton = document.getElementById('confirmTextInputModalButton');
    cancelTextInputModalButton = document.getElementById('cancelTextInputModalButton');
    closeTextInputModalButton = document.getElementById('closeTextInputModalButton');
    mainControlsInfoButton = document.getElementById('mainControlsInfoButton');
    toolsInfoButton = document.getElementById('toolsInfoButton');
    roiActionsInfoButton = document.getElementById('roiActionsInfoButton');
    confirmationModal = document.getElementById('confirmationModal');
    confirmationModalTitle = document.getElementById('confirmationModalTitle');
    confirmationModalMessage = document.getElementById('confirmationModalMessage');
    closeConfirmationModalButton = document.getElementById('closeConfirmationModalButton');
    cancelConfirmationButton = document.getElementById('cancelConfirmationButton');
    confirmConfirmationButton = document.getElementById('confirmConfirmationButton');
    gridDimensionsModal = document.getElementById('gridDimensionsModal');
    gridDimensionsForm = document.getElementById('gridDimensionsForm');
    gridRowsInput = document.getElementById('gridRowsInput');
    gridColsInput = document.getElementById('gridColsInput');
    gridDimensionsError = document.getElementById('gridDimensionsError');
    confirmGridDimensionsButton = document.getElementById('confirmGridDimensionsButton');
    cancelGridDimensionsButton = document.getElementById('cancelGridDimensionsButton');
    closeGridDimensionsModalButton = document.getElementById('closeGridDimensionsModalButton');
    openSignalSelectorModalButton = document.getElementById('openSignalSelectorModalButton');
    signalSelectorModal = document.getElementById('signalSelectorModal');
    closeSignalSelectorModalButton = document.getElementById('closeSignalSelectorModalButton');
    signalSearchInput = document.getElementById('signalSearchInput');
    selectAllSignalsButton = document.getElementById('selectAllSignalsButton');
    selectAllVisibleSignalsButton = document.getElementById('selectAllVisibleSignalsButton');
    unselectAllVisibleSignalsButton = document.getElementById('unselectAllVisibleSignalsButton');
    clearAllSignalSelectionsButton = document.getElementById('clearAllSignalSelectionsButton');
    signalSelectorContainer = document.getElementById('signalSelectorContainer');
    confirmSignalSelectionButton = document.getElementById('confirmSignalSelectionButton');
    saveSessionButton = document.getElementById('saveSessionButton');
    loadSessionButton = document.getElementById('loadSessionButton');
    settingsButton = document.getElementById('settingsButton');
    settingsModal = document.getElementById('settingsModal');
    closeSettingsModalButton = document.getElementById('closeSettingsModalButton');
    cancelSettingsButton = document.getElementById('cancelSettingsButton');
    saveSettingsButton = document.getElementById('saveSettingsButton');
    analystNameInput = document.getElementById('analystNameInput');
    operatorRoleInput = document.getElementById('operatorRoleInput');
    labNameInput = document.getElementById('labNameInput');
    institutionNameInput = document.getElementById('institutionNameInput');
    labLogoUpload = document.getElementById('labLogoUpload');
    institutionLogoUpload = document.getElementById('institutionLogoUpload');
    labLogoPreview = document.getElementById('labLogoPreview');
    institutionLogoPreview = document.getElementById('institutionLogoPreview');
    contactEmailInput = document.getElementById('contactEmailInput');
    contactPhoneInput = document.getElementById('contactPhoneInput');
    reportDetailsModal = document.getElementById('reportDetailsModal');
    closeReportDetailsModalButton = document.getElementById('closeReportDetailsModalButton');
    cancelReportDetailsButton = document.getElementById('cancelReportDetailsButton');
    confirmAndGeneratePdfButton = document.getElementById('confirmAndGeneratePdfButton');
    sampleIdInput = document.getElementById('sampleIdInput');
    reportIdInput = document.getElementById('reportIdInput');
    analysisLocationInput = document.getElementById('analysisLocationInput');
    applicationAreaInput = document.getElementById('applicationAreaInput');
    reportDetailsError = document.getElementById('reportDetailsError');
    includeImageInReportCheckbox = document.getElementById('includeImageInReport');
    advancedSequenceModal = document.getElementById('advancedSequenceModal');
    advancedSequenceForm = document.getElementById('advancedSequenceForm');
    closeAdvancedSequenceModalButton = document.getElementById('closeAdvancedSequenceModalButton');
    cancelAdvancedSequenceButton = document.getElementById('cancelAdvancedSequenceButton');
    confirmAdvancedSequenceButton = document.getElementById('confirmAdvancedSequenceButton');
    advancedSequenceByTouch = document.getElementById('advancedSequenceByTouch');
    sequencePatternHorizontal = document.getElementById('sequencePatternHorizontal');
    sequencePatternVertical = document.getElementById('sequencePatternVertical');
    sequenceSerpentineToggle = document.getElementById('sequenceSerpentineToggle');
    scanDirectionContainer = document.getElementById('scanDirectionContainer');
    readDirectionContainer = document.getElementById('readDirectionContainer');
    pwaInstallInfo = document.getElementById('pwaInstallInfo');
    installPwaButton = document.getElementById('installPwaButton');
    currentYear = document.getElementById('currentYear');
    analysisTitleInput = document.getElementById('analysisTitleInput');
    autoRoiSettingsModal = document.getElementById('autoRoiSettingsModal');
    saturationSlider = document.getElementById('saturationSlider');
    saturationValue = document.getElementById('saturationValue');
    brightnessSlider = document.getElementById('brightnessSlider');
    brightnessValue = document.getElementById('brightnessValue');
    minAreaSlider = document.getElementById('minAreaSlider');
    minAreaValue = document.getElementById('minAreaValue');
    circularitySlider = document.getElementById('circularitySlider');
    circularityValue = document.getElementById('circularityValue');
    cancelAutoRoiSettings = document.getElementById('cancelAutoRoiSettings');
    runDetectionWithSettings = document.getElementById('runDetectionWithSettings');
    metricInfoModal = document.getElementById('metricInfoModal');
    closeMetricInfoModalButton = document.getElementById('closeMetricInfoModalButton');
    metricInfoModalTitle = document.getElementById('metricInfoModalTitle');
    metricInfoFormula = document.getElementById('metricInfoFormula');
    metricInfoDescription = document.getElementById('metricInfoDescription');
    regressionViewModeContainer = document.getElementById('regressionViewModeContainer');
    viewModeBest = document.getElementById('viewModeBest');
    viewModeLinear = document.getElementById('viewModeLinear');
    viewModePoly = document.getElementById('viewModePoly');
    viewModeBoth = document.getElementById('viewModeBoth');
    focusModeToolbar = document.getElementById('focus-mode-toolbar');

    // --- INÍCIO DA ADIÇÃO (FEAT-RESULT-GROUPING-01) ---
    predictionInfoButton = document.getElementById('predictionInfoButton');
    // --- FIM DA ADIÇÃO ---
    
    log('domElements', 'info', 'Referências do DOM foram inicializadas com sucesso.');
}