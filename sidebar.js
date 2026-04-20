/* ========== Sidebar Component ========== */
function renderSidebar(activeKey, navItems, st) {
  const collapsed = st.sidebarCollapsed === true;
  const navCls = 'sidebar' + (collapsed ? ' sidebar--collapsed' : '');
  const toggleTip = collapsed ? '展开导航' : '收起导航';
  const navTip = (label) =>
    collapsed ? ` data-ud-tooltip="${String(label).replace(/"/g, '&quot;')}"` : '';

  return `
  <nav class="${navCls}" aria-label="主导航">
    <!-- Logo: Patent.AI + sidebar toggle -->
    <div class="sidebar-logo">
      <div class="sidebar-brand">
        <img class="sidebar-brand-logo" src="./assets/Patent.AI.svg" alt="Patent.AI" />
      </div>
      <button type="button" class="sidebar-collapse" data-action="toggle-sidebar" aria-label="${toggleTip}" data-ud-tooltip="${toggleTip}">${ICONS.sidebar}</button>
    </div>

    <!-- Navigation list -->
    <div class="sidebar-nav">
      ${navItems.map(n => `
        <div class="sidebar-nav-item ${activeKey != null && n.key === activeKey ? 'is-active' : ''}" data-action="go-${n.key}"${navTip(n.label)}>
          <span class="sidebar-nav-icon">${ICONS[n.icon]}</span>
          <span class="sidebar-nav-label">${n.label}</span>
        </div>
      `).join('')}
    </div>

    ${renderSidebarHistorySection(st)}

    <!-- User row (sticky bottom) -->
    <div class="sidebar-user">
      <div class="sidebar-user-left">
        <div class="sidebar-avatar">
          <img src="./assets/sidebar-avatar.png" alt="" width="32" height="32" decoding="async" />
        </div>
        <span class="sidebar-username">张欣</span>
      </div>
      <span class="sidebar-setting">${ICONS.setting}</span>
    </div>
  </nav>`;
}
