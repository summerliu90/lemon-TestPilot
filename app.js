const TASKS = {
  cases: {
    title: '生成测试用例', symbol: 'TC', description: '需求 → 结构化测试用例',
    kb: ['业务规则库', '历史 Bug 库', '接口异常库', '回归规则库'],
    output: '用例编号、标题、前置条件、步骤、预期结果、优先级',
    fields: [
      field('title', '需求标题', true, '例如：优惠券叠加规则调整'),
      field('environment', '项目 / 模块', true, '例如：交易 / 优惠券'),
      field('version', '需求版本', true, '例如：需求 #384'),
      field('details', '需求描述与业务流程', true, '描述正常流程、异常流程和规则', 'textarea'),
      field('actual', '验收标准', true, '填写可验证的验收标准', 'textarea'),
      field('attachments', '原型 / 需求链接', false, '可选')
    ]
  },
  bug: {
    title: '分析 Bug', symbol: 'BG', description: '现象 → 排查路径与回归范围',
    kb: ['历史 Bug 库', '业务规则库', '日志规律库', '回归规则库'],
    output: '影响模块、证据、排查路径、风险等级、回归范围',
    fields: [
      field('title', 'Bug 标题', true, '例如：支付成功但订单仍显示未支付'),
      field('environment', '环境', true, 'staging / production'),
      field('version', '版本改动', true, '描述最近相关改动'),
      field('details', '复现步骤', true, '逐步描述复现方式', 'textarea'),
      field('actual', '实际结果', true, '当前发生了什么'),
      field('expected', '预期结果', true, '正确结果应该是什么'),
      field('evidence', '日志 / 接口返回', false, '可粘贴 traceId、日志或接口返回', 'textarea')
    ]
  },
  logs: {
    title: '排查日志', symbol: 'LG', description: '日志 → 调用链与异常证据',
    kb: ['日志规律库', '接口异常库', '历史 Bug 库', '业务规则库'],
    output: '调用链、异常节点、日志证据、排查建议',
    fields: [
      field('title', '异常现象', true, '描述用户或系统侧异常'),
      field('environment', '环境', true, 'staging / production'),
      field('version', '服务 / 接口', true, '例如：payment-service'),
      field('details', '发生时间与操作', true, '时间范围和触发操作', 'textarea'),
      field('traceId', 'traceId', false, '推荐提供'),
      field('expected', '预期调用结果', false, '正常链路应该怎样'),
      field('evidence', '日志片段', true, '粘贴完整上下文', 'textarea')
    ]
  },
  sql: {
    title: '分析 SQL', symbol: 'DB', description: 'SQL → 一致性与性能风险',
    kb: ['SQL 经验库', '业务规则库', '历史 Bug 库'],
    output: '正确性、性能、一致性风险、验证 SQL',
    fields: [
      field('title', '分析场景', true, '例如：检查支付记录与订单状态一致性'),
      field('environment', '数据库环境', true, 'staging / production'),
      field('version', '数据表 / 模块', true, '例如：order_info、payment_record'),
      field('details', 'SQL 语句', true, '粘贴 SQL', 'textarea'),
      field('actual', '实际结果', false, '当前查询结果或异常'),
      field('expected', '预期结果', true, '期望的数据状态'),
      field('evidence', '表结构 / 执行计划', false, '推荐提供', 'textarea')
    ]
  },
  regression: {
    title: '生成回归清单', symbol: 'RG', description: '改动 → 必回归模块',
    kb: ['回归规则库', '历史 Bug 库', '业务规则库'],
    output: 'P0/P1/P2 回归项、关联风险、人工复核点',
    fields: [
      field('title', '变更标题', true, '例如：支付回调逻辑优化'),
      field('environment', '测试环境', true, 'staging'),
      field('version', '发布版本', true, '例如：v2.8.3'),
      field('details', '变更内容', true, '描述代码、配置或业务规则改动', 'textarea'),
      field('actual', '影响模块', true, '例如：支付、订单、MQ'),
      field('attachments', '关联需求 / Bug', false, '可选')
    ]
  },
  report: {
    title: '生成测试报告', symbol: 'RP', description: '任务结果 → 质量结论',
    kb: ['回归规则库', '历史 Bug 库'],
    output: '质量结论、覆盖情况、缺陷、风险、上线建议',
    fields: [
      field('title', '报告标题', true, '例如：支付回调优化测试报告'),
      field('environment', '测试环境', true, 'staging'),
      field('version', '发布版本', true, '例如：v2.8.3'),
      field('details', '测试范围', true, '描述覆盖模块和测试类型', 'textarea'),
      field('actual', '执行结果', true, '执行数量、通过、失败、阻塞', 'textarea'),
      field('expected', '缺陷与遗留风险', true, '缺陷等级、未覆盖项', 'textarea'),
      field('attachments', '附件 / 数据链接', false, '可选')
    ]
  }
};

function field(key, label, required, placeholder, type = 'text') {
  return { key, label, required, placeholder, type };
}

const KB_CATEGORIES = ['历史 Bug 库', '业务规则库', '接口异常库', '日志规律库', 'SQL 经验库', '压测经验库', '回归规则库'];
const STORE_KEY = 'testpilot-personal-workbench-v1';
const NAV = [
  ['dashboard', '工作台首页'], ['tasks', '任务表单'], ['knowledge', '知识库中心'],
  ['combinations', '组合任务'], ['workflows', '全链路任务'], ['reports', '测试报告'], ['settings', '配置中心']
];

const initialKnowledge = [
  knowledge('支付回调重复消费导致重复扣款', '历史 Bug 库', '支付 / MQ', 'P0', '重复回调触发 MQ 重复消费；回归需覆盖幂等键、流水和退款。'),
  knowledge('订单支付成功但状态未同步', '历史 Bug 库', '支付 / 订单', 'P1', '回调消费成功但订单状态更新失败；关注事务、重试和状态机。'),
  knowledge('取消订单后优惠券返还规则', '业务规则库', '订单 / 优惠券', 'P1', '待支付订单可取消；取消后释放库存、返还券并关闭支付入口。'),
  knowledge('支付回调日志关键字', '日志规律库', '支付', 'P1', '重点检索 callback、idempotent、consume、order status、traceId。'),
  knowledge('订单与支付流水一致性检查', 'SQL 经验库', '支付 / 账务', 'P1', '核对 order_info 与 payment_record 的状态、金额和更新时间。'),
  knowledge('支付回调改动回归规则', '回归规则库', '支付', 'P0', '必回归成功、失败、重复回调、订单、流水、库存、优惠券和退款。'),
  knowledge('三方支付超时异常', '接口异常库', '支付 / 三方', 'P1', '覆盖连接超时、响应超时、签名异常、重复通知和降级。'),
  knowledge('支付峰值压测经验', '压测经验库', '支付', 'P1', '关注回调消费积压、数据库锁等待、MQ lag 与幂等存储。')
];

