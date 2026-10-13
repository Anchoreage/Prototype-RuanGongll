import React,{useState} from 'react';
import {REVIEW_ITEMS} from './data';
import {validateExpression} from './relationExpression';
import {loadReviewRecords,saveReviewRecord,appendDecision} from './reviewRecords';
import {downloadJSON} from './Guide';
import Icon from './Icon';

const DEFAULT_ACTOR='教师 / 裁定者（演示）';
const formatTime=value=>value?new Date(value).toLocaleString('zh-CN'):'未记录';

function VersionRecord({version,current=false}){
 return <article className="decision-version">
  <div className="version-heading"><strong>v{version.version}{current?' · 当前定稿':''}</strong><span>{formatTime(version.decidedAt)}</span></div>
  <code className="final-expression">{version.result}</code>
  <p><strong>裁定理由：</strong>{version.reason}</p>
  <p className="muted">{version.supersedesVersion?'修改人':'裁定人'}：{version.actor||DEFAULT_ACTOR} · 指南 {version.guideVersion}</p>
  {version.changeReason&&<p><strong>修改原因：</strong>{version.changeReason}</p>}
  {version.supersedesVersion&&<small>基于 v{version.supersedesVersion} 修订，原记录已保留</small>}
 </article>;
}

function DecisionCase({item,record,guide,onSave,notify}){
 const latest=record?.versions.at(-1);
 const draft=record?.draft;
 const [editing,setEditing]=useState(!latest||Boolean(draft));
 const [choice,setChoice]=useState(draft?.choice||latest?.choice||'');
 const [custom,setCustom]=useState(draft?.custom||latest?.result||'');
 const [reason,setReason]=useState(draft?.reason||latest?.reason||'');
 const [actor,setActor]=useState(draft?.actor||DEFAULT_ACTOR);
 const [changeReason,setChangeReason]=useState(draft?.changeReason||'');
 const [error,setError]=useState('');
 const [dirty,setDirty]=useState(false);

 function field(setter,value){setter(value);setDirty(true);setError('');}
 function persist(next){
  if(onSave(next))return true;
  setError('本机存储失败，记录未保存。请导出已定稿记录或清理浏览器存储后重试。');
  return false;
 }
 function saveDraft(){
  const next={originalVersions:record?.originalVersions||{A:item.a,B:item.b},versions:record?.versions||[],draft:{choice,custom,reason,actor,changeReason,baseVersion:latest?.version||0,savedAt:new Date().toISOString()}};
  if(persist(next)){setDirty(false);notify('裁定草稿已保存，可切换案例或刷新后继续。');}
 }
 function requestRevision(){
  const nextDraft={choice:latest.choice,custom:latest.result,reason:latest.reason,actor:DEFAULT_ACTOR,changeReason:'',baseVersion:latest.version,savedAt:new Date().toISOString()};
  if(!persist({...record,draft:nextDraft}))return;
  setChoice(nextDraft.choice);setCustom(nextDraft.custom);setReason(nextDraft.reason);setActor(nextDraft.actor);setChangeReason('');setError('');setDirty(false);setEditing(true);
  notify(`已创建基于 v${latest.version} 的修订草稿，原定稿继续保留。`);
 }
 function cancelRevision(){
  if(!persist({...record,draft:null}))return;
  setEditing(false);setDirty(false);setError('');setChoice(latest.choice);
  notify('已取消本次修订，原定稿保持锁定。');
 }
 function commit(){
  setError('');
  if(!['A','B','custom'].includes(choice)){setError('请先选择认可的版本或重新标注。');return;}
  if(!reason.trim()){setError('请填写裁定理由，帮助学生理解差异。');return;}
  if(!actor.trim()){setError(latest?'请填写修改人。':'请填写裁定人。');return;}
  if(latest&&!changeReason.trim()){setError('请填写修改原因，原定稿将作为历史版本保留。');return;}
  let result=choice==='A'?item.a:choice==='B'?item.b:custom;
  try{result=validateExpression(result);}catch(e){setError(e.message);return;}
  const next=appendDecision(record,{choice,result,reason:reason.trim(),guideVersion:guide.version,guideName:guide.name,decidedAt:new Date().toISOString(),actor:actor.trim(),changeReason:latest?changeReason.trim():null},item);
  if(!persist(next))return;
  setEditing(false);setDirty(false);
  notify(`裁定 v${next.versions.at(-1).version} 已锁定，历史记录已保留。`);
 }

 return <>
  <section className="panel review-source"><h2>{item.title}</h2><p>{item.text}</p></section>
  <div className="compare-grid">{['A','B'].map(c=><section className={'panel compare-version '+(choice===c?'chosen':'')} key={c}>
   <div className="row"><h2>标注者 {c}</h2><span>独立原始版本</span></div>
   <code>{record?.originalVersions?.[c]||item[c.toLowerCase()]}</code>
   <p>版本 {c} 的关系结构</p>
   <button className="button full" disabled={!editing} onClick={()=>field(setChoice,c)}>{choice===c?<><Icon name="check"/>已选择此版本</>:'采用版本 '+c}</button>
  </section>)}</div>
  <section className="panel decision-panel">
   <div className="decision-heading"><h2>{latest&&editing?`修订草稿 · 基于 v${latest.version}`:'裁定记录'}</h2>{latest&&!editing&&<button className="button" onClick={requestRevision}>申请修改</button>}</div>
   {latest&&<><p className="success"><Icon name="check"/>v{latest.version} 已定稿 · 原记录锁定保存</p><VersionRecord version={latest} current/></>}
   {editing&&<div className="decision-form">
    {latest&&<p className="revision-note">本次修改将生成 v{latest.version+1}，请填写修改人和修改原因。</p>}
    <label className="radio-option"><input type="radio" name="decision" checked={choice==='custom'} onChange={()=>field(setChoice,'custom')}/><strong>重新标注关系</strong></label>
    {choice==='custom'&&<label className="field-title">最终表达式<input aria-label="最终表达式" placeholder="例如 S(M(J(p2,p3),p1),p4)" value={custom} onChange={e=>field(setCustom,e.target.value)}/></label>}
    <label className="field-title">裁定理由 <span className="muted">必填</span><textarea aria-label="裁定理由" value={reason} onChange={e=>field(setReason,e.target.value)} placeholder="说明关系类型、方向或嵌套结构的判断依据…" rows="5"/></label>
    <div className="decision-metadata"><label className="field-title">{latest?'修改人':'裁定人'}<input aria-label={latest?'修改人':'裁定人'} value={actor} onChange={e=>field(setActor,e.target.value)}/></label>
     {latest&&<label className="field-title">修改原因 <span className="muted">必填</span><textarea aria-label="修改原因" value={changeReason} onChange={e=>field(setChangeReason,e.target.value)} placeholder="说明为什么需要修订本次定稿…" rows="3"/></label>}
    </div>
    <p className="draft-status" role="status">{dirty?'有未保存的修改，切换前请保存草稿':draft?`草稿已保存 · ${formatTime(draft.savedAt)}`:'可先保存草稿，再继续填写或锁定结果'}</p>
    <div className="row decision-actions"><div className="row">{latest&&<button className="text-button" onClick={cancelRevision}>取消修订</button>}<button className="button" onClick={saveDraft}><Icon name="save"/>保存裁定草稿</button></div><button className="button primary" onClick={commit}><Icon name="check"/>{latest?'提交修订并锁定':'确认裁定并定稿'}</button></div>
   </div>}
   {error&&<p className="error" role="alert">{error}</p>}
   {latest&&<details className="version-history"><summary>版本历史 · 共 {record.versions.length} 个定稿版本</summary>{record.versions.map(v=><VersionRecord key={v.version} version={v}/>)}</details>}
   {latest&&!editing&&<details><summary>展开教学解释</summary><p>{item.explanation}</p></details>}
  </section>
 </>;
}

