// Détermine les services dont l'image doit être reconstruite depuis une référence git.
//   node scripts/affected-services.mjs origin/main
// Sorties (aussi écrites dans $GITHUB_OUTPUT) :
//   services=[...]   services modifiés, ou dépendant d'une librairie modifiée -> reconstruits
//   unchanged=[...]  autres services -> leur dernière image est simplement re-taggée
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const base = process.argv[2];

// Fichiers qui entrent dans la construction de toutes les images.
const GLOBAL_FILES = [/^package\.json$/, /^pnpm-lock\.yaml$/, /^pnpm-workspace\.yaml$/, /^tsconfig\.base\.json$/, /^docker\//];

/** Paquets du workspace : nom, dossier et dépendances internes (@un/...). */
function readWorkspace() {
  const packages = [];
  for (const group of ['apps', 'libs']) {
    for (const entry of readdirSync(join(root, group), { withFileTypes: true })) {
      const manifestPath = join(root, group, entry.name, 'package.json');
      if (!entry.isDirectory() || !existsSync(manifestPath)) continue;
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      const deps = { ...manifest.dependencies, ...manifest.devDependencies };
      packages.push({
        name: manifest.name,
        dir: `${group}/${entry.name}`,
        isService: group === 'apps',
        service: entry.name,
        internalDeps: Object.keys(deps).filter((dep) => dep.startsWith('@un/')),
      });
    }
  }
  return packages;
}

function changedFiles() {
  return execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

function affectedServices(packages) {
  const services = packages.filter((p) => p.isService).map((p) => p.service);
  // Premier push d'une branche, ou pas de référence : tout reconstruire.
  if (!base || /^0+$/.test(base)) return services;

  const files = changedFiles();
  if (files.some((file) => GLOBAL_FILES.some((re) => re.test(file)))) return services;

  // Paquets touchés directement, puis propagation aux paquets qui en dépendent.
  const affected = new Set(
    packages.filter((p) => files.some((file) => file.startsWith(`${p.dir}/`))).map((p) => p.name),
  );
  let grew = true;
  while (grew) {
    grew = false;
    for (const p of packages) {
      if (!affected.has(p.name) && p.internalDeps.some((dep) => affected.has(dep))) {
        affected.add(p.name);
        grew = true;
      }
    }
  }
  return packages.filter((p) => p.isService && affected.has(p.name)).map((p) => p.service);
}

const packages = readWorkspace();
const all = packages.filter((p) => p.isService).map((p) => p.service).sort();
const services = affectedServices(packages).sort();
const unchanged = all.filter((s) => !services.includes(s));

const lines = [`services=${JSON.stringify(services)}`, `unchanged=${JSON.stringify(unchanged)}`];
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
console.log(lines.join('\n'));
