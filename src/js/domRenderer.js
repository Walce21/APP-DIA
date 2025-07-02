// js/domRenderer.js


import * as state from './state.js';
import * as dom from './domElements.js';

function _updateText(card, field, value) {
    const el = card.querySelector(`[data-field="${field}"]`);
    if (el) {
        el.textContent = value;
    }
}

function _getPredictionStatusIndicator(status) {
    const statusMap = {
        'extrapolated_low': { icon: '⚠️', text: 'Resultado extrapolado (abaixo do menor padrão)' },
        'extrapolated_high': { icon: '⚠️', text: 'Resultado extrapolado (acima do maior padrão)' },
        'invalid_no_real_solution': { icon: '❌', text: 'Não foi possível calcular uma concentração real com este modelo' },
        'invalid_no_slope': { icon: '❌', text: 'O modelo linear não tem inclinação (m=0), impossível calcular' },
        // --- INÍCIO DA ALTERAÇÃO ---
        'invalid_negative_result': { icon: '❌', text: 'Cálculo resultou em concentração negativa, o que é fisicamente impossível.' }
        // --- FIM DA ALTERAÇÃO ---
    };

    const info = statusMap[status];
    if (!info || status === 'valid') return '';

    return `<span class="ml-2 text-amber-500" title="${info.text}">${info.icon}</span>`;
}

function _buildRoiCardElement(roi) {
    const { rois, analyticalWhiteRoiId: whiteId, selectionSet, editingRoiId: editingId } = state.getState();
    const isMultiSelected = selectionSet.has(roi.id);
    const isEditing = roi.id === editingId;
    const isSample = roi.isSample;
    const isWhite = roi.id === whiteId;

    const card = document.createElement('div');
    card.className = 'roi-card';
    card.dataset.roiId = roi.id;

    // --- Construção do Cabeçalho ---
    const header = document.createElement('div');
    header.className = 'roi-card-header';
    
    const sampleRois = rois.filter(r => r.isSample).sort((a, b) => a.id - b.id);
    let namePrefix = '';
    let mainName = roi.customName || roi.name;

    if (isWhite) {
        namePrefix = '⭐ ';
        mainName = roi.customName || 'BRANCO';
    } else if (isSample) {
        const sampleIndex = sampleRois.findIndex(r => r.id === roi.id);
        namePrefix = '🧪 ';
        mainName = roi.customName || `Amostra ${sampleIndex + 1}`;
    }

    const lockIndicator = roi.isPositionLocked && roi.isSizeLocked ? ' 🔒' : (roi.isPositionLocked ? ' 🔒(P)' : (roi.isSizeLocked ? ' 🔒(T)' : ''));
    let nameHtml = `<span class="font-semibold text-sm truncate" style="max-width:120px" title="${mainName}">${namePrefix}${mainName}${lockIndicator}</span>`;

    if (!isSample && !isWhite) {
         nameHtml += `<button class="edit-name-button-class ml-1 p-0.5 text-blue-500 hover:text-blue-700" title="Editar Nome"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-pencil-fill inline-block" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-2a.5.5 0 0 0 0 1h1.5v1.5h1.5v1.5h1.5v1.5A1.5 1.5 0 0 0 6.5 15h6a1.5 1.5 0 0 0 1.5-1.5V10h-2v2.707l-4.146 4.147A.5.5 0 0 1 6.032 13.85z"/></svg></button>`;
    }
    
    header.innerHTML = `<div class="flex items-center" data-field="header-content">${nameHtml}</div><button class="expand-details-button text-lg leading-none p-1" data-field="expand-button">▶</button>`;
    
    // --- Construção do Corpo (RGB) ---
    const body = document.createElement('div');
    body.className = 'roi-card-body';
    body.innerHTML = `
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1 text-sm">
            <div><strong class="text-red-600">R:</strong> <span data-field="rgb-r">...</span></div>
            <div><strong class="text-green-600">G:</strong> <span data-field="rgb-g">...</span></div>
            <div><strong class="text-blue-600">B:</strong> <span data-field="rgb-b">...</span></div>
            <div><strong>Média RGB:</strong> <span data-field="rgb-avg">...</span></div>
        </div>`;

    // --- Construção dos Detalhes (Outras Cores e Métricas) ---
    const details = document.createElement('div');
    details.className = 'roi-card-details hidden';
    details.innerHTML = `
        <div class="details-grid grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs p-2" data-field="color-data-grid">
            <div><strong>DP R:</strong> <span data-field="stdDev-r">...</span></div>
            <div><strong>DP G:</strong> <span data-field="stdDev-g">...</span></div>
            <div><strong>DP B:</strong> <span data-field="stdDev-b">...</span></div>
            <div><strong>Pixels:</strong> <span data-field="pixel-count">${roi.pixelCount || '...'}</span></div>
            <div><strong>Formato:</strong> ${roi.type === 'rect' ? 'Retangular' : 'Circular'}</div>
            <div><strong>Coords:</strong> (${roi.x.toFixed(0)},${roi.y.toFixed(0)})</div>
            <div><strong>Tam/Diâm:</strong> <span data-field="size">${roi.type === 'rect' ? `${roi.width.toFixed(0)}x${roi.height.toFixed(0)}` : `Ø${(roi.radius * 2).toFixed(0)}`}</span></div>
            <div><strong>HSV:</strong> <span data-field="hsv">...</span></div>
            <div><strong>HSL:</strong> <span data-field="hsl">...</span></div>
            <div><strong>CIELAB:</strong> <span data-field="lab">...</span></div>
            <div><strong>YCbCr:</strong> <span data-field="ycbcr">...</span></div>
            <div><strong>CMYK:</strong> <span data-field="cmyk">...</span></div>
            <div><strong>HunterLab:</strong> <span data-field="hunterLab">...</span></div>
            <div><strong>CIE XYZ:</strong> <span data-field="xyz">...</span></div>
        </div>
        <div data-field="analytical-metrics-container"></div>`;

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(details);

    // Aplica estado visual inicial
    updateRoiCardVisuals(card, roi);
    // Aplica dados de cor iniciais se já existirem
    if (roi.pixelCount > 0) {
        updateRoiCardData(card, roi);
    }
    
    return card;
}


