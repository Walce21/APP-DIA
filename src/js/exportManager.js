// js/exportManager.js

import * as state from './state.js';
import * as modalManager from './modalManager.js';
import * as dom from './domElements.js';

const metricMap = new Map();
for (const systemName in analyticalEquationsBySystem) {
    const subGroups = analyticalEquationsBySystem[systemName];
    for (const groupName in subGroups) {
        const equations = subGroups[groupName];
        equations.forEach(equation => {
            const channelName = `SA (${systemName} - ${equation.text})`;
            metricMap.set(channelName, equation);
        });
    }
}

function _getExcelStyles() { return { border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }, centerAlign: { vertical: 'middle', horizontal: 'center' }, tableTitleStyle: { font: { bold: true, size: 12 } }, groupHeaderStyle: { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }, alignment: { vertical: 'middle', horizontal: 'center' }, border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } } }, subHeaderStyle: { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }, alignment: { vertical: 'middle', horizontal: 'center' }, border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } } }, dataCellStyle: { border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } } }, bandedDataCellStyle: { border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } } } }; }

function _buildReportSheet(workbook, styles) {
    const sheet = workbook.addWorksheet('Relatório de Análise');
    const addStyledRow = (values, style) => { const row = sheet.addRow(values); row.eachCell({ includeEmpty: true }, cell => { cell.style = style; }); return row; };
    let titleRow = sheet.addRow(["Tabela 1: Concentrações Estimadas para Amostras"]);
    titleRow.font = styles.tableTitleStyle.font;
    sheet.addRow([]);
    const sampleRois = state.rois().filter(r => r.isSample);
    const regressions = state.lastRegressions();

    if (sampleRois.length > 0 && regressions.length > 0) {
        const uniqueParams = [...new Set(regressions.flatMap(reg => reg.models.map(model => reg.parameter)))].sort();
        const paramHeaders = uniqueParams.map(p => metricMap.get(p)?.fullName || p);
        addStyledRow([`Nome da Amostra / Parâmetro (${state.currentConcentrationUnit()})`, ...paramHeaders], styles.subHeaderStyle);
        sampleRois.forEach(roi => {
            const predictionsMap = new Map(roi.predictedConcentrations.map(p => [p.parameter, p.concentration]));
            const rowValues = [roi.customName || roi.name, ...uniqueParams.map(param => predictionsMap.has(param) ? Number(predictionsMap.get(param)) : '-')];
            addStyledRow(rowValues, styles.dataCellStyle);
        });
    } else { sheet.addRow(["Nenhuma amostra ou curva analítica disponível para gerar previsões."]); }

    sheet.addRow([]);
    titleRow = sheet.addRow(["Tabela 2: Modelos de Curva Analítica Gerados"]);
    titleRow.font = styles.tableTitleStyle.font;
    addStyledRow(["Parâmetro (Nome Completo)", "Tipo de Modelo", "Equação", "Coeficiente de Correlação (R²)"], styles.subHeaderStyle);

    if (regressions.length > 0) {
        regressions.forEach(reg => {
            const metricDef = metricMap.get(reg.parameter);
            const displayName = metricDef ? metricDef.fullName : reg.parameter;
            
            reg.models.forEach(model => {
                let equationStr = 'N/A';
                if (model.type === 'linear' && model.coefficients) {
                    const { m, b } = model.coefficients;
                    equationStr = `y = ${Number(m).toFixed(5)}x + ${Number(b).toFixed(5)}`;
                } else if (model.type === 'polynomial' && model.coefficients) {
                    const { a, b, c } = model.coefficients;
                    equationStr = `y = ${Number(a).toFixed(5)}x² + ${Number(b).toFixed(5)}x + ${Number(c).toFixed(5)}`;
                }
                const modelType = model.type.charAt(0).toUpperCase() + model.type.slice(1);
                addStyledRow([displayName, modelType, equationStr, Number(model.r2)], styles.dataCellStyle);
            });
        });
    } else { addStyledRow(["Nenhuma curva analítica gerada."], styles.dataCellStyle); }
    
    sheet.addRow([]);
    titleRow = sheet.addRow(["Tabela 3: Pontos Utilizados na Curva Analítica"]);
    titleRow.font = styles.tableTitleStyle.font;
    const calibrationRois = state.rois().filter(r => r.useInCalibration && r.concentration !== null);
    if (regressions.length > 0 && calibrationRois.length > 0) {
        regressions.forEach((reg) => {
            const metricDef = metricMap.get(reg.parameter);
            const displayName = metricDef ? metricDef.fullName : reg.parameter;
            sheet.addRow([]);
            addStyledRow([`Dados da Curva Analítica para: ${displayName}`], { font: styles.tableTitleStyle.font });
            addStyledRow([`Concentração (${state.currentConcentrationUnit()})`, "Sinal Analítico (SA)", "Nome da ROI Padrão"], styles.subHeaderStyle);
            calibrationRois.forEach(roi => {
                const response = roi.analyticalResponse.find(r => r.channel === reg.parameter);
                if (response) addStyledRow([Number(roi.concentration), Number(response.value), roi.customName || roi.name], styles.dataCellStyle);
            });
        });
    } else { sheet.addRow(["Não há dados de calibração para detalhar."]); }
    
    sheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
            const cellLength = cell.value ? cell.value.toString().length : 0;
            if (cellLength > maxLength) {
                maxLength = cellLength;
            }
        });
        column.width = maxLength < 12 ? 12 : maxLength + 4;
    });
}

