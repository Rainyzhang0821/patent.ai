/* ========== Chat Page (QC Flow) ========== */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 顶栏会话标题（用户重命名 > 历史记录 > 默认） */
function getChatConversationTitle(st) {
  if (st.chatTitleOverride != null && String(st.chatTitleOverride).trim() !== '') {
    return String(st.chatTitleOverride).trim();
  }
  if (st.replayHistoryId) {
    const rec = CHAT_HISTORY.find((r) => r.id === st.replayHistoryId);
    if (rec && rec.title) return rec.title;
  }
  return '批量质检 · 北京邦通卓匠 2025';
}

function renderChatHeader(st) {
  const rawTitle = getChatConversationTitle(st);
  const titleEscaped = escapeHtml(rawTitle);
  const showQcReportEntry = st.chatFlow === 'DONE';
  const reportBtn = showQcReportEntry
    ? `<button type="button" class="btn-back btn-back--icon-only" data-action="open-panel" data-ud-tooltip="查看对话中已完成的任务" aria-label="查看对话中已完成的任务">${ICONS.workflow}</button>`
    : '';

  const titleBlock = st.chatTitleEditing
    ? `<input type="text" class="chat-title-input" id="chat-title-input" maxlength="120" value="${titleEscaped}" autocomplete="off" />`
    : `<span class="chat-title-text" id="chat-title-display">${titleEscaped}</span>`;

  const editBtn = st.chatTitleEditing
    ? ''
    : `<button type="button" class="btn-back btn-back--icon-only chat-title-edit-btn" data-action="chat-title-start-edit" data-ud-tooltip="编辑标题" aria-label="编辑标题">${ICONS.edit_outlined}</button>`;

  return `
  <header class="chat-header-bar" aria-label="对话标题">
    <div class="chat-header-left">
      <div class="chat-title-row">
        ${titleBlock}
        ${editBtn}
      </div>
    </div>
    <div class="chat-header-end">
      ${reportBtn}
    </div>
  </header>`;
}

function renderAIMessage(bodyHtml) {
  return `
  <div class="msg-ai">
    <div class="msg-ai-body">${bodyHtml}</div>
  </div>`;
}

function renderUserMessage(text) {
  return `
  <div class="msg-user">
    <div class="msg-user-bubble">${text}</div>
  </div>`;
}

function buildUploadMsg(st) {
  const linkMode = st.qcUploadUi === 'link';
  const uploadArea =
    !linkMode && st.chatFlow === 'UPLOAD'
      ? `
    <div class="qc-submit-upload-wrap">
      <button type="button" class="btn-primary qc-submit-table-btn" data-action="upload-file" data-val-demo="pass">提交（模拟通过）</button>
      <button type="button" class="btn-default qc-submit-table-btn" data-action="upload-file" data-val-demo="fail-multi">提交（模拟失败）</button>
    </div>`
      : '';

  const intro = linkMode
    ? '好的，请按下方步骤准备数据，在输入框粘贴并发送表格链接，即可开始质检。'
    : '好的，发送专利申请书，即可得到质检报告！';
  const step1 = linkMode
    ? '打开 <a href="#" class="qc-link">质检模板表格</a>，按说明录入信息（不可复用已有表格）'
    : '打开 <a href="#" class="qc-link">质检模板表格</a>，录入信息并上传质检文件（不可复用已有表格）';
  const step2 = linkMode
    ? '在底部输入框<strong>粘贴表格链接</strong>（如飞书多维表格、网盘分享等）并发送，系统将拉取并校验'
    : '填写完成后点击提交进行校验，校验通过提交质检';
  const step3 = linkMode
    ? '校验通过后将为你提交质检，完成后将通过 Bot 发送质检报告消息'
    : '质检完成后将通过 Bot 为你发送质检报告消息';

  return `
    <div class="msg-ai-text">${intro}</div>
    <div class="qc-card">
      <div class="qc-card-header">
        <span>${ICONS.doc_insert}</span>
        <span class="qc-card-title">质检操作步骤</span>
      </div>
      <div class="qc-steps">
        <div class="qc-step">
          <span class="qc-step-num">1</span>
          <span>${step1}</span>
        </div>
        <div class="qc-step">
          <span class="qc-step-num">2</span>
          <span>${step2}</span>
        </div>
        <div class="qc-step">
          <span class="qc-step-num">3</span>
          <span>${step3}</span>
        </div>
      </div>
      ${uploadArea}
    </div>`;
}

function validationLineClass(item) {
  if (item.isError) return 'ud-notification__line--error';
  return 'ud-notification__line--success';
}

function validationLineStatus(item) {
  if (item.isError) return item.errorText;
  return item.okText;
}

