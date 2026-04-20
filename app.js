/* ========== App State Machine ========== */

const app = document.getElementById('app');

function loadSidebarCollapsedPref() {
  try {
    return window.localStorage.getItem('patent-ai-sidebar-collapsed') === '1';
  } catch (e) {
    return false;
  }
}

const state = {
  route: 'HOME',
  /** 左侧主导航收起为仅图标栏 */
  sidebarCollapsed: loadSidebarCollapsedPref(),
  chatFlow: 'UPLOAD',
  /** 对话内校验演示：pass = 通过；fail = 重复不通过；fail-multi = 多项不通过 */
  validationDemoMode: 'pass',
  /**
   * 质检上传引导：buttons = 首页「质检」卡入口（模拟提交）；link = 首页大输入框进入（输入框发表格链接）
   */
  qcUploadUi: 'buttons',
  /** link 模式下用户发送的链接/文案，用于对话气泡 */
  qcLinkSubmitText: null,
  drawerOpen: false,
  /** 右侧抽屉：summary = 任务摘要卡；result = 嵌入质检评分总表 */
  drawerMode: 'summary',
  /** 右侧「已完成任务」面板宽度（px），抽屉打开时可拖拽调节 */
  drawerPaneWidth: 320,
  progress: 0,
  valStep: -1,
  replayHistoryId: null,
  /** 历史列表高亮：上次从列表点进的会话 */
  historyLastOpenedId: null,
  workflowPage: 1,
  workflowPageSize: 15,
  workflowSortKey: null,
  workflowSortDir: 'desc',
  /** 二级质检报告当前选中的工作流任务 id */
  selectedWorkflowId: null,
  resultPage: 1,
  resultPageSize: 15,
  /** 结果明细表排序（与工作流列表交互一致） */
  resultSortKey: null,
  resultSortDir: 'desc',
  /** 质检完成后 Bot 通知展示时间 */
  botDoneAt: null,
  /** 对话中用户追加的问答（DONE / GENERAL_CHAT） */
  extraChatMessages: null,
  /** 二级质检详情返回：从对话抽屉进入 'chat'，从工作流列表进入 'workflow' */
  detailSource: 'workflow',
  /** 对话顶栏标题：用户修改后的文案；null 表示用历史标题或默认 */
  chatTitleOverride: null,
  chatTitleEditing: false,
};

const NAV_ITEMS = [
  { key: 'ai', label: '新对话', icon: 'ai_agent' },
  { key: 'workflow', label: '工作流', icon: 'workflow' },
];

/* ===== UD Tooltip（[data-ud-tooltip] → #ud-tooltip-host） ===== */

let udTooltipGlobalsBound = false;
/** 当前展示 tooltip 的触发元素（避免 mouseover 冒泡重复 show） */
let udTooltipActiveTrigger = null;

function ensureUdTooltipHost() {
  let el = document.getElementById('ud-tooltip-host');
  if (!el) {
    el = document.createElement('div');
    el.id = 'ud-tooltip-host';
    el.setAttribute('role', 'tooltip');
    el.hidden = true;
    document.body.appendChild(el);
  }
  return el;
}

function hideUdTooltip() {
  udTooltipActiveTrigger = null;
  const host = document.getElementById('ud-tooltip-host');
  if (host) {
    host.hidden = true;
    host.textContent = '';
    host.removeAttribute('data-ud-placement');
    host.style.removeProperty('--ud-tooltip-arrow-x');
  }
}

