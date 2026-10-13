import {REVIEW_ITEMS} from './data.js';

export const REVIEW_STORAGE_KEY='argument-review-v2';

export function loadReviewRecords(storage){
 try{
  const current=JSON.parse(storage.getItem(REVIEW_STORAGE_KEY));
  if(current?.schemaVersion===2&&current.decisions&&typeof current.decisions==='object'){
   return Object.fromEntries(REVIEW_ITEMS.filter(item=>Array.isArray(current.decisions[item.id]?.versions)).map(item=>[item.id,current.decisions[item.id]]));
  }
  const legacy=JSON.parse(storage.getItem('argument-review-v1'))||{};
  return Object.fromEntries(REVIEW_ITEMS.filter(item=>typeof legacy[item.id]?.result==='string'&&typeof legacy[item.id]?.reason==='string').map(item=>[item.id,{
   originalVersions:{A:item.a,B:item.b},
   versions:[{...legacy[item.id],version:1,supersedesVersion:null,changeReason:null}],
   draft:null,
  }]));
 }catch{return {};}
}

export function saveReviewRecord(storage,records,id,record){
 const next={...records,[id]:record};
 storage.setItem(REVIEW_STORAGE_KEY,JSON.stringify({schemaVersion:2,decisions:next}));
 return next;
}

export function appendDecision(record,decision,item){
 const versions=record?.versions||[];
 const previous=versions.at(-1);
 return {
  originalVersions:record?.originalVersions||{A:item.a,B:item.b},
  versions:[...versions,{...decision,version:(previous?.version||0)+1,supersedesVersion:previous?.version||null,status:'final'}],
  draft:null,
 };
}
