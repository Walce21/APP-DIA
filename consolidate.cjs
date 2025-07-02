// consolidate.js

import fs from 'fs';
import path from 'path';

// --- CONFIGURAÇÃO (AJUSTADA PARA O PROJETO ATUAL) ---
// Adicione aqui as pastas e arquivos que você quer incluir.
const pathsToInclude = [
  'public',           // Pasta principal do nosso app
  'firebase.json',    // Arquivo de configuração do Firebase
  '.firebaserc',      // Arquivo de configuração do Firebase
];

// Adicione aqui pastas ou arquivos que devem ser IGNORADOS.
const pathsToIgnore = [
  'node_modules',
  '.git',
  '.vscode',
  'dist',
  'build',
  '.DS_Store',
  'consolidate.js', // Ignora o próprio script
  '_clipboard.txt'  // Ignora o arquivo de saída
];

// Onde o arquivo de saída será salvo.
const outputFile = '_clipboard.txt';
// --------------------

let finalContent = '';

// Função que percorre as pastas recursivamente
function walkDir(currentPath) {
  const files = fs.readdirSync(currentPath);
  for (const file of files) {
    const filePath = path.join(currentPath, file);
    
    // Verifica se o caminho deve ser ignorado
    if (pathsToIgnore.some(ignorePath => filePath.includes(ignorePath))) {
      continue;
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath); // Se for um diretório, entra nele
    } else {
      // Se for um arquivo, lê o conteúdo
      console.log(`Lendo arquivo: ${filePath}`);
      const content = fs.readFileSync(filePath, 'utf-8');
      finalContent += `--- FILE: ${filePath} ---\n`;
      finalContent += `${content}\n\n`;
    }
  }
}

console.log('Iniciando a consolidação dos arquivos do projeto atual...');

// Processa todas as pastas e arquivos definidos em pathsToInclude
pathsToInclude.forEach(p => {
    if (fs.existsSync(p)) {
        if (fs.statSync(p).isDirectory()) {
            walkDir(p);
        } else {
            console.log(`Lendo arquivo: ${p}`);
            const content = fs.readFileSync(p, 'utf-8');
            finalContent += `--- FILE: ${p} ---\n`;
            finalContent += `${content}\n\n`;
        }
    } else {
        console.warn(`Atenção: O caminho '${p}' não foi encontrado e será ignorado.`);
    }
});

// Salva o conteúdo consolidado em um arquivo de texto
fs.writeFileSync(outputFile, finalContent);
console.log(`\nArquivos consolidados com sucesso em: ${outputFile}`);

// Tenta copiar para a área de transferência
(async () => {
  try {
    const { default: clipboardy } = await import('clipboardy');
    clipboardy.writeSync(finalContent);
    console.log('✅ Conteúdo copiado para a área de transferência!');
  } catch (error) {
    console.log('\n"clipboardy" não encontrado. Para copiar automaticamente, execute:');
    console.log('npm install clipboardy');
  }
})();