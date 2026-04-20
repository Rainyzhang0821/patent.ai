/* ========== Result Page：质检评分总表（与设计稿一致） ========== */

function getResultTask(st) {
  const id = st.selectedWorkflowId;
  if (id) {
    const t = WORKFLOW_TASKS.find((x) => x.id === id);
    if (t) return t;
  }
  return WORKFLOW_TASKS.find((x) => x.status === 'completed') || WORKFLOW_TASKS[1];
}

function sliceFilesForTask(task) {
  const n = Math.min(task.fileCount || 157, FILE_LIST.length);
  return FILE_LIST.slice(0, n);
}

function sortResultFiles(files, key, dir) {
  if (!key) return [...files];
  const mul = dir === 'asc' ? 1 : -1;
  return [...files].sort((a, b) => {
    const va = a.score;
    const vb = b.score;
    if (va === vb) return a.id - b.id;
    return va > vb ? mul : -mul;
  });
}

function renderResultRHeaderCells() {
  return FILE_R_DIM_KEYS.map((key, idx) => {
    const label = 'R' + String(idx + 1).padStart(2, '0');
    return `<th class="result-th-r" scope="col" data-ud-tooltip="${label}">${label}</th>`;
  }).join('');
}

function renderResultRDataCells(f) {
  return FILE_R_DIM_KEYS.map((key) => {
    const v = f[key];
    const display = v != null && v !== '' ? v : '—';
    const risk = key === 'r01' && f.r01 === 0;
    return `<td class="cell-rx${risk ? ' is-risk-num' : ''}">${display}</td>`;
  }).join('');
}

function resultTableSortHint(st, key) {
  if (st.resultSortKey !== key) {
    return `<span class="wf-sort-icons" aria-hidden="true"><span class="wf-sort-carets"></span></span>`;
  }
  return st.resultSortDir === 'asc'
    ? `<span class="wf-sort-icons is-on" aria-hidden="true"><span class="wf-sort-caret wf-sort-caret-up"></span></span>`
    : `<span class="wf-sort-icons is-on" aria-hidden="true"><span class="wf-sort-caret wf-sort-caret-down"></span></span>`;
}

/** 顶栏 meta：平均分 | 最高 | 最低（无文件数量；竖线分隔与原先一致） */
function renderResultMetaSpans(_task, metaAvg, metaMax, metaMin) {
  const parts = [
    `平均分：${metaAvg}`,
    `最高分：${metaMax}`,
    `最低分：${metaMin}`,
  ];
  return parts
    .map(
      (text, i) =>
        `${i > 0 ? '<span class="result-meta-sep" aria-hidden="true">|</span>' : ''}<span>${text}</span>`
    )
    .join('');
}

/** 质检详情顶栏：机构分析报告 + 飞书表格（抽屉顶栏与表头共用） */
function renderResultFeishuActionButtons(isProcessing) {
  const dis = isProcessing ? ' disabled' : '';
  return `<button type="button" class="btn-default btn-sm result-agency-report-btn" data-ud-tooltip="在飞书文档中查看" aria-label="在飞书文档中查看"${dis}><span class="result-header-action-ico" aria-hidden="true">${ICONS.file_link_word_outlined}</span> 机构分析报告</button>
          <button type="button" class="btn-icon-square btn-default btn-sm result-feishu-sheet-btn" data-ud-tooltip="在飞书表格中查看" aria-label="在飞书表格中查看"${dis}><span class="result-header-action-ico" aria-hidden="true">${ICONS.file_link_sheet_outlined}</span></button>`;
}

function renderResultHeaderBlock(st, task, isProcessing, opts = {}) {
  const {
    title,
    metaHtml,
    showActions = true,
    backAction = 'go-back-detail',
    showBackButton = true,
    hideTitle = false,
    hideStatusBadge = false,
  } = opts;
  const metaAvg = isProcessing ? '—' : opts.metaAvg;
  const metaMax = isProcessing ? '—' : opts.metaMax;
  const metaMin = isProcessing ? '—' : opts.metaMin;
  const meta =
    metaHtml != null
      ? metaHtml
      : renderResultMetaSpans(task, metaAvg, metaMax, metaMin);

  const actionsHtml = showActions
    ? `<div class="result-header-actions">${renderResultFeishuActionButtons(isProcessing)}</div>`
    : '';

  const titlePlain = String(title || '');
  const titleTip = escapeHtml(titlePlain);
  const titleLineInner = hideTitle
    ? ''
    : `<h1 class="result-page-title"${titlePlain ? ` data-ud-tooltip="${titleTip}"` : ''}>${escapeHtml(titlePlain)}</h1>`;

  const backBtn = showBackButton
    ? `<button type="button" class="btn-back btn-back--icon-only" data-action="${backAction}" aria-label="返回">${ICONS.left_arrow}</button>`
    : '';

  const badgeHtml = hideStatusBadge
    ? ''
    : `<span class="result-badge-done result-badge-done--pill${isProcessing ? ' is-processing' : ''}">${isProcessing ? '质检中' : '质检完成'}</span>`;
  const titleLineHtml = hideTitle ? badgeHtml : `${titleLineInner}${badgeHtml}`;
  const titleLineClass =
    titleLineHtml.trim() === ''
      ? ''
      : hideTitle
        ? 'result-title-line'
        : 'result-title-line result-title-line--with-page-title';
  const titleLineBlock =
    titleLineHtml.trim() === ''
      ? ''
      : `<div class="${titleLineClass}">${titleLineHtml}</div>`;

  return `
      <div class="result-header result-header--qc-detail${showBackButton ? '' : ' result-header--no-back'}${hideTitle ? ' result-header--detail-title-in-chrome' : ''}">
        <div class="result-header-row1">
          <div class="result-header-leading">
            ${backBtn}
            <div class="result-header-title-block">
              ${titleLineBlock}
              <div class="result-header-meta result-header-meta--pipe">${meta}</div>
            </div>
          </div>
          ${actionsHtml}
        </div>
      </div>`;
}

