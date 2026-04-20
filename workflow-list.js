/* ========== 工作流一级列表（UD Table / Tag / Pagination 语义样式） ========== */

function getFilteredWorkflowTasks() {
  return [...WORKFLOW_TASKS];
}

function sortWorkflowRows(rows, key, dir) {
  if (!key) return rows;
  const mul = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = key === 'avg' ? a.avgScore : a.maxScore;
    const vb = key === 'avg' ? b.avgScore : b.maxScore;
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    return va === vb ? 0 : va > vb ? mul : -mul;
  });
}

function renderWorkflowListPage(st) {
  const page = st.workflowPage || 1;
  const pageSize = st.workflowPageSize || 15;
  const sortKey = st.workflowSortKey || null;
  const sortDir = st.workflowSortDir || 'desc';

  const filtered = getFilteredWorkflowTasks();
  const sorted = sortWorkflowRows(filtered, sortKey, sortDir);
  const total = sorted.length;
  const { totalPages, safePage, pages } = paginationViewModel(
    page,
    pageSize,
    total
  );
  const start = (safePage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  const sortHint = (key) => {
    if (sortKey !== key) {
      return `<span class="wf-sort-icons" aria-hidden="true"><span class="wf-sort-carets"></span></span>`;
    }
    return sortDir === 'asc'
      ? `<span class="wf-sort-icons is-on" aria-hidden="true"><span class="wf-sort-caret wf-sort-caret-up"></span></span>`
      : `<span class="wf-sort-icons is-on" aria-hidden="true"><span class="wf-sort-caret wf-sort-caret-down"></span></span>`;
  };

  const rowsHtml = pageRows.length
    ? pageRows
        .map((t) => {
          const tag =
            t.status === 'processing'
              ? '<span class="ud-tag ud-tag-processing">质检中</span>'
              : '<span class="ud-tag ud-tag-success">质检完成</span>';
          const avg =
            t.avgScore != null ? String(t.avgScore) : '<span class="wf-empty">—</span>';
          const max =
            t.maxScore != null
              ? String(t.maxScore)
              : '<span class="wf-empty">—</span>';
          return `
      <tr class="wf-tr">
        <td class="wf-td wf-td-name"><span class="wf-name-ellipsis" data-ud-tooltip="${String(t.name).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}">${t.name}</span></td>
        <td class="wf-td wf-td-time"><span class="wf-time-cell">${t.submitTime}</span></td>
        <td class="wf-td wf-td-status">${tag}</td>
        <td class="wf-td wf-td-num wf-td-filecount">${t.fileCount}</td>
        <td class="wf-td wf-td-num">${avg}</td>
        <td class="wf-td wf-td-num">${max}</td>
        <td class="wf-td"><button type="button" class="wf-link" data-action="open-workflow-detail" data-id="${t.id}">查看详情</button></td>
      </tr>`;
        })
        .join('')
    : `<tr><td class="wf-td wf-empty-table" colspan="7">暂无质检任务</td></tr>`;

  const pageBtns = pages
    .map((p) => {
      if (p === '…') {
        return `<span class="wf-page-ellipsis">…</span>`;
      }
      const active = p === safePage ? ' is-active' : '';
      return `<button type="button" class="wf-page-btn${active}" data-action="wf-page" data-page="${p}">${p}</button>`;
    })
    .join('');

  return `
  <div class="home-content">
    <div class="home-card home-card--workflow">
      <div class="wf-list-content">
    <div class="wf-quick-workflow">
      ${renderHomeWorkflowSection('工作流', { showCreateEntry: true })}
    </div>
    <div class="wf-list-table-section">
      <div class="wf-task-records-heading">任务记录</div>
      <div class="wf-list-card">
      <div class="wf-list-body">
        <div class="wf-table-wrap">
          <table class="ud-table wf-table" cellspacing="0">
            <thead>
              <tr>
                <th class="wf-th wf-th-name">质检任务名称</th>
                <th class="wf-th wf-th-time">提交申请时间</th>
                <th class="wf-th wf-th-status">状态</th>
                <th class="wf-th wf-th-num wf-th-filecount">文件数量</th>
                <th class="wf-th wf-th-num wf-th-sort" data-action="wf-sort" data-key="avg">平均分 ${sortHint('avg')}</th>
                <th class="wf-th wf-th-num wf-th-sort" data-action="wf-sort" data-key="max">最高分 ${sortHint('max')}</th>
                <th class="wf-th wf-th-action">操作</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      </div>

      <div class="wf-footer ud-pagination-bar">
        <div class="wf-pagination-cluster">
          <span class="wf-total">共 ${total} 条</span>
          <div class="wf-page-nav">
            <button type="button" class="wf-page-arrow" data-action="wf-page" data-page="${safePage - 1}" ${safePage <= 1 ? 'disabled' : ''} aria-label="上一页">${ICONS.pagination_chevron_left}</button>
            ${pageBtns}
            <button type="button" class="wf-page-arrow" data-action="wf-page" data-page="${safePage + 1}" ${safePage >= totalPages ? 'disabled' : ''} aria-label="下一页">${ICONS.pagination_chevron_right}</button>
          </div>
          <div class="wf-page-size ud-select-wrap">
            <select id="wf-page-size-select" class="ud-select wf-page-size-select" aria-label="每页条数">
              <option value="15"${pageSize === 15 ? ' selected' : ''}>15 条/页</option>
              <option value="30"${pageSize === 30 ? ' selected' : ''}>30 条/页</option>
              <option value="50"${pageSize === 50 ? ' selected' : ''}>50 条/页</option>
              <option value="100"${pageSize === 100 ? ' selected' : ''}>100 条/页</option>
            </select>
          </div>
          <div class="wf-jump">
            <span>跳至</span>
            <input type="text" class="wf-jump-input" id="wf-jump-input" inputmode="numeric" autocomplete="off" placeholder="" />
            <span>页</span>
          </div>
        </div>
      </div>
    </div>
    </div>
      </div>
    </div>
  </div>`;
}
