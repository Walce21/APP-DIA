// src/js/infoContent.js

/**
 * Módulo central para armazenar os conteúdos de texto dos modais de informação.
 * Isso melhora a organização e facilita futuras manutenções ou traduções.
 */

// 1. Conteúdo para o painel "Controles da Imagem"
export const imageControlsHelp = {
    title: 'Guia: Controles da Imagem',
    htmlContent: `
        <div class="space-y-3 text-gray-800 text-left">
            <p>Este painel gerencia a imagem base para sua análise.</p>
            <ul class="list-disc list-inside pl-2 space-y-2 mt-2">
                <li><strong>Carregar:</strong> Abre um seletor de arquivos para carregar uma imagem (JPG, PNG, etc.) do seu dispositivo.</li>
                <li><strong>Excluir:</strong> Remove a imagem atual e todos os dados de análise associados (ROIs, curvas, etc.), permitindo que você comece do zero.</li>
                <li><strong>Girar:</strong> Gira a imagem em 90 graus no sentido horário. Útil para corrigir a orientação de fotos.</li>
                <li><strong>Restaurar:</strong> Centraliza a imagem na tela e restaura o nível de zoom para o padrão.</li>
            </ul>
        </div>
    `
};

// 2. Conteúdo unificado para o painel "Ferramentas"
export const toolsAndCanvasHelp = {
    title: 'Guia: Ferramentas e Interação',
    htmlContent: `
        <div class="space-y-4 text-gray-800 text-left">
            <div>
                <h4 class="font-semibold text-gray-900">Ferramentas de Desenho</h4>
                <ul class="list-disc list-inside pl-2 space-y-2 mt-2">
                    <li><strong>Ponteiro:</strong> A ferramenta principal para selecionar, mover e interagir com as ROIs. Use-a para clicar em uma ROI e ver suas propriedades ou para arrastá-la.</li>
                    <li><strong>Retângulo / Círculo:</strong> Selecione uma destas ferramentas para desenhar uma nova Região de Interesse (ROI) na imagem. Clique e arraste para definir o tamanho.</li>
                </ul>
            </div>
            <div>
                <h4 class="font-semibold text-gray-900">Detecção Automática</h4>
                <ul class="list-disc list-inside pl-2 space-y-2 mt-2">
                    <li><strong>Analisar Grade:</strong> Ideal para microplacas. Você define as dimensões (ex: 8x12) e marca os 4 cantos da placa para que o app crie e ordene todas as ROIs automaticamente.</li>
                    <li><strong>Configuração Avançada:</strong> Usa algoritmos de visão computacional (OpenCV.js) para encontrar todos os pontos circulares na imagem inteira com base em parâmetros de saturação, brilho e forma.</li>
                </ul>
            </div>
            <div>
                <h4 class="font-semibold text-gray-900">Interação no Canvas</h4>
                <ul class="list-disc list-inside pl-2 space-y-2 mt-2">
                    <li><strong>Zoom:</strong> Use a roda de rolagem (scroll) do mouse ou o gesto de pinça em telas de toque.</li>
                    <li><strong>Mover (Pan):</strong> Com a ferramenta Ponteiro, clique e arraste em uma área vazia da imagem. Em telas de toque, arraste com um dedo.</li>
                    <li><strong>Seleção Múltipla:</strong> Com a ferramenta Ponteiro, segure 'Shift' ou 'Ctrl' e clique em várias ROIs. Em telas de toque, faça um clique longo em uma ROI para iniciar o modo de multisseleção.</li>
                </ul>
            </div>
            <div>
                <h4 class="font-semibold text-gray-900">Controles do Canvas</h4>
                <ul class="list-disc list-inside pl-2 space-y-2 mt-2">
                    <li><strong>Modo Foco:</strong> Oculta os painéis laterais para maximizar a área de visualização da imagem. Ideal para desenhar e ajustar ROIs em telas pequenas.</li>
                    <li><strong>Lupa:</strong> Ativa/desativa uma lupa que aparece ao interagir com o canvas, facilitando o posicionamento preciso das ROIs.</li>
                    <li><strong>Travar Imagem:</strong> Bloqueia o zoom e o movimento (pan) da imagem, evitando deslocamentos acidentais ao trabalhar com as ROIs.</li>
                </ul>
            </div>
        </div>
    `
};

