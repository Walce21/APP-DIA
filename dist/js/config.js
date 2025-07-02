// public/js/config.js
// --- REATORADO PARA SCRIPT CLÁSSICO (SEM EXPORT) ---

// --- Configurações da Aplicação ---
// Este módulo armazena todas as constantes de configuração.

const ROI_STROKE_STYLE = 'rgba(255,0,0,0.8)';
const ROI_LINE_WIDTH = 2;
const ROI_SELECTED_STROKE_STYLE = 'rgba(0,123,255,0.9)';
const ROI_ANALYTICAL_WHITE_STROKE_STYLE = 'rgba(22, 163, 74, 0.9)';
const ROI_SAMPLE_STROKE_STYLE = 'rgba(245, 158, 11, 0.9)';
const ROI_HANDLE_VISUAL_DIAMETER_SCREEN_PX = 12;
const ROI_HANDLE_TOUCH_RADIUS_SCREEN_PX = 18;
const ROI_HANDLE_FILL_STYLE = 'rgba(0, 123, 255, 0.7)';
const DUPLICATE_OFFSET = 25;

const CHART_STYLES = [
    { borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 0.5)', pointStyle: 'circle', symbol: '●' },
    { borderColor: 'rgba(54, 162, 235, 1)', backgroundColor: 'rgba(54, 162, 235, 0.5)', pointStyle: 'triangle', symbol: '▲' },
    { borderColor: 'rgba(75, 192, 192, 1)', backgroundColor: 'rgba(75, 192, 192, 0.5)', pointStyle: 'rect', symbol: '■' },
    { borderColor: 'rgba(255, 206, 86, 1)', backgroundColor: 'rgba(255, 206, 86, 0.5)', pointStyle: 'star', symbol: '★' },
    { borderColor: 'rgba(153, 102, 255, 1)', backgroundColor: 'rgba(153, 102, 255, 0.5)', pointStyle: 'crossRot', symbol: '✚' },
    { borderColor: 'rgba(255, 159, 64, 1)', backgroundColor: 'rgba(255, 159, 64, 0.5)', pointStyle: 'dash', symbol: '—' }
];

