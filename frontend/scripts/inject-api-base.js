// Auto-generate frontend/config.js from environment variables
const fs = require('fs');
const path = require('path');

const apiBase = process.env.FRONTEND_API_BASE || '';
const adminPassword = process.env.ADMIN_PASSWORD || '';

const frontendDir = path.join(__dirname, '..');
const configPath = path.join(frontendDir, 'config.js');

function normalize(v) {
  if (!v) return '';
  v = String(v).trim();
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v.replace(/^\/+|\/+$/g, '');
  return v.replace(/\/+$/, '');
}

const normalized = normalize(apiBase);
const passwordStr = adminPassword ? JSON.stringify(adminPassword.trim()) : 'undefined';

const content = `// Auto-generated at build time
window.__API_BASE__ = ${JSON.stringify(normalized)};
window.ADMIN_PASSWORD = ${passwordStr};
`;

try {
  fs.writeFileSync(configPath, content, 'utf8');
  console.log('Wrote', configPath);
  console.log('  API_BASE:', normalized || "(empty)");
  console.log('  ADMIN_PASSWORD:', adminPassword ? '***' : "(not set)");
} catch (err) {
  console.error('Failed to write', configPath, err);
  process.exit(1);
}
