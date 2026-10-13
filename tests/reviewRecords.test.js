import test from 'node:test';
import assert from 'node:assert/strict';
import {REVIEW_ITEMS} from '../src/data.js';
import {loadReviewRecords,saveReviewRecord,appendDecision,REVIEW_STORAGE_KEY} from '../src/reviewRecords.js';
import {validateExpression} from '../src/relationExpression.js';

function memoryStorage(initial={}){
 const data=new Map(Object.entries(initial));
 return {getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
}
const first={choice:'B',result:'S(M(J(p2,p3),p1),p4)',reason:'共同前提对应一般规范。',actor:'教师 A',guideVersion:'v1.1',decidedAt:'2026-10-12T08:00:00Z'};

test('old locked decisions remain intact after migration, draft save and revision',()=>{
 const legacy=JSON.stringify({c1:{...first,status:'final'}});
 const storage=memoryStorage({'argument-review-v1':legacy});
 let records=loadReviewRecords(storage);
 const original=structuredClone(records.c1.versions[0]);
 records=saveReviewRecord(storage,records,'c1',{...records.c1,draft:{choice:'custom',custom:'S(p3,p4)',reason:'修订理由',actor:'教师 B',changeReason:'专家复核',baseVersion:1}});
 records=loadReviewRecords(storage);
 assert.equal(records.c1.draft.reason,'修订理由');
 assert.deepEqual(records.c1.versions[0],original);
 const revised=appendDecision(records.c1,{...first,choice:'custom',result:'S(p3,p4)',reason:'修订理由',actor:'教师 B',changeReason:'专家复核',decidedAt:'2026-10-12T09:00:00Z'},REVIEW_ITEMS[0]);
 saveReviewRecord(storage,records,'c1',revised);
 const reloaded=loadReviewRecords(storage);
 assert.deepEqual(reloaded.c1.versions[0],original);
 assert.equal(reloaded.c1.versions.length,2);
 assert.equal(reloaded.c1.versions[1].supersedesVersion,1);
 assert.equal(reloaded.c1.versions[1].version,2);
 assert.equal(reloaded.c1.draft,null);
 assert.deepEqual(reloaded.c1.originalVersions,{A:REVIEW_ITEMS[0].a,B:REVIEW_ITEMS[0].b});
 assert.equal(storage.getItem('argument-review-v1'),legacy);
});

test('drafts for separate cases round-trip without changing final versions',()=>{
 const storage=memoryStorage();
 let records=saveReviewRecord(storage,{},'c1',{versions:[],draft:{reason:'长理由'.repeat(500)}});
 records=saveReviewRecord(storage,records,'c2',{versions:[],draft:{reason:'第二个案例'}});
 const reloaded=loadReviewRecords(storage);
 assert.equal(reloaded.c1.draft.reason.length,1500);
 assert.equal(reloaded.c2.draft.reason,'第二个案例');
 assert.equal(reloaded.c1.versions.length,0);
 assert.equal(JSON.parse(storage.getItem(REVIEW_STORAGE_KEY)).schemaVersion,2);
});

test('storage failure does not mutate the existing record or history',()=>{
 const records={c1:appendDecision(null,first,REVIEW_ITEMS[0])};
 const before=structuredClone(records);
 const revised=appendDecision(records.c1,{...first,reason:'新的理由'},REVIEW_ITEMS[0]);
 const failing={setItem(){throw Error('QuotaExceededError');}};
 assert.throws(()=>saveReviewRecord(failing,records,'c1',revised),/QuotaExceededError/);
 assert.deepEqual(records,before);
});

test('malformed saved data cannot crash the review screen loader',()=>{
 assert.deepEqual(loadReviewRecords(memoryStorage({[REVIEW_STORAGE_KEY]:'{bad json'})),{});
 assert.deepEqual(loadReviewRecords(memoryStorage({[REVIEW_STORAGE_KEY]:JSON.stringify({schemaVersion:2,decisions:{c1:null}})})),{});
});

test('revised expressions validate nested structure and reject invalid endpoints',()=>{
 assert.equal(validateExpression('S(M(J(p2, p3), p1), p4)'),'S(M(J(p2,p3),p1),p4)');
 assert.throws(()=>validateExpression('S(p1,p7)'),/命题编号不存在/);
 assert.throws(()=>validateExpression('M(p1,p2)'),/一般规范或一般事实/);
 assert.throws(()=>validateExpression('S(p1,p1)'),/不同于起点/);
});
