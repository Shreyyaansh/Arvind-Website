// Auto-generate frontend/config.js from environment variable FRONTEND_API_BASE
const fs = require('fs');
const path = require('path');

const apiBase = process.env.FRONTEND_API_BASE || '';
const frontendDir = path.join(__dirname, '..', 'frontend');
const configPath = path.join(frontendDir, 'config.js');

function normalize(v) {
  if (!v) return '';
  v = String(v).trim();
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v.replace(/^\/+|\/+$/g, '');
  return v.replace(/\/+$/, '');
}

const normalized = normalize(apiBase);
const content = `// Auto-generated at build time
window.__API_BASE__ = ${JSON.stringify(normalized)};
`;

try {
  fs.writeFileSync(configPath, content, 'utf8');
  console.log('Wrote', configPath, '->', normalized || "(empty)");
} catch (err) {
  console.error('Failed to write', configPath, err);
  process.exit(1);
}
