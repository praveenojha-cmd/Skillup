// Cross-platform replacement for the Unix-only `cp` / `mkdir -p` chain
// previously used in package.json's build script.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'dist', 'bundle.js');

const destinations = [
  path.join(root, 'admin-portal', 'js', 'bundle.js'),
  path.join(root, 'admin', 'js', 'bundle.js'),
  path.join(root, 'app', 'src', 'main', 'assets', 'admin_portal', 'js', 'bundle.js')
];

for (const dest of destinations) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(source, dest);
  console.log(`Copied bundle.js -> ${path.relative(root, dest)}`);
}