function showUdTooltip(trigger, text) {
  const host = ensureUdTooltipHost();
  host.textContent = text;
  host.hidden = false;
  host.style.left = '-9999px';
  host.style.top = '0';
  const tw = host.offsetWidth;
  const th = host.offsetHeight;
  const rect = trigger.getBoundingClientRect();
  const pad = 8;
  let top = rect.top - pad - th;
  let placement = 'top';
  if (top < 8) {
    top = rect.bottom + pad;
    placement = 'bottom';
  }
  const vw = window.innerWidth;
  const triggerCx = rect.left + rect.width / 2;
  let left = triggerCx - tw / 2;
  left = Math.max(8, Math.min(left, vw - tw - 8));
  /* 气泡被左右夹紧时，箭头仍对准触发元素水平中心 */
  let arrowX = Math.round(triggerCx - left);
  const arrowPad = 14;
  arrowX = Math.max(arrowPad, Math.min(arrowX, tw - arrowPad));
  host.style.setProperty('--ud-tooltip-arrow-x', `${arrowX}px`);
  host.dataset.udPlacement = placement;
  host.style.left = `${Math.round(left)}px`;
  host.style.top = `${Math.round(top)}px`;
}

function bindUdTooltipGlobals() {
  if (udTooltipGlobalsBound) return;
  udTooltipGlobalsBound = true;
  window.addEventListener('scroll', hideUdTooltip, true);
  window.addEventListener('resize', hideUdTooltip);
}

/** document 级委托：mouseenter 不冒泡，改用 mouseover / mouseout */
function ensureUdTooltipDocumentDelegation() {
  if (document.documentElement.dataset.patentUdTooltipDoc) return;
  document.documentElement.dataset.patentUdTooltipDoc = '1';

  function udTooltipTriggerFromEventTarget(target) {
    if (!target || target.nodeType !== Node.ELEMENT_NODE) {
      const p = target && target.parentElement;
      return p ? p.closest('[data-ud-tooltip]') : null;
    }
    return target.closest('[data-ud-tooltip]');
  }

  document.addEventListener(
    'mouseover',
    (e) => {
      const t = udTooltipTriggerFromEventTarget(e.target);
      if (!t) return;
      const text = t.getAttribute('data-ud-tooltip');
      if (!text) return;
      if (udTooltipActiveTrigger === t) return;
      udTooltipActiveTrigger = t;
      showUdTooltip(t, text);
    },
    false
  );

  document.addEventListener(
    'mouseout',
    (e) => {
      const t = udTooltipTriggerFromEventTarget(e.target);
      if (!t) return;
      const rel = e.relatedTarget;
      if (rel && t.contains(rel)) return;
      hideUdTooltip();
    },
    false
  );

  document.addEventListener('focusin', (e) => {
    const t = udTooltipTriggerFromEventTarget(e.target);
    if (!t) return;
    const text = t.getAttribute('data-ud-tooltip');
    if (!text) return;
    udTooltipActiveTrigger = t;
    showUdTooltip(t, text);
  });

  document.addEventListener('focusout', (e) => {
    const t = udTooltipTriggerFromEventTarget(e.target);
    if (!t) return;
    hideUdTooltip();
  });
}

function bindUdTooltipScrollHide() {
  document
    .querySelectorAll('.result-list-body, .result-table-wrap')
    .forEach((el) => {
      if (el.dataset.patentUdTooltipScrollBound) return;
      el.dataset.patentUdTooltipScrollBound = '1';
      el.addEventListener('scroll', hideUdTooltip, { passive: true });
    });
}

function bindUdTooltips() {
  bindUdTooltipGlobals();
  ensureUdTooltipDocumentDelegation();
  bindUdTooltipScrollHide();
}

function showToast(msg) {
  let n = document.getElementById('patent-toast');
  if (!n) {
    n = document.createElement('div');
    n.id = 'patent-toast';
    n.style.cssText =
      'position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:99999;padding:10px 20px;background:rgba(31,35,41,0.92);color:#fff;border-radius:8px;font-size:13px;max-width:min(420px,92vw);text-align:center;pointer-events:none;opacity:0;transition:opacity .22s ease;';
    document.body.appendChild(n);
  }
  n.textContent = msg;
  n.style.opacity = '1';
  clearTimeout(n._patentT);
  n._patentT = setTimeout(() => {
    n.style.opacity = '0';
  }, 2600);
}

function resetSessionExtras() {
  state.extraChatMessages = null;
  state.botDoneAt = null;
}

function resetChatSessionTitle() {
  state.chatTitleOverride = null;
  state.chatTitleEditing = false;
}

function formatChatHistoryTime(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
}