// --- NOVAS FUNÇÕES CIRÚRGICAS ---

export function appendNewRoiCard(roi) {
    if (!dom.roiCardsContainer) return;
    log('domRenderer', 'perf', `Anexando novo card para ROI ID: ${roi.id}`);
    
    const cardElement = _buildRoiCardElement(roi);
    dom.roiCardsContainer.appendChild(cardElement);

    if (dom.noRoiMessage && !dom.noRoiMessage.classList.contains('hidden')) {
        dom.noRoiMessage.style.display = 'none';
    }
}

export function removeRoiCard(roiId) {
    if (!dom.roiCardsContainer) return;
    log('domRenderer', 'perf', `Removendo card da ROI ID: ${roiId}`);
    
    const cardToRemove = dom.roiCardsContainer.querySelector(`[data-roi-id="${roiId}"]`);
    if (cardToRemove) {
        cardToRemove.remove();
    }

    if (dom.roiCardsContainer.children.length === 0 && dom.noRoiMessage) {
        dom.noRoiMessage.style.display = 'block';
    }
}

export function updateRoiCardData(cardOrRoi, optionalRoi = null) {
    const roi = optionalRoi || cardOrRoi;
    const card = optionalRoi ? cardOrRoi : dom.roiCardsContainer.querySelector(`[data-roi-id="${roi.id}"]`);
    if (!card) return;

    log('domRenderer', 'perf', `Atualizando dados de cor no card da ROI ID: ${roi.id}`);
    const format = (val, dec = 3) => (val !== undefined && val !== null && !isNaN(parseFloat(val))) ? parseFloat(val).toFixed(dec) : 'N/D';
    
    _updateText(card, 'rgb-r', format(roi.rgb?.avgR));
    _updateText(card, 'rgb-g', format(roi.rgb?.avgG));
    _updateText(card, 'rgb-b', format(roi.rgb?.avgB));
    _updateText(card, 'rgb-avg', format(roi.rgb?.avgRGB));
    _updateText(card, 'stdDev-r', format(roi.rgb_stdDev?.r));
    _updateText(card, 'stdDev-g', format(roi.rgb_stdDev?.g));
    _updateText(card, 'stdDev-b', format(roi.rgb_stdDev?.b));
    _updateText(card, 'pixel-count', roi.pixelCount || '...');
    _updateText(card, 'hsv', roi.hsv ? `${format(roi.hsv.h, 0)}, ${format(roi.hsv.s, 1)}%, ${format(roi.hsv.v, 1)}%` : '...');
    _updateText(card, 'hsl', roi.hsl ? `${format(roi.hsl.h, 0)}, ${format(roi.hsl.s, 1)}%, ${format(roi.hsl.l, 1)}%` : '...');
    _updateText(card, 'lab', roi.lab ? `L*${format(roi.lab.l, 1)}, a*${format(roi.lab.a, 1)}, b*${format(roi.lab.b, 1)}` : '...');
    _updateText(card, 'ycbcr', roi.ycbcr ? `Y:${format(roi.ycbcr.y, 1)}, Cb:${format(roi.ycbcr.cb, 1)}, Cr:${format(roi.ycbcr.cr, 1)}` : '...');
    _updateText(card, 'cmyk', roi.cmyk ? `C:${format(roi.cmyk.c, 1)}%, M:${format(roi.cmyk.m, 1)}%, Y:${format(roi.cmyk.y, 1)}%, K:${format(roi.cmyk.k, 1)}%` : '...');
    _updateText(card, 'hunterLab', roi.hunterLab ? `L:${format(roi.hunterLab.l, 1)}, a:${format(roi.hunterLab.a, 1)}, b:${format(roi.hunterLab.b, 1)}` : '...');
    _updateText(card, 'xyz', roi.xyz ? `X:${format(roi.xyz.x, 1)}, Y:${format(roi.xyz.y, 1)}, Z:${format(roi.xyz.z, 1)}` : '...');
    _updateText(card, 'size', roi.type === 'rect' ? `${roi.width.toFixed(0)}x${roi.height.toFixed(0)}` : `Ø${(roi.radius * 2).toFixed(0)}`);

    const metricsContainer = card.querySelector('[data-field="analytical-metrics-container"]');
    if (metricsContainer) {
        if (roi.analyticalResponse && roi.analyticalResponse.length > 0) {
            let metricsHtml = '<div class="border-t mt-2 pt-2 text-xs"><h4 class="font-semibold text-gray-700 mb-1">Métricas Analíticas (SA)</h4><div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4">';
            roi.analyticalResponse.sort((a, b) => a.channel.localeCompare(b.channel)).forEach(metric => {
                const metricDef = findMetricByChannelName(metric.channel); // Agora usa a função global
                const displayName = metricDef ? metricDef.fullName : metric.channel;
                const formulaHint = metricDef ? `Fórmula: ${metricDef.formula}` : metric.channel;
                metricsHtml += `<div><strong title="${formulaHint}">${displayName}:</strong> ${format(metric.value, 4)}</div>`;
            });
            metricsHtml += '</div></div>';
            metricsContainer.innerHTML = metricsHtml;
        } else {
            metricsContainer.innerHTML = '';
        }
    }
}