function validationHasDuplicateError(items) {
  return items.some((i) => i.label === '重复文件' && i.isError);
}

function buildValidationMsg(st) {
  const items = getValidationItems(st.validationDemoMode || 'pass');
  const hasError = items.some((i) => i.isError);
  const submitLabel = '确认提交质检（157 份）';
  const dupBtn =
    hasError && validationHasDuplicateError(items)
      ? `<button type="button" class="btn-default" data-action="view-duplicates">前往修改</button>`
      : '';
  const primaryFooter = hasError
    ? `<button type="button" class="btn-primary" data-action="val-reupload">重新提交</button>`
    : `<button type="button" class="btn-primary" data-action="submit-qc">${submitLabel}</button>`;

  if (st.chatFlow === 'VALIDATING') {
    return `
      <div class="ud-notification ud-notification--info ud-notification--info-ring" id="val-notification" role="status">
        <div class="ud-notification__inner">
          <div class="ud-notification__head" id="val-notif-head">
            <span class="ud-notification__icon" aria-hidden="true"><span class="ud-notification__loading-icon">${ICONS.loading_outlined}</span></span>
            <span class="ud-notification__title">正在校验表格内容…</span>
          </div>
          <div id="val-items" class="ud-notification__list"></div>
          <div id="val-submit" class="ud-notification__footer" style="display:none">
            ${primaryFooter}${dupBtn}
          </div>
        </div>
      </div>`;
  }

  const notifMod = hasError ? 'ud-notification--error' : 'ud-notification--success';
  const headIcon = hasError ? ICONS.ud_notif_error : ICONS.ud_notif_check;
  const titleText = hasError ? '校验失败' : '校验完成';

  const itemsHtml = items
    .map(
      (item) => `
    <div class="ud-notification__line ${validationLineClass(item)}">
      <span class="ud-notification__line-label">${item.label}</span>
      <span class="ud-notification__line-status">${validationLineStatus(item)}</span>
    </div>
  `
    )
    .join('');

  const hideSubmit = ['PROCESSING', 'DONE'].includes(st.chatFlow);
  const submitBlock = hideSubmit
    ? ''
    : `<div class="ud-notification__footer">${primaryFooter}${dupBtn}</div>`;

  return `
    <div class="ud-notification ${notifMod} ud-notification--qc-card" id="val-notification" role="status">
      <div class="ud-notification__inner">
        <div class="ud-notification__head">
          <span class="ud-notification__icon" aria-hidden="true">${headIcon}</span>
          <span class="ud-notification__title">${titleText}</span>
        </div>
        <div class="ud-notification__list">${itemsHtml}</div>
        ${submitBlock}
      </div>
    </div>`;
}

function buildProcessingMsg(st) {
  const isDone = st.chatFlow === 'DONE';
  const headIcon = isDone
    ? ICONS.ud_notif_check
    : `<span class="qc-spinner ud-notification__spinner" aria-hidden="true"></span>`;

  return `
    <div class="ud-notification ud-notification--success ud-notification--qc-card" id="qc-processing-notification" role="status">
      <div class="ud-notification__inner">
        <div class="ud-notification__head">
          <span class="ud-notification__icon" aria-hidden="true">${headIcon}</span>
          <div class="ud-notification__head-main">
            <div class="ud-notification__title-row">
              <span class="ud-notification__title">批量质检文件已上传完成</span>
            </div>
          </div>
        </div>
        <div class="ud-notification__body">
          <p>共包含 <strong>157</strong> 个文件，质检大约需要 <strong>3 小时</strong>，完成后将通过 Bot 发送质检结果。</p>
          <p>也可在工作流 → 任务记录中跟进进度。</p>
        </div>
      </div>
    </div>`;
}

function buildBotNotify(st) {
  const sample = FILE_LIST.slice(0, 157);
  const m = computeQcMetrics(sample);

  return `
    <div class="ud-notification ud-notification--success ud-notification--qc-bot-done ud-notification--qc-card" role="status">
      <div class="ud-notification__inner">
        <div class="ud-notification__head">
          <span class="ud-notification__icon" aria-hidden="true">${ICONS.ud_notif_check}</span>
          <div class="ud-notification__head-main">
            <span class="ud-notification__title">质检完成通知</span>
          </div>
        </div>
        <div class="ud-notification__body">
          <p>2025年北京邦通卓匠知识产权代理有限公司质检评分总表 已完成。<br/>
          共 ${m.n} 份文件 · 平均分 ${m.avg} · 最高分 ${m.max} · 最低分 ${m.min}</p>
        </div>
        <div class="ud-notification__footer ud-notification__footer--no-divider">
          <button type="button" class="btn-primary" data-action="open-qc-result-drawer">查看质检结果</button>
        </div>
      </div>
    </div>`;
}

