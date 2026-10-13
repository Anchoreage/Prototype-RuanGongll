import {useState,useEffect} from 'react';
import {freshAttempt,validateGuide,CASE_TEXT,checkRelation,FLOW_STAGES,emptyReviewChecks} from './data';
const KEY='argument-learning-v1';
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));if(x?.schemaVersion===1&&!validateGuide(x.guide)&&Array.isArray(x.props)&&Array.isArray(x.rels)&&x.props.every(p=>Number.isInteger(p.start)&&Number.isInteger(p.end)&&p.start>=0&&p.end<=CASE_TEXT.length&&p.start<p.end&&typeof p.id==='string'&&typeof p.label==='string')&&x.rels.every(r=>Array.isArray(r.sources)&&!checkRelation(r,x.props,x.rels.filter(q=>q.id!==r.id))))return {...x,stage:FLOW_STAGES.some(s=>s.code===x.stage)?x.stage:x.submitted?'revision':x.mode==='guided'?'training':'annotation',reviewChecks:x.reviewChecks||emptyReviewChecks()};}catch{}return null;}
function invalidateReview(previous,next){return next.stage==='revision'&&(previous.props!==next.props||previous.rels!==next.rels)?{...next,reviewChecks:emptyReviewChecks(),reviewConfirmedAt:null}:next;}
export function useWorkspace(){
 const [history,setHistory]=useState(()=>{const saved=load();return {past:[],present:saved||freshAttempt(),future:[],restored:Boolean(saved)};});
 const [storageError,setStorageError]=useState(false);
 useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(history.present));setStorageError(false);}catch{setStorageError(true);}},[history.present]);
 function change(fn){setHistory(h=>({...h,past:[...h.past,h.present].slice(-30),present:invalidateReview(h.present,fn(h.present)),future:[]}));}
 function undo(){setHistory(h=>h.past.length?{...h,past:h.past.slice(0,-1),present:invalidateReview(h.present,h.past.at(-1)),future:[h.present,...h.future]}:h);}
 function redo(){setHistory(h=>h.future.length?{...h,past:[...h.past,h.present],present:invalidateReview(h.present,h.future[0]),future:h.future.slice(1)}:h);}
 function replace(x){setHistory({past:[],present:x,future:[],restored:false});}
 return {state:history.present,restored:history.restored,change,undo,redo,replace,canUndo:history.past.length>0,canRedo:history.future.length>0,storageError};
}
