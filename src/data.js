export const TAGS = [
  { code: 'SF', name: '个别事实判断', description: '关于本案具体对象、行为或证据的事实判断。', example: '原告已依约提供劳务。' },
  { code: 'GF', name: '一般事实判断', description: '经验法则、常识或科学规律等一般性事实判断。', example: '通常情况下，转账记录可反映资金往来。' },
  { code: 'SM', name: '个别规范判断', description: '对本案作出的法律评价，包括法律关系和裁判结论。', example: '被告应向原告支付该11000元。' },
  { code: 'GM', name: '一般规范判断', description: '可以适用于不特定案件的一般规范依据。', example: '当事人应当按照约定全面履行自己的义务。' },
];
export const SUBTYPES = [{code:'GM-L',name:'法律条文'},{code:'GM-I',name:'法律解释'},{code:'GM-U',name:'习惯与行业惯例'},{code:'GM-M',name:'道德与价值观念'},{code:'GM-O',name:'其他规范判断'},{code:'SM-C',name:'合同及合同解释'}];
export const RELATIONS = [
 {code:'S',name:'支持',description:'起点为终点的成立提供理由。',symbol:'●',example:'S(p5, p6)'},
 {code:'A',name:'反对',description:'起点为目标命题或支持关系的不成立提供理由。',symbol:'○',example:'A(p3, S(p1, p2))'},
 {code:'J',name:'组合',description:'至少两个对象缺一不可地共同成立；没有方向。',symbol:'⊕',example:'J(p2, p3)'},
 {code:'M',name:'匹配',description:'个别判断对应一般判断的构成要件；方向为个别到一般。',symbol:'⊕',example:'M(J(p2, p3), p1)'},
 {code:'I',name:'同一',description:'至少两个命题在语义上表达同一判断；没有方向。',symbol:'/',example:'I(p1, p2)'},
];
export const DEFAULT_GUIDE = {name:'中文裁判文书法律论证标注指南',version:'v1.1',tags:TAGS,subtypes:SUBTYPES,relations:RELATIONS,sourceName:'课程提供的标注与图示指南',sourceText:'',importedAt:null};
export const SENTENCES = [
 '当事人应当按照约定全面履行自己的义务。',
 '本案中，原、被告之间系劳务合同关系，',
 '原告已依约提供劳务，',
 '被告应按照原、被告之间的约定给付劳务报酬。',
 '根据原告提交的欠条、微信转账记录可以认定，',
 '被告尚欠原告劳务报酬11000元。',
];
export const CASE_TEXT = SENTENCES[0]+'\n\n'+SENTENCES.slice(1,4).join('')+'\n\n'+SENTENCES.slice(4).join('');
export const STANDARD_PROPS = SENTENCES.map((text,i)=>({id:'std-p'+(i+1),start:CASE_TEXT.indexOf(text),end:CASE_TEXT.indexOf(text)+text.length,label:['GM-L','SM','SF','SM','SF','SF'][i]}));
export const STANDARD_RELS = [
 {id:'std-r1',type:'J',sources:['std-p2','std-p3'],target:null},
 {id:'std-r2',type:'M',sources:['std-r1'],target:'std-p1'},
 {id:'std-r3',type:'S',sources:['std-r2'],target:'std-p4'},
 {id:'std-r4',type:'S',sources:['std-p5'],target:'std-p6'},
];
export const REVIEW_ITEMS = [
 {id:'c1',title:'组合结构是否完整',text:'本案中，原、被告之间系劳务合同关系，原告已依约提供劳务，被告应按照约定给付劳务报酬。',a:'S(p3, p4)',b:'S(M(J(p2, p3), p1), p4)',suggestion:'B',explanation:'合同法律关系与已经履行劳务须共同对应履行义务规范；单独的事实命题没有表达完整的规范适用结构。'},
 {id:'c2',title:'支持关系的方向',text:'根据原告提交的欠条、微信转账记录可以认定，被告尚欠原告劳务报酬11000元。',a:'S(p5, p6)',b:'S(p6, p5)',suggestion:'A',explanation:'欠条及转账记录是认定欠款事实的理由，方向应从证据判断 p5 指向欠款判断 p6。'},
];
export const FLOW_STAGES = [
 {code:'training',name:'训练',task:'指南学习'},
 {code:'trial',name:'试标',task:'命题与关系试标'},
 {code:'annotation',name:'正式标注',task:'命题标注与关系构建'},
 {code:'revision',name:'复核修订',task:'检查并修改标注'},
];
export const REVIEW_CHECKS = [
 {code:'boundaries',name:'命题边界',description:'已对照原文检查命题范围与完整性'},
 {code:'labels',name:'标签类型',description:'已依据当前指南检查标签及子类型'},
 {code:'relations',name:'关系结构',description:'已检查关系方向、端点及嵌套结构'},
];
export function emptyReviewChecks(){return Object.fromEntries(REVIEW_CHECKS.map(x=>[x.code,false]));}
export function reviewComplete(state){return state.stage==='revision'&&REVIEW_CHECKS.every(x=>state.reviewChecks?.[x.code]===true);}
export function freshAttempt(guided=true,guide=DEFAULT_GUIDE){return {schemaVersion:1,guide,props:guided?STANDARD_PROPS.slice(0,3):[],rels:guided?STANDARD_RELS.slice(0,2):[],mode:guided?'guided':'independent',stage:'training',trainingConfirmedAt:null,trialResult:null,reviewChecks:emptyReviewChecks(),reviewConfirmedAt:null,submitted:false,submittedAt:null,startedAt:Date.now(),elapsedSeconds:null};}
export function numbering(props,rels){const map={};[...props].sort((a,b)=>a.start-b.start).forEach((p,i)=>map[p.id]='p'+(i+1));rels.forEach((r,i)=>map[r.id]='r'+(i+1));return map;}
export function expression(id,props,rels,seen=new Set()) {const nums=numbering(props,rels);if(seen.has(id)) return '[循环]';const r=rels.find(x=>x.id===id);if(!r)return nums[id]||'[已删除]';const next=new Set(seen).add(id);const args=r.sources.map(x=>expression(x,props,rels,next));if(r.target)args.push(expression(r.target,props,rels,next));return `${r.type}(${args.join(', ')})`;}
export function checkRelation(r,props,rels){
 const all=[...props,...rels]; const exists=id=>all.some(x=>x.id===id);const directed=['S','A','M'].includes(r.type);
 if(!RELATIONS.some(x=>x.code===r.type))return '请选择有效的关系类型。';
 if(!r.sources.length||r.sources.some(x=>!exists(x)))return '请选择有效的起点或成员。';
 if(new Set(r.sources).size!==r.sources.length)return '关系成员不能重复。';
 if(directed&&r.sources.length!==1)return '有向关系须选择一个起点；多个前提请先建立组合 J。';
 if(directed&&(!exists(r.target)||r.sources.includes(r.target)))return '请选择不同于起点的有效终点。';
 if(!directed&&r.sources.length<2)return '组合或同一关系至少需要两个成员。';
 if(r.type==='S'&&!props.some(p=>p.id===r.target))return '支持关系的终点须为命题。';
 if(r.type==='A'&&rels.some(x=>x.id===r.target&&x.type!=='S'))return '反对关系只能指向命题或已有支持关系。';
 if(r.type==='I'&&r.sources.some(x=>!props.some(p=>p.id===x)))return '同一关系只能连接命题。';
 if(r.type==='M') {const source=props.find(p=>p.id===r.sources[0]);const target=props.find(p=>p.id===r.target);const sr=rels.find(x=>x.id===r.sources[0]);if(!target||!['GM','GF'].some(x=>target.label.startsWith(x)))return '匹配的终点须为一般规范或一般事实判断。';if(source&&!['SM','SF'].some(x=>source.label.startsWith(x)))return '匹配的起点须为个别判断。';if(sr&&(sr.type!=='J'||sr.sources.some(id=>!props.some(p=>p.id===id&&['SM','SF'].some(x=>p.label.startsWith(x))))))return '匹配的组合起点须由个别判断组成。';}
 return null;
}
export function validateGuide(g){
 if(!g||typeof g!=='object'||Array.isArray(g))return '指南必须是 JSON 对象。';
 if(typeof g.name!=='string'||!g.name.trim()||typeof g.version!=='string'||!g.version.trim())return '指南须包含名称 name 和版本 version。';
 for(const [key,required] of [['tags',['SF','GF','SM','GM']],['relations',['S','A','J','M','I']]]){if(!Array.isArray(g[key]))return `缺少 ${key} 列表。`;const codes=g[key].map(x=>x?.code);if(new Set(codes).size!==codes.length)return `${key} 中的代码重复。`;if(required.some(x=>!codes.includes(x)))return `${key} 必须包含 ${required.join('、')}。`;if(g[key].some(x=>typeof x.name!=='string'||!x.name.trim()||typeof x.description!=='string'||!x.description.trim()))return `${key} 每个条目须有名称和定义。`;if(codes.some(x=>!required.includes(x)))return `${key} 包含原型尚未支持的代码。`;}
 if(g.subtypes&&!Array.isArray(g.subtypes))return 'subtypes 须为数组。';
 if(g.subtypes?.some(x=>!SUBTYPES.some(s=>s.code===x.code)||typeof x.name!=='string'||!x.name.trim()))return '子类型代码或名称无效。';
 if(g.subtypes&&new Set(g.subtypes.map(x=>x.code)).size!==g.subtypes.length)return '子类型代码重复。';
 return null;
}
export function feedback(state){
 const expected=STANDARD_PROPS.map((p,i)=>{const exact=state.props.find(x=>x.start===p.start&&x.end===p.end);const overlap=state.props.find(x=>x.start<p.end&&x.end>p.start);return {id:'p'+(i+1),text:CASE_TEXT.slice(p.start,p.end),expected:p.label,actual:exact?.label||overlap?.label||'未标注',status:!exact?(overlap?'边界不同':'缺少命题'):exact.label===p.label?'正确':'标签不同',hint:['这是适用于不特定案件的履行义务规范，应选 GM-L。','劳务合同关系是本案的法律定性，应选 SM。','已经提供劳务描述本案事实，应选 SF。','给付义务是个案法律评价，应选 SM。','证据判断为欠款认定提供事实理由，应选 SF。','欠款金额是本案具体事实，应选 SF。'][i]};});
 const propCanonical=id=>{const p=state.props.find(x=>x.id===id);if(p)return `${p.start}:${p.end}`;return null;};
 function canonical(id,props,rels){const p=props.find(x=>x.id===id);if(p)return `${p.start}:${p.end}`;const r=rels.find(x=>x.id===id);if(!r)return '?';const members=r.sources.map(x=>canonical(x,props,rels));if(['J','I'].includes(r.type))members.sort();if(r.target)members.push(canonical(r.target,props,rels));return `${r.type}(${members.join(',')})`;}
 const expectedR=STANDARD_RELS.map(r=>{const key=canonical(r.id,STANDARD_PROPS,STANDARD_RELS);return {id:r.id,expected:expression(r.id,STANDARD_PROPS,STANDARD_RELS),correct:state.rels.some(x=>canonical(x.id,state.props,state.rels)===key)};});
 const extras=state.props.filter(p=>!STANDARD_PROPS.some(s=>s.start===p.start&&s.end===p.end)).length;
 const extraR=state.rels.filter(r=>!STANDARD_RELS.some(s=>canonical(s.id,STANDARD_PROPS,STANDARD_RELS)===canonical(r.id,state.props,state.rels))).length;
 return {expected,expectedR,extras,extraR,propCorrect:expected.filter(x=>x.status==='正确').length,relCorrect:expectedR.filter(x=>x.correct).length};
}
