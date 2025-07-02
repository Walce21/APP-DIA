// public/js/qualityParams.js
// Este arquivo define as descrições para os parâmetros de qualidade da regressão.
// Ele é carregado como um script clássico global no index.html.

const QUALITY_PARAMETERS_INFO = {
  r2: {
    title: 'R² (Coeficiente de Determinação)',
    description: 'Indica o quão bem os pontos de dados da calibração se ajustam à reta ou curva do modelo. Um valor de 0.99, por exemplo, significa que 99% da variação do sinal pode ser explicada pela variação na concentração. Embora um R² alto seja desejável, ele deve ser sempre avaliado em conjunto com outros parâmetros, como o erro padrão da regressão.',
    formula: '$$R^2 = 1 - \\frac{SS_{\\text{res}}}{SS_{\\text{tot}}} = 1 - \\frac{\\sum(y_i - \\hat{y}_i)^2}{\\sum(y_i - \\bar{y})^2}$$'
  },
  sensitivity: {
    title: 'Sensibilidade Analítica (Coeficiente Angular)',
    description: 'Para modelos lineares, corresponde ao coeficiente angular (m) da reta de calibração. Mede o quanto o sinal analítico (eixo Y) responde a uma mudança na concentração do analito (eixo X). Quanto maior o valor da sensibilidade (em módulo), mais "sensível" é o método, sendo capaz de detectar pequenas variações de concentração com maior facilidade.',
    // --- ALTERAÇÃO: "Sensibilidade" envolvida em \text{} ---
    formula: '$$y = mx + b \\quad \\rightarrow \\quad \\text{Sensibilidade} = m$$'
  },
  Syx: {
    title: 'S_{y/x} (Erro Padrão da Regressão)',
    description: 'Mede a dispersão média (ou o "desvio padrão") dos pontos de calibração em torno da linha de regressão ajustada. É uma medida do "erro médio" do modelo ao prever o sinal analítico. Diferente do R², este valor possui a mesma unidade do eixo Y (sinal). Quanto menor o valor de S_{y/x}, mais precisos são os dados da calibração.',
    formula: '$$S_{y/x} = \\sqrt{\\frac{\\sum(y_i - \\hat{y}_i)^2}{n-p}}$$'
  },
  lod: {
    title: 'LOD (Limite de Detecção)',
    description: 'A menor concentração do analito que pode ser detectada e confiavelmente diferenciada do sinal de um branco (ausência do analito), com um determinado nível de confiança estatística. Análises com resultado abaixo do LOD devem ser reportadas como "não detectado" ou "< LOD".',
    formula: '$$LOD = \\frac{3.3 \\times S_{y/x}}{|m|}$$'
  },
  loq: {
    title: 'LOQ (Limite de Quantificação)',
    description: 'A menor concentração do analito que pode ser determinada quantitativamente com um nível de precisão e exatidão considerado aceitável. Define o início da faixa de trabalho na qual se pode reportar um resultado numérico com confiança. O LOQ é sempre maior que o LOD.',
    formula: '$$LOQ = \\frac{10 \\times S_{y/x}}{|m|}$$'
  },
  range: {
    title: 'Faixa de Calibração',
    description: 'Indica o intervalo de concentração (do padrão mais baixo ao mais alto) que foi efetivamente utilizado para construir o modelo de regressão. O modelo matemático é considerado válido e confiável apenas dentro desta faixa. Prever concentrações de amostras que caiam muito fora deste intervalo (extrapolação) pode levar a resultados com erro elevado e não é uma prática analítica recomendada.',
    // --- ALTERAÇÃO: "Concentração" envolvida em \text{} ---
    formula: '$$[\\text{Concentração}_{min}, \\text{Concentração}_{max}]$$'
  }
};