/** 首页大输入框发送：新建一条历史会话并进入普通对话，不进入质检流程 */
function startNewConversationFromHome() {
  const ta = document.getElementById('home-chat-input');
  if (!ta) return;
  const text = ta.value.trim();
  if (!text) return;

  const id = 'h-' + Date.now();
  const now = formatChatHistoryTime(new Date());
  const title =
    text.length > 48 ? text.slice(0, 48).replace(/\s+$/, '') + '…' : text;
  const preview =
    text.length > 120 ? text.slice(0, 120) + '…' : text;

  CHAT_HISTORY.unshift({
    id,
    title,
    preview,
    time: now,
    type: 'general',
    pinned: false,
    listIcon: 'chat',
    workflows: [],
    thread: [
      { role: 'user', text },
      {
        role: 'ai',
        text:
          '好的，我们先围绕你的问题继续交流。若要发起批量质检，请直接说「质检」或点击工作流入口的「质检」。',
      },
    ],
  });

  clearTimers();
  state.route = 'CHAT';
  state.chatFlow = 'GENERAL_CHAT';
  state.replayHistoryId = id;
  state.historyLastOpenedId = id;
  state.drawerOpen = false;
  state.drawerMode = 'summary';
  state.progress = 0;
  state.valStep = -1;
  state.validationDemoMode = 'pass';
  state.qcUploadUi = 'buttons';
  state.qcLinkSubmitText = null;
  state.selectedWorkflowId = null;
  resetSessionExtras();
  resetChatSessionTitle();

  ta.value = '';
  ta.style.height = 'auto';
  const btn = document.getElementById('home-send-btn');
  if (btn) btn.classList.remove('is-active');

  render();
}

function commitChatTitle() {
  const input = document.getElementById('chat-title-input');
  if (!input || !state.chatTitleEditing) return;
  const v = input.value.trim();
  state.chatTitleOverride = v === '' ? null : v.slice(0, 120);
  state.chatTitleEditing = false;
  render();
}

/** 侧栏顶部 Tab 选中：与历史列表互斥；正在回放某条历史时不选中「新对话/工作流」 */
function sidebarNavActiveKey() {
  if (state.route === 'RESULT' || state.route === 'WORKFLOW') return 'workflow';
  if (state.route === 'CHAT' && state.replayHistoryId != null) return null;
  return 'ai';
}

/* ===== Render ===== */

function render() {
  if (state.route === 'HISTORY') state.route = 'HOME';

  hideUdTooltip();

  let content = '';

  if (state.route === 'HOME') {
    content = renderHomePage();
  } else if (state.route === 'CHAT') {
    content = renderChatPage(state);
  } else if (state.route === 'WORKFLOW') {
    content = renderWorkflowListPage(state);
  } else if (state.route === 'RESULT') {
    content = renderResultPage(state);
  }

  app.innerHTML = renderSidebar(sidebarNavActiveKey(), NAV_ITEMS, state) + content;
  postRender();
}

function bindHomeChatInput() {
  const ta = document.getElementById('home-chat-input');
  if (!ta || ta.dataset.bound) return;
  ta.dataset.bound = '1';
  const btn = document.getElementById('home-send-btn');

  function syncBtn() {
    if (ta.value.trim()) {
      btn.classList.add('is-active');
    } else {
      btn.classList.remove('is-active');
    }
  }

  ta.addEventListener('input', () => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    syncBtn();
  });

  ta.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    if (!ta.value.trim()) return;
    e.preventDefault();
    startNewConversationFromHome();
  });

  if (btn) {
    btn.addEventListener('click', () => {
      if (!ta.value.trim()) return;
      startNewConversationFromHome();
    });
  }
}

function bindChatEnterKey() {
  const ta = document.getElementById('chat-input');
  if (!ta || ta.dataset.patentEnterBound) return;
  ta.dataset.patentEnterBound = '1';
  ta.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    e.preventDefault();
    const btn = document.querySelector('[data-action="chat-send"]');
    if (btn && !btn.disabled) btn.click();
  });
}