function renderChatInput(st) {
  const linkUpload =
    st.chatFlow === 'UPLOAD' && st.qcUploadUi === 'link';
  const canSend =
    st.chatFlow === 'DONE' ||
    st.chatFlow === 'GENERAL_CHAT' ||
    linkUpload;
  const dis = canSend ? '' : ' disabled';
  const ph = '继续输入将基于当前会话上下文回复…';
  return `
  <div class="chat-input-box">
    <textarea class="chat-textarea" placeholder="${ph}" rows="2" id="chat-input"></textarea>
    <div class="chat-input-bottom">
      <div></div>
      <button type="button" class="chat-send-btn"${dis} data-action="chat-send">${ICONS.send}</button>
    </div>
  </div>`;
}

function renderExtraChatMessages(st) {
  const list = st.extraChatMessages || [];
  return list
    .map((m) =>
      m.role === 'user'
        ? renderUserMessage(escapeHtml(m.text))
        : renderAIMessage(`<div class="msg-ai-text">${escapeHtml(m.text)}</div>`)
    )
    .join('');
}

function renderGeneralChatThread(st) {
  const rec = CHAT_HISTORY.find((r) => r.id === st.replayHistoryId);
  if (!rec || !rec.thread) {
    return '';
  }
  const msgs = rec.thread
    .map((t) =>
      t.role === 'user'
        ? renderUserMessage(escapeHtml(t.text))
        : renderAIMessage(`<div class="msg-ai-text">${escapeHtml(t.text)}</div>`)
    )
    .join('');
  const extras = renderExtraChatMessages(st);

  return `
  <div class="chat-content">
    <div class="chat-card">
      <div class="chat-main">
        ${renderChatHeader(st)}
        <div class="chat-body" id="chat-body">
          <div class="chat-messages">${msgs}${extras}</div>
        </div>
        <div class="chat-sender-wrap">
          <div class="chat-sender">${renderChatInput(st)}</div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderChatPage(st) {
  if (st.chatFlow === 'GENERAL_CHAT') {
    return renderGeneralChatThread(st);
  }

  let msgs = '';

  msgs += renderAIMessage(buildUploadMsg(st));

  if (st.chatFlow !== 'UPLOAD') {
    const userUploadBubble =
      st.qcUploadUi === 'link' && st.qcLinkSubmitText
        ? escapeHtml(st.qcLinkSubmitText)
        : `<span class="msg-user-file-inline"><span class="msg-user-file-inline-ico" aria-hidden="true">${ICONS.file_icon}</span><span class="msg-user-file-inline-name">2025年北京邦通卓匠知识产权代理有限公司质检评分表.xlsx</span></span>`;
    msgs += renderUserMessage(userUploadBubble);
    // 提交质检后只保留「上传完成」卡片，校验结果不再与进度卡叠放
    if (['VALIDATING', 'VALIDATED'].includes(st.chatFlow)) {
      msgs += renderAIMessage(buildValidationMsg(st));
    }
  }

  if (['PROCESSING', 'DONE'].includes(st.chatFlow)) {
    msgs += renderAIMessage(buildProcessingMsg(st));
  }

  if (st.chatFlow === 'DONE') {
    msgs += renderAIMessage(buildBotNotify(st));
  }

  msgs += renderExtraChatMessages(st);

  const drawer = st.drawerOpen ? renderDrawerPanel(st) : '';
  const chatBodyClass =
    st.chatFlow === 'UPLOAD'
      ? 'chat-body chat-body--center-initial'
      : 'chat-body';

  const mainColumn = `
      <div class="chat-main">
        ${renderChatHeader(st)}
        <div class="${chatBodyClass}" id="chat-body">
          <div class="chat-messages">${msgs}</div>
        </div>
        <div class="chat-sender-wrap">
          <div class="chat-sender">${renderChatInput(st)}</div>
        </div>
      </div>`;

  if (st.drawerOpen) {
    const dw = Math.max(
      240,
      st.drawerPaneWidth != null ? st.drawerPaneWidth : 320
    );
    return `
  <div class="chat-content chat-content--split">
    <div class="chat-pane chat-pane--main">${mainColumn}</div>
    <div class="chat-split-gutter" id="chat-split-gutter" role="separator" aria-orientation="vertical" aria-label="拖拽调节左右宽度"></div>
    <div class="chat-pane chat-pane--side" id="chat-drawer-pane" style="width:${dw}px">${drawer}</div>
  </div>`;
  }

  return `
  <div class="chat-content">
    <div class="chat-card">
      ${mainColumn}
    </div>
  </div>`;
}