// 3. Conteúdo para o painel "Ferramentas ROI"
export const roiActionsHelp = {
    title: 'Guia: Ações em ROIs',
    htmlContent: `
        <div class="space-y-3 text-gray-800 text-left">
            <p>Estas ações se aplicam às ROIs que você selecionou no canvas ou na lista.</p>
            <ul class="list-disc list-inside pl-2 space-y-2 mt-2">
                <li><strong>Definir Amostra:</strong> Marca a ROI selecionada como uma amostra de concentração desconhecida. Amostras são excluídas da calibração e usadas para previsão.</li>
                <li><strong>Definir Branco:</strong> Marca uma única ROI como o "Branco Analítico", a referência para cálculos diferenciais como Delta E e Absorbância.</li>
                <li><strong>Duplicar:</strong> Cria uma cópia da(s) ROI(s) selecionada(s).</li>
                <li><strong>Excluir:</strong> Apaga a(s) ROI(s) selecionada(s).</li>
                <li><strong>Redimensionar Seleção:</strong> Ajusta o tamanho de todas as ROIs selecionadas simultaneamente usando o slider.</li>
                <li><strong>Travar Posição / Tamanho:</strong> Bloqueia o movimento ou o redimensionamento das ROIs selecionadas para evitar alterações acidentais.</li>
                <li><strong>Ordenar ROIs:</strong> Inicia o painel de ordenação para as ROIs selecionadas, permitindo definir a sequência correta dos pontos de calibração.</li>
            </ul>
        </div>
    `
};

export const orderRoisHelp = {
    title: 'Ajuda: Ordenar ROIs de Calibração',
    htmlContent: `
        <div class="space-y-3 text-gray-800 text-left">
            <p>Esta função permite definir a sequência numérica dos seus pontos de calibração (Padrão 1, Padrão 2, etc.), o que é crucial para construir a curva analítica corretamente.</p>
            <p><strong>Quando o botão está habilitado?</strong> O botão 'Ordenar ROIs' só fica ativo quando há pelo menos 2 ROIs que <strong>não</strong> são amostras nem o branco analítico.</p>
            <p><strong>Como usar:</strong></p>
            <ul class="list-disc list-inside pl-2 space-y-1">
                <li><strong>Ordenação Automática:</strong> Ideal para microplacas. Escolha um padrão de leitura (horizontal/vertical) e a direção para numerar as ROIs automaticamente.</li>
                <li><strong>Ordenação Manual:</strong> Clique em "ordenar por toque manual" para entrar no modo de seleção, onde você clica nas ROIs na ordem exata que desejar.</li>
                <li><strong>Ordenar Seleção:</strong> Se você selecionar um grupo específico de ROIs antes de clicar em "Ordenar ROIs", apenas as ROIs selecionadas entrarão no processo de ordenação.</li>
            </ul>
        </div>
    `
};

// --- INÍCIO DA ADIÇÃO (FEAT-RESULT-GROUPING-01) ---

export const predictionStatusHelp = {
    title: 'Guia: Entendendo os Resultados da Predição',
    htmlContent: `
        <div class="space-y-4 text-gray-800 text-left">
            <div>
                <h4 class="font-semibold text-gray-900">Como a Previsão é Calculada?</h4>
                <p class="mt-1">Esta seção utiliza os modelos de regressão, criados no Passo 4, para estimar a concentração das suas ROIs marcadas como "Amostra". O processo é:</p>
                <ul class="list-disc list-inside pl-2 space-y-1 mt-2">
                    <li>Para cada amostra, o sistema pega o modelo de regressão (linear ou polinomial) com o <strong>maior R² (melhor ajuste)</strong>.</li>
                    <li>Ele usa o valor do sinal analítico da amostra e aplica a equação do modelo para calcular a concentração.</li>
                    <li>O sistema então classifica o resultado para indicar sua confiabilidade, conforme o guia visual abaixo.</li>
                </ul>
            </div>
            <div class="border-t pt-4">
                <h4 class="font-semibold text-gray-900">Guia Visual de Resultados</h4>
                <div class="space-y-3 mt-2">
                    <div class="flex items-start">
                        <span class="text-xl leading-none mr-3">✅</span>
                        <div>
                            <strong class="font-semibold">Resultado Válido</strong>
                            <p class="text-xs text-gray-600">A concentração foi calculada e está <strong>dentro</strong> da faixa de trabalho dos seus padrões de calibração. Este é o resultado mais confiável.</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <span class="text-xl leading-none mr-3">⚠️</span>
                        <div>
                            <strong class="font-semibold">Resultado Extrapolado</strong>
                            <p class="text-xs text-gray-600">A concentração foi calculada, mas está <strong>fora</strong> da faixa de calibração. O valor deve ser visto com cautela, pois sua precisão pode ser menor. Considere diluir a amostra.</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <span class="text-xl leading-none mr-3">❌</span>
                        <div>
                            <strong class="font-semibold">Resultado Inválido</strong>
                            <p class="text-xs text-gray-600">Foi matematicamente <strong>impossível</strong> calcular um valor de concentração com este modelo, seja por falta de uma solução real na equação ou por um modelo inadequado (ex: reta sem inclinação).</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

// --- FIM DA ADIÇÃO ---