import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

console.log('=== Veritas RAG Frontend Build & Smoke Verification ===');

if (!fs.existsSync(distDir)) {
  console.error('FAIL: dist/ directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

const htmlPath = path.join(distDir, 'index.html');
if (!fs.existsSync(htmlPath)) {
  console.error('FAIL: dist/index.html not found.');
  process.exit(1);
}

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
if (!htmlContent.includes('<title>Veritas RAG') && !htmlContent.includes('Veritas')) {
  console.warn('NOTICE: index.html title might not be branded Veritas.');
}

const assetsDir = path.join(distDir, 'assets');
if (!fs.existsSync(assetsDir)) {
  console.error('FAIL: dist/assets directory not found.');
  process.exit(1);
}

const assetFiles = fs.readdirSync(assetsDir);
const jsBundles = assetFiles.filter(f => f.endsWith('.js'));
const cssBundles = assetFiles.filter(f => f.endsWith('.css'));

if (jsBundles.length === 0) {
  console.error('FAIL: No JS bundles generated in dist/assets.');
  process.exit(1);
}

if (cssBundles.length === 0) {
  console.error('FAIL: No CSS bundle generated in dist/assets.');
  process.exit(1);
}

console.log(`PASS: Build artifact verified successfully.`);
console.log(`- HTML: ${htmlPath}`);
console.log(`- JavaScript bundle: ${jsBundles.join(', ')}`);
console.log(`- CSS bundle: ${cssBundles.join(', ')}`);
console.log('=== All Smoke Checks Passed ===');
