/* ========== Shared Data ========== */

const VALIDATION_WARN_DUP_COUNT = 3;

/** 对话内实时校验：演示「全部通过」与「含警告」两种结果 */
const VALIDATION_ITEMS_PASS = [
  { label: '表格格式', okText: '.xlsx 格式正确' },
  { label: '必填字段', okText: '全部填写（157 条）' },
  { label: '文件数量', okText: '157 份，已确认' },
  { label: '重复文件', okText: '未发现重复编号' },
  { label: '专利号格式', okText: '全部合规' },
];

/** 仅重复编号问题：不通过，不可提交质检 */
const VALIDATION_ITEMS_FAIL_DUP = [
  { label: '表格格式', okText: '.xlsx 格式正确' },
  { label: '必填字段', okText: '全部填写（157 条）' },
  { label: '文件数量', okText: '157 份，已确认' },
  {
    label: '重复文件',
    errorText: `${VALIDATION_WARN_DUP_COUNT} 份文件编号重复，需处理后再提交`,
    isError: true,
  },
  { label: '专利号格式', okText: '全部合规' },
];

/** 多项错误：不通过，不可提交质检 */
const VALIDATION_ITEMS_FAIL = [
  { label: '表格格式', okText: '.xlsx 格式正确' },
  { label: '必填字段', errorText: '第 12、45 行存在未填写的必填项', isError: true },
  { label: '文件数量', okText: '157 份，已确认' },
  {
    label: '重复文件',
    errorText: `${VALIDATION_WARN_DUP_COUNT} 份文件编号重复，需处理后再提交`,
    isError: true,
  },
  { label: '专利号格式', errorText: '2 处专利号格式不符合规范', isError: true },
];

const VALIDATION_ITEM_COUNT = VALIDATION_ITEMS_PASS.length;

function getValidationItems(demoMode) {
  if (demoMode === 'pass') return VALIDATION_ITEMS_PASS;
  if (demoMode === 'fail-multi') return VALIDATION_ITEMS_FAIL;
  if (demoMode === 'fail') return VALIDATION_ITEMS_FAIL_DUP;
  return VALIDATION_ITEMS_PASS;
}

/** 根据文件列表计算质检汇总（结果页指标卡、分布条等） */
function computeQcMetrics(files) {
  if (!files || !files.length) {
    return {
      avg: 0,
      max: 0,
      min: 0,
      excellent: 0,
      highRisk: 0,
      r01zero: 0,
      n: 0,
      excellentPct: 0,
      highRiskPct: 0,
    };
  }
  const scores = files.map((f) => f.score);
  const n = files.length;
  const sum = scores.reduce((a, b) => a + b, 0);
  const avg = Math.round((sum / n) * 100) / 100;
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const excellent = files.filter((f) => f.score >= 60).length;
  const highRisk = files.filter((f) => f.score <= 50).length;
  const r01zero = files.filter((f) => f.r01 === 0).length;
  return {
    avg,
    max,
    min,
    excellent,
    highRisk,
    r01zero,
    n,
    excellentPct: Math.round((excellent / n) * 100),
    highRiskPct: Math.round((highRisk / n) * 100),
  };
}

function computeScoreDistribution(files) {
  const ranges = [
    { label: '60–65', lo: 60, hi: 65, cls: 'bar-green' },
    { label: '55–59', lo: 55, hi: 59, cls: 'bar-orange' },
    { label: '50–54', lo: 50, hi: 54, cls: 'bar-yellow' },
    { label: '45–49', lo: 45, hi: 49, cls: 'bar-red' },
  ];
  const n = files.length;
  return ranges.map((r) => {
    const count = files.filter((f) => f.score >= r.lo && f.score <= r.hi).length;
    const pct = n ? Math.round((count / n) * 100) : 0;
    return { label: r.label, count, pct, cls: r.cls };
  });
}

const TITLE_POOL = [
  '区块链共识方法、装置、电子设备、存储介质及程序产品',
  '一种移动互联网跨平台用户管理方法及装置',
  '多终端跨平台账号统一认证系统及认证方法',
  '跨平台应用数据同步方法、装置、设备及存储介质',
  '在网络中管理关联的会话',
  '一种基于联盟链的跨境数据安全共享方法及系统',
  '区块链智能合约自动审计方法、装置及电子设备',
  '一种智能网络会话优化方法及终端设备',
  '基于 5G 网络的会话资源动态分配方法及系统',
  '一种基于物联网的移动应用系统',
];