function knowledge(title, category, module, risk, content) {
  return { id: crypto.randomUUID(), title, category, module, risk, content, status: '已发布', updatedAt: '2026-08-19' };
}

const initialState = {
  tasks: [
    sampleTask('bug', '支付成功但订单状态未同步', '已复核'),
    sampleTask('regression', '支付回调逻辑优化 · v2.8.3', '待复核'),
    sampleTask('cases', '优惠券叠加规则调整 · 需求 #384', '已完成')
  ],
  knowledge: initialKnowledge,
  workflows: [{ id: crypto.randomUUID(), name: '支付异常完整排查链', steps: ['bug', 'logs', 'sql', 'regression', 'report'], updatedAt: '2026-08-19' }],
  reports: [],
  schemas: Object.fromEntries(Object.entries(TASKS).map(([id, def]) => [id, def.fields.map((item, index) => ({ id: crypto.randomUUID(), name: item.label, key: item.key, type: item.type, required: item.required, order: index + 1 }))])),
  bindings: Object.fromEntries(Object.entries(TASKS).map(([id, def]) => [id, [...def.kb]]))
};

function sampleTask(type, title, status) {
  return { id: crypto.randomUUID(), type, title, status, createdAt: '2026-08-19 10:30', result: makeResult(type, { title, environment: 'staging', version: 'v2.8.3' }) };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    return saved ? { ...structuredClone(initialState), ...saved } : structuredClone(initialState);
  } catch { return structuredClone(initialState); }
}

let state = loadState();
const ui = {
  page: 'dashboard', taskType: 'bug', inputMode: 'smart', drafts: {}, smartTexts: {}, lastResult: null,
  missing: [], kbCategory: '历史 Bug 库', kbSearch: '', comboSelected: ['bug', 'logs'], comboMode: 'sequence',
  comboText: '', workflowDraft: ['bug', 'logs', 'sql', 'regression', 'report'], workflowName: '支付异常完整排查链',
  reportSelected: [], reportForm: { version: '', environment: 'staging', execution: '', uncovered: '', decision: '' },
  latestReport: null, settingsTab: 'schema', schemaTask: 'cases', bindingTask: 'bug', modal: null
};

const app = document.querySelector('#app');

