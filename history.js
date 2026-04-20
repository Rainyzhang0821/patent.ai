/* ========== History（左侧边栏历史对话，豆包式） ========== */

/** 列表行 HTML */
function historyConversationRowsHtml(st) {
  const activeId =
    st && st.route === 'CHAT' && st.replayHistoryId ? st.replayHistoryId : null;
  return CHAT_HISTORY.map((h) => {
    const isActive = h.id === activeId;
    return `
    <li class="hist-item${isActive ? ' is-active' : ''}" data-action="open-history" data-id="${h.id}" tabindex="0" role="button">
      <span class="hist-item-label">${h.title}</span>
    </li>`;
  }).join('');
}

/** 侧栏「历史对话」区块（logo / 导航 之下，用户栏 之上） */
function renderSidebarHistorySection(st) {
  if (!CHAT_HISTORY.length) {
    return `
    <div class="sidebar-hist" aria-label="历史对话">
      <div class="hist-section-title sidebar-hist-heading">历史对话</div>
      <p class="sidebar-hist-empty">暂无记录</p>
    </div>`;
  }
  return `
    <div class="sidebar-hist" aria-label="历史对话">
      <div class="hist-section-title sidebar-hist-heading">历史对话</div>
      <ul class="hist-list sidebar-hist-list" role="list">${historyConversationRowsHtml(st)}</ul>
    </div>`;
}
