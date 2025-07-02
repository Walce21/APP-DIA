// js/log.js

/**
 * Define se os logs devem ser exibidos no console.
 * Mude para false para desativar todos os logs em produção.
 */
const DEBUG_MODE = true;

/**
 * Função de logging centralizada para a aplicação.
 *
 * @param {string} tag - O módulo ou contexto de onde o log se origina (ex: 'state', 'analysisManager').
 * @param {string} [type='info'] - O tipo de log ('info', 'warn', 'error').
 * @param {...any} data - Os dados a serem registrados (mensagens, objetos, etc.).
 */
function log(tag, type = 'info', ...data) {
  // Se o modo de depuração estiver desativado, não faz nada.
  if (!DEBUG_MODE) {
    return;
  }

  // Formata o prefixo para fácil identificação no console.
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  const prefix = `[${timestamp}] [${tag.toUpperCase()}]`;

  // Escolhe o método de console apropriado com base no tipo de log.
  switch (type.toLowerCase()) {
    case 'warn':
      console.warn(prefix, ...data);
      break;
    case 'error':
      console.error(prefix, ...data);
      break;
    case 'info':
    default:
      console.log(prefix, ...data);
      break;
  }

  /*
   * PONTO DE EXPANSÃO FUTURA:
   * Se no futuro você quiser enviar logs para um servidor ou exibi-los
   * em uma área da própria interface, você pode adicionar o código aqui.
   *
   * Exemplo para salvar em um array:
   * self.logHistory = self.logHistory || [];
   * self.logHistory.push({ timestamp, tag, type, data });
   *
   * Exemplo para enviar a um servidor:
   * if (type === 'error') {
   * sendLogToServer({ timestamp, tag, data });
   * }
   */
}

// Para evitar a necessidade de importar a função em todos os arquivos,
// nós a tornamos globalmente acessível através do objeto 'self'.
// O 'self' funciona tanto no escopo da janela (window) quanto no de um Web Worker,
// tornando este script compatível com ambos os ambientes.
self.log = log;