export function updateRoiCardVisuals(cardOrRoi, optionalRoi = null) {
    const roi = optionalRoi || cardOrRoi;
    const card = optionalRoi ? cardOrRoi : dom.roiCardsContainer.querySelector(`[data-roi-id="${roi.id}"]`);
    if (!card) return;

    log('domRenderer', 'perf', `Atualizando visuais do card da ROI ID: ${roi.id}`);
    const { analyticalWhiteRoiId, selectionSet, editingRoiId, rois } = state.getState();

    card.classList.toggle('sample-bg', roi.isSample);
    card.classList.toggle('analytical-white-bg', roi.id === analyticalWhiteRoiId);
    card.classList.toggle('multi-selected', selectionSet.has(roi.id));
    card.classList.toggle('editing-roi', roi.id === editingRoiId);

    const headerContent = card.querySelector('[data-field="header-content"]');
    if (headerContent) {
        const sampleRois = rois.filter(r => r.isSample).sort((a, b) => a.id - b.id);
        let namePrefix = '';
        let mainName = roi.customName || roi.name;

        if (roi.id === analyticalWhiteRoiId) {
            namePrefix = '⭐ ';
            mainName = roi.customName || 'BRANCO';
        } else if (roi.isSample) {
            const sampleIndex = sampleRois.findIndex(r => r.id === roi.id);
            namePrefix = '🧪 ';
            mainName = roi.customName || `Amostra ${sampleIndex >= 0 ? sampleIndex + 1 : ''}`;
        }
        
        const lockIndicator = roi.isPositionLocked && roi.isSizeLocked ? ' 🔒' : (roi.isPositionLocked ? ' 🔒(P)' : (roi.isSizeLocked ? ' 🔒(T)' : ''));
        const nameSpan = headerContent.querySelector('span');
        if (nameSpan) {
            nameSpan.title = mainName;
            nameSpan.innerHTML = `${namePrefix}${mainName}${lockIndicator}`;
        }
    }
    
    const expandButton = card.querySelector('[data-field="expand-button"]');
    if (expandButton) {
        expandButton.textContent = roi.isDetailsExpanded ? '▼' : '▶';
    }

    const details = card.querySelector('.roi-card-details');
    if (details) {
        details.classList.toggle('hidden', !roi.isDetailsExpanded);
    }
}


// --- FUNÇÕES DE RENDERIZAÇÃO COMPLETAS (Mantidas para resets e inicialização) ---

export function renderRoiCards() {
    if (!dom.roiCardsContainer) return;
    log('domRenderer', 'info', 'Executando renderização completa da lista de ROIs.');
    
    dom.roiCardsContainer.innerHTML = '';
    const roisToDisplay = state.rois();

    if (roisToDisplay.length === 0) {
        if (dom.noRoiMessage) dom.noRoiMessage.style.display = 'block';
        return;
    }
    if (dom.noRoiMessage) dom.noRoiMessage.style.display = 'none';

    roisToDisplay.forEach(roi => {
        const cardElement = _buildRoiCardElement(roi);
        dom.roiCardsContainer.appendChild(cardElement);
    });
}

// --- FUNÇÕES DE RENDERIZAÇÃO EXISTENTES (Sem alterações) ---

export function updateRoiCardsSelection() {
    if (!dom.roiCardsContainer) return;
    log('domRenderer', 'perf', 'Executando atualização otimizada de seleção de cards.');

    const selectionSet = state.selectionSet();
    const editingId = state.editingRoiId();

    for (const card of dom.roiCardsContainer.children) {
        if (card.matches('.roi-card')) {
            const roiId = parseInt(card.dataset.roiId, 10);
            if (!isNaN(roiId)) {
                card.classList.toggle('multi-selected', selectionSet.has(roiId));
                card.classList.toggle('editing-roi', roiId === editingId);
            }
        }
    }
}