function _buildDataSheet(workbook, styles) {
    const sheet = workbook.addWorksheet('Dados Consolidados');
    const sortedRois = [...state.rois()].sort((a, b) => { const typeA = (a.id === state.analyticalWhiteRoiId()) ? 0 : (a.isSample ? 2 : 1); const typeB = (b.id === state.analyticalWhiteRoiId()) ? 0 : (b.isSample ? 2 : 1); return (typeA !== typeB) ? typeA - typeB : (a.calibrationOrder || a.id) - (b.calibrationOrder || b.id); });
    const systemOrder = ['RGB', 'CIELAB', 'HSV', 'HSL', 'YCbCr', 'CMYK', 'HunterLab', 'XYZ', 'Sintéticos (Inter-sistema)'];
    const allAnalyticalChannels = [...new Set(state.rois().flatMap(r => r.analyticalResponse.map(resp => resp.channel)))].sort((a, b) => { const getSystem = (s) => s.substring(s.indexOf('(') + 1, s.indexOf(' - ')); const systemA = systemOrder.indexOf(getSystem(a)), systemB = systemOrder.indexOf(getSystem(b)); return (systemA !== systemB) ? systemA - systemB : a.localeCompare(b); });
    const analyticalChannelHeaders = allAnalyticalChannels.map(ch => metricMap.get(ch)?.fullName || ch);

    const groupHeaders = [{ name: "Informações da ROI", count: 11 }, { name: "Sistema RGB", count: 6 }, { name: "Sistema HSV", count: 3 }, { name: "Sistema HSL", count: 3 }, { name: "Sistema CIELAB", count: 3 }, { name: "Sistema YCbCr", count: 3 }, { name: "Sistema CMYK", count: 4}, { name: "Sistema CIE-XYZ", count: 3}, { name: "Sistema HunterLab", count: 3}];
    const analyticalChannelsBySystem = allAnalyticalChannels.reduce((acc, channel) => { const system = channel.substring(channel.indexOf('(') + 1, channel.indexOf(' - ')); if (!acc[system]) acc[system] = []; acc[system].push(channel); return acc; }, {});
    systemOrder.forEach(system => { if (analyticalChannelsBySystem[system]) groupHeaders.push({ name: `Respostas Analíticas - ${system}`, count: analyticalChannelsBySystem[system].length }); });
    const topHeaderRow = sheet.addRow(groupHeaders.flatMap(g => [g.name, ...Array(g.count - 1).fill(null)]));
    topHeaderRow.eachCell({ includeEmpty: true }, cell => { cell.style = styles.groupHeaderStyle; });
    groupHeaders.reduce((acc, group) => { if (group.count > 1) sheet.mergeCells(1, acc, 1, acc + group.count - 1); return acc + group.count; }, 1);

    const subHeaders = ["Tipo de ROI", "ID", "Nome", "Concentração", "Pixels", "Coord X", "Coord Y", "Largura", "Altura/Raio", "É Amostra?", "É Branco?", "R Média", "G Média", "B Média", "DP R", "DP G", "DP B", "HSV H", "HSV S", "HSV V", "HSL H", "HSL S", "HSL L", "CIELAB L*", "CIELAB a*", "CIELAB b*", "YCbCr Y", "YCbCr Cb", "YCbCr Cr", "CMYK C", "CMYK M", "CMYK Y", "CMYK K", "XYZ X", "XYZ Y", "XYZ Z", "Hunter L", "Hunter a", "Hunter b", ...analyticalChannelHeaders];
    sheet.addRow(subHeaders).eachCell(cell => cell.style = styles.subHeaderStyle);
    sortedRois.forEach((roi, index) => {
        const getRoiTypeString = (r) => (r.id === state.analyticalWhiteRoiId()) ? "Branco" : (r.isSample ? "Amostra" : "Ponto da Curva");
        const analyticalValues = new Map(roi.analyticalResponse.map(r => [r.channel, r.value]));
        const rowValues = [getRoiTypeString(roi), roi.id, roi.customName || roi.name, cleanVal(roi.concentration), roi.pixelCount, cleanVal(roi.x), cleanVal(roi.y), roi.type === 'rect' ? cleanVal(roi.width) : '', roi.type === 'rect' ? cleanVal(roi.height) : cleanVal(roi.radius), roi.isSample ? "Sim" : "Não", roi.id === state.analyticalWhiteRoiId() ? "Sim" : "Não", cleanVal(roi.rgb?.avgR), cleanVal(roi.rgb?.avgG), cleanVal(roi.rgb?.avgB), cleanVal(roi.rgb_stdDev?.r), cleanVal(roi.rgb_stdDev?.g), cleanVal(roi.rgb_stdDev?.b), cleanVal(roi.hsv?.h), cleanVal(roi.hsv?.s), cleanVal(roi.hsv?.v), cleanVal(roi.hsl?.h), cleanVal(roi.hsl?.s), cleanVal(roi.hsl?.l), cleanVal(roi.lab?.l), cleanVal(roi.lab?.a), cleanVal(roi.lab?.b), cleanVal(roi.ycbcr?.y), cleanVal(roi.ycbcr?.cb), cleanVal(roi.ycbcr?.cr), cleanVal(roi.cmyk?.c), cleanVal(roi.cmyk?.m), cleanVal(roi.cmyk?.y), cleanVal(roi.cmyk?.k), cleanVal(roi.xyz?.x), cleanVal(roi.xyz?.y), cleanVal(roi.xyz?.z), cleanVal(roi.hunterLab?.l), cleanVal(roi.hunterLab?.a), cleanVal(roi.hunterLab?.b), ...allAnalyticalChannels.map(channel => analyticalValues.has(channel) ? cleanVal(analyticalValues.get(channel)) : '')];
        sheet.addRow(rowValues).eachCell({ includeEmpty: true }, cell => cell.style = (index % 2 === 0) ? styles.bandedDataCellStyle : styles.dataCellStyle);
    });
    sheet.columns.forEach(column => { let maxLength = 0; column.eachCell({ includeEmpty: true }, cell => { maxLength = Math.max(maxLength, cell.value ? cell.value.toString().length : 10); }); column.width = maxLength < 10 ? 10 : maxLength + 4; });
}


