import { buildPlan, facilitate, reflect, exportMarkdown, knowledge, bands, goals, materials, accessOptions, situations, reflectionOptions } from './planner.js';
const $ = id => document.getElementById(id);
const element = (tag, text, className) => { const node=document.createElement(tag); if(text) node.textContent=text; if(className) node.className=className; return node; };
function selectField(parent,id,label,values,selected) {
  const wrapper=element('label',label), select=element('select'); select.id=id; select.name=id;
  for (const [value,text] of Object.entries(values)) { const item=element('option',text); item.value=value; select.append(item); }
  select.value=selected; wrapper.append(select); $(parent).append(wrapper); return select;
}
selectField('plan-fields','band','Age band',Object.fromEntries(Object.entries(bands).map(([k,v])=>[k,v.label])),'littles');
selectField('plan-fields','duration','Session minutes',{},'');
selectField('plan-fields','goal','New musical focus',Object.fromEntries(Object.entries(goals).map(([k,v])=>[k,v.label])),'rhythm');
selectField('plan-fields','review','Familiar review focus',Object.fromEntries(Object.entries(goals).map(([k,v])=>[k,v.label])),'rhythm');
selectField('plan-fields','material','Available materials',Object.fromEntries(Object.entries(materials).map(([k,v])=>[k,v.label])),'body');
selectField('plan-fields','group','Group format',{solo:'One-to-one',small:'Small group',class:'Class / ensemble'},'solo');
const defaultAccess={sound:'comfortable',language:'short',response:'flexible',notation:'sound',movement:'choice',theme:'music',visuals:'calm'};
for (const [key,d] of Object.entries(accessOptions)) selectField('access-fields',key,d.label,d.values,defaultAccess[key]);
selectField('situation-field','situation','Observed situation',Object.fromEntries(Object.entries(situations).map(([k,v])=>[k,v.label])),'ready');
for (const [key,d] of Object.entries(reflectionOptions)) selectField('reflection-fields',`reflection-${key}`,d.label,d.values,key==='next'?'pulse':'notObserved');
function durations() {
  $('duration').replaceChildren(...Object.keys(bands[$('band').value].timings).map(value=>{const o=element('option',`${value} minutes`);o.value=value;return o;}));
  $('duration').value=$('band').value==='littles'?'15':'25';
}
durations(); $('band').addEventListener('change',durations);
let plan, reflection=null;
function input() { return Object.fromEntries(['band','duration','goal','review','material','group'].map(key=>[key,$(key).value]).concat([['access',Object.fromEntries(Object.keys(accessOptions).map(key=>[key,$(key).value]))]])); }
function status(message,error=false) { $('status').textContent=message;$('status').className=error?'error':''; }
function printDocument() { $('print-document').textContent=exportMarkdown(plan,reflection); }
function render() {
  const container=$('session'); container.replaceChildren(); $('preview-title').textContent=plan.title;
  container.append(element('p',`${bands[plan.input.band].label} / ${plan.input.duration} min / ${materials[plan.input.material].label}`,'meta'));
  container.append(element('p',plan.materials),element('p',plan.groupNote),element('p',plan.balance,'meta'),element('p',plan.breakNote,'meta'));
  for (const part of plan.sections) { const article=element('article',null,'part');article.append(element('h3',`${part.name} · ${part.minutes} min`),element('p',part.instruction),element('p',`Say: “${part.phrase}”`,'phrase'));container.append(article); }
  container.append(element('h3','Access choices'));const list=element('ul',null,'access-list');
  for (const a of plan.adaptations) list.append(element('li',`${a.label} · ${a.choice}: ${a.instruction}`));container.append(list);
  container.append(element('h3','Look for musical evidence'),element('p',`${plan.evidence} Observation prompt only; no result is inferred.`),element('h3','Off-screen finish'),element('p',plan.extension));
  if(reflection) { const r=reflect(reflection);container.append(element('h3','After teaching'));for(const [key,value]of Object.entries(r))container.append(element('p',`${reflectionOptions[key].label}: ${value}`,'meta')); }
  printDocument();
}
function build(event) { event?.preventDefault();try {plan=buildPlan(input());reflection=null;$('reflection-form').reset();$('reflection-result').replaceChildren();render();status('Session draft updated. Review it before teaching.');}catch(error){status(error.message,true);} }
$('plan-form').addEventListener('submit',build);
$('adapt-form').addEventListener('submit',event=>{event.preventDefault();try{plan=buildPlan({...plan.input,access:input().access});render();status('Access choices applied to the current session draft.');}catch(error){status(error.message,true);}});
function move() {const m=facilitate($('situation').value),panel=$('move');panel.className=`move${m.handoff?' handoff':''}`;panel.replaceChildren(element('strong',`“${m.phrase}”`),element('p',m.fallback),element('p',m.stop,'stop'));}
$('situation').addEventListener('change',move); move();
$('reflection-form').addEventListener('submit',event=>{event.preventDefault();try{const values=Object.fromEntries(Object.keys(reflectionOptions).map(key=>[key,$(`reflection-${key}`).value]));reflect(values);reflection=values;render();$('reflection-result').textContent='Reflection added. It will be included in your next export.';status('Reflection added to the current session draft.');}catch(error){status(error.message,true);}});
document.querySelectorAll('[data-job]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.job').forEach(panel=>{panel.hidden=panel.id!==button.dataset.job;});document.querySelectorAll('[data-job]').forEach(tab=>tab.removeAttribute('aria-current'));button.setAttribute('aria-current','page');}));
$('download').addEventListener('click',()=>{ const blob=new Blob([exportMarkdown(plan,reflection)],{type:'text/markdown;charset=utf-8'}), url=URL.createObjectURL(blob), link=element('a');link.href=url;link.download='EEC-session-plan.md';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Session plan downloaded. Keep exports free of learner details.'); });
$('print').addEventListener('click',()=>{printDocument();window.print();});
$('reset').addEventListener('click',()=>{ $('plan-form').reset();$('adapt-form').reset();$('reflection-form').reset();$('situation').value='ready';durations();build();move();status('Work cleared. Default session draft restored.');document.querySelector('[data-job="plan"]').click();});
$('content-version').textContent=`${knowledge.version} · ${knowledge.reviewStatus}. Activities and adaptations are source-derived drafts, not tested access claims.`;
for(const source of knowledge.sources){const item=element('li'),link=element('a',source.title);link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';item.append(link,document.createTextNode(` — ${source.section}`));$('sources').append(item);}
window.addEventListener('beforeprint',printDocument);build();