export function renderYAxisParameterOptions() {
    const container = dom.signalSelectorContainer;
    if (!container) return;

    const checkedParams = Array.from(container.querySelectorAll('input:checked')).map(cb => cb.value);
    
    container.innerHTML = '';
    const roisWithResponses = state.rois().some(r => r.analyticalResponse && r.analyticalResponse.length > 0);

    if (!roisWithResponses) {
        container.innerHTML = `<p class="text-xs text-gray-500 p-4 text-center">Calcule todas as métricas no Passo 1 para ver os parâmetros disponíveis.</p>`;
        return;
    }

    const systemOrder = ['RGB', 'CIELAB', 'HSV', 'HSL', 'YCbCr', 'CMYK', 'HunterLab', 'XYZ', 'Sintéticos (Inter-sistema)'];
    
    for (const systemName of systemOrder) {
        if (!analyticalEquationsBySystem[systemName]) continue;

        const systemAccordion = document.createElement('div');
        systemAccordion.className = 'accordion-item';
        systemAccordion.dataset.systemName = systemName; 

        const systemHeader = document.createElement('div');
        systemHeader.className = 'accordion-header flex items-center cursor-pointer p-2 bg-gray-100 hover:bg-gray-200 rounded-md';
        systemHeader.innerHTML = `<span class="accordion-icon font-bold text-lg mr-2 transition-transform">▶</span><h5 class="font-semibold text-gray-800 text-sm">${systemName}</h5>`;
        
        const systemBody = document.createElement('div');
        systemBody.className = 'accordion-body hidden pl-4 pt-1 border-l-2 ml-3';

        const subGroups = analyticalEquationsBySystem[systemName];
        for (const groupName in subGroups) {
            const subGroupAccordion = document.createElement('div');
            subGroupAccordion.className = 'accordion-item mt-1';
            subGroupAccordion.dataset.groupName = groupName;
            
            const subGroupHeader = document.createElement('div');
            subGroupHeader.className = 'accordion-header flex items-center cursor-pointer py-1';
            subGroupHeader.innerHTML = `<span class="accordion-icon font-bold text-md mr-2 transition-transform">▶</span><h6 class="text-xs font-semibold text-gray-600">${groupName}</h6>`;
            
            const subGroupBody = document.createElement('div');
            subGroupBody.className = 'accordion-body hidden pl-5';

            const equations = subGroups[groupName];
            equations.forEach(equation => {
                const channelName = `SA (${systemName} - ${equation.text})`;
                const div = document.createElement('div');
                div.className = 'flex items-center my-1';
                const isChecked = checkedParams.includes(channelName);
                
                const displayName = equation.fullName || equation.text;

                div.innerHTML = `
                    <input type="checkbox" id="y-axis-${channelName}" name="y-axis-param" value="${channelName}" class="form-checkbox h-3.5 w-3.5">
                    <label for="y-axis-${channelName}" class="text-sm cursor-pointer ml-2 flex items-center justify-between w-full">
                        <span class="flex-grow">${displayName}</span>
                        <span class="metric-info-icon" data-metric-id="${equation.id}" title="Ver detalhes da métrica">i</span>
                    </label>
                `;
                div.querySelector('input').checked = isChecked;
                subGroupBody.appendChild(div);
            });

            subGroupAccordion.appendChild(subGroupHeader);
            subGroupAccordion.appendChild(subGroupBody);
            systemBody.appendChild(subGroupAccordion);
        }

        systemAccordion.appendChild(systemHeader);
        systemAccordion.appendChild(systemBody);
        container.appendChild(systemAccordion);
    }
}

export function renderSignalSearchResults(filteredMetrics, searchTerm) {
    const container = dom.signalSelectorContainer;
    if (!container) return;

    log('domRenderer', 'info', `Renderizando ${filteredMetrics.length} resultados de busca para o termo: "${searchTerm}".`);

    const checkedParams = new Set(Array.from(container.querySelectorAll('input:checked')).map(cb => cb.value));
    filteredMetrics.forEach(metric => {
        if (metric.isChecked) {
            checkedParams.add(metric.channelName);
        }
    });

    container.innerHTML = ''; 

    if (filteredMetrics.length === 0) {
        container.innerHTML = `<p class="text-sm text-gray-500 p-4 text-center">Nenhum resultado encontrado para "<strong>${searchTerm}</strong>".</p>`;
        return;
    }

    filteredMetrics.forEach(metric => {
        const div = document.createElement('div');
        div.className = 'flex items-center my-1 p-2 hover:bg-gray-50 rounded-md';
        
        const isChecked = checkedParams.has(metric.channelName);
        const displayName = metric.equation.fullName || metric.equation.text;

        div.innerHTML = `
            <input type="checkbox" id="y-axis-${metric.channelName}" name="y-axis-param" value="${metric.channelName}" class="form-checkbox h-3.5 w-3.5">
            <label for="y-axis-${metric.channelName}" class="text-sm cursor-pointer ml-3 flex-grow flex items-center justify-between">
                <span class="flex-grow">
                    ${displayName}
                    <span class="text-xs text-gray-400 ml-2">(${metric.systemName} &gt; ${metric.groupName})</span>
                </span>
                <span class="metric-info-icon" data-metric-id="${metric.equation.id}" title="Ver detalhes da métrica">i</span>
            </label>
        `;
        div.querySelector('input').checked = isChecked;
        container.appendChild(div);
    });
}

