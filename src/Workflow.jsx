import React,{useState} from 'react';
import {FLOW_STAGES,REVIEW_CHECKS,freshAttempt,emptyReviewChecks,reviewComplete} from './data';
import Icon from './Icon';

export default function Workflow({workspace,onGuide,onSubmit,resetSelection,notify}){
 const {state,change,replace}=workspace;
 const [understood,setUnderstood]=useState(false);
 const stage=state.stage;
 const current=FLOW_STAGES.findIndex(x=>x.code===stage);

 function beginTrial(){
  if(!understood)return;
  replace({...freshAttempt(false,state.guide),mode:'trial',stage:'trial',trainingConfirmedAt:new Date().toISOString()});
  resetSelection();
  notify('开始独立试标。试标结果会单独保留，不计入正式标注。');
 }
 function beginAnnotation(){
  if(!state.props.length){notify('请至少完成一个试标命题，再开始正式标注。');return;}
  const trialResult={props:state.props,rels:state.rels,guideVersion:state.guide.version,startedAt:state.startedAt,completedAt:new Date().toISOString()};
  replace({...freshAttempt(false,state.guide),stage:'annotation',trainingConfirmedAt:state.trainingConfirmedAt,trialResult});
  resetSelection();
  notify('试标结果已保留。正式标注从空白开始，请独立完成命题和关系。');
 }
 function beginRevision(){
  if(!state.props.length){notify('请至少创建一个命题，再进入复核修订。');return;}
  change(s=>({...s,stage:'revision',reviewChecks:emptyReviewChecks()}));
  notify('请逐项检查标注。仍可修改命题和关系，修改后需要重新确认。');
 }

 return <>
  <ol className="journey workflow-journey" aria-label="四阶段标注流程">
   {FLOW_STAGES.map((s,i)=><li key={s.code} className={(stage===s.code?'current ':'')+(i<current||state.submitted?'complete':'')} aria-current={stage===s.code?'step':undefined}>
    <span className="stage-number">{i<current||state.submitted?<Icon name="check" size={15}/>:i+1}</span>
    <div><strong>{s.name}</strong><small>{s.task}</small></div>
   </li>)}
  </ol>
  <section className="stage-panel" aria-label="当前阶段">
   {state.submitted?<><div><h2>复核完成 · 已提交</h2><p>本次标注已锁定，可回看原文与论证图，或在学习反馈中查看差异。</p></div></>:<>
    {stage==='training'&&<><div><h2>第 1 阶段 · 训练与指南学习</h2><p>先学习命题类型、关系方向和嵌套规则，再进入独立试标。</p><label className="stage-confirm"><input type="checkbox" checked={understood} onChange={e=>setUnderstood(e.target.checked)}/>我已阅读并理解当前指南 {state.guide.version}</label></div><div className="stage-actions"><button className="button" onClick={onGuide}>阅读标注指南</button><button className="button primary" disabled={!understood} onClick={beginTrial}>开始试标<Icon name="arrow"/></button></div></>}
    {stage==='trial'&&<><div><h2>第 2 阶段 · 试标</h2><p>使用下方工具独立试标，发现边界、标签或关系中的疑问。试标结果会单独保留。</p><small>当前指南 {state.guide.version} · 至少完成一个命题后可继续</small></div><button className="button primary" disabled={!state.props.length} onClick={beginAnnotation}>完成试标，开始正式标注<Icon name="arrow"/></button></>}
    {stage==='annotation'&&<><div><h2>第 3 阶段 · 正式标注</h2><p>依据当前指南独立完成标注，使用学习助手切换命题与关系操作。</p>{state.trialResult&&<small>已保留试标：{state.trialResult.props.length} 个命题、{state.trialResult.rels.length} 个关系 · 正式标注不继承试标结果</small>}</div><button className="button primary" disabled={!state.props.length} onClick={beginRevision}>进入复核修订<Icon name="arrow"/></button></>}
    {stage==='revision'&&<div className="revision-stage"><div className="stage-intro"><div><h2>第 4 阶段 · 复核修订</h2><p>对照原文与论证图逐项检查。可直接修改下方标注，修改后复核确认会重置。</p></div><button className="button primary" disabled={!reviewComplete(state)} onClick={onSubmit}><Icon name="send"/>提交练习</button></div><div className="review-checks">{REVIEW_CHECKS.map(check=><label key={check.code}><input type="checkbox" checked={state.reviewChecks?.[check.code]===true} onChange={e=>{const checked=e.target.checked;change(s=>({...s,reviewChecks:{...s.reviewChecks,[check.code]:checked}}));}}/><div><strong>{check.name}</strong><span>{check.description}</span></div></label>)}</div></div>}
   </>}
  </section>
 </>;
}