function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char])); }
function formatNow() { return new Intl.DateTimeFormat('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false }).format(new Date()).replaceAll('/', '-'); }
function getDraft(type) { return ui.drafts[type] ||= Object.fromEntries(TASKS[type].fields.map(item => [item.key, ''])); }
function titleForPage() { return ({ dashboard:'工作台首页', tasks:'任务表单', knowledge:'知识库中心', combinations:'组合任务', workflows:'全链路任务', reports:'测试报告', settings:'配置中心' })[ui.page]; }

function render() {
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand"><div class="brand-mark">T</div><div><div class="brand-name">TestPilot</div><div class="brand-sub">Personal QA Workspace</div></div></div>
        <div class="nav-section"><div class="nav-label">Workspace</div><nav class="nav-list" aria-label="工作台导航">
          ${NAV.map(([id, label], index) => `<button class="nav-item ${ui.page === id ? 'active' : ''}" data-nav="${id}"><span class="nav-index">${String(index + 1).padStart(2,'0')}</span><span>${label}</span></button>`).join('')}
        </nav></div>
        <div class="sidebar-footer"><div class="status-line"><span class="status-dot"></span>本地工作台已就绪</div><div>数据仅保存在当前浏览器 · 端口 3344</div></div>
      </aside>
      <main class="workspace">
        <header class="topbar"><div><div class="eyebrow">Personal workspace</div><h1 class="page-title">${titleForPage()}</h1></div><div class="top-actions"><button class="btn" data-nav="knowledge">维护知识</button><button class="btn btn-primary" data-open-task="bug">新建任务</button></div></header>
        <div class="content">${renderPage()}</div>
      </main>
    </div>${renderModal()}`;
  bindEvents();
}

function renderPage() {
  return ({ dashboard: renderDashboard, tasks: renderTasks, knowledge: renderKnowledge, combinations: renderCombinations, workflows: renderWorkflows, reports: renderReports, settings: renderSettings })[ui.page]();
}

function renderDashboard() {
  const pending = state.tasks.filter(task => task.status === '待复核').length;
  return `<section class="page stack">
    <div class="section-heading"><div><h2>开始一项测试任务</h2><p>智能输入、固定表单和项目知识在同一个入口内协同工作</p></div><div class="section-actions"><button class="btn" data-nav="combinations">组合多个任务</button><button class="btn btn-primary" data-nav="workflows">运行全链路</button></div></div>
    <div class="grid-4">
      <div class="metric"><div class="metric-label">今日任务</div><div class="metric-value">${state.tasks.length}</div><div class="metric-context">个人任务历史</div></div>
      <div class="metric"><div class="metric-label">待人工复核</div><div class="metric-value">${pending}</div><div class="metric-context">高风险结论需确认</div></div>
      <div class="metric"><div class="metric-label">有效知识</div><div class="metric-value">${state.knowledge.filter(item => item.status === '已发布').length}</div><div class="metric-context">七类测试知识</div></div>
      <div class="metric"><div class="metric-label">已保存链路</div><div class="metric-value">${state.workflows.length}</div><div class="metric-context">可重复运行</div></div>
    </div>
    <div class="task-grid">${Object.entries(TASKS).map(([id, def]) => taskCard(id, def, false)).join('')}</div>
    <div class="grid-2">
      <section class="card"><div class="card-title"><h3>最近任务</h3><button class="btn btn-ghost" data-nav="reports">汇总报告</button></div>
        ${state.tasks.slice(0,5).map(task => `<div class="recent-row"><strong>${escapeHtml(TASKS[task.type]?.title || task.type)}</strong><span class="recent-detail">${escapeHtml(task.title)}</span>${statusBadge(task.status)}</div>`).join('') || empty('还没有任务','从上方选择一个任务开始')}
      </section>
      <aside class="card"><div class="card-title"><h3>知识库健康度</h3><button class="btn btn-ghost" data-nav="knowledge">去维护</button></div>
        <div class="health-list"><div class="health-row"><span class="muted">字段完整率</span><strong>92%</strong></div><div class="progress"><span style="width:92%"></span></div><div class="health-row"><span class="muted">待审核知识</span><strong>${state.knowledge.filter(item=>item.status==='待审核').length}</strong></div><div class="health-row"><span class="muted">知识分类</span><strong>${new Set(state.knowledge.map(item=>item.category)).size}/7</strong></div><div class="notice">优先补充历史 Bug、业务规则和回归规则，能最快提升分析质量。</div></div>
      </aside>
    </div>
  </section>`;
}

function taskCard(id, def, selectable, selected = false) {
  return `<button class="task-card ${selected ? 'selected' : ''}" ${selectable ? `data-combo-task="${id}"` : `data-open-task="${id}"`}>
    <div class="task-card-top"><span class="task-icon">${def.symbol}</span>${selectable ? `<input class="task-check" type="checkbox" ${selected ? 'checked' : ''} aria-label="选择${def.title}" tabindex="-1">` : '<span class="badge badge-yellow">智能输入</span>'}</div>
    <h3>${def.title}</h3><p>${def.description}</p></button>`;
}

function renderTasks() {
  const def = TASKS[ui.taskType];
  const draft = getDraft(ui.taskType);
  const missing = getMissing(def, draft);
  return `<section class="page stack">
    <div class="section-heading"><div><h2>任务表单</h2><p>每种任务都支持智能输入和逐项填写，解析结果会直接回填当前表单</p></div><button class="btn" data-nav="combinations">组合多个任务</button></div>
    <div class="tabs" role="tablist">${Object.entries(TASKS).map(([id,item]) => `<button class="tab ${ui.taskType===id?'active':''}" data-task-tab="${id}">${item.title}</button>`).join('')}</div>
    <section class="card smart-input">
      <div class="smart-toolbar"><div><strong>当前任务：${def.title}</strong><div class="help">输入模式随任务切换，不需要离开本页面</div></div><div class="segmented"><button class="segment ${ui.inputMode==='smart'?'active':''}" data-input-mode="smart">智能输入</button><button class="segment ${ui.inputMode==='manual'?'active':''}" data-input-mode="manual">逐项填写</button></div></div>
      ${ui.inputMode === 'smart' ? `<div class="smart-grid"><div class="field"><label for="smart-source">粘贴与“${def.title}”有关的文本</label><textarea id="smart-source" class="textarea" placeholder="直接粘贴需求、问题描述、日志或执行数据…">${escapeHtml(ui.smartTexts[ui.taskType] || '')}</textarea><div><button class="btn btn-primary" id="parse-smart">解析并填充表单</button> <button class="btn" id="load-smart-example">载入示例</button></div></div><div class="recognition-list"><div class="recognition-row"><span>已识别字段</span><strong class="badge badge-success">${def.fields.length - missing.length} 项</strong></div><div class="recognition-row"><span>必填缺失</span><strong class="badge ${missing.length?'badge-warning':'badge-success'}">${missing.length} 项</strong></div><div class="recognition-row"><span>关联知识</span><strong>${def.kb.length} 类</strong></div><div class="recognition-row"><span>处理原则</span><strong>不编造缺失内容</strong></div></div></div>` : `<div class="notice">逐项填写模式：系统会实时校验必填项，填写内容与智能输入使用同一份任务草稿。</div>`}
    </section>
    <div class="grid-2">
      <section class="card"><div class="card-title"><h3>${ui.inputMode==='smart'?'解析后的任务表单':'逐项填写任务表单'}</h3>${missing.length ? `<span class="badge badge-warning">缺 ${missing.length} 项</span>` : '<span class="badge badge-success">信息完整</span>'}</div>
        <div class="form-grid">${def.fields.map(item => renderField(item, draft[item.key] || '')).join('')}<div class="field field-full"><button class="btn btn-primary btn-block" id="run-task">${ui.taskType==='report'?'生成报告草稿':'开始分析'}</button></div></div>
      </section>
      <aside class="stack"><section class="card"><div class="card-title"><h3>本任务配置</h3><span class="badge badge-yellow">v1.0</span></div><div class="health-list"><div><div class="muted">输入格式</div><strong>${def.fields.length} 个字段</strong></div><div><div class="muted">关联知识</div><div>${def.kb.map(item=>`<span class="evidence">${item}</span>`).join('')}</div></div><div><div class="muted">输出格式</div><div class="help">${def.output}</div></div><div class="notice">无证据不判断根因；P0/P1 风险必须人工复核。</div></div></section>${ui.lastResult ? renderResult(ui.lastResult) : ''}</aside>
    </div>
  </section>`;
}

function renderField(item, value) {
  const required = item.required ? '<span class="required">*</span>' : '';
  const control = item.type === 'textarea'
    ? `<textarea class="textarea" data-field="${item.key}" placeholder="${escapeHtml(item.placeholder)}">${escapeHtml(value)}</textarea>`
    : `<input class="input" data-field="${item.key}" value="${escapeHtml(value)}" placeholder="${escapeHtml(item.placeholder)}">`;
  return `<div class="field ${item.type==='textarea'?'field-full':''}"><label>${item.label} ${required}</label>${control}</div>`;
}

function renderResult(result) {
  return `<section class="card result-panel"><div class="card-title"><h3>最近生成结果</h3><span class="badge badge-warning">待人工复核</span></div>
    ${result.sections.map(section => `<div class="result-section"><h4>${escapeHtml(section.title)}</h4>${Array.isArray(section.items) ? `<ul>${section.items.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul>` : `<p>${escapeHtml(section.items)}</p>`}</div>`).join('')}
    <div class="result-section"><h4>引用依据</h4>${result.evidence.map(item=>`<span class="evidence">${escapeHtml(item)}</span>`).join('')}</div></section>`;
}

function renderKnowledge() {
  const items = state.knowledge.filter(item => item.category === ui.kbCategory && (!ui.kbSearch || `${item.title}${item.module}${item.content}`.toLowerCase().includes(ui.kbSearch.toLowerCase())));
  return `<section class="page stack"><div class="section-heading"><div><h2>知识库中心</h2><p>知识经过标准化和审核后，才会被任务引用</p></div><div class="section-actions"><button class="btn" id="import-knowledge">批量导入</button><button class="btn btn-primary" id="new-knowledge">新增知识</button></div></div>
    <div class="grid-4"><div class="metric"><div class="metric-label">有效知识</div><div class="metric-value">${state.knowledge.filter(item=>item.status==='已发布').length}</div></div><div class="metric"><div class="metric-label">待审核</div><div class="metric-value">${state.knowledge.filter(item=>item.status==='待审核').length}</div></div><div class="metric"><div class="metric-label">分类覆盖</div><div class="metric-value">${new Set(state.knowledge.map(item=>item.category)).size}/7</div></div><div class="metric"><div class="metric-label">本月命中</div><div class="metric-value">1,248</div></div></div>
    <div class="kb-layout"><aside class="card"><div class="card-title"><h3>知识分类</h3></div><div class="category-list">${KB_CATEGORIES.map(category=>`<button class="category-btn ${ui.kbCategory===category?'active':''}" data-kb-category="${category}">${category}<span class="muted"> · ${state.knowledge.filter(item=>item.category===category).length}</span></button>`).join('')}</div></aside>
      <section class="card"><div class="search-row"><input class="input" id="kb-search" value="${escapeHtml(ui.kbSearch)}" placeholder="搜索标题、模块和内容"><button class="btn" data-nav="settings" data-settings-tab="binding">配置任务关联</button></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>标题</th><th>模块</th><th>风险</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead><tbody>${items.map(item=>`<tr><td><strong>${escapeHtml(item.title)}</strong></td><td>${escapeHtml(item.module)}</td><td>${riskBadge(item.risk)}</td><td>${statusBadge(item.status)}</td><td>${item.updatedAt}</td><td><button class="row-action" data-toggle-knowledge="${item.id}">${item.status==='已发布'?'转为待审核':'审核发布'}</button></td></tr>`).join('')}</tbody></table>${items.length?'':empty('没有匹配的知识','可以新增或切换知识分类')}</div>
      </section></div></section>`;
}

function renderCombinations() {
  const selected = ui.comboSelected.map(id => TASKS[id]);
  const requirements = mergedRequirements(ui.comboSelected);
  return `<section class="page stack"><div class="section-heading"><div><h2>组合多个测试任务</h2><p>勾选多个任务，平台自动合并重复字段并提示额外信息</p></div></div>
    <div class="task-grid">${Object.entries(TASKS).map(([id,def])=>taskCard(id,def,true,ui.comboSelected.includes(id))).join('')}</div>
    <div class="selection-bar"><div><strong>已选 ${selected.length} 项</strong><span class="muted"> · ${selected.map(item=>item.title).join('、') || '请选择任务'}</span></div><div class="segmented"><button class="segment ${ui.comboMode==='parallel'?'active':''}" data-combo-mode="parallel">并行分析</button><button class="segment ${ui.comboMode==='sequence'?'active':''}" data-combo-mode="sequence">顺序执行</button></div></div>
    <div class="grid-2"><section class="card smart-input"><div class="card-title"><h3>组合任务智能输入</h3><span class="badge badge-yellow">相同字段只填一次</span></div><div class="field"><label>粘贴完整上下文</label><textarea id="combo-text" class="textarea textarea-lg" placeholder="描述问题、环境、版本改动；如包含日志或 SQL 可一并粘贴…">${escapeHtml(ui.comboText)}</textarea></div><div style="margin-top:12px"><button class="btn btn-primary" id="run-combo" ${selected.length?'':'disabled'}>检查信息并创建组合任务</button></div></section>
      <aside class="card"><div class="card-title"><h3>合并后的输入要求</h3><span class="badge ${requirements.length?'badge-warning':'badge-success'}">${requirements.length} 项</span></div>${requirements.map(item=>`<div class="recognition-row"><span>${escapeHtml(item)}</span><span class="badge badge-warning">待识别</span></div>`).join('') || empty('还没有输入要求','先选择至少一个任务')}<div class="notice" style="margin-top:12px">${ui.comboMode==='sequence'?'前一步结构化结果会自动传给下一步；到缺项节点时暂停提醒。':'各任务同时读取公共上下文，完成后合并结论并去重。'}</div></aside></div>
  </section>`;
}

function renderWorkflows() {
  return `<section class="page stack"><div class="section-heading"><div><h2>自定义全链路任务</h2><p>自由排列任务顺序，保存为个人模板并提前检查缺项</p></div><div class="section-actions"><button class="btn" id="clear-workflow">清空</button><button class="btn btn-primary" id="save-workflow">保存链路</button></div></div>
    <div class="grid-2"><section class="stack"><div class="card"><div class="field"><label>链路名称</label><input id="workflow-name" class="input" value="${escapeHtml(ui.workflowName)}"></div></div><div class="workflow-list">${ui.workflowDraft.map((id,index)=>workflowStep(id,index)).join('') || empty('链路为空','从下方添加任务节点')}</div>
      <div class="card"><div class="card-title"><h3>添加任务节点</h3></div><div class="grid-3">${Object.entries(TASKS).map(([id,def])=>`<button class="btn" data-add-step="${id}">＋ ${def.title}</button>`).join('')}</div></div></section>
      <aside class="stack"><section class="card"><div class="card-title"><h3>跑完整条链路所需信息</h3><span class="badge badge-warning">运行时检查</span></div>${workflowPreflight()}</section><section class="card"><div class="card-title"><h3>已保存模板</h3></div>${state.workflows.map(flow=>`<div class="preflight-row"><div class="preflight-head"><strong>${escapeHtml(flow.name)}</strong><button class="row-action" data-load-workflow="${flow.id}">载入</button></div><p>${flow.steps.map(id=>TASKS[id]?.title).join(' → ')}</p></div>`).join('')}</section></aside></div>
  </section>`;
}

function workflowStep(id, index) {
  const def = TASKS[id];
  return `<div class="workflow-step"><div class="step-index">${index+1}</div><div><strong>${def.title}</strong><p>${index ? '继承上游结构化结果，并检查本节点额外输入' : '使用公共上下文作为链路起点'}</p></div><div class="step-actions"><button class="icon-btn" data-move-step="${index}" data-direction="up" aria-label="上移">↑</button><button class="icon-btn" data-move-step="${index}" data-direction="down" aria-label="下移">↓</button><button class="icon-btn btn-danger" data-remove-step="${index}" aria-label="删除">×</button></div></div>`;
}

function workflowPreflight() {
  if (!ui.workflowDraft.length) return empty('暂无检查项','添加节点后自动计算');
  const extras = { bug:'复现步骤、实际/预期结果', logs:'日志片段或日志文件', sql:'SQL、表结构或查询结果', cases:'需求与验收标准', regression:'变更内容和影响模块', report:'用例执行结果、缺陷和未覆盖项' };
  return ui.workflowDraft.map((id,index)=>`<div class="preflight-row"><div class="preflight-head"><strong>${TASKS[id].title}</strong><span class="badge ${index>2?'badge-success':'badge-warning'}">${index>2?'可继承':'需检查'}</span></div><p>${extras[id]}${index ? '；可继承项目、环境、版本和上游证据。' : '；作为链路起点需由用户提供。'}</p></div>`).join('');
}

function renderReports() {
  const selectedTasks = state.tasks.filter(task=>ui.reportSelected.includes(task.id));
  return `<section class="page stack"><div class="section-heading"><div><h2>从已有任务生成测试报告</h2><p>勾选测试用例、Bug 分析或其他任务结果，自动汇总并检查正式报告缺项</p></div></div>
    <div class="grid-2"><section class="stack"><div class="card"><div class="card-title"><h3>1. 选择报告数据源</h3><span class="badge badge-yellow">已选 ${selectedTasks.length} 项</span></div>${state.tasks.map(task=>`<label class="binding-option"><input type="checkbox" data-report-task="${task.id}" ${ui.reportSelected.includes(task.id)?'checked':''}><span><strong>${TASKS[task.type]?.title}</strong><span class="help">${escapeHtml(task.title)} · ${task.status}</span></span></label>`).join('') || empty('还没有可选任务','请先运行测试任务')}</div>
      <div class="card"><div class="card-title"><h3>2. 补充报告信息</h3></div><div class="form-grid"><div class="field"><label>发布版本 <span class="required">*</span></label><input class="input" data-report-field="version" value="${escapeHtml(ui.reportForm.version)}" placeholder="v2.8.3"></div><div class="field"><label>测试环境 <span class="required">*</span></label><input class="input" data-report-field="environment" value="${escapeHtml(ui.reportForm.environment)}"></div><div class="field field-full"><label>用例执行结果</label><textarea class="textarea" data-report-field="execution" placeholder="例如：执行 86 条，通过 82 条，失败 3 条，阻塞 1 条">${escapeHtml(ui.reportForm.execution)}</textarea></div><div class="field field-full"><label>未覆盖项与遗留风险</label><textarea class="textarea" data-report-field="uncovered" placeholder="没有执行数据时只能生成报告草稿">${escapeHtml(ui.reportForm.uncovered)}</textarea></div><div class="field field-full"><label>放行意见</label><input class="input" data-report-field="decision" value="${escapeHtml(ui.reportForm.decision)}" placeholder="建议上线 / 有条件上线 / 暂缓"></div><div class="field field-full"><button class="btn btn-primary btn-block" id="generate-report">生成测试报告</button></div></div></div></section>
      <aside class="stack"><section class="card"><div class="card-title"><h3>报告完整性检查</h3></div>${reportReadiness(selectedTasks)}</section>${ui.latestReport ? renderGeneratedReport(ui.latestReport) : ''}</aside></div>
  </section>`;
}

function reportReadiness(tasks) {
  const hasCases = tasks.some(task=>task.type==='cases');
  const hasBug = tasks.some(task=>task.type==='bug');
  const checks = [
    ['任务数据源', tasks.length > 0, tasks.length ? `${tasks.length} 项` : '未选择'],
    ['测试范围', hasCases || tasks.length > 1, hasCases ? '来自测试用例' : '建议补充'],
    ['缺陷分析', hasBug, hasBug ? '已包含' : '暂无 Bug 分析'],
    ['执行结果', Boolean(ui.reportForm.execution.trim()), ui.reportForm.execution.trim() ? '已填写' : '缺失'],
    ['发布版本', Boolean(ui.reportForm.version.trim()), ui.reportForm.version.trim() || '缺失']
  ];
  const formal = tasks.length && ui.reportForm.execution.trim() && ui.reportForm.version.trim();
  return `${checks.map(([name,ok,value])=>`<div class="recognition-row"><span>${name}</span><span class="badge ${ok?'badge-success':'badge-warning'}">${escapeHtml(value)}</span></div>`).join('')}<div class="notice ${formal?'':'notice-warning'}" style="margin-top:12px">${formal?'满足正式报告基础条件，生成后仍需人工复核。':'当前只能生成报告草稿；正式报告至少需要执行结果和发布版本。'}</div>`;
}

function renderGeneratedReport(report) {
  return `<section class="card result-panel"><div class="card-title"><h3>${escapeHtml(report.title)}</h3>${statusBadge(report.status)}</div><div class="result-section"><h4>质量结论</h4><p>${escapeHtml(report.conclusion)}</p></div><div class="result-section"><h4>汇总来源</h4>${report.sources.map(item=>`<span class="evidence">${escapeHtml(item)}</span>`).join('')}</div><div class="result-section"><h4>人工复核</h4><p>${escapeHtml(report.review)}</p></div></section>`;
}

function renderSettings() {
  return `<section class="page stack"><div class="section-heading"><div><h2>配置中心</h2><p>输出格式、知识关联和个人偏好均可编辑并保存</p></div></div><div class="tabs"><button class="tab ${ui.settingsTab==='schema'?'active':''}" data-settings-tab="schema">输出格式</button><button class="tab ${ui.settingsTab==='binding'?'active':''}" data-settings-tab="binding">知识关联</button><button class="tab ${ui.settingsTab==='preferences'?'active':''}" data-settings-tab="preferences">个人偏好</button></div>${ui.settingsTab==='schema'?renderSchemaSettings():ui.settingsTab==='binding'?renderBindingSettings():renderPreferences()}</section>`;
}

function renderSchemaSettings() {
  const schema = state.schemas[ui.schemaTask];
  return `<div class="grid-2"><section class="card"><div class="card-title"><h3>输出格式设计器</h3><button class="btn btn-primary" id="save-schema">保存新版本</button></div><div class="field"><label>任务类型</label><select class="select" id="schema-task">${Object.entries(TASKS).map(([id,def])=>`<option value="${id}" ${ui.schemaTask===id?'selected':''}>${def.title}</option>`).join('')}</select></div><div style="margin-top:14px">${schema.map((item,index)=>`<div class="schema-row"><span class="schema-order">${index+1}</span><input class="input" data-schema-name="${item.id}" value="${escapeHtml(item.name)}"><select class="select schema-type" data-schema-type="${item.id}"><option value="text" ${item.type==='text'?'selected':''}>文本</option><option value="textarea" ${item.type==='textarea'?'selected':''}>多行文本</option><option value="list" ${item.type==='list'?'selected':''}>列表</option></select><label class="schema-required"><input type="checkbox" data-schema-required="${item.id}" ${item.required?'checked':''}> 必填</label><button class="icon-btn btn-danger" data-remove-schema="${item.id}">×</button></div>`).join('')}</div><button class="dashed-button" id="add-schema-field" style="margin-top:12px">＋ 新增字段</button></section><aside class="card"><div class="card-title"><h3>版本规则</h3><span class="badge badge-yellow">v1.0</span></div><div class="health-list"><div class="notice">新任务使用最新版格式；历史任务继续保留创建时的版本。</div><div><strong>支持调整</strong><p class="help">字段名称、顺序、类型、必填规则和导出映射。</p></div><div><strong>变更保护</strong><p class="help">删除关键字段时，需要检查 Prompt、任务链路和报告引用。</p></div></div></aside></div>`;
}

function renderBindingSettings() {
  const selected = state.bindings[ui.bindingTask] || [];
  return `<div class="grid-2"><section class="card"><div class="card-title"><h3>任务与知识库关联</h3><button class="btn btn-primary" id="save-binding">保存配置</button></div><div class="field"><label>任务类型</label><select class="select" id="binding-task">${Object.entries(TASKS).map(([id,def])=>`<option value="${id}" ${ui.bindingTask===id?'selected':''}>${def.title}</option>`).join('')}</select></div><div class="binding-grid" style="margin-top:14px">${KB_CATEGORIES.map(category=>`<label class="binding-option"><input type="checkbox" data-binding-category="${category}" ${selected.includes(category)?'checked':''}><span>${category}</span></label>`).join('')}</div></section><aside class="card"><div class="card-title"><h3>当前检索策略</h3></div><div class="health-list"><div><div class="muted">过滤顺序</div><strong>项目 → 模块 → 版本 → 时间</strong></div><div><div class="muted">最多引用</div><strong>每类 5 条</strong></div><div><div class="muted">无匹配时</div><strong>扩大到关联模块并明确提示</strong></div><div class="notice">任务结果必须展示实际引用的知识条目，方便人工复核。</div></div></aside></div>`;
}

function renderPreferences() {
  return `<div class="grid-3"><section class="card"><div class="card-title"><h3>主题</h3><span class="badge badge-yellow">Lemon yellow</span></div><p class="help">明亮黄色用于主操作和选中状态，黑色侧栏承载导航。</p></section><section class="card"><div class="card-title"><h3>本地数据</h3><span class="badge badge-success">已启用</span></div><p class="help">任务、知识、报告和链路保存在当前浏览器 localStorage。</p></section><section class="card"><div class="card-title"><h3>服务端口</h3><span class="badge badge-yellow">3344</span></div><p class="help">本地访问地址为 http://127.0.0.1:3344。</p></section></div>`;
}

function renderModal() {
  if (ui.modal !== 'knowledge') return '';
  return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><div class="modal-head"><div><h3>新增测试知识</h3><p>新增内容先进入待审核状态，发布后才能被任务引用。</p></div><button class="icon-btn" id="close-modal">×</button></div><div class="form-grid"><div class="field field-full"><label>知识标题 <span class="required">*</span></label><input class="input" id="new-kb-title"></div><div class="field"><label>知识分类</label><select class="select" id="new-kb-category">${KB_CATEGORIES.map(item=>`<option ${ui.kbCategory===item?'selected':''}>${item}</option>`).join('')}</select></div><div class="field"><label>模块</label><input class="input" id="new-kb-module" placeholder="例如：支付 / 订单"></div><div class="field"><label>风险等级</label><select class="select" id="new-kb-risk"><option>P0</option><option selected>P1</option><option>P2</option></select></div><div class="field field-full"><label>结构化内容 <span class="required">*</span></label><textarea class="textarea textarea-lg" id="new-kb-content" placeholder="填写现象、触发条件、根因证据、回归重点或业务规则…"></textarea></div></div><div class="modal-actions"><button class="btn" id="close-modal-2">取消</button><button class="btn btn-primary" id="save-knowledge">保存为待审核</button></div></section></div>`;
}

function bindEvents() {
  document.querySelectorAll('[data-nav]').forEach(button => button.addEventListener('click', () => { ui.page = button.dataset.nav; if (button.dataset.settingsTab) ui.settingsTab = button.dataset.settingsTab; render(); }));
  document.querySelectorAll('[data-open-task]').forEach(button => button.addEventListener('click', () => { ui.taskType = button.dataset.openTask; ui.page = 'tasks'; ui.lastResult = null; render(); }));
  document.querySelectorAll('[data-task-tab]').forEach(button => button.addEventListener('click', () => { ui.taskType = button.dataset.taskTab; ui.lastResult = null; render(); }));
  document.querySelectorAll('[data-input-mode]').forEach(button => button.addEventListener('click', () => { ui.inputMode = button.dataset.inputMode; render(); }));
  document.querySelectorAll('[data-field]').forEach(control => control.addEventListener('input', () => { getDraft(ui.taskType)[control.dataset.field] = control.value; }));
  document.querySelector('#parse-smart')?.addEventListener('click', parseCurrentSmartInput);
  document.querySelector('#load-smart-example')?.addEventListener('click', loadSmartExample);
  document.querySelector('#run-task')?.addEventListener('click', runCurrentTask);

  document.querySelectorAll('[data-kb-category]').forEach(button => button.addEventListener('click', () => { ui.kbCategory = button.dataset.kbCategory; render(); }));
  document.querySelector('#kb-search')?.addEventListener('input', event => { ui.kbSearch = event.target.value; render(); });
  document.querySelector('#new-knowledge')?.addEventListener('click', () => { ui.modal = 'knowledge'; render(); });
  document.querySelector('#import-knowledge')?.addEventListener('click', () => toast('第一版支持在“新增知识”中录入；CSV / JSON 批量导入接口已预留。'));
  document.querySelectorAll('[data-toggle-knowledge]').forEach(button => button.addEventListener('click', () => toggleKnowledge(button.dataset.toggleKnowledge)));
  document.querySelector('#close-modal')?.addEventListener('click', closeModal);
  document.querySelector('#close-modal-2')?.addEventListener('click', closeModal);
  document.querySelector('#save-knowledge')?.addEventListener('click', addKnowledge);

  document.querySelectorAll('[data-combo-task]').forEach(button => button.addEventListener('click', event => { if (event.target.matches('input')) event.preventDefault(); toggleCombo(button.dataset.comboTask); }));
  document.querySelectorAll('[data-combo-mode]').forEach(button => button.addEventListener('click', () => { ui.comboMode = button.dataset.comboMode; render(); }));
  document.querySelector('#combo-text')?.addEventListener('input', event => { ui.comboText = event.target.value; });
  document.querySelector('#run-combo')?.addEventListener('click', runCombination);

  document.querySelector('#workflow-name')?.addEventListener('input', event => { ui.workflowName = event.target.value; });
  document.querySelectorAll('[data-add-step]').forEach(button => button.addEventListener('click', () => { ui.workflowDraft.push(button.dataset.addStep); render(); }));
  document.querySelectorAll('[data-remove-step]').forEach(button => button.addEventListener('click', () => { ui.workflowDraft.splice(Number(button.dataset.removeStep),1); render(); }));
  document.querySelectorAll('[data-move-step]').forEach(button => button.addEventListener('click', () => moveStep(Number(button.dataset.moveStep), button.dataset.direction)));
  document.querySelector('#clear-workflow')?.addEventListener('click', () => { ui.workflowDraft = []; render(); });
  document.querySelector('#save-workflow')?.addEventListener('click', saveWorkflow);
  document.querySelectorAll('[data-load-workflow]').forEach(button => button.addEventListener('click', () => loadWorkflow(button.dataset.loadWorkflow)));

  document.querySelectorAll('[data-report-task]').forEach(input => input.addEventListener('change', () => { ui.reportSelected = input.checked ? [...ui.reportSelected,input.dataset.reportTask] : ui.reportSelected.filter(id=>id!==input.dataset.reportTask); render(); }));
  document.querySelectorAll('[data-report-field]').forEach(control => control.addEventListener('input', () => { ui.reportForm[control.dataset.reportField] = control.value; }));
  document.querySelector('#generate-report')?.addEventListener('click', generateReport);

  document.querySelectorAll('[data-settings-tab]').forEach(button => button.addEventListener('click', () => { ui.settingsTab = button.dataset.settingsTab; ui.page = 'settings'; render(); }));
  document.querySelector('#schema-task')?.addEventListener('change', event => { ui.schemaTask = event.target.value; render(); });
  document.querySelectorAll('[data-schema-name]').forEach(input => input.addEventListener('input', () => updateSchema(input.dataset.schemaName,'name',input.value)));
  document.querySelectorAll('[data-schema-type]').forEach(input => input.addEventListener('change', () => updateSchema(input.dataset.schemaType,'type',input.value)));
  document.querySelectorAll('[data-schema-required]').forEach(input => input.addEventListener('change', () => updateSchema(input.dataset.schemaRequired,'required',input.checked)));
  document.querySelectorAll('[data-remove-schema]').forEach(button => button.addEventListener('click', () => { state.schemas[ui.schemaTask] = state.schemas[ui.schemaTask].filter(item=>item.id!==button.dataset.removeSchema); save(); render(); }));
  document.querySelector('#add-schema-field')?.addEventListener('click', addSchemaField);
  document.querySelector('#save-schema')?.addEventListener('click', () => { save(); toast('输出格式新版本已保存'); });
  document.querySelector('#binding-task')?.addEventListener('change', event => { ui.bindingTask = event.target.value; render(); });
  document.querySelectorAll('[data-binding-category]').forEach(input => input.addEventListener('change', () => toggleBinding(input.dataset.bindingCategory,input.checked)));
  document.querySelector('#save-binding')?.addEventListener('click', () => { save(); toast('知识关联配置已保存'); });
}

function getMissing(def, draft) { return def.fields.filter(item => item.required && !String(draft[item.key] || '').trim()); }

function parseCurrentSmartInput() {
  const text = document.querySelector('#smart-source').value.trim();
  ui.smartTexts[ui.taskType] = text;
  if (!text) return toast('请先粘贴需要分析的文本');
  const def = TASKS[ui.taskType];
  const draft = getDraft(ui.taskType);
  const sentences = text.split(/[。！？\n]/).map(item=>item.trim()).filter(Boolean);
  const env = text.match(/\b(staging|production|prod|test|uat)\b/i)?.[1];
  const version = text.match(/v\d+(?:\.\d+){1,3}|版本\s*[：:]?\s*[^，。\s]+|需求\s*#?\d+/i)?.[0];
  const trace = text.match(/trace(?:id)?\s*[=:：]?\s*([\w-]+)/i)?.[1];
  const service = text.match(/[a-z][a-z0-9-]+-service/i)?.[0];
  if (!draft.title) draft.title = sentences[0]?.slice(0,80) || '';
  if (!draft.environment && env) draft.environment = env;
  if (!draft.version && (version || service)) draft.version = version || service;
  if (def.fields.some(item=>item.key==='traceId') && trace) draft.traceId = trace;
  if (!draft.details && sentences.length > 1) draft.details = sentences.slice(1,4).join('；');
  if (!draft.evidence && /error|warn|exception|日志|sql|select|trace/i.test(text)) draft.evidence = text;
  if (ui.taskType === 'cases' && !draft.actual) draft.actual = sentences.find(item=>/验收|应该|需要|必须|确保/.test(item)) || '';
  if (ui.taskType === 'regression' && !draft.actual) draft.actual = extractModules(text).join('、');
  if (ui.taskType === 'report' && !draft.actual) draft.actual = text.match(/执行[^。\n]+/)?.[0] || '';
  ui.missing = getMissing(def,draft).map(item=>item.label);
  render();
  toast(ui.missing.length ? `已完成解析，仍缺 ${ui.missing.length} 项必填信息` : '已解析并完整回填任务表单');
}

function loadSmartExample() {
  const examples = {
    cases:'优惠券叠加规则有调整：平台券与商家券满足活动条件时允许叠加，订单金额不能小于 0，需要覆盖互斥、过期和退款场景。需求 #384。',
    bug:'用户完成微信支付后订单仍显示未支付。发生在 staging，最近优化支付回调逻辑，traceId=pay-20260819-0081。',
    logs:'staging 环境 payment-service 在 19:30 出现订单未更新，traceId=pay-20260819-0081，WARN callback consumed but order status unchanged。',
    sql:'需要检查 order_info 和 payment_record 一致性，payment_record 成功但 order_info 仍是 WAIT_PAY。SELECT * FROM order_info。',
    regression:'v2.8.3 优化支付回调逻辑，涉及幂等、订单状态同步和 MQ 消费，需要覆盖支付、订单、优惠券和退款。',
    report:'v2.8.3 支付回调测试完成，执行 86 条，通过 82 条，失败 3 条，阻塞 1 条；存在 1 个 P1 缺陷。'
  };
  ui.smartTexts[ui.taskType] = examples[ui.taskType]; render();
}

function runCurrentTask() {
  const def = TASKS[ui.taskType];
  const draft = getDraft(ui.taskType);
  document.querySelectorAll('[data-field]').forEach(control => draft[control.dataset.field] = control.value);
  const missing = getMissing(def,draft);
  if (missing.length) return toast(`请先补齐：${missing.map(item=>item.label).join('、')}`);
  const result = makeResult(ui.taskType,draft);
  const task = { id:crypto.randomUUID(), type:ui.taskType, title:draft.title || def.title, status:'待复核', createdAt:formatNow(), input:{...draft}, result };
  state.tasks.unshift(task); ui.lastResult = result; save(); render(); toast(`${def.title}已完成，等待人工复核`);
}

function makeResult(type, draft = {}) {
  const modules = extractModules(`${draft.title||''} ${draft.details||''} ${draft.actual||''}`);
  const evidence = (TASKS[type]?.kb || []).flatMap(category => initialKnowledge.filter(item=>item.category===category).slice(0,1).map(item=>item.title)).slice(0,4);
  const common = evidence.length ? evidence : ['支付回调改动回归规则', '订单支付成功但状态未同步'];
  const map = {
    cases: [section('用例范围',[`覆盖${modules.join('、')}的正常、异常和边界场景`,'包含历史缺陷回归与规则约束']),section('建议用例',["P0｜支付成功后订单、流水同步","P0｜重复回调幂等处理","P1｜支付失败与超时恢复","P1｜库存与优惠券联动","P2｜提示文案与兼容性"])],
    bug: [section('影响模块',modules),section('排查路径',['核对支付回调是否到达并验证签名','按 traceId 串联回调、MQ 消费和订单更新','检查订单与支付流水状态一致性']),section('风险与回归',['暂不能在无日志证据时断言根因','重点回归重复回调、状态同步、库存、优惠券和退款'])],
    logs: [section('调用链',['支付网关 → 回调接口 → 幂等校验 → MQ → 订单状态更新']),section('关注证据',['callback/consume/order status 关键字','同 traceId 下的异常、重试和耗时','消息消费成功但数据库更新失败的时间点'])],
    sql: [section('数据风险',['订单与支付流水状态不一致','关联字段或时间条件遗漏造成误判','大表 JOIN 可能触发全表扫描']),section('验证建议',['先限定订单号与时间范围','分别核对状态、金额和更新时间','生产环境默认只生成验证 SQL，不自动执行'])],
    regression: [section('P0 必回归',['支付成功、失败、重复回调','订单状态、支付流水、库存、优惠券','退款链路和历史高风险缺陷']),section('P1/P2',['异常重试、超时恢复和消息积压','提示文案、兼容性和监控告警'])],
    report: [section('报告草稿',[draft.actual || '尚未提供完整执行数据',draft.expected || '需要补充遗留风险']),section('质量判断',['正式报告需包含执行结果、缺陷、未覆盖项和发布版本','最终上线结论必须人工确认'])]
  };
  return { sections:map[type] || [], evidence:common };
}

function section(title, items) { return { title, items }; }
function extractModules(text='') {
  const known = ['支付','订单','MQ','库存','优惠券','退款','账务','接口','数据库'];
  const found = known.filter(item=>text.toLowerCase().includes(item.toLowerCase()));
  return found.length ? found : ['当前业务模块','关联服务'];
}

function toggleKnowledge(id) { const item=state.knowledge.find(entry=>entry.id===id); item.status=item.status==='已发布'?'待审核':'已发布'; item.updatedAt='2026-08-19'; save(); render(); }
function closeModal() { ui.modal=null; render(); }
function addKnowledge() {
  const title=document.querySelector('#new-kb-title').value.trim(), content=document.querySelector('#new-kb-content').value.trim();
  if (!title || !content) return toast('请填写知识标题和结构化内容');
  state.knowledge.unshift({ id:crypto.randomUUID(), title, category:document.querySelector('#new-kb-category').value, module:document.querySelector('#new-kb-module').value.trim()||'未分类', risk:document.querySelector('#new-kb-risk').value, content, status:'待审核', updatedAt:'2026-08-19' });
  save(); ui.modal=null; render(); toast('知识已保存为待审核');
}

function toggleCombo(id) { ui.comboSelected = ui.comboSelected.includes(id) ? ui.comboSelected.filter(item=>item!==id) : [...ui.comboSelected,id]; render(); }
function mergedRequirements(ids) {
  const normalized = new Map();
  ids.flatMap(id=>TASKS[id].fields.filter(item=>item.required)).forEach(item=>{
    const key = ({ environment:'环境', version:'版本 / 服务 / 模块', title:'任务主题', details:'详细上下文', actual:'实际结果 / 影响范围', expected:'预期结果' })[item.key] || item.label;
    normalized.set(key,key);
  });
  return [...normalized.values()];
}
function runCombination() {
  ui.comboText = document.querySelector('#combo-text').value.trim();
  if (!ui.comboSelected.length) return toast('请至少选择一个任务');
  if (!ui.comboText) return toast('请提供组合任务的公共上下文');
  const title=`组合任务：${ui.comboSelected.map(id=>TASKS[id].title).join(' + ')}`;
  state.tasks.unshift({ id:crypto.randomUUID(), type:ui.comboSelected[0], title, status:'待复核', createdAt:formatNow(), combination:[...ui.comboSelected], result:{ sections:[section(ui.comboMode==='sequence'?'顺序执行计划':'并行分析计划',ui.comboSelected.map((id,index)=>`${index+1}. ${TASKS[id].title}`)),section('信息检查',['公共上下文已保存','各节点运行前继续校验条件必填项'])], evidence:['组合任务公共上下文'] } });
  save(); toast('组合任务已创建，可在最近任务中查看'); ui.page='dashboard'; render();
}

function moveStep(index,direction) { const target=direction==='up'?index-1:index+1; if(target<0||target>=ui.workflowDraft.length)return; [ui.workflowDraft[index],ui.workflowDraft[target]]=[ui.workflowDraft[target],ui.workflowDraft[index]]; render(); }
function saveWorkflow() { const name=document.querySelector('#workflow-name').value.trim(); if(!name||!ui.workflowDraft.length)return toast('请填写名称并添加至少一个节点'); state.workflows.unshift({id:crypto.randomUUID(),name,steps:[...ui.workflowDraft],updatedAt:'2026-08-19'}); save(); render(); toast('全链路模板已保存'); }
function loadWorkflow(id) { const flow=state.workflows.find(item=>item.id===id); ui.workflowName=flow.name; ui.workflowDraft=[...flow.steps]; render(); toast('链路模板已载入'); }

function generateReport() {
  document.querySelectorAll('[data-report-field]').forEach(control=>ui.reportForm[control.dataset.reportField]=control.value);
  const tasks=state.tasks.filter(task=>ui.reportSelected.includes(task.id));
  if(!tasks.length)return toast('请至少勾选一个任务结果');
  const formal=Boolean(ui.reportForm.version.trim()&&ui.reportForm.execution.trim());
  const hasCases=tasks.some(task=>task.type==='cases'), hasBug=tasks.some(task=>task.type==='bug');
  const report={ id:crypto.randomUUID(), title:`${ui.reportForm.version||'未命名版本'} 测试报告`, status:formal?'待复核':'草稿', createdAt:formatNow(), sources:tasks.map(task=>`${TASKS[task.type]?.title}：${task.title}`), conclusion:formal?`${ui.reportForm.execution}。${ui.reportForm.decision||'上线意见待人工确认'}。`:`已汇总 ${tasks.length} 项任务结果，但缺少完整执行数据或发布版本，仅生成草稿。`, review:`${hasCases?'已包含测试范围；':'建议补充测试用例与范围；'}${hasBug?'已包含缺陷分析；':'暂无 Bug 分析；'}${ui.reportForm.uncovered||'未覆盖项待补充。'}` };
  state.reports.unshift(report); ui.latestReport=report; save(); render(); toast(formal?'正式报告草稿已生成，等待人工复核':'信息不足，已生成报告草稿');
}

function updateSchema(id,key,value) { const item=state.schemas[ui.schemaTask].find(entry=>entry.id===id); item[key]=value; }
function addSchemaField() { state.schemas[ui.schemaTask].push({id:crypto.randomUUID(),name:'新字段',key:`custom_${Date.now()}`,type:'text',required:false,order:state.schemas[ui.schemaTask].length+1}); save(); render(); }
function toggleBinding(category,checked) { const items=state.bindings[ui.bindingTask]||[]; state.bindings[ui.bindingTask]=checked?[...new Set([...items,category])]:items.filter(item=>item!==category); }

function statusBadge(status) { const style=status==='已发布'||status==='已完成'||status==='已复核'?'badge-success':status==='待复核'||status==='待审核'?'badge-warning':'badge'; return `<span class="badge ${style}">${escapeHtml(status)}</span>`; }
function riskBadge(risk) { return `<span class="badge ${risk==='P0'?'badge-danger':risk==='P1'?'badge-warning':''}">${escapeHtml(risk)}</span>`; }
function empty(title,description) { return `<div class="empty"><strong>${title}</strong><span>${description}</span></div>`; }
function toast(message) { const root=document.querySelector('#toast-root'); root.innerHTML=`<div class="toast">${escapeHtml(message)}</div>`; window.clearTimeout(toast.timer); toast.timer=window.setTimeout(()=>root.innerHTML='',2600); }

render();