export function renderCalibrationSetupTable() {
    const tableElement = document.getElementById('calibrationSetupTable');
    if (!tableElement) {
        log('domRenderer', 'warn', 'Elemento da tabela de calibração não encontrado no DOM.');
        return;
    }

    log('domRenderer', 'info', 'Iniciando renderização da tabela de calibração.');

    const roisForTable = state.rois()
        .filter(r => r.calibrationOrder !== null && r.calibrationOrder !== undefined);

    roisForTable.sort((a, b) => a.calibrationOrder - b.calibrationOrder);
    
    log('domRenderer', 'data', `Renderizando ${roisForTable.length} ROIs na tabela de calibração.`, roisForTable.map(r => `ID: ${r.id} (Ordem: ${r.calibrationOrder})`));

    const headerHTML = `
        <thead class="bg-gray-100 sticky top-0 z-10">
            <tr>
                <th class="p-1 sm:p-2 text-center font-semibold text-gray-600 text-xs w-[10%]" title="Arrastar para reordenar"></th>
                <th class="p-1 sm:p-2 text-center font-semibold text-gray-600 text-xs w-[15%]">Ponto #</th>
                <th class="p-1 sm:p-2 text-left font-semibold text-gray-600 text-xs w-[35%]">Nome ROI</th>
                <th class="p-1 sm:p-2 text-left font-semibold text-gray-600 text-xs w-[25%]">Concentração</th>
                <th id="selectAllHeaderCell" class="p-1 sm:p-2 text-center font-semibold text-gray-600 text-xs w-[15%]">
                    <label for="selectAllForCalibration" class="flex justify-center items-center cursor-pointer unselectable">
                         <span class="hidden sm:inline">Incluir</span>
                         <input type="checkbox" id="selectAllForCalibration" title="Selecionar Todas" class="form-checkbox !ml-1 sm:!ml-2"/>
                    </label>
                </th>
            </tr>
        </thead>
    `;

    let bodyHTML;
    if (roisForTable.length === 0) {
        bodyHTML = `<tbody><tr><td colspan="5" class="text-center text-xs text-gray-500 p-4">Nenhuma ROI de calibração disponível. Defina ROIs como Padrão na aba 'Dados ROI'.</td></tr></tbody>`;
    } else {
        bodyHTML = `<tbody id="calibrationSetupTableBody">` + roisForTable.map((roi, index) => {
            const stableName = roi.customName || roi.name;
            const isConcentrationSet = roi.concentration !== null;
            const isDisabled = !isConcentrationSet;
            const isChecked = roi.useInCalibration && isConcentrationSet;

            return `
                <tr class="border-b calibration-row" data-roi-id="${roi.id}" draggable="true">
                    <td class="drag-handle-cell p-1 text-center align-middle" title="Arrastar para reordenar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-grip-vertical inline-block text-gray-400 cursor-grab" viewBox="0 0 16 16"><path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>
                    </td>
                    <td class="p-1 sm:p-2 text-center align-middle text-sm font-medium text-gray-500">${index + 1}</td>
                    <td class="p-1 sm:p-2 text-left align-middle text-sm text-gray-800 truncate" title="${stableName}">${stableName}</td>
                    <td class="p-1 sm:p-2 align-middle">
                        <input type="number" step="any" class="form-input w-full text-xs p-1" data-roi-id="${roi.id}" placeholder="Ex: 0.5" value="${roi.concentration ?? ''}">
                    </td>
                    <td class="p-1 sm:p-2 text-center align-middle flex justify-center items-center">
                        <input type="checkbox" class="form-checkbox calibration-checkbox" data-roi-id="${roi.id}" ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
                    </td>
                </tr>
            `;
        }).join('') + `</tbody>`;
    }
    
    tableElement.innerHTML = headerHTML + bodyHTML;
    
    const selectAllCheckbox = document.getElementById('selectAllForCalibration');
    if (selectAllCheckbox) {
        const allChecked = roisForTable.length > 0 && roisForTable.every(r => r.useInCalibration);
        selectAllCheckbox.checked = allChecked;
    }
}

function _buildPredictionGroupHtml(predictions, title, titleColor, unit) {
    if (!predictions || predictions.length === 0) return '';

    const itemsHtml = predictions.map(p => {
        const r2Value = p.r2 ? p.r2.toFixed(4) : 'N/A';
        const concentrationDisplay = p.concentration !== null ? p.concentration.toFixed(4) : 'N/D';
        const statusIndicator = _getPredictionStatusIndicator(p.status);
        const metricDef = findMetricByChannelName(p.parameter);
        const displayName = metricDef ? metricDef.fullName : p.parameter;

        return `
            <div class="detail-card text-sm">
                <strong>Parâmetro:</strong> ${displayName}<br>
                <div class="flex items-center">
                    <strong>Concentração Prevista:</strong>
                    <span class="ml-1">${concentrationDisplay} ${unit}</span>${statusIndicator}
                </div>
                <div class="text-gray-600 mt-1"><strong>Equação:</strong> ${p.equation}</div>
                <div class="text-gray-600"><strong>R²:</strong> ${r2Value}</div>
            </div>`;
    }).join('');

    return `
        <h4 class="font-semibold text-sm my-2 ${titleColor}">${title}</h4>
        ${itemsHtml}
    `;
}

