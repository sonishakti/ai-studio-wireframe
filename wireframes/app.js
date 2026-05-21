/* Studio_X interactive wireframe — vanilla JS, no deps */
(function () {
  'use strict';

  const state = {
    mode: 'project', // 'project' | 'account'
    route: 'agents',
    project: 'Project Alpha',
    selectedVendor: null,
    credentials: [], // additional vendor credentials
  };

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function setMode(mode) {
    state.mode = mode;
    $$('[data-mode]').forEach((el) => {
      el.classList.toggle('hidden', el.dataset.mode !== mode);
    });
  }

  function goTo(route) {
    state.route = route;
    // Determine mode based on route
    const accountRoutes = ['account-overview', 'billing-plans', 'team-sso', 'preferences', 'restful-api', 'webhooks', 'audit-logs', 'help-support', 'whats-new'];
    const targetMode = accountRoutes.includes(route) ? 'account' : 'project';
    if (state.mode !== targetMode) setMode(targetMode);

    // Show the right screen
    $$('.screen').forEach((s) => s.classList.add('hidden'));
    const screen = $(`[data-screen="${route}"]`);
    if (screen) screen.classList.remove('hidden');

    // Update active nav item
    $$('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.route === route));

    // Close any open dropdowns
    closeAllDropdowns();
    window.scrollTo(0, 0);
  }

  function toggleDropdown(id) {
    const dd = document.getElementById(id);
    if (!dd) return;
    const wasHidden = dd.classList.contains('hidden');
    closeAllDropdowns();
    if (wasHidden) dd.classList.remove('hidden');
  }

  function closeAllDropdowns() {
    $$('.dropdown').forEach((dd) => dd.classList.add('hidden'));
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.add('hidden'), 1800);
  }

  // ---------- Actions ----------
  const actions = {
    switchProject(el) {
      state.project = el.dataset.project;
      $('#currentProject').textContent = state.project;
      $$('.proj-name').forEach((n) => (n.textContent = state.project));
      $$('.dropdown .item.check').forEach((i) => i.classList.remove('check'));
      el.classList.add('check');
      // Mark all matching by data-project too
      $$('[data-action="switchProject"]').forEach((i) => {
        i.classList.toggle('check', i.dataset.project === state.project);
      });
      closeAllDropdowns();
      toast(`Switched to ${state.project}`);
    },
    createProject() {
      closeAllDropdowns();
      toast('Wireframe stub — Create project flow would open here.');
    },
    viewAllProjects() {
      closeAllDropdowns();
      toast('Wireframe stub — All projects page.');
    },
    backToProject() {
      setMode('project');
      goTo('home');
    },
    switchWorkspace(el) {
      const ws = el.dataset.workspace;
      const wsEl = document.getElementById('currentWorkspace');
      if (wsEl) wsEl.textContent = ws;
      const wsName = document.getElementById('wsName');
      if (wsName) wsName.textContent = ws;
      // Update check marks
      document.querySelectorAll('[data-action="switchWorkspace"]').forEach((i) => {
        i.classList.toggle('check', i.dataset.workspace === ws);
      });
      closeAllDropdowns();
      toast(`Switched to ${ws}`);
    },
    goAccount(el) {
      closeAllDropdowns();
      const route = el.dataset.route;
      goTo(route);
    },
    newAgent() { toast('Wireframe stub — New agent flow.'); },
    openAgent(el) {
      const name = el.dataset.agent || 'Appointment Reminder';
      $('#agentName').textContent = name;
      $('#agentTitle').textContent = name;
      $('#deployAgentName').textContent = name;
      goTo('builder');
    },
    openAddCred() {
      $('#addCredModal').classList.remove('hidden');
      // reset to step 1
      $('#credStep1').classList.remove('hidden');
      $('#credStep2').classList.add('hidden');
      $('#step1Footer').classList.remove('hidden');
      $('#stepTab1').classList.add('active');
      $('#stepTab2').classList.remove('active');
      $('#addCredTitle').textContent = 'Add vendor credential';
    },
    closeAddCred() {
      $('#addCredModal').classList.add('hidden');
      state.selectedVendor = null;
    },
    pickVendor(el) {
      const vendor = el.dataset.vendor;
      state.selectedVendor = vendor;
      $('#vendorField').value = vendor;
      $('#credName').value = `${vendor} · `;
      $('#credStep1').classList.add('hidden');
      $('#credStep2').classList.remove('hidden');
      $('#step1Footer').classList.add('hidden');
      $('#stepTab1').classList.remove('active');
      $('#stepTab2').classList.add('active');
      $('#addCredTitle').textContent = `Add vendor credential — ${vendor}`;
    },
    credBack() {
      $('#credStep1').classList.remove('hidden');
      $('#credStep2').classList.add('hidden');
      $('#step1Footer').classList.remove('hidden');
      $('#stepTab1').classList.add('active');
      $('#stepTab2').classList.remove('active');
      $('#addCredTitle').textContent = 'Add vendor credential';
    },
    saveCred() {
      const name = $('#credName').value || `${state.selectedVendor} · Untitled`;
      // Append to list
      const list = $('#credList');
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `
        <span class="label">${name}</span>
        <span class="value">${state.selectedVendor.toLowerCase().slice(0, 2)}-•••${Math.random().toString(36).slice(-4)}</span>
        <span class="tag muted">Just added</span>
        <div class="actions"><button class="btn small">Edit</button><button class="btn small">Revoke</button></div>
      `;
      list.appendChild(row);
      actions.closeAddCred();
      toast(`Saved credential: ${name}`);
    },
    openDeploy() {
      $('#deployModal').classList.remove('hidden');
      // reset tabs
      $$('#deployTabs .tab').forEach((t, i) => t.classList.toggle('active', i === 0));
      $$('#deployModal .tab-panel').forEach((p, i) => p.classList.toggle('hidden', i !== 0));
    },
    closeDeploy() { $('#deployModal').classList.add('hidden'); },
    confirmDeploy() {
      $('#deployModal').classList.add('hidden');
      toast('Deploying to production — wireframe stub');
    },
    revealCert() {
      const el = $('#appCertVal');
      el.textContent = el.textContent.startsWith('•') ? '4f3a-8e2c-7b1d-9c0a-1234-5678-3f9a' : '••••••••••••••••••••••••••••3f9a';
    },
    revealSecret() {
      const el = $('#custSecretVal');
      el.textContent = el.textContent.startsWith('•') ? 'aB7xK2pQ9rT4wL6mN1vC8fH3jY5sX0eP3f9a' : '••••••••••••••••••••••••3f9a';
    },
    toast(el) { toast(el.dataset.msg || 'Action triggered'); },
    setHomeMode(el) {
      const mode = el.dataset.modeName;
      const def = document.getElementById('homeDefault');
      const fr = document.getElementById('homeFirstrun');
      const sus = document.getElementById('homeSuspended');
      [def, fr, sus].forEach((n) => n && n.classList.add('hidden'));
      if (mode === 'first-run') fr && fr.classList.remove('hidden');
      else if (mode === 'suspended') sus && sus.classList.remove('hidden');
      else def && def.classList.remove('hidden');
      toast(`Home state: ${mode}`);
    },
  };

  // ---------- Event wiring ----------
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action], [data-toggle], [data-route], [data-tab]');
    if (!target) {
      // click outside dropdowns
      if (!e.target.closest('.dropdown')) closeAllDropdowns();
      return;
    }

    if (target.dataset.toggle) {
      e.preventDefault();
      e.stopPropagation();
      toggleDropdown(target.dataset.toggle);
      return;
    }

    if (target.dataset.action && actions[target.dataset.action]) {
      e.preventDefault();
      actions[target.dataset.action](target);
      return;
    }

    if (target.dataset.route) {
      e.preventDefault();
      // Use goAccount logic if route is account-y
      goTo(target.dataset.route);
      return;
    }

    if (target.dataset.tab) {
      e.preventDefault();
      const tabsRoot = target.closest('.tabs');
      const panelRoot = tabsRoot ? tabsRoot.parentElement : document;
      $$('.tab', tabsRoot).forEach((t) => t.classList.toggle('active', t === target));
      $$('.tab-panel', panelRoot).forEach((p) => {
        p.classList.toggle('hidden', p.dataset.panel !== target.dataset.tab);
      });
    }
  });

  // Close dropdowns on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      $$('.modal-backdrop').forEach((m) => m.classList.add('hidden'));
    }
  });

  // ---------- Init ----------
  goTo('home');
})();
