import {useState,useEffect} from 'react';
import {freshAttempt,validateGuide,CASE_TEXT,checkRelation} from './data';
const KEY='argument-learning-v1';
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));if(x?.schemaVersion===1&&!validateGuide(x.guide)&&Array.isArray(x.props)&&Array.isArray(x.rels)&&x.props.every(p=>Number.isInteger(p.start)&&Number.isInteger(p.end)&&p.start>=0&&p.end<=CASE_TEXT.length&&p.start<p.end&&typeof p.id==='string'&&typeof p.label==='string')&&x.rels.every(r=>Array.isArray(r.sources)&&!checkRelation(r,x.props,x.rels.filter(q=>q.id!==r.id))))return x;}catch{}return freshAttempt();}
export function useWorkspace(){
 const [history,setHistory]=useState(()=>({past:[],present:load(),future:[]}));
 const [storageError,setStorageError]=useState(false);
 useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(history.present));setStorageError(false);}catch{setStorageError(true);}},[history.present]);
 function change(fn){setHistory(h=>({past:[...h.past,h.present].slice(-30),present:fn(h.present),future:[]}));}
 function undo(){setHistory(h=>h.past.length?{past:h.past.slice(0,-1),present:h.past.at(-1),future:[h.present,...h.future]}:h);}
 function redo(){setHistory(h=>h.future.length?{past:[...h.past,h.present],present:h.future[0],future:h.future.slice(1)}:h);}
 function replace(x){setHistory({past:[],present:x,future:[]});}
 return {state:history.present,change,undo,redo,replace,canUndo:history.past.length>0,canRedo:history.future.length>0,storageError};
}