const AGENT_POOL = [
  '李健',
  'Nita Khatri',
  'James Morris',
  'Naomi Hill',
  '王冰',
  'Juliette Roux',
  'Neha Anand',
  '张锐',
  '李天天',
];

/** 质检细分维度字段名 r01 … r28（与表头 R01–R28 对应） */
const FILE_R_DIM_KEYS = (function () {
  const a = [];
  for (let r = 1; r <= 28; r++) {
    a.push('r' + String(r).padStart(2, '0'));
  }
  return a;
})();

/** 明细行上限需覆盖工作流任务 fileCount 最大值 */
const FILE_LIST = (function () {
  const out = [];
  const total = 400;
  for (let i = 0; i < total; i++) {
    const score = 45 + ((i * 13 + 7) % 21);
    const row = {
      id: i + 1,
      caseNo: 'P' + String(202203273000 + i),
      title:
        TITLE_POOL[i % TITLE_POOL.length] +
        (i >= TITLE_POOL.length ? `（${i + 1}）` : ''),
      agent: AGENT_POOL[i % AGENT_POOL.length],
      score,
    };
    row.r01 = i % 13 === 2 ? 0 : 5;
    for (let r = 2; r <= 28; r++) {
      const k = 'r' + String(r).padStart(2, '0');
      row[k] = (i * 17 + r * 11) % 10;
    }
    out.push(row);
  }
  return out;
})();

/** 质检报告「查看」：新标签页打开（可替换为真实飞书文档地址） */
const FEISHU_QC_REPORT_OPEN_URL = 'https://www.feishu.cn';

/** 工作流列表任务名称：律所池（按索引打散选用，演示数据） */
const WORKFLOW_FIRM_NAMES = [
  '北京市金杜律师事务所',
  '北京市中伦律师事务所',
  '北京市君合律师事务所',
  '北京市海问律师事务所',
  '北京市竞天公诚律师事务所',
  '北京市通商律师事务所',
  '上海市锦天城律师事务所',
  '上海市方达律师事务所',
  '上海市通力律师事务所',
  '深圳市华商律师事务所',
  '广州金鹏律师事务所',
  '浙江天册律师事务所',
  '江苏世纪同仁律师事务所',
  '四川恒和信律师事务所',
  '湖北今天律师事务所',
  '湖南天地人律师事务所',
  '山东众成清泰律师事务所',
  '天津张盈律师事务所',
  '重庆百君律师事务所',
  '北京立方律师事务所',
  '北京万慧达知识产权代理有限公司',
  '北京三友知识产权代理有限公司',
  '北京集佳知识产权代理有限公司',
  '北京康信知识产权代理有限责任公司',
  '上海专利商标事务所有限公司',
  '广州三环专利商标代理有限公司',
  '杭州华进联浙知识产权代理有限公司',
  '南京经纬专利商标代理有限公司',
  '成都虹桥专利事务所（普通合伙）',
  '西安智邦专利商标代理有限公司',
  '武汉科皓知识产权代理事务所',
  '郑州联科专利事务所',
  '沈阳科苑专利商标代理有限公司',
  '大连东方专利代理有限责任公司',
  '哈尔滨龙科专利代理有限公司'
];

/** 工作流 Tab：一级列表（质检任务）— 共 157 条，供 Table + Pagination */
const WORKFLOW_TASKS = (function () {
  const slots = [];
  for (let k = 0; k < 157; k++) {
    const day = 1 + ((k * 19 + (k % 11)) % 31);
    const hh = (k * 5) % 24;
    const mm = (k * 13 + (k % 3)) % 60;
    slots.push({ day, hh, mm, k });
  }
  slots.sort((a, b) => {
    if (b.day !== a.day) return b.day - a.day;
    if (b.hh !== a.hh) return b.hh - a.hh;
    if (b.mm !== a.mm) return b.mm - a.mm;
    return b.k - a.k;
  });
  const pad2 = (n) => String(n).padStart(2, '0');
  const firmCount = WORKFLOW_FIRM_NAMES.length;
  const out = [];
  for (let i = 0; i < 157; i++) {
    const processing = i % 7 === 0;
    const { day, hh, mm } = slots[i];
    const firmIdx = (i * 23 + (i % 17) * 11) % firmCount;
    const firm = WORKFLOW_FIRM_NAMES[firmIdx];
    const baseName = `2025年${firm}质检评分总表`;
    out.push({
      id: 'wf-' + (i + 1),
      name: i === 0 ? baseName : `${baseName}（批次 ${i + 1}）`,
      submitTime: `2025/12/${pad2(day)} ${pad2(hh)}:${pad2(mm)}`,
      status: processing ? 'processing' : 'completed',
      fileCount: 120 + ((i * 47) % 250),
      avgScore: processing ? null : Math.round((52 + (i % 15) + (i % 8) / 10) * 100) / 100,
      maxScore: processing ? null : 62 + (i % 5),
    });
  }
  return out;
})();

