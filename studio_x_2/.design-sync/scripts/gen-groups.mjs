// gen-groups.mjs — assign each discovered component to a DS-pane group and emit
// category stub files + a docsMap (cfg.docsMap). Run from studio-x.
// Groups come from the component's source family: shadcn ui/ files map by table,
// every feature component → "App components". Sparkline (a chart) → Data display.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const FILE_GROUP = {
  button: 'Actions', toggle: 'Actions', 'toggle-group': 'Actions',
  input: 'Forms', textarea: 'Forms', label: 'Forms', checkbox: 'Forms', switch: 'Forms', select: 'Forms', 'input-group': 'Forms',
  dialog: 'Overlays', 'alert-dialog': 'Overlays', sheet: 'Overlays', 'dropdown-menu': 'Overlays', tooltip: 'Overlays', command: 'Overlays',
  tabs: 'Navigation', breadcrumb: 'Navigation', 'navigation-menu': 'Navigation', sidebar: 'Navigation',
  table: 'Data display', card: 'Data display', badge: 'Data display', avatar: 'Data display', progress: 'Data display',
  skeleton: 'Data display', separator: 'Data display', 'scroll-area': 'Data display', collapsible: 'Data display',
  sonner: 'Feedback',
};

const root = 'ds-bundle/components';
const allNames = new Set();
for (const g of readdirSync(root)) for (const n of readdirSync(join(root, g))) allNames.add(n);

const nameGroup = {};
for (const [file, group] of Object.entries(FILE_GROUP)) {
  let src; try { src = readFileSync(`components/ui/${file}.tsx`, 'utf8'); } catch { continue; }
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:function|const)\s+([A-Z][A-Za-z0-9]*)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g))
    for (const part of m[1].split(',')) {
      const id = part.trim().split(/\s+as\s+/).pop().trim();
      if (/^[A-Z][A-Za-z0-9]*$/.test(id)) names.add(id);
    }
  for (const n of names) if (allNames.has(n)) nameGroup[n] = group;
}
for (const n of allNames) if (!nameGroup[n]) nameGroup[n] = 'App components';
if (allNames.has('Sparkline')) nameGroup['Sparkline'] = 'Data display';

const slug = (g) => g.replace(/\s+/g, '-');
mkdirSync('.design-sync/groups', { recursive: true });
for (const g of new Set(Object.values(nameGroup)))
  writeFileSync(`.design-sync/groups/${slug(g)}.md`, `---\ncategory: ${g}\n---\n`);

const docsMap = {};
for (const [n, g] of Object.entries(nameGroup)) docsMap[n] = `.design-sync/groups/${slug(g)}.md`;
mkdirSync('.design-sync/.cache', { recursive: true });
writeFileSync('.design-sync/.cache/docsmap.json', JSON.stringify(docsMap, null, 2));

const counts = {};
for (const g of Object.values(nameGroup)) counts[g] = (counts[g] || 0) + 1;
console.error('groups:', JSON.stringify(counts), '\ntotal components:', Object.keys(docsMap).length);