function _addHeaderAndFooter(doc, data, settings, logos, timestamp) {
    const PAGE_WIDTH = doc.internal.pageSize.getWidth(), PAGE_HEIGHT = doc.internal.pageSize.getHeight(), MARGIN = 15;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    const drawLogo = (logoData, x, y) => { if (!logoData) return; try { const MAX_LOGO_WIDTH = 35, MAX_LOGO_HEIGHT = 20; let w = logoData.width, h = logoData.height, ratio = w / h; if (w > MAX_LOGO_WIDTH) { w = MAX_LOGO_WIDTH; h = w / ratio; } if (h > MAX_LOGO_HEIGHT) { h = MAX_LOGO_HEIGHT; w = h * ratio; } doc.addImage(logoData.data, 'JPEG', x, y, w, h); } catch(e) { log('exportManager', 'error', "Erro ao adicionar logo ao PDF:", e); } };
    drawLogo(logos.lab, MARGIN, 8);
    drawLogo(logos.institution, PAGE_WIDTH - MARGIN - 35, 8);
    doc.setFont('helvetica', 'bold'); doc.text(settings.labName || '', PAGE_WIDTH / 2, 15, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.text(settings.institutionName || '', PAGE_WIDTH / 2, 22, { align: 'center' });
    doc.setLineWidth(0.5); doc.line(MARGIN, 30, PAGE_WIDTH - MARGIN, 30);
    doc.setFontSize(8);
    doc.text(`Página ${data.pageNumber} de ${doc.internal.getNumberOfPages()}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: 'center' });
    doc.text(`Gerado em: ${timestamp}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: 'right' });
    doc.text([settings.analystName, settings.contactEmail, settings.contactPhone].filter(Boolean).map(t => t.trim()).join(' | '), MARGIN, PAGE_HEIGHT - 10);
}

