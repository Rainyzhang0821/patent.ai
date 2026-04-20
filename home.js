/* ========== Home Page Component (首页 node 1514:141326) ========== */

/**
 * 首页与工作流页共用的工作流卡片区。
 * @param {string} [workflowTitle='常用工作流']
 * @param {{ showCreateEntry?: boolean }} [opts]
 */
function renderHomeWorkflowSection(workflowTitle = '常用工作流', opts = {}) {
  const { showCreateEntry = false } = opts;
  const createCard = showCreateEntry
    ? `
          <div class="home-wf-card home-wf-card--soon" data-action="wf-coming-soon">
            <div class="home-wf-top">
              <div class="home-wf-top-left">
                <span class="home-wf-icon">${ICONS.plus_create}</span>
                <span class="home-wf-name">创建</span>
                <span class="home-wf-soon">即将上线</span>
              </div>
            </div>
            <span class="home-wf-desc">定义你的专属工作流</span>
          </div>`
    : '';

  return `
      <div class="home-workflow">
        <span class="home-workflow-title">${workflowTitle}</span>
        <div class="home-workflow-grid${showCreateEntry ? ' home-workflow-grid--with-create' : ''}">
          <div class="home-wf-card" data-action="go-chat">
            <div class="home-wf-top">
              <div class="home-wf-top-left">
                <span class="home-wf-icon">${ICONS.hcplan}</span>
                <span class="home-wf-name">质检</span>
              </div>
            </div>
            <span class="home-wf-desc">上传文件或在专利系统中选择质检文件</span>
          </div>
          <div class="home-wf-card home-wf-card--soon" data-action="wf-coming-soon">
            <div class="home-wf-top">
              <div class="home-wf-top-left">
                <span class="home-wf-icon">${ICONS.translate}</span>
                <span class="home-wf-name">翻译</span>
                <span class="home-wf-soon">即将上线</span>
              </div>
            </div>
            <span class="home-wf-desc">根据各国家知识产权相关要求翻译申请书</span>
          </div>
          <div class="home-wf-card home-wf-card--soon" data-action="wf-coming-soon">
            <div class="home-wf-top">
              <div class="home-wf-top-left">
                <span class="home-wf-icon">${ICONS.manual}</span>
                <span class="home-wf-name">审查</span>
                <span class="home-wf-soon">即将上线</span>
              </div>
            </div>
            <span class="home-wf-desc">快速根据审查反馈要求修改文档</span>
          </div>
          ${createCard}
        </div>
      </div>`;
}

function renderHomePage() {
  return `
  <div class="home-content">
    <div class="home-card">

      <div class="home-main-area">
      <div class="home-upper">
      <!-- Center content block: w800 -->
      <div class="home-center">

        <!-- 标题 + 对话框：渐变锚定在此区域，随垂直居中一起移动 -->
        <div class="home-hero">
          <div class="home-title-block">
            <div class="home-title-logo" role="img" aria-label="Patent.AI"></div>
            <span class="home-subtitle">字节跳动专利 AI 全流程辅助系统</span>
          </div>

          <div class="home-input">
            <div class="ai-chat-sender">
              <div class="ai-sender-inner">
                <div class="ai-sender-textarea">
                  <textarea id="home-chat-input" class="ai-sender-real-input" placeholder="继续输入将基于当前会话上下文回复…" rows="1"></textarea>
                </div>
                <div class="ai-sender-bottom">
                  <div class="ai-sender-agent-btn"></div>
                  <div class="ai-send-btn" id="home-send-btn">${ICONS.send}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Prompt: 你可能想问 -->
        <div class="home-prompt">
          <div class="home-prompt-header">
            <span class="home-prompt-title">你可能想问</span>
          </div>
          <div class="home-chips">
            <div class="home-chip">
              <span class="home-chip-emoji">📊</span>
              <span class="home-chip-text">哪个专利代理商的初稿质量最高？</span>
            </div>
            <div class="home-chip">
              <span class="home-chip-emoji">📈</span>
              <span class="home-chip-text">北京市百伦律师事务所的稿件近 3 年对比一下，质量是否有所提高？</span>
            </div>
            <div class="home-chip">
              <span class="home-chip-emoji">🎯</span>
              <span class="home-chip-text">北京市百伦律师事务所的代理人稿件水平如何？</span>
            </div>
          </div>
        </div>
      </div>
      </div>

      <!-- Workflow section：紧贴上方内容，间距 32px -->
      ${renderHomeWorkflowSection()}
      </div>

    </div>
  </div>`;
}