/** 有输入内容与首页发送钮一致：灰色 → 主色可点 */
function bindChatSendButtonState() {
  const ta = document.getElementById('chat-input');
  const btn = document.querySelector('[data-action="chat-send"]');
  if (!ta || !btn || btn.disabled) return;
  if (ta.dataset.patentSendSyncBound) return;
  ta.dataset.patentSendSyncBound = '1';
  function sync() {
    if (btn.disabled) return;
    if (ta.value.trim()) btn.classList.add('is-active');
    else btn.classList.remove('is-active');
  }
  ta.addEventListener('input', sync);
  sync();
}

function applyWorkflowJumpPage() {
  const input = document.getElementById('wf-jump-input');
  const p = parseInt(input && input.value, 10);
  const filtered = getFilteredWorkflowTasks();
  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / (state.workflowPageSize || 15))
  );
  if (!Number.isFinite(p) || p < 1 || p > totalPages) return;
  state.workflowPage = p;
  render();
}

function bindChatTitleEditor() {
  if (state.route !== 'CHAT' || !state.chatTitleEditing) return;
  const input = document.getElementById('chat-title-input');
  if (!input || input.dataset.patentTitleBound) return;
  input.dataset.patentTitleBound = '1';
  input.addEventListener('blur', () => {
    if (state.chatTitleEditing) commitChatTitle();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.blur();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      state.chatTitleEditing = false;
      render();
    }
  });
  requestAnimationFrame(() => {
    input.focus();
    input.select();
  });
}

const CHAT_SPLIT_GUTTER = 8;
const CHAT_DRAWER_MIN = 240;
const CHAT_MAIN_MIN = 280;

function bindChatDrawerSplit() {
  const gutter = document.getElementById('chat-split-gutter');
  const pane = document.getElementById('chat-drawer-pane');
  const splitRoot = document.querySelector('.chat-content--split');
  if (!gutter || !pane || !splitRoot) return;

  gutter.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    gutter.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startW = pane.getBoundingClientRect().width;

    function clampDrawerW(next) {
      const splitW = splitRoot.getBoundingClientRect().width;
      const maxW = Math.max(
        CHAT_DRAWER_MIN,
        splitW - CHAT_SPLIT_GUTTER - CHAT_MAIN_MIN
      );
      return Math.max(
        CHAT_DRAWER_MIN,
        Math.min(maxW, Math.round(next))
      );
    }

    function onMove(ev) {
      if (!ev.isPrimary) return;
      const dx = startX - ev.clientX;
      const next = clampDrawerW(startW + dx);
      pane.style.width = next + 'px';
    }

    function onUp(ev) {
      try {
        gutter.releasePointerCapture(ev.pointerId);
      } catch (_) {
        /* ignore */
      }
      gutter.removeEventListener('pointermove', onMove);
      gutter.removeEventListener('pointerup', onUp);
      gutter.removeEventListener('pointercancel', onUp);
      state.drawerPaneWidth = clampDrawerW(pane.getBoundingClientRect().width);
      pane.style.width = state.drawerPaneWidth + 'px';
    }

    gutter.addEventListener('pointermove', onMove);
    gutter.addEventListener('pointerup', onUp);
    gutter.addEventListener('pointercancel', onUp);
  });
}

function bindWorkflowPagination() {
  const jump = document.getElementById('wf-jump-input');
  if (jump && !jump.dataset.bound) {
    jump.dataset.bound = '1';
    jump.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      applyWorkflowJumpPage();
    });
  }
  const sel = document.getElementById('wf-page-size-select');
  if (sel && !sel.dataset.bound) {
    sel.dataset.bound = '1';
    sel.addEventListener('change', () => {
      const n = parseInt(sel.value, 10);
      if (!Number.isFinite(n) || n < 1) return;
      state.workflowPageSize = n;
      state.workflowPage = 1;
      render();
    });
  }
}

function isResultTableUiActive() {
  return (
    state.route === 'RESULT' ||
    (state.route === 'CHAT' &&
      state.drawerOpen &&
      state.drawerMode === 'result')
  );
}