function _addPdfSection(doc, startY, neededHeight, title, sectionCounter) {
    if (startY + neededHeight > doc.internal.pageSize.getHeight() - 25) { doc.addPage(); startY = 40; }
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text(`${sectionCounter}. ${title}`, 15, startY);
    return startY + 7;
}

export async function exportToXlsx() {
    log('exportManager', 'info', "Iniciando exportação para Excel.");
    try {
        if (state.rois().length === 0) {
            log('exportManager', 'warn', "Exportação para Excel cancelada: não há ROIs.");
            modalManager.showGeneralModal("Não há dados para exportar. Crie ao menos uma ROI.");
            return;
        }
        const workbook = new ExcelJS.Workbook();
        const styles = _getExcelStyles();
        _buildReportSheet(workbook, styles);
        _buildDataSheet(workbook, styles);
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Relatorio_Analise_${new Date().toLocaleString('sv').replace(/ /g, '_').replace(/:/g, '')}.xlsx`;
        link.click();
        URL.revokeObjectURL(link.href);
        log('exportManager', 'info', "Relatório Excel gerado e download iniciado com sucesso.");
        modalManager.showGeneralModal("Relatório Excel formatado exportado com sucesso!");
    } catch (error) {
        log('exportManager', 'error', "Erro ao exportar para Excel:", error);
        modalManager.showGeneralModal(`Ocorreu um erro ao gerar o arquivo Excel: ${error.message}`);
    }
}

async function generatePdfReport(reportDetails) {
    const chart = state.calibrationChart();
    if (!chart || state.lastRegressions().length === 0) {
        log('exportManager', 'warn', "Geração de PDF cancelada: a curva analítica não foi gerada.");
        modalManager.showGeneralModal("Gere uma curva analítica antes de exportar o relatório PDF.");
        return;
    }
    log('exportManager', 'info', "Iniciando geração de relatório PDF.", reportDetails);
    modalManager.showLoadingModal("Gerando relatório PDF, por favor aguarde...");
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const MARGIN = 15, CONTENT_WIDTH = doc.internal.pageSize.getWidth() - (2 * MARGIN);
        let startY = 40, sectionCounter = 1;
        const savedSettings = JSON.parse(localStorage.getItem('reportSettings')) || {};
        const opaqueLabLogo = await ensureOpaqueImage(savedSettings.labLogo);
        const opaqueInstitutionLogo = await ensureOpaqueImage(savedSettings.institutionLogo);
        const analysisTimestamp = new Date().toLocaleString('pt-BR');
        const headerFooterCallback = (data) => _addHeaderAndFooter(doc, data, savedSettings, { lab: opaqueLabLogo, institution: opaqueInstitutionLogo }, analysisTimestamp);
        doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.text("Relatório de Análise Colorimétrica Digital", doc.internal.pageSize.getWidth() / 2, startY, { align: 'center' });
        startY += 7;
        const analysisTitle = state.analysisTitle();
        if (analysisTitle) { doc.setFont('helvetica', 'normal'); doc.setFontSize(14); doc.setTextColor(100); doc.text(analysisTitle, doc.internal.pageSize.getWidth() / 2, startY, { align: 'center' }); startY += 10; }
        startY = _addPdfSection(doc, startY, 20, "Detalhes da Análise", sectionCounter++);
        doc.autoTable({ startY: startY, body: [["Amostra/Lote:", reportDetails.sampleId],["Cód. Relatório:", reportDetails.reportId],["Local:", reportDetails.analysisLocation],["Projeto:", reportDetails.applicationArea]].filter(i => i[1]), theme: 'plain', styles: { fontSize: 10, cellPadding: 1 }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } } });
        startY = doc.autoTable.previous.finalY + 10;
        
        const analysisImageBase64 = reportDetails.includeImage ? await getAnalysisImageAsDataUrl() : null;
        
        if (analysisImageBase64) {
            const imgProps = doc.getImageProperties(analysisImageBase64);
            const imgHeight = (imgProps.height * CONTENT_WIDTH) / imgProps.width;
            startY = _addPdfSection(doc, startY, imgHeight + 5, "Imagem da Análise com ROIs", sectionCounter++);
            doc.addImage(analysisImageBase64, 'JPEG', MARGIN, startY, CONTENT_WIDTH, imgHeight);
            startY += imgHeight + 10;
        }
        const originalBgColor = chart.options.plugins.customCanvasBackgroundColor.color;
        chart.options.plugins.customCanvasBackgroundColor.color = 'white'; chart.update('none');
        const chartImageBase64 = chart.toBase64Image('image/jpeg', 0.9);
        chart.options.plugins.customCanvasBackgroundColor.color = originalBgColor; chart.update('none');
        const chartHeight = (chart.height * CONTENT_WIDTH) / chart.width;
        startY = _addPdfSection(doc, startY, chartHeight + 30, "Curva Analítica e Modelos", sectionCounter++);
        doc.addImage(chartImageBase64, 'JPEG', MARGIN, startY, CONTENT_WIDTH, chartHeight);
        startY += chartHeight + 5;
        
        const regressionTableBody = state.lastRegressions().flatMap(regression => {
            const metricDef = metricMap.get(regression.parameter);
            const displayName = metricDef ? metricDef.fullName : regression.parameter;

            return regression.models.map(model => {
                let equationStr = 'N/A';
                if (model.type === 'linear' && model.coefficients) {
                    const { m, b } = model.coefficients;
                    equationStr = `y = ${Number(m).toFixed(4)}x + ${Number(b).toFixed(4)}`;
                } else if (model.type === 'polynomial' && model.coefficients) {
                    const { a, b, c } = model.coefficients;
                    equationStr = `y = ${Number(a).toFixed(4)}x² + ${Number(b).toFixed(4)}x + ${Number(c).toFixed(4)}`;
                }
                
                const r2 = model.r2 ? Number(model.r2).toFixed(5) : 'N/A';
                const modelType = model.type === 'linear' ? 'Linear' : 'Polinomial';

                return [displayName, modelType, equationStr, r2];
            });
        });
        doc.autoTable({ startY: startY, head: [['Parâmetro', 'Modelo', 'Equação', 'R²']], body: regressionTableBody, theme: 'grid', headStyles: { fillColor: [22, 110, 160], textColor: 255, fontStyle: 'bold' }, didDrawPage: headerFooterCallback });
        
        startY = doc.autoTable.previous.finalY + 10;
        
        startY = _addPdfSection(doc, startY, 20, "Resultados e Dados Brutos", sectionCounter++);
        const sampleRois = state.rois().filter(r => r.isSample);
        if (sampleRois.length > 0) {
            doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text("Tabela de Previsão de Concentração para Amostras:", MARGIN, startY); startY += 5;
            
            // --- INÍCIO DA ALTERAÇÃO ---
            const predictionsBody = sampleRois.flatMap(roi => {
                if (roi.predictedConcentrations.length > 0) {
                    return roi.predictedConcentrations.map(pred => {
                        const metricDef = metricMap.get(pred.parameter);
                        const displayName = metricDef ? metricDef.fullName : pred.parameter;
                        
                        // Adiciona a verificação para valores nulos antes de chamar toFixed()
                        const concentrationDisplay = pred.concentration !== null ? pred.concentration.toFixed(4) : 'N/D';
                        const r2Display = pred.r2 !== null ? pred.r2.toFixed(5) : 'N/A';
        
                        return [roi.customName || roi.name, displayName, concentrationDisplay, r2Display];
                    });
                } else {
                    return [[roi.customName || roi.name, "N/A", "Nenhuma curva gerada", "N/A"]];
                }
            });
            // --- FIM DA ALTERAÇÃO ---

            doc.autoTable({ startY: startY, head: [['Amostra', 'Parâmetro Utilizado', `Concentração Prevista (${state.currentConcentrationUnit()})`, 'R² do Modelo']], body: predictionsBody, theme: 'grid', headStyles: { fillColor: [22, 110, 160], textColor: 255, fontStyle: 'bold' }, didDrawPage: headerFooterCallback });
            startY = doc.autoTable.previous.finalY + 10;
        }

        const calibrationRois = state.rois().filter(r => r.useInCalibration && r.concentration !== null);
        if (calibrationRois.length > 0 && state.lastRegressions().length > 0) {
            doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text("Tabela de Dados Utilizados na Calibração:", MARGIN, startY); startY += 5;
            
            const calibrationDataBody = calibrationRois.flatMap(roi => 
                state.lastRegressions().map(reg => {
                    const metricDef = metricMap.get(reg.parameter);
                    const parameterName = metricDef ? metricDef.fullName : reg.parameter;
                    const response = roi.analyticalResponse.find(r => r.channel === reg.parameter);
                    const signalValue = response ? response.value.toFixed(4) : 'N/D';
                    
                    return [
                        roi.customName || roi.name,
                        roi.concentration,
                        parameterName,
                        signalValue
                    ];
                })
            );

            const tableHeaders = [['ROI Padrão', `Conc. (${state.currentConcentrationUnit()})`, 'Parâmetro Analisado', 'Sinal Analítico (SA)']];

            doc.autoTable({
                startY: startY,
                head: tableHeaders,
                body: calibrationDataBody,
                theme: 'grid',
                headStyles: { fillColor: [22, 110, 160], textColor: 255, fontStyle: 'bold' },
                didDrawPage: headerFooterCallback
            });
        }

        for (let i = 1; i <= doc.internal.getNumberOfPages(); i++) { doc.setPage(i); headerFooterCallback({ pageNumber: i, pageCount: doc.internal.getNumberOfPages() }); }
        doc.save(`Relatorio_Analise_${reportDetails.sampleId.replace(/[^a-z0-9]/gi, '_')}_${new Date().toLocaleString('sv').replace(/ /g, '_').replace(/:/g, '')}.pdf`);
        log('exportManager', 'info', "Relatório PDF gerado e salvo com sucesso.");
        modalManager.showGeneralModal("Relatório PDF gerado com sucesso!");
    } catch (error) {
        log('exportManager', 'error', "Erro ao gerar PDF: ", error);
        modalManager.showGeneralModal("Ocorreu um erro inesperado ao gerar o relatório PDF: " + error.message);
    }
}

export function initializeExport() {
    if (dom.confirmAndGeneratePdfButton) dom.confirmAndGeneratePdfButton.addEventListener('click', triggerPdfGeneration);
    if (dom.closeReportDetailsModalButton) dom.closeReportDetailsModalButton.addEventListener('click', closeReportDetailsModal);
    if (dom.cancelReportDetailsButton) dom.cancelReportDetailsButton.addEventListener('click', closeReportDetailsModal);
}
export function openReportDetailsModal() { if (dom.reportDetailsModal) dom.reportDetailsModal.dataset.visible = 'true'; dom.reportDetailsError.classList.add('hidden'); }
export function closeReportDetailsModal() { if (dom.reportDetailsModal) dom.reportDetailsModal.dataset.visible = 'false'; }


function triggerPdfGeneration() {
    const sampleIdValue = dom.sampleIdInput.value.trim();
    if (!sampleIdValue) { dom.reportDetailsError.textContent = 'O campo "Identificação da Amostra" é obrigatório.'; dom.reportDetailsError.classList.remove('hidden'); return; }
    dom.reportDetailsError.classList.add('hidden');
    const reportDetails = { sampleId: sampleIdValue, reportId: dom.reportIdInput.value, analysisLocation: dom.analysisLocationInput.value, applicationArea: dom.applicationAreaInput.value, includeImage: dom.includeImageInReportCheckbox.checked };
    closeReportDetailsModal();
    generatePdfReport(reportDetails);
}

async function getAnalysisImageAsDataUrl() {
    const imageInfo = state.originalImage();
    if (!imageInfo || !imageInfo.src) return null;

    const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => {
            log('exportManager', 'error', "Falha ao carregar a imagem para o PDF.", err);
            reject(new Error("Falha ao carregar a imagem para o PDF."));
        }
        img.src = imageInfo.src;
    });

    const scaleFactor = Math.min(1, 1200 / image.naturalWidth);
    const w = image.naturalWidth * scaleFactor, h = image.naturalHeight * scaleFactor;
    const tempCanvas = document.createElement('canvas'); tempCanvas.width = w; tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = '#FFFFFF'; tempCtx.fillRect(0, 0, w, h);
    tempCtx.drawImage(image, 0, 0, w, h);
    
    state.rois().forEach(roi => {
        const scaledRoi = { x: roi.x * scaleFactor, y: roi.y * scaleFactor, width: roi.width * scaleFactor, height: roi.height * scaleFactor, radius: roi.radius * scaleFactor, type: roi.type };
        const lineWidth = Math.max(1, w * 0.0025), fontSize = Math.max(8, w * 0.015);
        let strokeStyle = (roi.isSample) ? 'rgba(245, 158, 11, 0.9)' : ((roi.id === state.analyticalWhiteRoiId()) ? 'rgba(22, 163, 74, 0.9)' : 'rgba(255, 0, 0, 0.9)');
        Object.assign(tempCtx, { strokeStyle, lineWidth, fillStyle: strokeStyle, font: `bold ${fontSize}px Arial`, textAlign: 'center', textBaseline: 'bottom' });
        if (roi.type === 'rect') { 
            tempCtx.strokeRect(scaledRoi.x, scaledRoi.y, scaledRoi.width, scaledRoi.height); 
        } else if (roi.type === 'circle') { 
            tempCtx.beginPath(); 
            tempCtx.arc(scaledRoi.x + scaledRoi.radius, scaledRoi.y + scaledRoi.radius, scaledRoi.radius, 0, 2 * Math.PI); 
            tempCtx.stroke(); 
        }
        const labelX = scaledRoi.x + (scaledRoi.type === 'rect' ? scaledRoi.width/2 : scaledRoi.radius);
        const labelY = scaledRoi.y - (fontSize * 0.4);
        tempCtx.fillText(roi.customName || roi.name, labelX, labelY);
    });
    return tempCanvas.toDataURL('image/jpeg', 0.9);
}

async function ensureOpaqueImage(base64String) {
    if (!base64String || !base64String.startsWith('data:image')) return null;
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
            canvas.width = img.width; canvas.height = img.height;
            ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0);
            resolve({ data: canvas.toDataURL('image/jpeg', 0.9), width: img.width, height: img.height });
        };
        img.onerror = () => resolve(null);
        img.src = base64String;
    });
}