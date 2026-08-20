import http from 'node:http';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 3344);
const production = process.argv.includes('--production');
const dataDir = join(root, 'data');
await mkdir(join(dataDir, 'backups'), { recursive: true });
const db = new DatabaseSync(join(dataDir, 'testpilot.sqlite'));
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS modules (id TEXT PRIMARY KEY, project_name TEXT NOT NULL, module_name TEXT NOT NULL, submodule_name TEXT NOT NULL, status TEXT NOT NULL DEFAULT '启用', sort_order INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL, module_id TEXT, risk TEXT NOT NULL DEFAULT 'P1', status TEXT NOT NULL DEFAULT '草稿', review_status TEXT NOT NULL DEFAULT '未提交', knowledge_status TEXT NOT NULL DEFAULT '未入库', parent_id TEXT, input_json TEXT NOT NULL DEFAULT '{}', result_json TEXT NOT NULL DEFAULT '{}', model TEXT NOT NULL DEFAULT '本地规则', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(module_id) REFERENCES modules(id));
CREATE TABLE IF NOT EXISTS cases (id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, title TEXT NOT NULL, module_id TEXT, priority TEXT NOT NULL DEFAULT 'P1', case_type TEXT NOT NULL DEFAULT '功能', version INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT '未执行', source_task_id TEXT, content_json TEXT NOT NULL DEFAULT '{}', archived INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(module_id) REFERENCES modules(id));
CREATE TABLE IF NOT EXISTS knowledge (id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL, module_id TEXT, risk TEXT NOT NULL DEFAULT 'P1', status TEXT NOT NULL DEFAULT '待审核', version INTEGER NOT NULL DEFAULT 1, content TEXT NOT NULL, source_task_id TEXT, review_note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(module_id) REFERENCES modules(id));
CREATE TABLE IF NOT EXISTS regressions (id TEXT PRIMARY KEY, title TEXT NOT NULL, module_id TEXT, status TEXT NOT NULL DEFAULT '执行中', progress INTEGER NOT NULL DEFAULT 0, data_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, title TEXT NOT NULL, project_name TEXT NOT NULL, verdict TEXT NOT NULL, version TEXT NOT NULL DEFAULT 'v1.0', data_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS workflows (id TEXT PRIMARY KEY, name TEXT NOT NULL, steps_json TEXT NOT NULL, status TEXT NOT NULL DEFAULT '模板', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS relations (id INTEGER PRIMARY KEY AUTOINCREMENT, source_type TEXT NOT NULL, source_id TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT NOT NULL, label TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS providers (id TEXT PRIMARY KEY, name TEXT NOT NULL, base_url TEXT NOT NULL, model TEXT NOT NULL, temperature REAL NOT NULL DEFAULT 0.2, timeout INTEGER NOT NULL DEFAULT 60, max_tokens INTEGER NOT NULL DEFAULT 4096, enabled INTEGER NOT NULL DEFAULT 0, key_mask TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, action TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS migrations (key TEXT PRIMARY KEY, completed_at TEXT NOT NULL, backup_path TEXT NOT NULL);
`);

const now = () => new Date().toISOString();
const makeId = prefix => `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
const json = value => JSON.stringify(value ?? {});
const parse = (value, fallback = {}) => { try { return JSON.parse(value); } catch { return fallback; } };

function seed() {
  if (db.prepare('SELECT COUNT(*) AS n FROM modules').get().n) return;
  const insertModule = db.prepare('INSERT INTO modules VALUES (?, ?, ?, ?, ?, ?, ?)');
  [['mod_pay_callback','电商平台','支付中心','支付回调'],['mod_pay_order','电商平台','支付中心','订单同步'],['mod_order_coupon','电商平台','订单中心','优惠券'],['mod_account','电商平台','账户中心','会员账户'],['mod_ops','测试平台','质量工具','任务编排']].forEach((m,i)=>insertModule.run(...m,'启用',i+1,now()));

  const insertCase = db.prepare('INSERT INTO cases VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  [
    ['case_001','TC-PAY-001','支付回调幂等校验','mod_pay_callback','P0','接口',2,'通过',{precondition:'订单待支付',steps:['连续发送两次相同回调','查询支付流水与订单'],expected:'仅生成一笔流水且订单只更新一次',testData:'相同 transactionId'}],
    ['case_002','TC-PAY-002','支付成功后订单状态同步','mod_pay_order','P1','功能',1,'失败',{precondition:'正常支付订单',steps:['完成支付','等待回调消费','查询订单'],expected:'订单状态为已支付',testData:'普通订单'}],
    ['case_003','TC-COUPON-001','取消订单返还优惠券','mod_order_coupon','P1','回归',3,'未执行',{precondition:'订单使用优惠券',steps:['取消待支付订单','查询优惠券状态'],expected:'优惠券恢复可用',testData:'有效优惠券'}],
    ['case_004','TC-PAY-003','三方回调签名异常','mod_pay_callback','P0','异常',1,'阻塞',{precondition:'准备错误签名',steps:['发送异常回调'],expected:'拒绝处理并记录安全日志',testData:'错误 sign'}]
  ].forEach(r=>insertCase.run(...r.slice(0,8),null,json(r[8]),0,now(),now()));

  const insertKnowledge = db.prepare('INSERT INTO knowledge VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  [
    ['kb_001','支付回调重复消费导致重复扣款','历史 Bug 库','mod_pay_callback','P0','已发布',2,'重复回调可能触发 MQ 重复消费；回归必须覆盖幂等键、流水唯一索引与退款。','task_bug_001'],
    ['kb_002','支付回调日志关键字','日志规律库','mod_pay_callback','P1','已发布',1,'重点检索 callback、idempotent、consume、order status 与 traceId。','task_logs_001'],
    ['kb_003','订单与支付流水一致性检查','SQL 经验库','mod_pay_order','P1','待审核',1,'核对 order_info 与 payment_record 的状态、金额和更新时间。','task_sql_001'],
    ['kb_004','支付回调改动回归规则','回归规则库','mod_pay_callback','P0','已发布',1,'必回归成功、失败、重复回调、流水、优惠券和退款。',null]
  ].forEach(r=>insertKnowledge.run(...r,'',now(),now()));

  const insertTask = db.prepare('INSERT INTO tasks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  [
    ['task_bug_001','bug','支付成功但订单状态未同步','mod_pay_order','P0','已完成','审核通过','已入库',null,{phenomenon:'支付成功，订单仍待支付'},{summary:'回调消费后订单事务回滚',suggestions:['核对消费日志','校验事务边界']},'DeepSeek'],
    ['task_logs_001','logs','支付回调消费超时排查','mod_pay_callback','P1','已完成','审核通过','已入库',null,{traceId:'trace-demo-1024'},{timeline:['10:20:01 接收回调','10:20:04 MQ 超时'],cause:'消费端连接池等待'},'通义千问'],
    ['task_sql_001','sql','订单与支付流水一致性分析','mod_pay_order','P1','待审核','待审核','未入库',null,{sql:'SELECT ...'},{risk:'状态字段存在延迟窗口',suggestion:'按 transaction_id 建立联合索引'},'OpenAI'],
    ['task_case_001','cases','优惠券叠加规则用例生成','mod_order_coupon','P1','已完成','审核通过','未入库',null,{requirement:'优惠券叠加规则'},{count:12,p0:2},'DeepSeek']
  ].forEach(r=>insertTask.run(...r.slice(0,9),json(r[9]),json(r[10]),r[11],now(),now()));

  const items=[{id:'ri_1',caseId:'case_001',title:'支付回调幂等校验',priority:'P0',status:'通过',expected:'只处理一次',actual:'通过',owner:'我',moduleId:'mod_pay_callback'},{id:'ri_2',caseId:'case_002',title:'订单状态同步',priority:'P1',status:'失败',expected:'订单已支付',actual:'偶发仍为待支付',owner:'我',moduleId:'mod_pay_order'},{id:'ri_3',bugId:'task_bug_001',title:'重复回调历史缺陷验证',priority:'P0',status:'未执行',expected:'缺陷不再出现',actual:'',owner:'我',moduleId:'mod_pay_callback'}];
  db.prepare('INSERT INTO regressions VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run('reg_001','支付回调优化回归清单','mod_pay_callback','执行中',67,json({version:'v2.8.3',items}),now(),now());
  db.prepare('INSERT INTO reports VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run('report_001','支付回调优化测试报告','电商平台','有条件上线','v2.8.3',json({modules:['支付回调','订单同步'],passed:18,failed:1,blocked:1,sources:['reg_001','task_bug_001'],risks:['订单状态同步存在偶发失败']}),now(),now());
  db.prepare('INSERT INTO workflows VALUES (?, ?, ?, ?, ?, ?)').run('wf_001','支付异常完整排查链',json(['bug','logs','sql','regression','report']),'模板',now(),now());
  const p=db.prepare('INSERT INTO providers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  p.run('openai','OpenAI','https://api.openai.com/v1','gpt-5-mini',0.2,60,4096,0,'');
  p.run('qwen','通义千问','https://dashscope.aliyuncs.com/compatible-mode/v1','qwen-plus',0.2,60,4096,0,'');
  p.run('deepseek','DeepSeek','https://api.deepseek.com/v1','deepseek-chat',0.2,60,4096,0,'');
  p.run('custom','自定义兼容接口','','',0.2,60,4096,0,'');
}
seed();
if (!db.prepare("SELECT 1 FROM relations WHERE source_type='task' AND source_id='task_bug_001' AND target_type='knowledge' AND target_id='kb_004'").get()) {
  db.prepare('INSERT INTO relations(source_type,source_id,target_type,target_id,label) VALUES(?,?,?,?,?)').run('task','task_bug_001','knowledge','kb_004','Bug 分析引用回归规则');
}

function moduleLabel(moduleId){if(!moduleId)return '';const m=db.prepare('SELECT * FROM modules WHERE id=?').get(moduleId);return m?`${m.project_name} / ${m.module_name} / ${m.submodule_name}`:'';}
function mapRow(resource,row){if(!row)return null;const camel=Object.fromEntries(Object.entries(row).map(([k,v])=>[k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase()),v]));for(const key of ['inputJson','resultJson','contentJson','dataJson','stepsJson','valueJson'])if(key in camel){camel[key.replace('Json','')]=parse(camel[key]);delete camel[key];}if(camel.moduleId)camel.moduleLabel=moduleLabel(camel.moduleId);if(resource==='providers')camel.keyConfigured=Boolean(camel.keyMask);return camel;}
const resources={tasks:{table:'tasks',search:['title','type','status','review_status'],order:'updated_at'},cases:{table:'cases',search:['code','title','priority','status'],order:'updated_at',where:'archived=0'},knowledge:{table:'knowledge',search:['title','category','content','status'],order:'updated_at'},regressions:{table:'regressions',search:['title','status'],order:'updated_at'},reports:{table:'reports',search:['title','project_name','verdict'],order:'updated_at'},workflows:{table:'workflows',search:['name','status'],order:'updated_at'},modules:{table:'modules',search:['project_name','module_name','submodule_name','status'],order:'sort_order'},providers:{table:'providers',search:['name','model'],order:'name'}};
function listResource(resource,url){const c=resources[resource];if(!c)return null;const page=Math.max(1,Number(url.searchParams.get('page')||1));const pageSize=[20,50,100].includes(Number(url.searchParams.get('pageSize')))?Number(url.searchParams.get('pageSize')):20;const q=(url.searchParams.get('q')||'').trim();const clauses=c.where?[c.where]:[];const params=[];if(q){clauses.push(`(${c.search.map(k=>`${k} LIKE ?`).join(' OR ')})`);params.push(...c.search.map(()=>`%${q}%`));}['type','status','module_id','category','priority','risk'].forEach(key=>{const value=url.searchParams.get(key);if(value){clauses.push(`${key}=?`);params.push(value);}});const where=clauses.length?`WHERE ${clauses.join(' AND ')}`:'';const total=db.prepare(`SELECT COUNT(*) AS n FROM ${c.table} ${where}`).get(...params).n;const rows=db.prepare(`SELECT * FROM ${c.table} ${where} ORDER BY ${c.order} DESC LIMIT ? OFFSET ?`).all(...params,pageSize,(page-1)*pageSize);return{items:rows.map(row=>mapRow(resource,row)),page,pageSize,total,pages:Math.max(1,Math.ceil(total/pageSize))};}
function send(res,status,payload){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(payload));}
async function readBody(req){const chunks=[];for await(const chunk of req)chunks.push(chunk);return chunks.length?JSON.parse(Buffer.concat(chunks).toString('utf8')):{};}
function audit(type,entityId,action,detail=''){db.prepare('INSERT INTO audit(entity_type,entity_id,action,detail,created_at) VALUES(?,?,?,?,?)').run(type,entityId,action,detail,now());}
async function saveProviderKey(providerId,secret){if(secret)await execFileAsync('/usr/bin/security',['add-generic-password','-U','-a',providerId,'-s','TestPilot-LLM','-w',secret]);}
async function readProviderKey(providerId){try{return(await execFileAsync('/usr/bin/security',['find-generic-password','-a',providerId,'-s','TestPilot-LLM','-w'])).stdout.trim();}catch{return '';}}

async function handleApi(req,res,url){
  const parts=url.pathname.split('/').filter(Boolean);if(parts[0]!=='api')return false;
  try{
    if(req.method==='GET'&&parts[1]==='bootstrap'){const counts={};for(const[k,v]of Object.entries(resources))counts[k]=db.prepare(`SELECT COUNT(*) AS n FROM ${v.table}`).get().n;return send(res,200,{counts,modules:db.prepare('SELECT * FROM modules ORDER BY project_name,module_name,sort_order').all().map(r=>mapRow('modules',r)),providers:db.prepare('SELECT * FROM providers ORDER BY name').all().map(r=>mapRow('providers',r))});}
    if(req.method==='GET'&&resources[parts[1]]&&!parts[2])return send(res,200,listResource(parts[1],url));
    if(req.method==='GET'&&resources[parts[1]]&&parts[2]){const row=db.prepare(`SELECT * FROM ${resources[parts[1]].table} WHERE id=?`).get(parts[2]);if(!row)return send(res,404,{error:'记录不存在'});const mapped=mapRow(parts[1],row);if(parts[1]==='knowledge'){mapped.dependencies=db.prepare("SELECT * FROM relations WHERE target_type='knowledge' AND target_id=? AND active=1").all(parts[2]).map(r=>mapRow('relations',r));mapped.referenceCount=mapped.dependencies.length;}return send(res,200,mapped);}
    if(req.method==='POST'&&parts[1]==='tasks'){const d=await readBody(req),taskId=makeId('task'),ts=now();db.prepare('INSERT INTO tasks VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(taskId,d.type,d.title,d.moduleId||null,d.risk||'P1',d.status||'草稿','未提交','未入库',d.parentId||null,json(d.input),json(d.result),d.model||'本地规则',ts,ts);audit('task',taskId,'创建',d.type);return send(res,201,mapRow('tasks',db.prepare('SELECT * FROM tasks WHERE id=?').get(taskId)));}
    if(req.method==='PATCH'&&parts[1]==='tasks'&&parts[2]){const d=await readBody(req),c=db.prepare('SELECT * FROM tasks WHERE id=?').get(parts[2]);if(!c)return send(res,404,{error:'任务不存在'});db.prepare('UPDATE tasks SET title=?,module_id=?,risk=?,status=?,review_status=?,knowledge_status=?,input_json=?,result_json=?,updated_at=? WHERE id=?').run(d.title??c.title,d.moduleId??c.module_id,d.risk??c.risk,d.status??c.status,d.reviewStatus??c.review_status,d.knowledgeStatus??c.knowledge_status,json(d.input??parse(c.input_json)),json(d.result??parse(c.result_json)),now(),parts[2]);audit('task',parts[2],'更新',d.action||'编辑任务');return send(res,200,mapRow('tasks',db.prepare('SELECT * FROM tasks WHERE id=?').get(parts[2])));}
    if(req.method==='POST'&&parts[1]==='cases'){const d=await readBody(req),caseId=makeId('case'),ts=now(),code=d.code||`TC-${Date.now().toString().slice(-6)}`;db.prepare('INSERT INTO cases VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(caseId,code,d.title,d.moduleId||null,d.priority||'P1',d.caseType||'功能',1,d.status||'未执行',d.sourceTaskId||null,json(d.content),0,ts,ts);audit('case',caseId,'创建');return send(res,201,mapRow('cases',db.prepare('SELECT * FROM cases WHERE id=?').get(caseId)));}
    if(req.method==='PATCH'&&parts[1]==='cases'&&parts[2]){const d=await readBody(req),c=db.prepare('SELECT * FROM cases WHERE id=?').get(parts[2]);if(!c)return send(res,404,{error:'用例不存在'});db.prepare('UPDATE cases SET title=?,module_id=?,priority=?,case_type=?,version=version+1,status=?,content_json=?,archived=?,updated_at=? WHERE id=?').run(d.title??c.title,d.moduleId??c.module_id,d.priority??c.priority,d.caseType??c.case_type,d.status??c.status,json(d.content??parse(c.content_json)),d.archived??c.archived,now(),parts[2]);audit('case',parts[2],'更新版本');return send(res,200,mapRow('cases',db.prepare('SELECT * FROM cases WHERE id=?').get(parts[2])));}
    if(req.method==='POST'&&parts[1]==='knowledge'){const d=await readBody(req),kid=makeId('kb'),ts=now();db.prepare('INSERT INTO knowledge VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(kid,d.title,d.category,d.moduleId||null,d.risk||'P1','待审核',1,d.content,d.sourceTaskId||null,'',ts,ts);audit('knowledge',kid,'创建');return send(res,201,mapRow('knowledge',db.prepare('SELECT * FROM knowledge WHERE id=?').get(kid)));}
    if(req.method==='PATCH'&&parts[1]==='knowledge'&&parts[2]){const d=await readBody(req),c=db.prepare('SELECT * FROM knowledge WHERE id=?').get(parts[2]);if(!c)return send(res,404,{error:'知识不存在'});if(d.action==='withdraw'){const deps=db.prepare("SELECT * FROM relations WHERE target_type='knowledge' AND target_id=? AND active=1").all(parts[2]);if(deps.length)return send(res,409,{error:'存在有效关联，不能撤销入库',dependencies:deps});}const status=d.action==='approve'?'已发布':d.action==='reject'?'已驳回':d.action==='withdraw'?'已撤销':d.status??c.status;db.prepare('UPDATE knowledge SET title=?,category=?,module_id=?,risk=?,status=?,version=version+1,content=?,review_note=?,updated_at=? WHERE id=?').run(d.title??c.title,d.category??c.category,d.moduleId??c.module_id,d.risk??c.risk,status,d.content??c.content,d.reviewNote??c.review_note,now(),parts[2]);audit('knowledge',parts[2],d.action||'编辑',d.reviewNote||'');return send(res,200,mapRow('knowledge',db.prepare('SELECT * FROM knowledge WHERE id=?').get(parts[2])));}
    if(req.method==='PATCH'&&parts[1]==='regressions'&&parts[2]){const d=await readBody(req),c=db.prepare('SELECT * FROM regressions WHERE id=?').get(parts[2]);if(!c)return send(res,404,{error:'回归清单不存在'});const value=d.data??parse(c.data_json),items=value.items||[],complete=items.filter(i=>!['未执行','阻塞'].includes(i.status)).length,progress=items.length?Math.round(complete/items.length*100):0;db.prepare('UPDATE regressions SET status=?,progress=?,data_json=?,updated_at=? WHERE id=?').run(d.status??(progress===100?'已完成':'执行中'),progress,json(value),now(),parts[2]);audit('regression',parts[2],'更新执行结果');return send(res,200,mapRow('regressions',db.prepare('SELECT * FROM regressions WHERE id=?').get(parts[2])));}
    if(req.method==='POST'&&parts[1]==='reports'){const d=await readBody(req),rid=makeId('report'),ts=now();db.prepare('INSERT INTO reports VALUES(?,?,?,?,?,?,?,?)').run(rid,d.title,d.projectName||'未指定项目',d.verdict||'有条件上线',d.version||'v1.0',json(d.data),ts,ts);(d.data?.sources||[]).forEach(s=>db.prepare('INSERT INTO relations(source_type,source_id,target_type,target_id,label) VALUES(?,?,?,?,?)').run('report',rid,s.type,s.id,'报告来源'));audit('report',rid,'生成');return send(res,201,mapRow('reports',db.prepare('SELECT * FROM reports WHERE id=?').get(rid)));}
    if(req.method==='POST'&&parts[1]==='workflows'){const d=await readBody(req),wid=makeId('wf'),ts=now();db.prepare('INSERT INTO workflows VALUES(?,?,?,?,?,?)').run(wid,d.name,json(d.steps),d.status||'模板',ts,ts);audit('workflow',wid,'创建');return send(res,201,mapRow('workflows',db.prepare('SELECT * FROM workflows WHERE id=?').get(wid)));}
    if(req.method==='POST'&&parts[1]==='modules'){const d=await readBody(req),mid=makeId('mod');db.prepare('INSERT INTO modules VALUES(?,?,?,?,?,?,?)').run(mid,d.projectName,d.moduleName,d.submoduleName,'启用',d.sortOrder||99,now());audit('module',mid,'创建');return send(res,201,mapRow('modules',db.prepare('SELECT * FROM modules WHERE id=?').get(mid)));}
    if(req.method==='PATCH'&&parts[1]==='modules'&&parts[2]){const d=await readBody(req),c=db.prepare('SELECT * FROM modules WHERE id=?').get(parts[2]);if(!c)return send(res,404,{error:'模块不存在'});db.prepare('UPDATE modules SET project_name=?,module_name=?,submodule_name=?,status=?,sort_order=?,updated_at=? WHERE id=?').run(d.projectName??c.project_name,d.moduleName??c.module_name,d.submoduleName??c.submodule_name,d.status??c.status,d.sortOrder??c.sort_order,now(),parts[2]);audit('module',parts[2],'更新');return send(res,200,mapRow('modules',db.prepare('SELECT * FROM modules WHERE id=?').get(parts[2])));}
    if(req.method==='PATCH'&&parts[1]==='providers'&&parts[2]){const d=await readBody(req),c=db.prepare('SELECT * FROM providers WHERE id=?').get(parts[2]);if(!c)return send(res,404,{error:'模型厂商不存在'});if(d.apiKey)await saveProviderKey(parts[2],d.apiKey);const mask=d.apiKey?`${d.apiKey.slice(0,3)}••••${d.apiKey.slice(-3)}`:c.key_mask;db.prepare('UPDATE providers SET base_url=?,model=?,temperature=?,timeout=?,max_tokens=?,enabled=?,key_mask=? WHERE id=?').run(d.baseUrl??c.base_url,d.model??c.model,d.temperature??c.temperature,d.timeout??c.timeout,d.maxTokens??c.max_tokens,d.enabled?1:0,mask,parts[2]);audit('provider',parts[2],'更新配置');return send(res,200,mapRow('providers',db.prepare('SELECT * FROM providers WHERE id=?').get(parts[2])));}
    if(req.method==='POST'&&parts[1]==='providers'&&parts[3]==='test'){const p=db.prepare('SELECT * FROM providers WHERE id=?').get(parts[2]),key=await readProviderKey(parts[2]);if(!p||!key)return send(res,400,{error:'请先保存 API Key'});const started=Date.now(),response=await fetch(`${p.base_url.replace(/\/$/,'')}/models`,{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(p.timeout*1000)});if(!response.ok)return send(res,502,{error:`连接失败：HTTP ${response.status}`});return send(res,200,{ok:true,latency:Date.now()-started});}
    if(req.method==='POST'&&parts[1]==='ai'&&parts[2]==='analyze'){const d=await readBody(req),p=db.prepare('SELECT * FROM providers WHERE id=? AND enabled=1').get(d.providerId);if(!p)return send(res,400,{error:'请选择并启用一个模型配置'});const key=await readProviderKey(p.id);if(!key)return send(res,400,{error:'模型 API Key 未配置'});const response=await fetch(`${p.base_url.replace(/\/$/,'')}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:json({model:p.model,temperature:p.temperature,max_tokens:p.max_tokens,messages:[{role:'system',content:'你是测试分析助手。仅返回合法 JSON，包含 summary、risk、suggestions、missingFields。'},{role:'user',content:`${d.taskType}\n${d.text}` }]}),signal:AbortSignal.timeout(p.timeout*1000)});if(!response.ok)return send(res,502,{error:`模型调用失败：HTTP ${response.status}`});const result=await response.json(),content=result.choices?.[0]?.message?.content||'{}';return send(res,200,{provider:p.name,model:p.model,result:parse(content.replace(/^```json\s*|\s*```$/g,''),{summary:content})});}
    if(req.method==='POST'&&parts[1]==='migrate'){const d=await readBody(req),old=db.prepare('SELECT * FROM migrations WHERE key=?').get('localstorage-v1');if(old)return send(res,200,{migrated:false,reason:'already-migrated',backupPath:old.backup_path});const backupPath=join(dataDir,'backups',`localstorage-${Date.now()}.json`);await writeFile(backupPath,JSON.stringify(d,null,2),{flag:'wx'});const imported={tasks:0,knowledge:0};for(const item of d.tasks||[]){const tid=item.id||makeId('legacy_task');if(db.prepare('SELECT 1 FROM tasks WHERE id=?').get(tid))continue;db.prepare('INSERT INTO tasks VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(tid,item.type||'bug',item.title||'旧版任务',null,'P1',item.status||'已完成','未提交','未入库',null,json(item.input||{}),json(item.result||{}),'旧版规则',item.createdAt||now(),now());imported.tasks++;}for(const item of d.knowledge||[]){const kid=item.id||makeId('legacy_kb');if(db.prepare('SELECT 1 FROM knowledge WHERE id=?').get(kid))continue;db.prepare('INSERT INTO knowledge VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(kid,item.title||'旧版知识',item.category||'业务规则库',null,item.risk||'P1',item.status||'待审核',1,item.content||'',null,'从旧版迁移',item.updatedAt||now(),now());imported.knowledge++;}db.prepare('INSERT INTO migrations VALUES(?,?,?)').run('localstorage-v1',now(),backupPath);audit('migration','localstorage-v1','完成',json(imported));return send(res,200,{migrated:true,imported,backupPath});}
    if(req.method==='GET'&&parts[1]==='settings'&&parts[2]){const row=db.prepare('SELECT value_json FROM settings WHERE key=?').get(parts[2]);return send(res,200,{key:parts[2],value:row?parse(row.value_json):null});}
    if(req.method==='PATCH'&&parts[1]==='settings'&&parts[2]){const d=await readBody(req);db.prepare('INSERT INTO settings(key,value_json) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json').run(parts[2],json(d.value));audit('settings',parts[2],'全量同步模板');return send(res,200,{key:parts[2],value:d.value});}
    if(req.method==='GET'&&parts[1]==='audit'){const rows=db.prepare('SELECT * FROM audit WHERE entity_type=? AND entity_id=? ORDER BY id DESC').all(url.searchParams.get('type'),url.searchParams.get('id'));return send(res,200,{items:rows.map(r=>mapRow('audit',r))});}
    return send(res,404,{error:'接口不存在'});
  }catch(error){console.error(error);return send(res,500,{error:error.message||'服务端错误'});}
}

const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.woff2':'font/woff2'};
let vite;
const staticFiles=new Map();
async function preloadStatic(dir,prefix=''){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const relative=prefix?`${prefix}/${entry.name}`:entry.name;
    const absolute=join(dir,entry.name);
    if(entry.isDirectory())await preloadStatic(absolute,relative);
    else staticFiles.set(`/${relative}`,await readFile(absolute));
  }
}
if(!production){const{createServer}=await import('vite');vite=await createServer({root,server:{middlewareMode:true},appType:'spa'});}
else await preloadStatic(join(root,'runtime-dist'));
const server=http.createServer(async(req,res)=>{const url=new URL(req.url,`http://${req.headers.host}`);if(url.pathname.startsWith('/api/')){await handleApi(req,res,url);return;}if(vite){vite.middlewares(req,res,()=>send(res,404,{error:'页面不存在'}));return;}try{const requested=normalize(decodeURIComponent(url.pathname));const key=requested==='/'?'/index.html':requested;const asset=staticFiles.get(key)||staticFiles.get('/index.html');const contentType=staticFiles.has(key)?types[extname(key)]:types['.html'];res.writeHead(200,{'Content-Type':contentType||'application/octet-stream','Cache-Control':'no-store'});res.end(asset);}catch(error){res.writeHead(500);res.end(error.message);}});
server.listen(port,'127.0.0.1',()=>console.log(`TestPilot 已启动：http://127.0.0.1:${port}`));