export default function Review({teacher,guide,notify}){
 const [index,setIndex]=useState(0);
 const [records,setRecords]=useState(()=>loadReviewRecords(localStorage));
 const item=REVIEW_ITEMS[index];
 const finished=REVIEW_ITEMS.every(x=>records[x.id]?.versions.length);
 function save(record){
  try{setRecords(saveReviewRecord(localStorage,records,item.id,record));return true;}catch{return false;}
 }
 function exportRecords(){
  const decisions=Object.fromEntries(Object.entries(records).filter(([,r])=>r.versions.length).map(([id,r])=>[id,{originalVersions:r.originalVersions,versions:r.versions}]));
  downloadJSON({schemaVersion:2,decisions},'关系裁定结果.json');
 }
 return <>
  <div className="page-heading"><div><h1>关系裁定</h1><p>对照原文，比较独立标注，解释最终选择。</p></div><button className="button" disabled={!teacher||!finished} onClick={exportRecords}><Icon name="download"/>导出裁定记录与历史</button></div>
  <p className="muted">固定教学演示案例 · p1至p6对应指南示例中的六个命题 · 共2处待复核关系</p>
  {!teacher?<div className="empty page-empty"><Icon name="scale" size={40}/><h2>教师与裁定者工作区</h2><p>请在右上角切换演示角色。学生在提交后通过“学习反馈”查看自己的差异。</p></div>:<div className="review-layout">
   <aside className="panel review-index"><h2>复核清单</h2>{REVIEW_ITEMS.map((x,n)=>{
    const record=records[x.id];const latest=record?.versions.at(-1);
    return <button className={index===n?'active':''} key={x.id} onClick={()=>setIndex(n)}><span>0{n+1}</span><div><strong>{x.title}</strong><small>{latest?`v${latest.version} 已定稿${record.draft?' · 修订草稿':''}`:record?.draft?'草稿已保存':'待裁定'}</small></div>{latest&&<Icon name="check"/>}</button>;
   })}<p>原始版本与每次定稿均保留。申请修改后创建修订草稿，填写依据再锁定新版本。</p></aside>
   <div><DecisionCase key={item.id} item={item} record={records[item.id]} guide={guide} onSave={save} notify={notify}/></div>
  </div>}
 </>;
}