// --- INÍCIO DA ALTERAÇÃO ---

export function renderSampleIdentificationTable() {
    if (!dom.sampleIdentificationContainer) return;

    const allRois = state.rois();
    const sampleRois = allRois.filter(r => r.isSample);
    const sortedSampleRois = [...sampleRois].sort((a,b) => a.id - b.id);

    if (sampleRois.length === 0) {
        dom.sampleIdentificationContainer.innerHTML = '<p class="text-sm text-center text-gray-500 p-4 bg-gray-50 rounded-md">Nenhuma ROI foi definida como amostra.</p>';
        return;
    }
    
    let tableHTML = `<table class="sample-id-table w-full"><thead><tr><th>Nome da Amostra</th><th>Descrição da Amostra</th><th>Resultados</th></tr></thead><tbody>`;
    
    sortedSampleRois.forEach((roi, index) => {
        const predictions = [...(roi.predictedConcentrations || [])];
        const descriptionDisplay = roi.sampleDescription || '<span class="text-gray-400 italic">Clique para adicionar...</span>';
        
        // CORREÇÃO: Usar o nome da amostra em vez do ID interno.
        const sampleName = roi.customName || `Amostra ${index + 1}`;
        
        // Lógica para encontrar o melhor resultado para exibição principal
        const bestPrediction = predictions.find(p => p.status === 'valid') || predictions.sort((a, b) => b.r2 - a.r2)[0] || null;

        let bestResultHtml = 'Nenhuma previsão disponível.';
        if (bestPrediction) {
            const bestModelR2 = bestPrediction.r2 ? bestPrediction.r2.toFixed(4) : 'N/A';
            const bestMetricDef = findMetricByChannelName(bestPrediction.parameter);
            const bestMetricName = bestMetricDef ? bestMetricDef.fullName : (bestPrediction.parameter || '');
            const concentrationDisplay = bestPrediction.concentration !== null ? bestPrediction.concentration.toFixed(4) : 'N/D';
            const statusIndicator = _getPredictionStatusIndicator(bestPrediction.status);

            bestResultHtml = `
                <div class="flex justify-between items-center">
                    <div>
                        <div class="flex items-center">
                           <strong class="text-base">${concentrationDisplay}</strong>${statusIndicator}
                        </div>
                        <span class="text-sm text-gray-700 ml-1">${state.currentConcentrationUnit()}</span>
                        <br><span class="text-xs text-gray-500">(Parâmetro: ${bestMetricName} | R²=${bestModelR2})</span>
                    </div>
                    ${predictions.length > 1 ? `<span class="toggle-details-btn p-1 cursor-pointer text-lg" title="Ver todos os resultados">▶</span>` : ''}
                </div>`;
        }
        
        // Lógica para criar a UI de accordion (sanfona) para os resultados
        let detailsHtml = '';
        if (predictions.length > 0) {
            const validPredictions = predictions.filter(p => p.status === 'valid');
            const extrapolatedPredictions = predictions.filter(p => p.status.startsWith('extrapolated'));
            const invalidPredictions = predictions.filter(p => p.status.startsWith('invalid'));

            // Renderiza resultados válidos diretamente
            detailsHtml += _buildPredictionGroupHtml(validPredictions, '✅ Resultados Válidos', 'text-green-700', state.currentConcentrationUnit());

            const hiddenResultsCount = extrapolatedPredictions.length + invalidPredictions.length;
            if (hiddenResultsCount > 0) {
                detailsHtml += `
                    <details class="results-accordion">
                        <summary class="cursor-pointer text-sm font-medium text-sky-700 hover:underline py-2">
                            Ver ${hiddenResultsCount} resultado(s) extrapolado(s) ou inválido(s)
                        </summary>
                        <div class="pl-2 border-l-2 border-gray-200 mt-2">
                            ${_buildPredictionGroupHtml(extrapolatedPredictions, '⚠️ Resultados Extrapolados', 'text-amber-700', state.currentConcentrationUnit())}
                            ${_buildPredictionGroupHtml(invalidPredictions, '❌ Resultados Inválidos', 'text-red-700', state.currentConcentrationUnit())}
                        </div>
                    </details>
                `;
            }
        } else {
             detailsHtml = '<p class="text-xs text-gray-500 mt-3 p-2">Nenhum resultado para exibir. Gere a curva analítica.</p>';
        }

        tableHTML += `
            <tr class="sample-main-row" data-roi-id="${roi.id}">
                <td data-label="Nome da Amostra">${sampleName}</td>
                <td data-label="Descrição"><div class="sample-description-display p-2 border border-dashed border-gray-400 rounded-md cursor-pointer" data-roi-id="${roi.id}">${descriptionDisplay}</div></td>
                <td data-label="Melhor Resultado">${bestResultHtml}</td>
            </tr>
            <tr class="sample-detail-row hidden"><td colspan="3"><div class="p-3 bg-gray-50">${detailsHtml}</div></td></tr>`;
    });
    tableHTML += `</tbody></table>`;
    dom.sampleIdentificationContainer.innerHTML = tableHTML;
}

