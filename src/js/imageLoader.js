import * as state from './state.js';
import * as canvasManager from './canvasManager.js';
import * as chartManager from './chartManager.js';
import * as dom from './domElements.js';
import * as actions from './stateActions.js';
import * as uiManager from './uiManager.js';

export async function loadImage(file) {
    if (!file) {
        return { success: false, message: "Nenhum arquivo selecionado." };
    }

    if (!file.type.startsWith('image/')) {
        return { success: false, message: "O arquivo selecionado não é uma imagem válida." };
    }

    const reader = new FileReader();

    return new Promise((resolve) => {
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // --- INÍCIO DA REATORAÇÃO ---
                // O reset do estado e a configuração da nova imagem agora são uma única ação atômica.
                actions.setupForNewImage({
                    offscreenCanvas: canvas,
                    originalImage: { src: e.target.result, fileName: file.name }
                });

                // A lógica de UI/Componente permanece aqui.
                // A atualização da UI será disparada automaticamente pela ação.
                canvasManager.resizeCanvasToContainer();
                chartManager.initializeChart(); // O gráfico é reinicializado após o estado ser limpo.
                uiManager.startCvReadyCheck();
                // --- FIM DA REATORAÇÃO ---

                resolve({ success: true, message: "Imagem carregada com sucesso!", fileName: file.name });
            };

            img.onerror = () => {
                resolve({ success: false, message: "Erro ao carregar a imagem." });
            };

            img.src = e.target.result;
        };

        reader.onerror = () => {
            resolve({ success: false, message: "Erro ao ler o arquivo." });
        };

        reader.readAsDataURL(file);
    });
}


/**
 * Limpa a imagem atual e reseta o estado da aplicação para o início.
 * Chamado pelo botão "Excluir Imagem".
 */
export function unloadImage() {
    log('imageLoader', 'info', 'Iniciando processo de exclusão da imagem atual.');

    // --- INÍCIO DA REATORAÇÃO ---
    // Uma única ação agora lida com o reset completo do estado.
    actions.setupForNewImage(null);

    // A lógica que manipula diretamente o DOM ou reinicializa componentes permanece aqui.
    if (dom.fileNameDisplay) {
        dom.fileNameDisplay.textContent = 'Nenhum arquivo';
    }
    
    // A ação já destrói a instância do gráfico no estado, aqui nós criamos uma nova.
    chartManager.initializeChart();
    // A chamada ao uiManager.updateAllDynamicContent() foi removida.
    // --- FIM DA REATORAÇÃO ---

    log('imageLoader', 'success', 'Imagem e dados de análise foram limpos com sucesso.');
}