function renderResultQcDetailBlock(st, opts = {}) {
  const backAction = opts.backAction || 'go-back-detail';
  const contentRootClass = opts.contentRootClass || '';
  const showBackButton = opts.showBackButton !== false;
  const hideResultDetailTitle = opts.hideResultDetailTitle === true;
  const hideResultStatusBadge = opts.hideResultStatusBadge === true;

  const task = getResultTask(st);
  const isProcessing = task.status === 'processing';
  const files = sliceFilesForTask(task);

  const sortedFiles = sortResultFiles(
    files,
    st.resultSortKey,
    st.resultSortDir
  );
  const m = computeQcMetrics(files);

  const page = st.resultPage || 1;
  const pageSize = st.resultPageSize || 15;
  const total = sortedFiles.length;
  const { totalPages, safePage, pages: pageNumList } = paginationViewModel(
    page,
    pageSize,
    total
  );
  const start = (safePage - 1) * pageSize;
  const pageFiles = sortedFiles.slice(start, start + pageSize);

  const tableRows = pageFiles
    .map(
      (f) => `
    <tr class="${f.score <= 53 ? 'row-danger' : ''}">
      <td class="cell-case cell-case-col">${f.caseNo}</td>
      <td class="cell-title ${f.score <= 53 ? 'is-risk' : 'is-link'}">${f.title}</td>
      <td class="cell-agent">${f.agent}</td>
      <td class="cell-score">${f.score}</td>
      ${renderResultRDataCells(f)}
      <td class="cell-report-col"><button type="button" class="btn-link" data-action="open-result-file" data-ud-tooltip="在飞书表格中查看">查看</button></td>
    </tr>`
    )
    .join('');

  const pageBtnsHtml = pageNumList
    .map((p) => {
      if (p === '…') {
        return '<span class="wf-page-ellipsis">…</span>';
      }
      const active = p === safePage ? ' is-active' : '';
      return `<button type="button" class="wf-page-btn${active}" data-action="result-page" data-page="${p}">${p}</button>`;
    })
    .join('');

  const metaAvg = isProcessing ? '—' : m.avg;
  const metaMax = isProcessing ? '—' : m.max;
  const metaMin = isProcessing ? '—' : m.min;

  const isDrawerChromeMeta =
    contentRootClass.includes('result-content--in-drawer') &&
    hideResultDetailTitle &&
    hideResultStatusBadge;

  const header = isDrawerChromeMeta
    ? `<div class="result-drawer-meta-strip"><div class="result-header-meta result-header-meta--pipe">${renderResultMetaSpans(task, metaAvg, metaMax, metaMin)}</div></div>`
    : renderResultHeaderBlock(st, task, isProcessing, {
        title: task.name,
        metaAvg,
        metaMax,
        metaMin,
        showActions: opts.suppressEmbeddedDrawerActions !== true,
        backAction,
        showBackButton,
        hideTitle: hideResultDetailTitle,
        hideStatusBadge: hideResultStatusBadge,
      });

  const rootCls = ['result-content', contentRootClass].filter(Boolean).join(' ');

  return `
  <div class="${rootCls}">
    <div class="result-card result-card--qc-detail">
      ${header}

      <div class="result-list-shell">
        <div class="result-list-body">
          <div class="result-table-wrap">
            <table class="result-table result-table--qc-detail">
              <thead>
                <tr>
                  <th class="cell-case-col" style="width:130px" scope="col">案号</th>
                  <th>初稿文件名称</th>
                  <th style="width:100px">代理人</th>
                  <th class="wf-th-sort result-th-metric" style="width:72px" data-action="result-sort" data-key="score">总分 ${resultTableSortHint(st, 'score')}</th>
                  ${renderResultRHeaderCells()}
                  <th class="result-th-report cell-report-col" scope="col">质检报告</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>
        </div>
        <div class="ud-pagination-bar wf-footer result-list-footer">
          <div class="wf-pagination-cluster">
            <span class="wf-total">共 ${total} 条</span>
            <div class="wf-page-nav">
              <button type="button" class="wf-page-arrow" data-action="result-page" data-page="${safePage - 1}" ${safePage <= 1 ? 'disabled' : ''} aria-label="上一页">${ICONS.pagination_chevron_left}</button>
              ${pageBtnsHtml}
              <button type="button" class="wf-page-arrow" data-action="result-page" data-page="${safePage + 1}" ${safePage >= totalPages ? 'disabled' : ''} aria-label="下一页">${ICONS.pagination_chevron_right}</button>
            </div>
            <div class="wf-page-size ud-select-wrap">
              <select id="result-page-size-select" class="ud-select wf-page-size-select" aria-label="每页条数">
                <option value="15"${pageSize === 15 ? ' selected' : ''}>15 条/页</option>
                <option value="30"${pageSize === 30 ? ' selected' : ''}>30 条/页</option>
                <option value="50"${pageSize === 50 ? ' selected' : ''}>50 条/页</option>
                <option value="100"${pageSize === 100 ? ' selected' : ''}>100 条/页</option>
              </select>
            </div>
            <div class="wf-jump">
              <span>跳至</span>
              <input type="text" class="wf-jump-input" id="result-jump-input" inputmode="numeric" autocomplete="off" placeholder="" />
              <span>页</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>`;
}

function renderResultPage(st) {
  return renderResultQcDetailBlock(st);
}
