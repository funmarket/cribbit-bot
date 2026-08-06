const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '..', 'public');
const output = path.join(__dirname, '..', 'dist');

fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(source, output, { recursive: true });

for (const file of ['index.html', 'app.html', 'app.js', 'i18n.js', 'styles.css', 'logo.png']) {
  if (!fs.existsSync(path.join(output, file))) throw new Error(`Vercel build is missing ${file}`);
}

console.log(`Prepared Vercel static output in ${output}`);