/**
 * 对话历史
 * pinned: 预留字段（列表不再展示图钉）
 * listIcon: 'chat' | 'mobile' — 左侧圆圈内图标
 * workflows: 会话内工作流标签（历史列表精简后不再展示，保留供对话回放等使用）
 */
const CHAT_HISTORY = [
  {
    id: 'h1',
    title: '批量质检 · 北京邦通卓匠 2025',
    preview: '质检已完成：157 份文件，平均分 58.18，已生成评分总表',
    time: '2026-04-03 14:32',
    type: 'qc',
    pinned: true,
    listIcon: 'chat',
    workflows: [{ label: '质检', count: 2 }]
  },
  {
    id: 'h2',
    title: '代理机构初稿质量对比',
    preview: '哪个专利代理商的初稿质量最高？',
    time: '2026-04-02 11:05',
    type: 'general',
    pinned: true,
    listIcon: 'chat',
    workflows: [],
    thread: [
      { role: 'user', text: '哪个专利代理商的初稿质量最高？' },
      { role: 'ai', text: '根据近一年录入数据，A 机构初稿一次通过率约 78%，略高于 B 机构的 71%…' }
    ]
  },
  {
    id: 'h3',
    title: '百伦所稿件三年趋势',
    preview: '北京市百伦律师事务所的稿件近 3 年对比一下，质量是否有所提高？',
    time: '2026-04-01 16:40',
    type: 'general',
    pinned: true,
    listIcon: 'chat',
    workflows: [],
    thread: [
      { role: 'user', text: '北京市百伦律师事务所的稿件近 3 年对比一下，质量是否有所提高？' },
      { role: 'ai', text: '2023–2025 年该所平均质检分从 54.2 提升至 57.1，权利要求缺陷率下降约 12%…' }
    ]
  },
  {
    id: 'h4',
    title: '说明书与权要一致性',
    preview: '请帮我检查这份说明书和权利要求是否一致',
    time: '2026-03-28 09:12',
    type: 'general',
    pinned: true,
    listIcon: 'chat',
    workflows: [{ label: '审查', count: 1 }],
    thread: [
      { role: 'user', text: '请帮我检查这份说明书和权利要求是否一致' },
      { role: 'ai', text: '可先上传权利要求书与说明书 PDF，系统将对独立权利要求与支持段落做逐条引用分析…' }
    ]
  }
];

/* ========== 表格分页（工作流列表 / 质检结果页 / 对话侧栏「质检结果」抽屉共用） ========== */

function buildCompactPaginationPages(currentPage, totalPages) {
  const total = Math.max(1, Math.floor(Number(totalPages)) || 0);
  const cur = Math.min(
    Math.max(1, Math.floor(Number(currentPage)) || 1),
    total
  );
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const delta = 1;
  const left = Math.max(2, cur - delta);
  const right = Math.min(total - 1, cur + delta);
  const pages = [];
  pages.push(1);
  if (left > 2) pages.push('…');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push('…');
  pages.push(total);
  return pages;
}

function paginationViewModel(currentPage, pageSize, totalItems) {
  const size = Math.max(1, Math.floor(Number(pageSize)) || 15);
  const n = Math.max(0, Math.floor(Number(totalItems)) || 0);
  const totalPages = Math.max(1, Math.ceil(n / size));
  const page = Math.floor(Number(currentPage)) || 1;
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pages = buildCompactPaginationPages(safePage, totalPages);
  return { totalPages, safePage, pages, totalItems: n, pageSize: size };
}
