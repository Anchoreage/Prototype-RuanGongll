import React from 'react';

export default function GuideLearning({guide}){
 return <section className="panel guide-learning" aria-label="第一阶段指南学习">
  <div className="training-heading"><div><h2>先认识命题，再理解关系</h2><p>当前指南 {guide.version} · 阅读下面的定义与示例，确认理解后开始试标。</p></div><span className="training-badge">第 1 阶段 · 训练</span></div>
  <div className="training-content">
   <section aria-labelledby="training-tags-heading"><h3 id="training-tags-heading">四类命题</h3><div className="training-tags">{guide.tags.map(tag=><article key={tag.code} className="training-tag">
    <div className="training-tag-heading"><span className={'tag type-'+tag.code}>{tag.code}</span><h4>{tag.name}</h4></div>
    <p>{tag.description}</p>{tag.example&&<p className="training-example"><span>示例</span>{tag.example}</p>}
   </article>)}</div></section>
   <section aria-labelledby="training-relations-heading"><h3 id="training-relations-heading">五种关系</h3><ul className="training-relations">{guide.relations.map(relation=><li key={relation.code}>
    <span className="training-relation-code">{relation.code}</span><div><strong>{relation.name}</strong><p>{relation.description}</p></div>
   </li>)}</ul><p className="training-rule">命题标注与关系构建在下一阶段开放。多个前提共同成立时，先建立组合，再连接匹配或支持关系。</p></section>
  </div>
 </section>;
}
