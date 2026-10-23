// Crée un service NestJS à partir du gabarit commun : pnpm new-service <nom-en-kebab-case>
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const name = process.argv[2];

if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error('Usage : pnpm new-service <nom-en-kebab-case>');
  process.exit(1);
}

const target = join(root, 'apps', name);
if (existsSync(target)) {
  console.error(`apps/${name} existe déjà.`);
  process.exit(1);
}

cpSync(join(root, 'tools', 'templates', 'nest-service'), target, { recursive: true });

function replacePlaceholder(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) replacePlaceholder(path);
    else writeFileSync(path, readFileSync(path, 'utf8').replaceAll('__SERVICE__', name));
  }
}
replacePlaceholder(target);

console.log(`apps/${name} créé. Étapes suivantes :
  1. pnpm install
  2. déclarer le service dans compose.yaml et deploy/helm/urbannavigators/values.yaml
  3. l'ajouter à SERVICES dans libs/contracts/src/services.ts
  4. justifier ce service supplémentaire par un ADR (ARC-004 : sept capacités au maximum)`);