function applyResultJumpPage() {
  const input = document.getElementById('result-jump-input');
  const p = parseInt(input && input.value, 10);
  const task = getResultTask(state);
  const files = sliceFilesForTask(task);
  const sorted = sortResultFiles(
    files,
    state.resultSortKey,
    state.resultSortDir
  );
  const totalPages = Math.max(
    1,
    Math.ceil(sorted.length / (state.resultPageSize || 15))
  );
  if (!Number.isFinite(p) || p < 1 || p > totalPages) return;
  state.resultPage = p;
  render();
}

function updateResultTableStickyEdges() {
  if (!isResultTableUiActive()) return;
  const el = document.querySelector('.result-list-body');
  if (!el) return;
  const max = Math.max(0, el.scrollWidth - el.clientWidth);
  const sl = el.scrollLeft;
  const eps = 2;
  const canScrollX = max > eps;
  el.classList.toggle(
    'is-sticky-left-occluded',
    canScrollX && sl > eps
  );
  el.classList.toggle(
    'is-sticky-right-occluded',
    canScrollX && sl < max - eps
  );
}

function ensureResultStickyResizeListener() {
  if (window.__patentResultStickyResize) return;
  window.__patentResultStickyResize = true;
  window.addEventListener('resize', () => updateResultTableStickyEdges());
}

function bindResultTableStickyEdges() {
  if (!isResultTableUiActive()) return;
  const el = document.querySelector('.result-list-body');
  if (!el) return;
  ensureResultStickyResizeListener();
  const run = () => updateResultTableStickyEdges();
  if (!el.dataset.stickyEdgeBound) {
    el.dataset.stickyEdgeBound = '1';
    el.addEventListener('scroll', run, { passive: true });
  }
  requestAnimationFrame(() => requestAnimationFrame(run));
}

function bindResultPagination() {
  if (!isResultTableUiActive()) return;
  const jump = document.getElementById('result-jump-input');
  if (jump && !jump.dataset.bound) {
    jump.dataset.bound = '1';
    jump.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      applyResultJumpPage();
    });
  }
  const sel = document.getElementById('result-page-size-select');
  if (sel && !sel.dataset.bound) {
    sel.dataset.bound = '1';
    sel.addEventListener('change', () => {
      const n = parseInt(sel.value, 10);
      if (!Number.isFinite(n) || n < 1) return;
      state.resultPageSize = n;
      state.resultPage = 1;
      render();
    });
  }
}

