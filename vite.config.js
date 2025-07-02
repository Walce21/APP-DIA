import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // Define o diretório 'public' como a fonte de arquivos estáticos.
  // É recomendado mover arquivos como manifest.json, icons, e bibliotecas JS de terceiros para esta pasta.
  publicDir: 'public',

  build: {
    // Define o diretório de saída para os arquivos de produção.
    // O comando 'npm run build' criará uma pasta 'dist' com o app otimizado.
    outDir: 'dist',
  },

  server: {
    // Abre automaticamente o navegador quando o servidor de desenvolvimento é iniciado com 'npm run dev'.
    open: true,
  },
});