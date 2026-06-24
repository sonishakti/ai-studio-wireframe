// postbuild.mjs — make the bundle browser-safe for a Next.js-app-as-DS.
//
// This repo is a Next.js APP (not a plain component library), so its components
// and the React 19 dev vendor reference Node's `process` global:
//   • _vendor/react.js (React 19 dev build) → process.emit  (universal — every card)
//   • _ds_bundle.js (next/* in feature comps) → process.env.__NEXT_*, process.nextTick
// Browsers have no `process`, so without a shim every preview throws
// "process is not defined". We inject a no-clobber `process` shim into the FIRST
// script every preview loads (_vendor/react.js, before _ds_bundle.js) and into the
// shipped _ds_bundle.js itself (after its @ds-bundle header line, which must stay
// line 1) so designs the agent builds with the DS are safe too.
//
// Run AFTER package-build.mjs and BEFORE validate/capture:  node .ds-sync/postbuild.mjs ./ds-bundle
// (contract-safe: it does not fork emit.mjs/bundle.mjs; it only patches generated assets.)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2] || './ds-bundle';
const MARK = 'window.process=window.process';
const SHIM =
  ';window.process=window.process||{env:{NODE_ENV:"development"},' +
  'emit:function(){return false},nextTick:function(f){Promise.resolve().then(f)},' +
  'argv:[],cwd:function(){return"/"},platform:"browser",version:"",versions:{}};\n';

// _vendor/react.js loads first in every preview → window.process is set before
// react.js's own dev code and before _ds_bundle.js run.
const reactPath = join(OUT, '_vendor', 'react.js');
if (existsSync(reactPath)) {
  const react = readFileSync(reactPath, 'utf8');
  if (!react.includes(MARK)) writeFileSync(reactPath, SHIM + react);
}

// _ds_bundle.js: insert the shim AFTER the @ds-bundle header line (line 1).
const bundlePath = join(OUT, '_ds_bundle.js');
if (existsSync(bundlePath)) {
  const bundle = readFileSync(bundlePath, 'utf8');
  if (!bundle.includes(MARK)) {
    const nl = bundle.indexOf('\n');
    writeFileSync(bundlePath, bundle.slice(0, nl + 1) + SHIM + bundle.slice(nl + 1));
  }
}
console.error('postbuild: injected no-clobber process shim into _vendor/react.js + _ds_bundle.js');