function postRender() {
  const chatBody = document.getElementById('chat-body');
  if (chatBody) {
    if (state.route === 'CHAT' && state.chatFlow === 'UPLOAD') {
      chatBody.scrollTop = 0;
    } else {
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }

  bindChatEnterKey();
  bindChatSendButtonState();
  bindHomeChatInput();
  bindWorkflowPagination();
  bindResultPagination();
  bindResultTableStickyEdges();
  bindChatTitleEditor();
  bindChatDrawerSplit();
  bindUdTooltips();

  if (
    state.route === 'CHAT' &&
    state.chatFlow === 'VALIDATING' &&
    state.valStep === -1
  ) {
    runValidation();
  }
  if (
    state.route === 'CHAT' &&
    state.chatFlow === 'PROCESSING' &&
    state.progress === 0
  ) {
    runProgress();
  }
}

/* ===== Validation Animation ===== */

let valTimer = null;

function runValidation() {
  const items = getValidationItems(state.validationDemoMode);
  state.valStep = 0;
  const container = document.getElementById('val-items');
  if (!container) return;

  valTimer = setInterval(() => {
    if (state.valStep >= items.length) {
      clearInterval(valTimer);
      valTimer = null;

      const notifEl = document.getElementById('val-notification');
      const hasError = items.some((i) => i.isError);
      if (notifEl) {
        const mod = hasError ? 'ud-notification--error' : 'ud-notification--success';
        notifEl.className =
          'ud-notification ' + mod + ' ud-notification--qc-card';
      }

      const header = document.getElementById('val-notif-head');
      if (header) {
        const icon = hasError ? ICONS.ud_notif_error : ICONS.ud_notif_check;
        const titleText = hasError ? '校验失败' : '校验完成';
        header.innerHTML = `<span class="ud-notification__icon" aria-hidden="true">${icon}</span><span class="ud-notification__title">${titleText}</span>`;
      }

      const submit = document.getElementById('val-submit');
      if (submit) submit.style.display = 'flex';

      state.chatFlow = 'VALIDATED';
      scrollChatBottom();
      return;
    }

    const item = items[state.valStep];
    const el = document.createElement('div');
    const lineMod = item.isError
      ? 'ud-notification__line--error'
      : 'ud-notification__line--success';
    const statusText = item.isError ? item.errorText : item.okText;
    el.className = 'ud-notification__line ' + lineMod;
    el.innerHTML = `
      <span class="ud-notification__line-label">${item.label}</span>
      <span class="ud-notification__line-status">${statusText}</span>`;
    container.appendChild(el);
    state.valStep++;
    scrollChatBottom();
  }, 500);
}

/* ===== Progress Animation ===== */

let progressTimer = null;

function runProgress() {
  const bar = document.getElementById('progress-bar');
  const pct = document.getElementById('progress-pct');

  progressTimer = setInterval(() => {
    state.progress += Math.random() * 10 + 4;
    if (state.progress >= 100) {
      state.progress = 100;
      clearInterval(progressTimer);
      progressTimer = null;
      if (bar) bar.style.width = '100%';
      if (pct) pct.textContent = '100%';

      setTimeout(() => {
        state.chatFlow = 'DONE';
        state.botDoneAt = new Date().toISOString();
        render();
      }, 500);
      return;
    }

    if (bar) bar.style.width = Math.round(state.progress) + '%';
    if (pct) pct.textContent = Math.round(state.progress) + '%';
  }, 200);
}

function scrollChatBottom() {
  const chatBody = document.getElementById('chat-body');
  if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
}

function clearTimers() {
  if (valTimer) {
    clearInterval(valTimer);
    valTimer = null;
  }
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

/* ===== Event Delegation ===== */

app.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target.closest('.hist-item[data-action="open-history"]');
  if (!el) return;
  e.preventDefault();
  el.click();
});

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  switch (action) {
    case 'toggle-sidebar': {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      try {
        window.localStorage.setItem(
          'patent-ai-sidebar-collapsed',
          state.sidebarCollapsed ? '1' : '0'
        );
      } catch (err) {
        /* ignore quota / private mode */
      }
      break;
    }

    case 'go-ai':
      clearTimers();
      state.route = 'HOME';
      state.chatFlow = 'UPLOAD';
      state.qcUploadUi = 'buttons';
      state.qcLinkSubmitText = null;
      state.drawerOpen = false;
      state.drawerMode = 'summary';
      state.progress = 0;
      state.valStep = -1;
      state.validationDemoMode = 'pass';
      state.replayHistoryId = null;
      state.historyLastOpenedId = null;
      state.selectedWorkflowId = null;
      state.resultPage = 1;
      resetSessionExtras();
      resetChatSessionTitle();
      break;

    case 'go-workflow':
      state.route = 'WORKFLOW';
      state.historyLastOpenedId = null;
      state.replayHistoryId = null;
      state.drawerOpen = false;
      state.drawerMode = 'summary';
      break;

    case 'open-history': {
      const hid = el.dataset.id;
      const rec = CHAT_HISTORY.find((r) => r.id === hid);
      if (!rec) break;
      clearTimers();
      resetSessionExtras();
      resetChatSessionTitle();
      state.historyLastOpenedId = hid;
      state.replayHistoryId = hid;
      state.route = 'CHAT';
      state.drawerOpen = false;
      state.drawerMode = 'summary';
      if (rec.type === 'qc') {
        state.chatFlow = 'DONE';
        state.progress = 100;
        state.valStep = VALIDATION_ITEM_COUNT;
        state.validationDemoMode = 'pass';
        state.qcUploadUi = 'buttons';
        state.qcLinkSubmitText = null;
        state.botDoneAt = '2026-04-03T14:32:00';
        state.selectedWorkflowId = 'wf-2';
      } else {
        state.chatFlow = 'GENERAL_CHAT';
        state.progress = 0;
        state.valStep = -1;
        state.qcUploadUi = 'buttons';
        state.qcLinkSubmitText = null;
      }
      break;
    }

    case 'go-chat':
      clearTimers();
      state.route = 'CHAT';
      state.chatFlow = 'UPLOAD';
      state.qcUploadUi = 'buttons';
      state.qcLinkSubmitText = null;
      state.progress = 0;
      state.valStep = -1;
      state.validationDemoMode = 'pass';
      state.replayHistoryId = null;
      state.historyLastOpenedId = null;
      state.selectedWorkflowId = null;
      state.resultPage = 1;
      state.drawerOpen = false;
      state.drawerMode = 'summary';
      resetSessionExtras();
      resetChatSessionTitle();
      break;

    case 'upload-file': {
      const d = el.dataset.valDemo;
      const mode =
        d === 'pass' ? 'pass' : d === 'fail-multi' ? 'fail-multi' : 'fail';
      state.validationDemoMode = mode;
      state.qcLinkSubmitText = null;
      state.chatFlow = 'VALIDATING';
      state.valStep = -1;
      break;
    }

    case 'val-reupload':
      clearTimers();
      state.chatFlow = 'UPLOAD';
      state.valStep = -1;
      state.qcLinkSubmitText = null;
      break;

    case 'submit-qc': {
      const vItems = getValidationItems(state.validationDemoMode);
      if (vItems.some((i) => i.isError)) break;
      state.chatFlow = 'PROCESSING';
      state.progress = 0;
      break;
    }

    case 'chat-title-start-edit':
      state.chatTitleEditing = true;
      break;

    case 'open-panel':
      state.drawerMode = 'summary';
      state.drawerOpen = true;
      break;

    case 'close-drawer':
      state.drawerOpen = false;
      state.drawerMode = 'summary';
      break;

    case 'open-qc-result-drawer': {
      if (state.route !== 'CHAT') break;
      state.detailSource = 'chat';
      if (!state.selectedWorkflowId) {
        state.selectedWorkflowId = 'wf-2';
      }
      state.resultPage = 1;
      state.resultSortKey = null;
      state.resultSortDir = 'desc';
      state.drawerMode = 'result';
      state.drawerOpen = true;
      state.drawerPaneWidth = Math.max(state.drawerPaneWidth || 320, 560);
      break;
    }

    case 'go-result':
      state.route = 'RESULT';
      state.detailSource = 'chat';
      state.drawerOpen = false;
      state.drawerMode = 'summary';
      if (!state.selectedWorkflowId) {
        state.selectedWorkflowId = 'wf-2';
      }
      state.resultPage = 1;
      state.resultSortKey = null;
      state.resultSortDir = 'desc';
      break;

    case 'open-workflow-detail':
      state.selectedWorkflowId = el.dataset.id;
      state.route = 'RESULT';
      state.detailSource = 'workflow';
      state.drawerOpen = false;
      state.drawerMode = 'summary';
      state.resultPage = 1;
      state.resultSortKey = null;
      state.resultSortDir = 'desc';
      break;

    case 'chat-send': {
      const ta = document.getElementById('chat-input');
      const text = (ta && ta.value ? ta.value : '').trim();
      if (!text) break;
      if (state.route !== 'CHAT') break;
      if (
        state.chatFlow === 'UPLOAD' &&
        state.qcUploadUi === 'link'
      ) {
        state.qcLinkSubmitText = text;
        state.validationDemoMode = 'pass';
        state.chatFlow = 'VALIDATING';
        state.valStep = -1;
        if (ta) ta.value = '';
        break;
      }
      if (state.chatFlow !== 'DONE' && state.chatFlow !== 'GENERAL_CHAT') break;
      if (!state.extraChatMessages) state.extraChatMessages = [];
      state.extraChatMessages.push({ role: 'user', text });
      const m = computeQcMetrics(FILE_LIST.slice(0, 157));
      const aiText =
        state.chatFlow === 'GENERAL_CHAT'
          ? '我在当前历史上下文中继续说明：如需结合某次质检的数字结论，请打开对应含质检完成的会话，或使用工作流 Tab 查看任务列表。'
          : `已收到。据本次会话质检样本，均分为 ${m.avg}。建议优先复核评分 ≤53 的高风险稿件，并在工作流中跟踪后续机构批次。`;
      state.extraChatMessages.push({ role: 'ai', text: aiText });
      if (ta) ta.value = '';
      break;
    }

    case 'view-duplicates':
      showToast(
        `共 ${VALIDATION_WARN_DUP_COUNT} 份重复案号需处理，修正表格后重新上传再提交质检（演示）`
      );
      break;

    case 'wf-coming-soon':
      showToast('该工作流即将开放，敬请期待');
      break;

    case 'wf-sort': {
      const key = el.dataset.key;
      if (state.workflowSortKey === key) {
        state.workflowSortDir = state.workflowSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.workflowSortKey = key;
        state.workflowSortDir = 'desc';
      }
      state.workflowPage = 1;
      break;
    }

    case 'wf-page': {
      const p = parseInt(el.dataset.page, 10);
      if (!Number.isFinite(p)) break;
      const filtered = getFilteredWorkflowTasks();
      const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / (state.workflowPageSize || 15))
      );
      if (p < 1 || p > totalPages) break;
      state.workflowPage = p;
      break;
    }

    case 'result-page': {
      const p = parseInt(el.dataset.page, 10);
      if (!Number.isFinite(p)) break;
      const task = getResultTask(state);
      const files = sliceFilesForTask(task);
      const sorted = sortResultFiles(
        files,
        state.resultSortKey,
        state.resultSortDir
      );
      const totalPages = Math.max(
        1,
        Math.ceil(sorted.length / (state.resultPageSize || 15))
      );
      if (p < 1 || p > totalPages) break;
      state.resultPage = p;
      break;
    }

    case 'result-sort': {
      const key = el.dataset.key;
      if (key !== 'score') break;
      if (state.resultSortKey === key) {
        state.resultSortDir =
          state.resultSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.resultSortKey = key;
        state.resultSortDir = 'desc';
      }
      state.resultPage = 1;
      break;
    }

    case 'open-result-file': {
      const url =
        typeof FEISHU_QC_REPORT_OPEN_URL === 'string' &&
        FEISHU_QC_REPORT_OPEN_URL.trim() !== ''
          ? FEISHU_QC_REPORT_OPEN_URL.trim()
          : 'https://www.feishu.cn';
      window.open(url, '_blank', 'noopener,noreferrer');
      break;
    }

    case 'go-back-detail':
      state.resultPage = 1;
      state.resultSortKey = null;
      state.resultSortDir = 'desc';
      if (state.detailSource === 'chat') {
        state.route = 'CHAT';
        state.chatFlow = 'DONE';
        state.replayHistoryId = null;
        state.drawerOpen = false;
        state.drawerMode = 'summary';
      } else {
        state.route = 'WORKFLOW';
      }
      break;

    default:
      return;
  }

  render();
});

/* ===== Boot ===== */
function applyHashToRoute() {
  const raw = (window.location.hash || '').replace(/^#/, '');
  if (!raw) return;
  const h = raw.split(/[?&]/)[0].toLowerCase();
  if (h === 'result' || h === 'qc-detail' || h === '质检详情') {
    const done = WORKFLOW_TASKS.find((x) => x.status === 'completed');
    state.route = 'RESULT';
    state.selectedWorkflowId = done ? done.id : 'wf-2';
    state.detailSource = 'workflow';
    state.drawerOpen = false;
    state.drawerMode = 'summary';
    state.resultPage = 1;
    state.resultSortKey = null;
    state.resultSortDir = 'desc';
  }
}

applyHashToRoute();
render();

window.addEventListener('hashchange', () => {
  applyHashToRoute();
  render();
});