// --- FIM DA ALTERAÇÃO ---


export function renderSampleResultsCards() {
    if (!dom.sampleResultsContainer) return;

    const sampleRois = state.rois().filter(r => r.isSample);
    const unit = state.currentConcentrationUnit();

    if (sampleRois.length === 0) {
        dom.sampleResultsContainer.innerHTML = `<p class="text-sm text-gray-500 p-4 text-center">Marque uma ou mais ROIs como "Amostra" para ver as previsões aqui.</p>`;
        return;
    }
    
    if (state.lastRegressions().length === 0) {
        dom.sampleResultsContainer.innerHTML = `<p class="text-sm text-gray-500 p-4 text-center">Gere uma curva analítica para ver as previsões para as amostras.</p>`;
        return;
    }

    let allCardsHtml = '';
    const sortedSampleRois = sampleRois.sort((a,b) => a.id - b.id);

    sortedSampleRois.forEach((roi, index) => {
        const name = roi.customName || `Amostra ${index + 1}`;
        const description = roi.sampleDescription ? `<p class="text-xs text-gray-500 mt-1">${roi.sampleDescription}</p>` : '';

        let predictionsHtml = '<p class="text-xs text-gray-500 p-2">Nenhuma previsão disponível para esta amostra.</p>';
        if (roi.predictedConcentrations && roi.predictedConcentrations.length > 0) {
            
            const validPredictions = roi.predictedConcentrations.filter(p => p.status === 'valid').sort((a, b) => b.r2 - a.r2);
            const extrapolatedPredictions = roi.predictedConcentrations.filter(p => p.status.startsWith('extrapolated')).sort((a, b) => b.r2 - a.r2);
            // --- INÍCIO DA ALTERAÇÃO ---
            // Atualiza a lógica para incluir o novo status 'invalid_negative_result'
            const invalidPredictions = roi.predictedConcentrations.filter(p => p.status.startsWith('invalid')).sort((a, b) => b.r2 - a.r2);
            // --- FIM DA ALTERAÇÃO ---

            const buildGroupHtml = (predictions, title, titleColor) => {
                if(predictions.length === 0) return '';
                let html = `<h5 class="font-semibold text-xs mt-3 mb-1 p-1 rounded-sm ${titleColor}">${title}</h5>`;
                html += predictions.map(p => {
                    const r2 = p.r2 ? p.r2.toFixed(4) : 'N/A';
                    const metricDef = findMetricByChannelName(p.parameter);
                    const displayName = metricDef ? metricDef.fullName : p.parameter;
                    const formulaHint = metricDef ? `Fórmula: ${metricDef.formula}` : p.parameter;
                    const concentrationDisplay = p.concentration !== null ? p.concentration.toFixed(4) : 'N/D';
                    const statusIndicator = _getPredictionStatusIndicator(p.status);

                    return `
                        <div class="flex justify-between items-center py-2 px-2 my-1 rounded-md border border-gray-200">
                            <div class="text-sm flex-grow">
                                <div class="font-semibold text-gray-800 flex items-center">${concentrationDisplay}<span class="text-xs text-gray-600 ml-1">${unit}</span>${statusIndicator}</div>
                                <p class="text-xs text-gray-500" title="${formulaHint}">${displayName}</p>
                            </div>
                            <div class="text-xs text-right text-gray-500 pl-2">
                                <span>R²=${r2}</span>
                            </div>
                        </div>
                    `;
                }).join('');
                return html;
            };

            predictionsHtml = 
                buildGroupHtml(validPredictions, '✅ Resultados Válidos', 'bg-green-100 text-green-800') +
                buildGroupHtml(extrapolatedPredictions, '⚠️ Resultados Extrapolados', 'bg-amber-100 text-amber-800') +
                buildGroupHtml(invalidPredictions, '❌ Resultados Inválidos', 'bg-red-100 text-red-800');
        }

        allCardsHtml += `
            <div class="result-card mb-4">
                <div class="result-card-header">
                    <div class="flex-grow">
                        <h4 class="font-semibold text-gray-800">🧪 ${name}</h4>
                        ${description}
                    </div>
                </div>
                <div class="result-card-body">
                    ${predictionsHtml || '<p class="text-xs text-gray-500 p-2">Nenhuma previsão pôde ser calculada para esta amostra.</p>'}
                </div>
            </div>
        `;
    });

    dom.sampleResultsContainer.innerHTML = allCardsHtml;
}

function _formatDisplayValue(num, notApplicableSymbol = '—') {
    if (num === null || num === undefined) {
        return notApplicableSymbol;
    }
    if (isNaN(num)) {
        return 'N/D';
    }
    if (num === 0) return '0.0000';
    if (Math.abs(num) > 1000 || (Math.abs(num) < 0.001 && Math.abs(num) > 0)) {
        return num.toExponential(3);
    }
    return num.toFixed(4);
}

