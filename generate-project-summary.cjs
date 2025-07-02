const fs = require('fs');
const path = require('path');

// Lista de pastas/arquivos a ignorar
const ignoreList = [
  'node_modules',
  '.git',
  'dist',
  '.DS_Store',
  '_clipboard.txt',
  'consolidate.cjs',
  'generate-project-summary.cjs',
  'project-summary.md'
];

// Função para analisar arquivos
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').length;
  const sizeKB = (fs.statSync(filePath).size / 1024).toFixed(2);

  const imports = content.match(/(import|require)\s.+from\s.+|require\(.+\)/g) || [];

  return {
    lines,
    sizeKB,
    imports
  };
}

// Função recursiva para andar nas pastas
function walkDir(currentPath, indent = '') {
  const items = fs.readdirSync(currentPath);

  items.forEach(item => {
    const fullPath = path.join(currentPath, item);
    const relativePath = path.relative('.', fullPath);

    // Ignorar paths
    if (ignoreList.some(ignore => relativePath.includes(ignore))) {
      return;
    }

    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      summary += `${indent}📁 ${item}/\n`;
      walkDir(fullPath, indent + '  ');
    } else {
      const { lines, sizeKB, imports } = analyzeFile(fullPath);
      summary += `${indent}📄 ${item} - ${lines} linhas - ${sizeKB} KB\n`;
      if (imports.length > 0) {
        summary += `${indent}   ↳ Imports: ${imports.length} encontrados\n`;
      }
    }
  });
}

let summary = `# Project Summary (Estrutura Completa)\n\n## Diretórios e Arquivos:\n\n`;

walkDir('.');

fs.writeFileSync('project-summary.md', summary);

console.log('✅ Novo summary gerado com sucesso em project-summary.md');
