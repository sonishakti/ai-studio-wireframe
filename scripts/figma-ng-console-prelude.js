// ---- ng-console Figma prelude (paste at the top of every use_figma script) ----
const IDS = {"bg/base":"VariableID:33:3","bg/surface":"VariableID:33:4","bg/elevated":"VariableID:33:5","bg/sunken":"VariableID:33:6","bg/hover":"VariableID:33:7","text/primary":"VariableID:33:8","text/secondary":"VariableID:33:9","text/tertiary":"VariableID:33:10","border/faint":"VariableID:33:11","border/subtle":"VariableID:33:12","border/default":"VariableID:33:13","border/strong":"VariableID:33:14","brand/accent":"VariableID:33:15","brand/on-accent":"VariableID:33:16","state/active":"VariableID:33:17","nav/accent":"VariableID:33:18","status/success":"VariableID:33:19","status/success-bg":"VariableID:33:20","status/warning":"VariableID:33:21","status/warning-bg":"VariableID:33:22","status/danger":"VariableID:33:23","status/danger-bg":"VariableID:33:24","status/info":"VariableID:33:25","status/info-bg":"VariableID:33:26"};
const ST = {"console/page-title":"S:c6da7b272cef274ea65d12b25833c17e7072e5c4,","console/title":"S:5f37888db6ca9cdaa7d6674142261e0585008ce7,","console/section":"S:088c96a59207cd4ebd184c3e33c15978c3fec92c,","console/nav":"S:d9a3da6c7c9874490c3eb26305571eaf67e93297,","console/body":"S:354e2e223648a9285f3c4e5cb8a9b37924bd550d,","console/meta":"S:e4e7618331a8cf490826bacb161fa488d34789fc,","console/group-label":"S:f85b605b920ec06e336febfed63c3efaa99bd4dc,","console/mono":"S:747e1ca47c4365edf6a1f5908bd43458038b6bae,","console/spoken":"S:7ca71f917e407602ef183e80d405016d25166f6d,","board/heading":"S:20dc00a4b3717569542261bb56c3a41863daed25,","board/subheading":"S:e40d12c646b29ea535127fbf5c1ea12216468993,"};
const COLLECTION_ID = "VariableCollectionId:33:2"; const MODE = { light: "33:0", dark: "33:1" };
for (const f of [{family:'Inter',style:'Regular'},{family:'Inter',style:'Medium'},{family:'Inter',style:'Semi Bold'},{family:'Inter',style:'Italic'},{family:'Geist Mono',style:'Regular'}]) await figma.loadFontAsync(f);
const V = {}; for (const k in IDS) V[k] = await figma.variables.getVariableByIdAsync(IDS[k]);
const paint = (k, opacity) => { const p = figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', V[k]); return opacity == null ? p : { ...p, opacity } };
const fillV = (n, k) => { n.fills = k ? [paint(k)] : []; return n };
const strokeV = (n, k, w = 1, align = 'INSIDE') => { n.strokes = [paint(k)]; n.strokeWeight = w; n.strokeAlign = align; return n };
const al = (dir = 'HORIZONTAL', props = {}) => { const f = figma.createAutoLayout(dir, props); f.fills = []; return f };
const txt = async (parent, chars, style = 'console/body', color = 'text/primary', opts = {}) => {
  const t = figma.createText(); await t.setTextStyleIdAsync(ST[style]); t.characters = chars; t.fills = [paint(color)];
  if (opts.name) t.name = opts.name;
  if (parent) parent.appendChild(t);
  if (opts.width) { t.textAutoResize = 'HEIGHT'; t.resize(opts.width, t.height) }
  if (opts.fill && parent && parent.layoutMode && parent.layoutMode !== 'NONE') { t.textAutoResize = 'HEIGHT'; t.layoutSizingHorizontal = 'FILL' }
  if (opts.align) t.textAlignHorizontal = opts.align;
  return t;
};
const ICONS = {
  'audio-lines': '<path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/>',
  'waypoints': '<circle cx="12" cy="4.5" r="2.5"/><path d="m10.2 6.3-3.9 3.9"/><circle cx="4.5" cy="12" r="2.5"/><path d="M7 12h10"/><circle cx="19.5" cy="12" r="2.5"/><path d="m13.8 17.7 3.9-3.9"/><circle cx="12" cy="19.5" r="2.5"/>',
  'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  'flask-conical': '<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
  'rocket': '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  'check': '<path d="M20 6 9 17l-5-5"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'code-xml': '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
  'ellipsis': '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  'copy': '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'phone': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  'megaphone': '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  'sliders': '<path d="M21 4h-7"/><path d="M10 4H3"/><path d="M21 12h-9"/><path d="M8 12H3"/><path d="M21 20h-5"/><path d="M12 20H3"/><path d="M14 2v4"/><path d="M8 10v4"/><path d="M16 18v4"/>',
  'history': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  'sparkles': '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
  'bot': '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  'plus': '<path d="M5 12h14"/><path d="M12 5v14"/>',
  'mic': '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
  'pencil': '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  'panel-left': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
  'box': '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  'house': '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  'activity': '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  'webhook': '<path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"/><path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"/><path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"/>',
  'plug': '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
  'key': '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
  'chart': '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  'triangle-alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  'external-link': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3"/>',
  'play': '<polygon points="6 3 20 12 6 21 6 3"/>',
  'bell': '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
};
const icon = (name, size = 16, color = 'text/secondary', parent = null) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  const f = figma.createNodeFromSvg(svg); f.name = `icon/${name}`; f.fills = [];
  for (const c of f.findAll(() => true)) { if ('strokes' in c && c.strokes.length) c.strokes = [paint(color)]; if ('fills' in c && c.type !== 'FRAME') c.fills = [] }
  f.rescale(size / 24); if (parent) parent.appendChild(f); return f;
};
const setDark = async (frame) => { const col = await figma.variables.getVariableCollectionByIdAsync(COLLECTION_ID); frame.setExplicitVariableModeForCollection(col, MODE.dark) };
// ---- end prelude ----