export function renderQualityControlPanel(modelsToDisplay) {
    let container = document.getElementById('qualityControlPanelContainer');
    if (!container && dom.step4Content) {
        container = document.createElement('div');
        container.id = 'qualityControlPanelContainer';
        container.className = 'my-4';
        if (dom.regressionEquationsContainer) {
            dom.regressionEquationsContainer.after(container);
        } else {
            dom.step4Content.appendChild(container);
        }
    }

    if (!container) {
        log('domRenderer', 'error', 'Não foi possível encontrar ou criar o container para o painel de QC.');
        return;
    }

    if (modelsToDisplay.length === 0) {
        container.innerHTML = '';
        container.classList.add('hidden');
        return;
    }
    
    const isExpanded = state.isQualityPanelExpanded();
    const bodyClass = isExpanded ? '' : 'hidden';
    const iconClass = isExpanded ? 'rotate-90' : '';

    const tableRows = modelsToDisplay.map(model => {
        const metricDef = findMetricByChannelName(model.parameter);
        const displayName = metricDef ? metricDef.fullName : model.parameter;
        const quality = model.quality || {};
        const range = quality.range ? `${_formatDisplayValue(quality.range.min)} - ${_formatDisplayValue(quality.range.max)}` : '—';
        
        const sensitivity = model.type === 'linear' ? _formatDisplayValue(model.coefficients.m) : '—';
        const syx = _formatDisplayValue(quality.Syx);
        const lod = _formatDisplayValue(quality.lod);
        const loq = _formatDisplayValue(quality.loq);

        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-2 text-xs truncate" title="${displayName}">${displayName}</td>
                <td class="p-2 text-xs text-center font-semibold">${model.type === 'linear' ? 'Linear' : 'Polinomial'}</td>
                <td class="p-2 text-xs text-center font-mono">${_formatDisplayValue(model.r2)}</td>
                <td class="p-2 text-xs text-center font-mono">${sensitivity}</td>
                <td class="p-2 text-xs text-center font-mono">${syx}</td>
                <td class="p-2 text-xs text-center font-mono">${lod}</td>
                <td class="p-2 text-xs text-center font-mono">${loq}</td>
                <td class="p-2 text-xs text-center font-mono">${range}</td>
            </tr>
        `;
    }).join('');

    const panelHTML = `
        <div class="analysis-section accordion-item">
            <div class="accordion-header flex items-center justify-between cursor-pointer p-2 bg-gray-50 hover:bg-gray-100 rounded-t-md border">
                <h4 class="font-semibold text-gray-700 text-sm">Painel de Controle de Qualidade</h4>
                <span class="accordion-icon font-bold text-lg transition-transform ${iconClass}">▶</span>
            </div>
            <div class="accordion-body ${bodyClass} border border-t-0 rounded-b-md p-1">
                <div class="overflow-x-auto">
                    <table class="min-w-full">
                        <thead class="bg-gray-100">
                            <tr>
                                <th class="p-2 text-left text-xs font-semibold text-gray-600 cursor-pointer" data-sort-by="parameter" title="Ordenar por Parâmetro"><span>Parâmetro</span></th>
                                <th class="p-2 text-center text-xs font-semibold text-gray-600"><span>Modelo</span></th>
                                <th class="p-2 text-center text-xs font-semibold text-gray-600 cursor-pointer" data-sort-by="r2" title="Ordenar por Coeficiente de Determinação (R²)"><span>R² ↓</span></th>
                                <th class="p-2 text-center text-xs font-semibold text-gray-600 cursor-pointer" data-sort-by="sensitivity" title="Ordenar por Coeficiente Angular (Sensibilidade)"><span>Sensibilidade</span></th>
                                <th class="p-2 text-center text-xs font-semibold text-gray-600 cursor-pointer" data-sort-by="Syx" title="Ordenar por Erro Padrão da Regressão"><span>S<sub>y/x</sub></span></th>
                                <th class="p-2 text-center text-xs font-semibold text-gray-600 cursor-pointer" data-sort-by="lod" title="Ordenar por Limite de Detecção"><span>LOD</span></th>
                                <th class="p-2 text-center text-xs font-semibold text-gray-600 cursor-pointer" data-sort-by="loq" title="Ordenar por Limite de Quantificação"><span>LOQ</span></th>
                                <th class="p-2 text-center text-xs font-semibold text-gray-600"><span>Faixa de Calibração</span></th>
                                <th class="p-2 text-center text-xs font-semibold text-gray-600">
                                    <button id="quality-panel-info-button" title="Informações sobre as métricas" class="p-1 rounded-full hover:bg-gray-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle-fill text-sky-700" viewBox="0 0 16 16">
                                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zM8 4a.905.905 0 0 1 .9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995A.905.905 0 0 1 8 4zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                                        </svg>
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
                 <p class="text-xs text-gray-500 mt-2 p-2">LOD, LOQ e Sensibilidade são aplicáveis apenas a modelos lineares. Clique nos cabeçalhos para reordenar.</p>
            </div>
        </div>
    `;

    container.innerHTML = panelHTML;
    container.classList.remove('hidden');
    log('domRenderer', 'success', 'Painel de Controle de Qualidade renderizado com sucesso.');
}