// --- INÍCIO DA ALTERAÇÃO: Fórmulas convertidas para LaTeX ---
const analyticalEquationsBySystem = {
    'RGB': {
        'Intensidade e Derivados': [
            { id: 'direct_r', text: 'Componente R', fullName: 'Componente R (RGB)', formula: '$$R$$', description: 'Intensidade do canal Vermelho (Red). Valor de 0 a 255 extraído da média dos pixels na ROI.', type: 'direct', system: 'rgb', channel: 'avgR' },
            { id: 'direct_g', text: 'Componente G', fullName: 'Componente G (RGB)', formula: '$$G$$', description: 'Intensidade do canal Verde (Green). Valor de 0 a 255 extraído da média dos pixels na ROI.', type: 'direct', system: 'rgb', channel: 'avgG' },
            { id: 'direct_b', text: 'Componente B', fullName: 'Componente B (RGB)', formula: '$$B$$', description: 'Intensidade do canal Azul (Blue). Valor de 0 a 255 extraído da média dos pixels na ROI.', type: 'direct', system: 'rgb', channel: 'avgB' },
            { id: 'direct_avg', text: 'Média R,G,B', fullName: 'Média dos Componentes (RGB)', formula: '$$\\frac{R + G + B}{3}$$', description: 'Média aritmética dos três canais RGB. Pode ser usada como um indicador geral de luminosidade.', type: 'direct', system: 'rgb', channel: 'avgRGB' },
            { id: 'inverse_r', text: 'Inverso de R (255-R)', fullName: 'Inverso do Componente R (RGB)', formula: '$$255 - R$$', description: 'Sinal inverso do canal Vermelho. Útil em sistemas onde a cor se intensifica com a concentração, resultando em menor reflectância.', type: 'inverse', system: 'rgb', channel: 'avgR' },
            { id: 'inverse_g', text: 'Inverso de G (255-G)', fullName: 'Inverso do Componente G (RGB)', formula: '$$255 - G$$', description: 'Sinal inverso do canal Verde. Útil em sistemas onde a cor se intensifica com a concentração, resultando em menor reflectância.', type: 'inverse', system: 'rgb', channel: 'avgG' },
            { id: 'inverse_b', text: 'Inverso de B (255-B)', fullName: 'Inverso do Componente B (RGB)', formula: '$$255 - B$$', description: 'Sinal inverso do canal Azul. Útil em sistemas onde a cor se intensifica com a concentração, resultando em menor reflectância.', type: 'inverse', system: 'rgb', channel: 'avgB' },
        ],
        'Relações e Índices': [
            { id: 'ratio_r_g', text: 'Razão R/G', fullName: 'Razão R/G (RGB)', formula: '$$\\frac{R}{G}$$', description: 'Razão entre os canais R e G. Normaliza o sinal, minimizando efeitos de variações de iluminação.', type: 'ratio', system: 'rgb', channels: ['avgR', 'avgG'] },
            { id: 'ratio_r_b', text: 'Razão R/B', fullName: 'Razão R/B (RGB)', formula: '$$\\frac{R}{B}$$', description: 'Razão entre os canais R e B. Normaliza o sinal, minimizando efeitos de variações de iluminação.', type: 'ratio', system: 'rgb', channels: ['avgR', 'avgB'] },
            { id: 'ratio_g_b', text: 'Razão G/B', fullName: 'Razão G/B (RGB)', formula: '$$\\frac{G}{B}$$', description: 'Razão entre os canais G e B. Normaliza o sinal, minimizando efeitos de variações de iluminação.', type: 'ratio', system: 'rgb', channels: ['avgG', 'avgB'] },
            { id: 'ndi_r_g', text: 'NDI (R-G)', fullName: 'Índice de Diferença Normalizada (R-G)', formula: '$$\\frac{R - G}{R + G}$$', description: 'Varia de -1 a +1 e é robusto a variações de iluminação, realçando o contraste entre os canais R e G.', type: 'ndi', system: 'rgb', channels: ['avgR', 'avgG'] },
            { id: 'ndi_r_b', text: 'NDI (R-B)', fullName: 'Índice de Diferença Normalizada (R-B)', formula: '$$\\frac{R - B}{R + B}$$', description: 'Varia de -1 a +1 e é robusto a variações de iluminação, realçando o contraste entre os canais R e B.', type: 'ndi', system: 'rgb', channels: ['avgR', 'avgB'] },
            { id: 'ndi_g_b', text: 'NDI (G-B)', fullName: 'Índice de Diferença Normalizada (G-B)', formula: '$$\\frac{G - B}{G + B}$$', description: 'Varia de -1 a +1 e é robusto a variações de iluminação, realçando o contraste entre os canais G e B.', type: 'ndi', system: 'rgb', channels: ['avgG', 'avgB'] },
            { id: 'sum_ratio_r', text: 'Contribuição de R (R/Soma)', fullName: 'Contribuição do Componente R (RGB)', formula: '$$\\frac{R}{R + G + B}$$', description: 'Contribuição relativa do canal R para a intensidade total, normalizando a cor e reduzindo o efeito da intensidade luminosa.', type: 'sum_ratio_rgb', channel: 'avgR' },
            { id: 'sum_ratio_g', text: 'Contribuição de G (G/Soma)', fullName: 'Contribuição do Componente G (RGB)', formula: '$$\\frac{G}{R + G + B}$$', description: 'Contribuição relativa do canal G para a intensidade total, normalizando a cor e reduzindo o efeito da intensidade luminosa.', type: 'sum_ratio_rgb', channel: 'avgG' },
            { id: 'sum_ratio_b', text: 'Contribuição de B (B/Soma)', fullName: 'Contribuição do Componente B (RGB)', formula: '$$\\frac{B}{R + G + B}$$', description: 'Contribuição relativa do canal B para a intensidade total, normalizando a cor e reduzindo o efeito da intensidade luminosa.', type: 'sum_ratio_rgb', channel: 'avgB' },
        ],
        'Comparações com Branco': [
            { id: 'delta_r', text: 'Diferença em R (ΔR)', fullName: 'Diferença em R (ΔR)', formula: '$$R_{\\text{branco}} - R_{\\text{amostra}}$$', description: 'Diferença aritmética entre o canal R do branco e da amostra. Mede a mudança absoluta no sinal vermelho.', type: 'delta', system: 'rgb', channel: 'avgR', needsWhite: true },
            { id: 'delta_g', text: 'Diferença em G (ΔG)', fullName: 'Diferença em G (ΔG)', formula: '$$G_{\\text{branco}} - G_{\\text{amostra}}$$', description: 'Diferença aritmética entre o canal G do branco e da amostra. Mede a mudança absoluta no sinal verde.', type: 'delta', system: 'rgb', channel: 'avgG', needsWhite: true },
            { id: 'delta_b', text: 'Diferença em B (ΔB)', fullName: 'Diferença em B (ΔB)', formula: '$$B_{\\text{branco}} - B_{\\text{amostra}}$$', description: 'Diferença aritmética entre o canal B do branco e da amostra. Mede a mudança absoluta no sinal azul.', type: 'delta', system: 'rgb', channel: 'avgB', needsWhite: true },
            { id: 'beer_r', text: 'Análogo Beer para R', fullName: 'Absorbância Análoga de R (RGB)', formula: '$$-\\log_{10}\\left(\\frac{R_{\\text{amostra}}}{R_{\\text{branco}}}\\right)$$', description: 'Análogo à absorbância para o canal R. Frequentemente linear com a concentração em ensaios colorimétricos.', type: 'beer', system: 'rgb', channel: 'avgR', needsWhite: true },
            { id: 'beer_g', text: 'Análogo Beer para G', fullName: 'Absorbância Análoga de G (RGB)', formula: '$$-\\log_{10}\\left(\\frac{G_{\\text{amostra}}}{G_{\\text{branco}}}\\right)$$', description: 'Análogo à absorbância para o canal G. Frequentemente linear com a concentração em ensaios colorimétricos.', type: 'beer', system: 'rgb', channel: 'avgG', needsWhite: true },
            { id: 'beer_b', text: 'Análogo Beer para B', fullName: 'Absorbância Análoga de B (RGB)', formula: '$$-\\log_{10}\\left(\\frac{B_{\\text{amostra}}}{B_{\\text{branco}}}\\right)$$', description: 'Análogo à absorbância para o canal B. Frequentemente linear com a concentração em ensaios colorimétricos.', type: 'beer', system: 'rgb', channel: 'avgB', needsWhite: true },
            { id: 'euclidean_rgb', text: 'Distância Euclidiana (ΔE_rgb)', fullName: 'Distância Euclidiana (ΔE) (RGB)', formula: '$$\\sqrt{(\\Delta R)^2 + (\\Delta G)^2 + (\\Delta B)^2}$$','description': 'Distância geométrica entre a amostra e o branco no espaço de cor RGB. Mede a magnitude total da mudança de cor.', type: 'euclidean_rgb', system: 'rgb', needsWhite: true },
        ]
    },
    'CIELAB': {
        'Componentes Perceptuais': [
            { id: 'direct_lab_l', text: 'Componente L*', fullName: 'Luminosidade L* (CIELAB)', formula: '$$L^*$$', description: 'Componente de luminosidade (0=preto, 100=branco). É desenhado para ser perceptualemente uniforme.', type: 'direct', system: 'lab', channel: 'l' },
            { id: 'direct_lab_a', text: 'Componente a*', fullName: 'Componente Verde-Vermelho a* (CIELAB)', formula: '$$a^*$$', description: 'Eixo de cor do verde (-a*) ao vermelho (+a*).', type: 'direct', system: 'lab', channel: 'a' },
            { id: 'direct_lab_b', text: 'Componente b*', fullName: 'Componente Azul-Amarelo b* (CIELAB)', formula: '$$b^*$$', description: 'Eixo de cor do azul (-b*) ao amarelo (+b*).', type: 'direct', system: 'lab', channel: 'b' },
            { id: 'direct_lab_c', text: 'Croma (C*)', fullName: 'Croma C* (CIELAB)', formula: '$$\\sqrt{(a^*)^2 + (b^*)^2}$$', description: 'Mede a pureza ou intensidade da cor. Valores maiores indicam cores mais vivas.', type: 'cielab_chroma', system: 'lab' },
            { id: 'direct_lab_h', text: 'Ângulo de Matiz (h_ab)', fullName: 'Ângulo de Matiz h_ab (CIELAB)', formula: '$$\\text{atan2}(b^*, a^*)$$', description: 'Representa o matiz da cor como um ângulo (0-360°), onde 0° é vermelho e 180° é verde.', type: 'cielab_hue', system: 'lab' },
            { id: 'cielab_hue_cos', text: 'Componente de Matiz (cos(h))', fullName: 'Componente Cosseno do Ângulo de Matiz (CIELAB)', formula: '$$\\cos(h_{ab})$$', description: 'Lineariza o componente de matiz angular para uso em modelos lineares.', type: 'cielab_hue_component', subType: 'cos', system: 'lab' },
            { id: 'cielab_hue_sin', text: 'Componente de Matiz (sin(h))', fullName: 'Componente Seno do Ângulo de Matiz (CIELAB)', formula: '$$\\sin(h_{ab})$$', description: 'Lineariza o componente de matiz angular para uso em modelos lineares.', type: 'cielab_hue_component', subType: 'sin', system: 'lab' },
        ],
        'Relações e Índices': [
            { id: 'ratio_l_a', text: 'Razão L*/a*', fullName: 'Razão L*/a* (CIELAB)', formula: '$$\\frac{L^*}{a^*}$$', description: 'Relação entre a luminosidade e o componente verde-vermelho.', type: 'ratio', system: 'lab', channels: ['l', 'a'] },
            { id: 'ratio_l_b', text: 'Razão L*/b*', fullName: 'Razão L*/b* (CIELAB)', formula: '$$\\frac{L^*}{b^*}$$', description: 'Relação entre a luminosidade e o componente azul-amarelo.', type: 'ratio', system: 'lab', channels: ['l', 'b'] },
            { id: 'ratio_a_b', text: 'Razão a*/b*', fullName: 'Razão a*/b* (CIELAB)', formula: '$$\\frac{a^*}{b^*}$$', description: 'Relação entre os componentes de cromaticidade. Conhecido como índice de avermelhamento em algumas aplicações.', type: 'ratio', system: 'lab', channels: ['a', 'b'] },
            { id: 'ndi_a_b', text: 'NDI (a*-b*)', fullName: 'Índice de Diferença Normalizada (a*-b*)', formula: '$$\\frac{a^* - b^*}{a^* + b^*}$$', description: 'Índice normalizado entre os componentes de cromaticidade.', type: 'ndi', system: 'lab', channels: ['a', 'b'] },
            { id: 'cielab_chroma_lightness_ratio', text: 'Índice de Croma (C*/L*)', fullName: 'Índice Croma/Luminosidade (CIELAB)', formula: '$$\\frac{C^*}{L^*}$$', description: 'Relação entre a pureza da cor e sua luminosidade. Pode indicar a vivacidade relativa da cor.', type: 'cielab_chroma_lightness_ratio', system: 'lab' },
        ],
        'Comparações com Branco': [
            { id: 'delta_lab_l', text: 'Diferença (ΔL*)', fullName: 'Diferença em L* (ΔL*)', formula: '$$L^*_{\\text{branco}} - L^*_{\\text{amostra}}$$', description: 'Mede a mudança perceptual na luminosidade em relação ao branco.', type: 'delta', system: 'lab', channel: 'l', needsWhite: true },
            { id: 'delta_lab_a', text: 'Diferença (Δa*)', fullName: 'Diferença em a* (Δa*)', formula: '$$a^*_{\\text{branco}} - a^*_{\\text{amostra}}$$', description: 'Mede a mudança no eixo verde-vermelho em relação ao branco.', type: 'delta', system: 'lab', channel: 'a', needsWhite: true },
            { id: 'delta_lab_b', text: 'Diferença (Δb*)', fullName: 'Diferença em b* (Δb*)', formula: '$$b^*_{\\text{branco}} - b^*_{\\text{amostra}}$$', description: 'Mede a mudança no eixo azul-amarelo em relação ao branco.', type: 'delta', system: 'lab', channel: 'b', needsWhite: true },
            { id: 'delta_e2000', text: 'Diferença de Cor (ΔE2000)', fullName: 'Diferença de Cor CIEDE2000 (ΔE00)', formula: '$$\\Delta E_{00}(\\text{Amostra}, \\text{Branco})$$', description: 'Métrica padrão da indústria para quantificar a diferença de cor perceptual, corrigindo não-uniformidades do espaço CIELAB.', type: 'delta_e2000', system: 'lab', needsWhite: true },
            { id: 'beer_lab_l', text: 'Análogo Beer para L*', fullName: 'Absorbância Análoga de L* (CIELAB)', formula: '$$-\\log_{10}\\left(\\frac{L^*_{\\text{amostra}}}{L^*_{\\text{branco}}}\\right)$$', description: 'Análogo à absorbância para o componente de luminosidade perceptual L*.', type: 'beer', system: 'lab', channel: 'l', needsWhite: true },
        ]
    },
    'HSV': {
        'Componentes Diretos': [
            { id: 'direct_hsv_h', text: 'Componente H', fullName: 'Matiz (Hue) (HSV)', formula: '$$H$$', description: 'Atributo de cor (ex: vermelho, verde, azul) como um ângulo de 0 a 360.', type: 'direct', system: 'hsv', channel: 'h' },
            { id: 'direct_hsv_s', text: 'Componente S', fullName: 'Saturação (Saturation) (HSV)', formula: '$$S$$', description: 'Intensidade ou pureza da cor (0-100%). 0% é cinza, 100% é a cor mais pura.', type: 'direct', system: 'hsv', channel: 's' },
            { id: 'direct_hsv_v', text: 'Componente V (Brilho)', fullName: 'Valor/Brilho (Value) (HSV)', formula: '$$V$$', description: 'Brilho da cor (0-100%). 0% é preto.', type: 'direct', system: 'hsv', channel: 'v' },
        ],
        'Relações e Índices': [
            { id: 'ratio_h_s', text: 'Razão H/S', fullName: 'Razão H/S (HSV)', formula: '$$\\frac{H}{S}$$', description: 'Relação entre o matiz e a saturação da cor.', type: 'ratio', system: 'hsv', channels: ['h', 's'] },
            { id: 'ratio_h_v', text: 'Razão H/V', fullName: 'Razão H/V (HSV)', formula: '$$\\frac{H}{V}$$', description: 'Relação entre o matiz e o brilho da cor.', type: 'ratio', system: 'hsv', channels: ['h', 'v'] },
            { id: 'ratio_s_v', text: 'Índice Saturação/Brilho (S/V)', fullName: 'Índice Saturação/Brilho (HSV)', formula: '$$\\frac{S}{V}$$', description: 'Relação entre a pureza da cor e seu brilho.', type: 'ratio', system: 'hsv', channels: ['s', 'v'] },
            { id: 'ndi_h_s', text: 'NDI (H-S)', fullName: 'Índice de Diferença Normalizada (H-S) (HSV)', formula: '$$\\frac{H - S}{H + S}$$', description: 'Índice normalizado entre o matiz e a saturação.', type: 'ndi', system: 'hsv', channels: ['h', 's'] },
            { id: 'ndi_s_v', text: 'NDI (S-V)', fullName: 'Índice de Diferença Normalizada (S-V) (HSV)', formula: '$$\\frac{S - V}{S + V}$$', description: 'Índice normalizado entre a saturação e o brilho.', type: 'ndi', system: 'hsv', channels: ['s', 'v'] },
        ],
        'Comparações com Branco': [
            { id: 'delta_hsv_s', text: 'Diferença em S (ΔS)', fullName: 'Diferença em Saturação (ΔS) (HSV)', formula: '$$S_{\\text{branco}} - S_{\\text{amostra}}$$', description: 'Mede a mudança na pureza da cor em relação ao branco.', type: 'delta', system: 'hsv', channel: 's', needsWhite: true },
            { id: 'delta_hsv_v', text: 'Diferença em V (ΔV)', fullName: 'Diferença em Valor/Brilho (ΔV) (HSV)', formula: '$$V_{\\text{branco}} - V_{\\text{amostra}}$$', description: 'Mede a mudança no brilho da cor em relação ao branco.', type: 'delta', system: 'hsv', channel: 'v', needsWhite: true },
            { id: 'beer_hsv_v', text: 'Análogo Beer para V', fullName: 'Absorbância Análoga de V (HSV)', formula: '$$-\\log_{10}\\left(\\frac{V_{\\text{amostra}}}{V_{\\text{branco}}}\\right)$$', description: 'Análogo à absorbância para o componente de brilho V.', type: 'beer', system: 'hsv', channel: 'v', needsWhite: true },
            { id: 'euclidean_hsv', text: 'Distância Euclidiana (ΔE_hsv)', fullName: 'Distância Euclidiana (ΔE) (HSV)', formula: '$$\\sqrt{(\\Delta H)^2 + (\\Delta S)^2 + (\\Delta V)^2}$$','description': 'Distância geométrica entre a amostra e o branco no espaço de cor HSV.', type: 'euclidean_generic', system: 'hsv', channels: ['h', 's', 'v'], needsWhite: true },
        ]
    },
    'HSL': {
        'Componentes Diretos': [
            { id: 'direct_hsl_h', text: 'Componente H', fullName: 'Matiz (Hue) (HSL)', formula: '$$H$$', description: 'Atributo de cor (ex: vermelho, verde, azul) como um ângulo de 0 a 360.', type: 'direct', system: 'hsl', channel: 'h' },
            { id: 'direct_hsl_s', text: 'Componente S', fullName: 'Saturação (Saturation) (HSL)', formula: '$$S$$', description: 'Intensidade ou pureza da cor (0-100%).', type: 'direct', system: 'hsl', channel: 's' },
            { id: 'direct_hsl_l', text: 'Componente L (Luminosidade)', fullName: 'Luminosidade (Lightness) (HSL)', formula: '$$L$$', description: 'Luminosidade da cor (0-100%), onde 0% é preto, 50% é a cor pura e 100% é branco.', type: 'direct', system: 'hsl', channel: 'l' },
        ],
        'Relações e Índices': [
            { id: 'ratio_hsl_h_s', text: 'Razão H/S (HSL)', fullName: 'Razão H/S (HSL)', formula: '$$\\frac{H}{S}$$', description: 'Relação entre o matiz e a saturação da cor.', type: 'ratio', system: 'hsl', channels: ['h', 's'] },
            { id: 'ratio_hsl_h_l', text: 'Razão H/L (HSL)', fullName: 'Razão H/L (HSL)', formula: '$$\\frac{H}{L}$$', description: 'Relação entre o matiz e a luminosidade da cor.', type: 'ratio', system: 'hsl', channels: ['h', 'l'] },
            { id: 'ratio_hsl_s_l', text: 'Razão S/L (HSL)', fullName: 'Razão S/L (HSL)', formula: '$$\\frac{S}{L}$$', description: 'Relação entre a saturação e a luminosidade da cor.', type: 'ratio', system: 'hsl', channels: ['s', 'l'] },
            { id: 'ndi_hsl_s_l', text: 'NDI (S-L) (HSL)', fullName: 'Índice de Diferença Normalizada (S-L) (HSL)', formula: '$$\\frac{S - L}{S + L}$$', description: 'Índice normalizado entre a saturação e a luminosidade.', type: 'ndi', system: 'hsl', channels: ['s', 'l'] },
        ],
        'Comparações com Branco': [
            { id: 'delta_hsl_l', text: 'Diferença em L (ΔL)', fullName: 'Diferença em Luminosidade (ΔL) (HSL)', formula: '$$L_{\\text{branco}} - L_{\\text{amostra}}$$', description: 'Mede a mudança na luminosidade em relação ao branco.', type: 'delta', system: 'hsl', channel: 'l', needsWhite: true },
            { id: 'delta_hsl_s', text: 'Diferença em S (HSL-ΔS)', fullName: 'Diferença em Saturação (ΔS) (HSL)', formula: '$$S_{\\text{branco}} - S_{\\text{amostra}}$$', description: 'Mede a mudança na saturação da cor em relação ao branco.', type: 'delta', system: 'hsl', channel: 's', needsWhite: true },
            { id: 'beer_hsl_l', text: 'Análogo Beer para L', fullName: 'Absorbância Análoga de L (HSL)', formula: '$$-\\log_{10}\\left(\\frac{L_{\\text{amostra}}}{L_{\\text{branco}}}\\right)$$', description: 'Análogo à absorbância para o componente de luminosidade L.', type: 'beer', system: 'hsl', channel: 'l', needsWhite: true },
        ]
    },
    'YCbCr': {
        'Componentes (Luma e Croma)': [
            { id: 'direct_ycbcr_y', text: 'Componente Y (Luma)', fullName: 'Componente Luma (Y) (YCbCr)', formula: '$$Y$$', description: 'Componente de luminância (brilho) do sinal de vídeo.', type: 'direct', system: 'ycbcr', channel: 'y' },
            { id: 'direct_ycbcr_cb', text: 'Componente Cb', fullName: 'Diferença de Croma Azul (Cb) (YCbCr)', formula: '$$C_b$$', description: 'Componente de crominância azul (diferença entre azul e luma).', type: 'direct', system: 'ycbcr', channel: 'cb' },
            { id: 'direct_ycbcr_cr', text: 'Componente Cr', fullName: 'Diferença de Croma Vermelho (Cr) (YCbCr)', formula: '$$C_r$$', description: 'Componente de crominância vermelha (diferença entre vermelho e luma).', type: 'direct', system: 'ycbcr', channel: 'cr' },
        ],
        'Relações e Índices': [
            { id: 'ratio_y_cb', text: 'Razão Y/Cb', fullName: 'Razão Y/Cb (YCbCr)', formula: '$$\\frac{Y}{C_b}$$', description: 'Relação entre luma e croma azul.', type: 'ratio', system: 'ycbcr', channels: ['y', 'cb'] },
            { id: 'ratio_y_cr', text: 'Razão Y/Cr', fullName: 'Razão Y/Cr (YCbCr)', formula: '$$\\frac{Y}{C_r}$$', description: 'Relação entre luma e croma vermelho.', type: 'ratio', system: 'ycbcr', channels: ['y', 'cr'] },
            { id: 'ratio_cb_cr', text: 'Razão Cb/Cr', fullName: 'Razão Cb/Cr (YCbCr)', formula: '$$\\frac{C_b}{C_r}$$', description: 'Relação entre os dois componentes de crominância.', type: 'ratio', system: 'ycbcr', channels: ['cb', 'cr'] },
            { id: 'ndi_cb_cr', text: 'NDI (Cb-Cr)', fullName: 'Índice de Diferença Normalizada (Cb-Cr) (YCbCr)', formula: '$$\\frac{C_b - C_r}{C_b + C_r}$$', description: 'Índice normalizado entre os componentes de crominância.', type: 'ndi', system: 'ycbcr', channels: ['cb', 'cr'] },
        ],
        'Comparações com Branco': [
            { id: 'delta_ycbcr_y', text: 'Diferença em Y (ΔY)', fullName: 'Diferença em Luma (ΔY) (YCbCr)', formula: '$$Y_{\\text{branco}} - Y_{\\text{amostra}}$$', description: 'Mede a mudança na luma em relação ao branco.', type: 'delta', system: 'ycbcr', channel: 'y', needsWhite: true },
            { id: 'delta_ycbcr_cb', text: 'Diferença em Cb (ΔCb)', fullName: 'Diferença em Croma Azul (ΔCb) (YCbCr)', formula: '$$C_{b, \\text{branco}} - C_{b, \\text{amostra}}$$', description: 'Mede a mudança no croma azul em relação ao branco.', type: 'delta', system: 'ycbcr', channel: 'cb', needsWhite: true },
            { id: 'delta_ycbcr_cr', text: 'Diferença em Cr (ΔCr)', fullName: 'Diferença em Croma Vermelho (ΔCr) (YCbCr)', formula: '$$C_{r, \\text{branco}} - C_{r, \\text{amostra}}$$', description: 'Mede a mudança no croma vermelho em relação ao branco.', type: 'delta', system: 'ycbcr', channel: 'cr', needsWhite: true },
            { id: 'beer_ycbcr_y', text: 'Análogo Beer para Y', fullName: 'Absorbância Análoga de Y (YCbCr)', formula: '$$-\\log_{10}\\left(\\frac{Y_{\\text{amostra}}}{Y_{\\text{branco}}}\\right)$$', description: 'Análogo à absorbância para o componente de luma Y.', type: 'beer', system: 'ycbcr', channel: 'y', needsWhite: true },
            { id: 'euclidean_ycbcr', text: 'Distância Euclidiana (ΔE_ycbcr)', fullName: 'Distância Euclidiana (ΔE) (YCbCr)', formula: '$$\\sqrt{(\\Delta Y)^2 + (\\Delta C_b)^2 + (\\Delta C_r)^2}$$','description': 'Distância geométrica entre a amostra e o branco no espaço de cor YCbCr.', type: 'euclidean_generic', system: 'ycbcr', channels: ['y', 'cb', 'cr'], needsWhite: true },
        ]
    },
    'CMYK': {
        'Componentes de Cor': [
            { id: 'direct_cmyk_c', text: 'Componente C', fullName: 'Componente Ciano (C) (CMYK)', formula: '$$C$$', description: 'Componente Ciano (0-100) no modelo de cor subtrativo CMYK.', type: 'direct', system: 'cmyk', channel: 'c' },
            { id: 'direct_cmyk_m', text: 'Componente M', fullName: 'Componente Magenta (M) (CMYK)', formula: '$$M$$', description: 'Componente Magenta (0-100) no modelo de cor subtrativo CMYK.', type: 'direct', system: 'cmyk', channel: 'm' },
            { id: 'direct_cmyk_y', text: 'Componente Y', fullName: 'Componente Amarelo (Y) (CMYK)', formula: '$$Y$$', description: 'Componente Amarelo (Yellow) (0-100) no modelo de cor subtrativo CMYK.', type: 'direct', system: 'cmyk', channel: 'y' },
            { id: 'direct_cmyk_k', text: 'Componente K', fullName: 'Componente Chave/Preto (K) (CMYK)', formula: '$$K$$', description: 'Componente Preto (Key) (0-100) no modelo de cor subtrativo CMYK.', type: 'direct', system: 'cmyk', channel: 'k' },
        ],
        'Relações e Índices': [
            { id: 'ratio_c_m', text: 'Razão C/M', fullName: 'Razão C/M (CMYK)', formula: '$$\\frac{C}{M}$$', description: 'Relação entre os componentes Ciano e Magenta.', type: 'ratio', system: 'cmyk', channels: ['c', 'm'] },
            { id: 'ratio_c_y', text: 'Razão C/Y', fullName: 'Razão C/Y (CMYK)', formula: '$$\\frac{C}{Y}$$', description: 'Relação entre os componentes Ciano e Amarelo.', type: 'ratio', system: 'cmyk', channels: ['c', 'y'] },
            { id: 'ratio_m_y', text: 'Razão M/Y', fullName: 'Razão M/Y (CMYK)', formula: '$$\\frac{M}{Y}$$', description: 'Relação entre os componentes Magenta e Amarelo.', type: 'ratio', system: 'cmyk', channels: ['m', 'y'] },
            { id: 'ndi_c_m', text: 'NDI (C-M)', fullName: 'Índice de Diferença Normalizada (C-M) (CMYK)', formula: '$$\\frac{C - M}{C + M}$$', description: 'Índice normalizado entre os componentes Ciano e Magenta.', type: 'ndi', system: 'cmyk', channels: ['c', 'm'] },
            { id: 'ndi_c_y', text: 'NDI (C-Y)', fullName: 'Índice de Diferença Normalizada (C-Y) (CMYK)', formula: '$$\\frac{C - Y}{C + Y}$$', description: 'Índice normalizado entre os componentes Ciano e Amarelo.', type: 'ndi', system: 'cmyk', channels: ['c', 'y'] },
        ],
        'Comparações com Branco': [
            { id: 'delta_cmyk_c', text: 'Diferença em C (ΔC)', fullName: 'Diferença em Ciano (ΔC) (CMYK)', formula: '$$C_{\\text{branco}} - C_{\\text{amostra}}$$', description: 'Mede a mudança no componente Ciano em relação ao branco.', type: 'delta', system: 'cmyk', channel: 'c', needsWhite: true },
            { id: 'delta_cmyk_m', text: 'Diferença em M (ΔM)', fullName: 'Diferença em Magenta (ΔM) (CMYK)', formula: '$$M_{\\text{branco}} - M_{\\text{amostra}}$$', description: 'Mede a mudança no componente Magenta em relação ao branco.', type: 'delta', system: 'cmyk', channel: 'm', needsWhite: true },
            { id: 'delta_cmyk_y', text: 'Diferença em Y (CMYK-ΔY)', fullName: 'Diferença em Amarelo (ΔY) (CMYK)', formula: '$$Y_{\\text{branco}} - Y_{\\text{amostra}}$$', description: 'Mede a mudança no componente Amarelo em relação ao branco.', type: 'delta', system: 'cmyk', channel: 'y', needsWhite: true },
            { id: 'delta_cmyk_k', text: 'Diferença em K (ΔK)', fullName: 'Diferença em Chave/Preto (ΔK) (CMYK)', formula: '$$K_{\\text{branco}} - K_{\\text{amostra}}$$', description: 'Mede a mudança no componente Preto em relação ao branco.', type: 'delta', system: 'cmyk', channel: 'k', needsWhite: true },
            { id: 'euclidean_cmyk', text: 'Distância Euclidiana (ΔE_cmyk)', fullName: 'Distância Euclidiana (ΔE) (CMYK)', formula: '$$\\sqrt{(\\Delta C)^2 + (\\Delta M)^2 + (\\Delta Y)^2 + (\\Delta K)^2}$$','description': 'Distância geométrica entre a amostra e o branco no espaço de cor CMYK.', type: 'euclidean_generic', system: 'cmyk', channels: ['c', 'm', 'y', 'k'], needsWhite: true },
        ]
    },
    'XYZ': {
        'Componentes Tristimulus': [
            { id: 'direct_xyz_x', text: 'Componente X', fullName: 'Componente Tristimulus X (CIE-XYZ)', formula: '$$X$$', description: 'Um dos três valores tristimulus que descrevem a cor, relacionado a uma mistura de curvas de resposta cone do olho humano.', type: 'direct', system: 'xyz', channel: 'x' },
            { id: 'direct_xyz_y', text: 'Componente Y (Luminância)', fullName: 'Componente Tristimulus Y (Luminância) (CIE-XYZ)', formula: '$$Y$$', description: 'O componente de luminância (brilho) no espaço XYZ, diretamente relacionado à percepção de claridade.', type: 'direct', system: 'xyz', channel: 'y' },
            { id: 'direct_xyz_z', text: 'Componente Z', fullName: 'Componente Tristimulus Z (CIE-XYZ)', formula: '$$Z$$', description: 'O terceiro valor tristimulus, aproximadamente relacionado à resposta do cone azul.', type: 'direct', system: 'xyz', channel: 'z' },
        ],
        'Cromaticidade': [
            { id: 'chromaticity_x', text: 'Cromaticidade x', fullName: 'Coordenada de Cromaticidade x (CIE-XYZ)', formula: '$$\\frac{X}{X + Y + Z}$$', description: 'Coordenada de cromaticidade (cor, independente do brilho) no diagrama de cromaticidade CIE 1931.', type: 'xyz_chromaticity', channel: 'x' },
            { id: 'chromaticity_y', text: 'Cromaticidade y', fullName: 'Coordenada de Cromaticidade y (CIE-XYZ)', formula: '$$\\frac{Y}{X + Y + Z}$$', description: 'Coordenada de cromaticidade (cor, independente do brilho) no diagrama de cromaticidade CIE 1931.', type: 'xyz_chromaticity', channel: 'y' },
        ],
        'Relações e Comparações': [
            { id: 'beer_xyz_y', text: 'Análogo Beer para Y (Luminância)', fullName: 'Absorbância Análoga de Y (CIE-XYZ)', formula: '$$-\\log_{10}\\left(\\frac{Y_{\\text{amostra}}}{Y_{\\text{branco}}}\\right)$$', description: 'Análogo à absorbância para o componente de luminância Y.', type: 'beer', system: 'xyz', channel: 'y', needsWhite: true },
            { id: 'ratio_x_y', text: 'Razão X/Y', fullName: 'Razão X/Y (CIE-XYZ)', formula: '$$\\frac{X}{Y}$$', description: 'Relação entre os componentes tristimulus X e Y.', type: 'ratio', system: 'xyz', channels: ['x', 'y'] },
            { id: 'ratio_y_z', text: 'Razão Y/Z', fullName: 'Razão Y/Z (CIE-XYZ)', formula: '$$\\frac{Y}{Z}$$', description: 'Relação entre os componentes tristimulus Y e Z.', type: 'ratio', system: 'xyz', channels: ['y', 'z'] },
        ]
    },
    'HunterLab': {
        'Componentes Hunter': [
            { id: 'direct_hunter_l', text: 'Componente L', fullName: 'Luminosidade L (HunterLab)', formula: '$$L$$', description: 'Componente de luminosidade no espaço de cor Hunter L,a,b.', type: 'direct', system: 'hunterLab', channel: 'l' },
            { id: 'direct_hunter_a', text: 'Componente a', fullName: 'Componente Verde-Vermelho a (HunterLab)', formula: '$$a$$', description: 'Eixo de cor do verde (-a) ao vermelho (+a) no espaço Hunter L,a,b.', type: 'direct', system: 'hunterLab', channel: 'a' },
            { id: 'direct_hunter_b', text: 'Componente b', fullName: 'Componente Azul-Amarelo b (HunterLab)', formula: '$$b$$', description: 'Eixo de cor do azul (-b) ao amarelo (+b) no espaço Hunter L,a,b.', type: 'direct', system: 'hunterLab', channel: 'b' },
        ],
        'Relações e Índices': [
            { id: 'ratio_hunter_l_a', text: 'Razão L/a (Hunter)', fullName: 'Razão L/a (HunterLab)', formula: '$$\\frac{L}{a}$$', description: 'Relação entre a luminosidade e o componente verde-vermelho.', type: 'ratio', system: 'hunterLab', channels: ['l', 'a'] },
            { id: 'ratio_hunter_l_b', text: 'Razão L/b (Hunter)', fullName: 'Razão L/b (HunterLab)', formula: '$$\\frac{L}{b}$$', description: 'Relação entre a luminosidade e o componente azul-amarelo.', type: 'ratio', system: 'hunterLab', channels: ['l', 'b'] },
            { id: 'ratio_hunter_a_b', text: 'Razão a/b (Hunter)', fullName: 'Razão a/b (HunterLab)', formula: '$$\\frac{a}{b}$$', description: 'Relação entre os componentes de cromaticidade do espaço HunterLab.', type: 'ratio', system: 'hunterLab', channels: ['a', 'b'] },
        ],
        'Comparações com Branco': [
            { id: 'delta_hunter_l', text: 'Diferença em L (Hunter-ΔL)', fullName: 'Diferença em L (ΔL) (HunterLab)', formula: '$$L_{\\text{branco}} - L_{\\text{amostra}}$$', description: 'Mede a mudança na luminosidade (Hunter L) em relação ao branco.', type: 'delta', system: 'hunterLab', channel: 'l', needsWhite: true },
            { id: 'delta_hunter_a', text: 'Diferença em a (Hunter-Δa)', fullName: 'Diferença em a (Δa) (HunterLab)', formula: '$$a_{\\text{branco}} - a_{\\text{amostra}}$$', description: 'Mede a mudança no eixo verde-vermelho (Hunter a) em relação ao branco.', type: 'delta', system: 'hunterLab', channel: 'a', needsWhite: true },
            { id: 'delta_hunter_b', text: 'Diferença em b (Hunter-Δb)', fullName: 'Diferença em b (Δb) (HunterLab)', formula: '$$b_{\\text{branco}} - b_{\\text{amostra}}$$', description: 'Mede a mudança no eixo azul-amarelo (Hunter b) em relação ao branco.', type: 'delta', system: 'hunterLab', channel: 'b', needsWhite: true },
            { id: 'beer_hunter_l', text: 'Análogo Beer para L (Hunter)', fullName: 'Absorbância Análoga de L (HunterLab)', formula: '$$-\\log_{10}\\left(\\frac{L_{\\text{amostra}}}{L_{\\text{branco}}}\\right)$$', description: 'Análogo à absorbância para o componente de luminosidade L de Hunter.', type: 'beer', system: 'hunterLab', channel: 'l', needsWhite: true },
            { id: 'euclidean_hunter', text: 'Distância Euclidiana (ΔE_hunter)', fullName: 'Distância Euclidiana (ΔE) (HunterLab)', formula: '$$\\sqrt{(\\Delta L)^2 + (\\Delta a)^2 + (\\Delta b)^2}$$','description': 'Distância geométrica entre a amostra e o branco no espaço de cor Hunter L,a,b.', type: 'euclidean_generic', system: 'hunterLab', channels: ['l', 'a', 'b'], needsWhite: true },
        ]
    },
    'Sintéticos (Inter-sistema)': {
        'Relações de Luminosidade': [
            { id: 'inter_ratio_L_V', text: 'Razão L*(CIELab) / V(HSV)', fullName: 'Razão Luminosidade(CIELAB) / Valor(HSV)', formula: '$$\\frac{L^*}{V}$$', description: 'Relação entre a luminosidade perceptual (CIELAB) e o brilho (HSV).', type: 'inter_ratio', systems: ['lab', 'hsv'], channels: ['l', 'v'] },
            { id: 'inter_ratio_L_Y', text: 'Razão L*(CIELab) / Y(YCbCr)', fullName: 'Razão Luminosidade(CIELAB) / Luma(YCbCr)', formula: '$$\\frac{L^*}{Y}$$', description: 'Relação entre a luminosidade perceptual (CIELAB) e o componente de luma de vídeo (YCbCr).', type: 'inter_ratio', systems: ['lab', 'ycbcr'], channels: ['l', 'y'] },
            { id: 'inter_ratio_V_LHSL', text: 'Razão V(HSV) / L(HSL)', fullName: 'Razão Valor(HSV) / Luminosidade(HSL)', formula: '$$\\frac{V}{L}$$', description: 'Relação entre os componentes de brilho/luminosidade dos espaços HSV e HSL.', type: 'inter_ratio', systems: ['hsv', 'hsl'], channels: ['v', 'l'] },
        ],
        'Relações de Croma e Saturação': [
            { id: 'inter_ratio_C_S', text: 'Razão Croma*(CIELab) / S(HSV)', fullName: 'Razão Croma(CIELAB) / Saturação(HSV)', formula: '$$\\frac{C^*}{S}$$', description: 'Relação entre a pureza da cor perceptual (C*) e a saturação (HSV).', type: 'inter_ratio_cstar', systems: ['lab', 'hsv'], channels: ['c_star', 's'] },
            { id: 'inter_ratio_C_SHSL', text: 'Razão Croma*(CIELab) / S(HSL)', fullName: 'Razão Croma(CIELAB) / Saturação(HSL)', formula: '$$\\frac{C^*}{S}$$', description: 'Relação entre a pureza da cor perceptual (C*) e a saturação (HSL).', type: 'inter_ratio_cstar', systems: ['lab', 'hsl'], channels: ['c_star', 's'] },
        ],
        'Relações RGB vs. Perceptual': [
            { id: 'inter_ratio_R_Lstar', text: 'Razão R(RGB) / L*(CIELab)', fullName: 'Razão R(RGB) / L*(CIELAB)', formula: '$$\\frac{R}{L^*}$$', description: 'Normaliza o canal Vermelho pela luminosidade perceptual.', type: 'inter_ratio', systems: ['rgb', 'lab'], channels: ['avgR', 'l'] },
            { id: 'inter_ratio_G_Lstar', text: 'Razão G(RGB) / L*(CIELab)', fullName: 'Razão G(RGB) / L*(CIELAB)', formula: '$$\\frac{G}{L^*}$$', description: 'Normaliza o canal Verde pela luminosidade perceptual.', type: 'inter_ratio', systems: ['rgb', 'lab'], channels: ['avgG', 'l'] },
            { id: 'inter_ratio_B_Lstar', text: 'Razão B(RGB) / L*(CIELab)', fullName: 'Razão B(RGB) / L*(CIELAB)', formula: '$$\\frac{B}{L^*}$$', description: 'Normaliza o canal Azul pela luminosidade perceptual.', type: 'inter_ratio', systems: ['rgb', 'lab'], channels: ['avgB', 'l'] },
            { id: 'inter_ratio_RGB_Lstar', text: 'Razão (R+G+B) / L*(CIELab)', fullName: 'Razão (R+G+B) / L*(CIELAB)', formula: '$$\\frac{R+G+B}{L^*}$$', description: 'Relação entre a intensidade RGB total e a luminosidade perceptual.', type: 'inter_ratio_sum_rgb', systems: ['rgb', 'lab'], channels: ['sum', 'l'] },
            { id: 'inter_ratio_R_astar', text: 'Razão R(RGB) / a*(CIELab)', fullName: 'Razão R(RGB) / a*(CIELAB)', formula: '$$\\frac{R}{a^*}$$', description: 'Relação entre o canal Vermelho e o componente de cromaticidade a*.', type: 'inter_ratio', systems: ['rgb', 'lab'], channels: ['avgR', 'a']},
            { id: 'inter_ratio_G_astar', text: 'Razão G(RGB) / a*(CIELab)', fullName: 'Razão G(RGB) / a*(CIELAB)', formula: '$$\\frac{G}{a^*}$$', description: 'Relação entre o canal Verde e o componente de cromaticidade a*.', type: 'inter_ratio', systems: ['rgb', 'lab'], channels: ['avgG', 'a']},
            { id: 'inter_ratio_B_bstar', text: 'Razão B(RGB) / b*(CIELab)', fullName: 'Razão B(RGB) / b*(CIELAB)', formula: '$$\\frac{B}{b^*}$$', description: 'Relação entre o canal Azul e o componente de cromaticidade b*.', type: 'inter_ratio', systems: ['rgb', 'lab'], channels: ['avgB', 'b']},
            { id: 'inter_ratio_R_cstar', text: 'Razão R(RGB) / C*(CIELab)', fullName: 'Razão R(RGB) / C*(CIELAB)', formula: '$$\\frac{R}{C^*}$$', description: 'Relação entre o canal Vermelho e o Croma perceptual.', type: 'inter_ratio_rgb_vs_cstar', systems: ['rgb', 'lab'], channels: ['avgR', 'c_star'] },
            { id: 'inter_ratio_G_cstar', text: 'Razão G(RGB) / C*(CIELab)', fullName: 'Razão G(RGB) / C*(CIELAB)', formula: '$$\\frac{G}{C^*}$$', description: 'Relação entre o canal Verde e o Croma perceptual.', type: 'inter_ratio_rgb_vs_cstar', systems: ['rgb', 'lab'], channels: ['avgG', 'c_star'] },
            { id: 'inter_ratio_B_cstar', text: 'Razão B(RGB) / C*(CIELab)', fullName: 'Razão B(RGB) / C*(CIELAB)', formula: '$$\\frac{B}{C^*}$$', description: 'Relação entre o canal Azul e o Croma perceptual.', type: 'inter_ratio_rgb_vs_cstar', systems: ['rgb', 'lab'], channels: ['avgB', 'c_star'] },
        ]
    }
};
// --- FIM DA ALTERAÇÃO ---