/* ========== Drawer Panel：批量质检摘要卡（Artifacts 式） ========== */

function escapeDrawerHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function renderDrawerPanel(st) {
  if (st.drawerMode === 'result') {
    const task = getResultTask(st);
    const processing = task.status === 'processing';
    const tip = escapeDrawerHtml(task.name);
    const titleHtml = escapeDrawerHtml(task.name);
    const inlineActions = renderResultFeishuActionButtons(processing);
    const headerHtml = `
    <header class="drawer-panel-header drawer-panel-header--result drawer-panel-header--result-inline">
      <h2 class="drawer-panel-header-task-title"${task.name ? ` data-ud-tooltip="${tip}"` : ''}>${titleHtml}</h2>
      <div class="drawer-panel-header-inline-actions result-header-actions">${inlineActions}</div>
      <button type="button" class="btn-back btn-back--icon-only" data-action="close-drawer" aria-label="关闭">${ICONS.close}</button>
    </header>`;
    return `
  <div class="drawer-panel drawer-panel--result">
    ${headerHtml}
    <div class="drawer-result-scroll">
      ${renderResultQcDetailBlock(st, {
        contentRootClass: 'result-content--in-drawer',
        showBackButton: false,
        hideResultDetailTitle: true,
        hideResultStatusBadge: true,
        suppressEmbeddedDrawerActions: true,
      })}
    </div>
  </div>`;
  }

  const headerHtml = `
    <header class="drawer-panel-header">
      <h2 class="drawer-panel-header-title">已完成任务</h2>
      <button type="button" class="btn-back btn-back--icon-only" data-action="close-drawer" aria-label="关闭">${ICONS.close}</button>
    </header>`;

  const task = getResultTask(st);
  const files = sliceFilesForTask(task);
  const { avg, max, min } = computeQcMetrics(files);
  const metaHtml = renderResultMetaSpans(task, avg, max, min);
  const processing = task.status === 'processing';
  const statusLabel = processing ? '质检中' : '质检完成';
  const statusClass = processing
    ? 'drawer-qc-badge drawer-qc-badge--processing'
    : 'drawer-qc-badge';

  return `
  <div class="drawer-panel">
    ${headerHtml}
    <div class="drawer-stack">
      <h3 class="drawer-kicker">批量质检</h3>
      <div class="drawer-qc-card">
        <div class="drawer-qc-card-inner">
          <div class="drawer-qc-body">
            <div class="drawer-qc-title-row"><span class="drawer-qc-title">${escapeDrawerHtml(task.name)}</span><span class="${statusClass}">${statusLabel}</span></div>
            <div class="drawer-qc-meta result-header-meta result-header-meta--pipe">${metaHtml}</div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}
