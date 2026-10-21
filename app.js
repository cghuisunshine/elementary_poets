(() => {
'use strict';
const $ = id => document.getElementById(id);
const names = ['一','二','三','四','五','六'];
const subtitles = ['从一声鹅鸣开始','在山水间，发现新天地','把四季，读成一首诗','山川有情，诗中有志','明月照见，故园与远方','带着六年的诗意，向前走'];
let learned = new Set();
try { const saved = JSON.parse(localStorage.getItem('xiaoxue-shici-read-v1') || '[]'); if (Array.isArray(saved)) learned = new Set(saved.filter(id => POEMS.some(p=>p.id===id))); } catch {}
let grade = Math.min(6, Math.max(1, Number((location.hash.match(/^#grade-([1-6])$/)||[])[1])||1));
let term = 'all', query = '', onlyLearned = false, current = null, reciting = false, readerList = [], visibleList = [];
let view = 'grid', flashId = null, flashIndex = 0, flashRevealed = false;
try { if(localStorage.getItem('xiaoxue-shici-view-v1')==='flashcards') view='flashcards'; } catch {}
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shortTitle = p => p.title.replace(/（(?!节选)[^）]*）/g,'');
const gradeName = g => names[g-1]+'年级';
const studies = window.POEM_STUDIES || {};
function wordList(words){return `<dl class="study-words">${words.map(g=>`<div><dt>${esc(g.word)}</dt><dd>${esc(g.meaning)}</dd></div>`).join('')}</dl>`;}
function annotateClause(text,terms){
 let at=0,html='',used=[];
 while(at<text.length){
  const found=terms.find(g=>text.startsWith(g.word,at));
  if(found){html+=`<span class="study-token" title="${esc(found.meaning)}">${esc(found.word)}</span>`;if(!used.includes(found))used.push(found);at+=found.word.length;}
  else{html+=esc(text[at]);at++;}
 }
 return {html,used};
}
function studyMarkup(p){
 const data=studies[p.id];
 if(!data)return '<p class="study-message">讲解暂未载入，请刷新页面后重试。</p>';
 const terms=[...data.glossary].sort((a,b)=>b.word.length-a.word.length);
 let sentenceNumber=0;
 const groups=data.lines.map((row,i)=>{
  const sentences=row.translations.map((translation,j)=>{
   const original=row.clauses&&row.clauses[j];
   const annotated=original?annotateClause(original,terms):null;
   sentenceNumber++;
   return `<section class="study-sentence" aria-label="第${sentenceNumber}句解释"><h5>第 ${sentenceNumber} 句${original?'':' · 内容解读'}</h5>${annotated?`<p class="study-original">${annotated.html}</p>`:''}<p class="study-translation"><b>白话</b>${esc(translation)}</p>${annotated?wordList(annotated.used):''}</section>`;
  }).join('');
  return `<details class="study-group" open><summary>${esc(p.lines[i]||row.label)}</summary><div>${sentences}<p class="study-reading"><b>读懂这一层</b>${esc(row.reading)}</p></div></details>`;
 }).join('');
 return `<details class="poem-study" open><summary><span>逐字逐句详解</span><small>${sentenceNumber} 句 · ${data.glossary.length} 条字词注释</small></summary><div class="study-content"><section class="study-intro"><h4>先读懂题目</h4><p>${esc(data.intro)}</p></section><div class="study-heading"><h4>${p.modern?'依次读懂全篇':'一句一句读'}</h4><div role="group" aria-label="展开或收起逐句讲解"><button type="button" data-study-expand="true">全部展开</button><button type="button" data-study-expand="false">全部收起</button></div></div><p class="study-help">字词按句中含义分组解释；固定词语连在一起读。</p>${groups}<section class="study-theme"><h4>全诗赏析 · 把意思连起来</h4><p>${esc(data.theme)}</p></section><details class="study-glossary"><summary>字词总表（含题目用语）</summary>${wordList(data.glossary)}</details><p class="study-reference">白话与赏析为学习讲解；有异文或多种解释的地方已作提示。<a href="https://www.edb.gov.hk/tc/curriculum-development/kla/chi-edu/resources/primary/lang/jilei.html" target="_blank" rel="noopener">延伸阅读：教育局小学古诗文选编 ↗</a></p></div></details>`;
}
function renderStudy(id,p){const host=$(id);if(!host||host.dataset.poem===p.id)return;host.innerHTML=studyMarkup(p);host.dataset.poem=p.id;}
const classicCount = POEMS.filter(p=>!p.modern).length;
$('classic-count').textContent=classicCount;
$('about-count').textContent=`共收录 ${classicCount} 首古诗词，另有 3 首现代诗词补充篇目。`;
function save(){try{localStorage.setItem('xiaoxue-shici-read-v1',JSON.stringify([...learned]));}catch{toast('本次已记录，浏览器暂时无法长期保存。');}}
let toastTimer;
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2400);}
function nav(){ $('grade-nav').innerHTML=names.map((n,i)=>`<a class="grade-link ${grade===i+1?'active':''}" href="#grade-${i+1}" ${grade===i+1?'aria-current="page"':''}><span class="grade-number">0${i+1}</span><span class="grade-label">${n}年级</span><span class="grade-total">${POEMS.filter(p=>p.grade===i+1).length}</span></a>`).join(''); }
function matching(){const q=query.trim();return POEMS.filter(p=>(q ? [p.title,p.author,p.dynasty,...p.lines].join('').includes(q) : p.grade===grade));}
function render(){
 nav();$('crumb-grade').textContent=gradeName(grade);
 const q=query.trim(),base=matching();
 $('collection-title').innerHTML=q?`搜索结果 <span>在六个年级中寻找诗意</span>`:`${gradeName(grade)} <span>${subtitles[grade-1]}</span>`;
 $('section-kicker').textContent=q?'诗名 · 作者 · 诗句':`第${names[grade-1]}段时光 · 慢慢读，慢慢长大`;
 $('up-count').textContent=base.filter(p=>p.term==='上').length;
 $('down-count').textContent=base.filter(p=>p.term==='下').length;
 const filtered=base.filter(p=>(term==='all'||term===p.term)&&(!onlyLearned||learned.has(p.id)));
 visibleList=filtered;
 $('collection-count').textContent=`${filtered.length} 篇 · ${filtered.filter(p=>!p.modern).length} 首古诗词`;
 $('learned-count').textContent=base.filter(p=>learned.has(p.id)).length;
 $('learned-filter').setAttribute('aria-pressed',String(onlyLearned));
 document.querySelectorAll('[data-term]').forEach(b=>{b.classList.toggle('active',b.dataset.term===term);b.setAttribute('aria-pressed',String(b.dataset.term===term));});
 $('results-note').hidden=!q;$('results-note').textContent=`“${q}” 的搜索结果，范围为一年级至六年级。点击年级可回到该年级目录。`;
 $('poem-grid').innerHTML=filtered.map((p,i)=>`<article class="poem-card ${learned.has(p.id)?'is-read':''}" data-poem="${p.id}"><div class="card-top"><span>${String(i+1).padStart(2,'0')} / ${p.modern?'现代诗词补充':'古诗词'}</span><span class="term-tag">${gradeName(p.grade)} · ${p.term}册</span></div><h3 class="${shortTitle(p).length>8?'long-title':''}"><button class="title-open" data-open="${p.id}">${esc(shortTitle(p))}</button></h3><p class="author">${p.dynasty==='作者待考'?'作者待考':esc(p.dynasty)+' · '+esc(p.author)}</p><div class="verse-preview ${p.modern?'modern-preview':''}">${p.lines.length?p.lines.slice(0,2).map(l=>`<span>${esc(l)}</span>`).join(''):'传统诗词形式的现代作品<br>补充篇目 · 标题与作者'}</div><div class="card-bottom"><button class="card-open" data-open="${p.id}">${p.lines.length?'阅读 · 详解':'篇目 · 详解'} <span aria-hidden="true">↗</span></button><button class="read-state" data-read="${p.id}" aria-label="${learned.has(p.id)?'取消已读':'标为已读'}：${esc(p.title)}" aria-pressed="${learned.has(p.id)}"><span class="read-word">${learned.has(p.id)?'已读':'未读'}</span><span class="read-check" aria-hidden="true">✓</span></button></div></article>`).join('');
 $('empty').hidden=!!filtered.length;
 $('empty-message').textContent=onlyLearned?'当前范围还没有已读记录，读完一首后可点击“标为已读”。':'换个关键词或学期，再找找看。';
 renderFlashcards();
}
function renderFlashcards(){
 const selected=visibleList.findIndex(p=>p.id===flashId);
 flashIndex=selected>=0?selected:Math.min(flashIndex,Math.max(0,visibleList.length-1));
 const p=visibleList[flashIndex];
 if(!p||p.id!==flashId) flashRevealed=false;
 flashId=p?p.id:null;
 $('poem-grid').hidden=view!=='grid';
 $('flashcards').hidden=view!=='flashcards'||!p;
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
 $('view-hint').textContent=view==='flashcards'?'一次一首，先想一想，再翻开诗句。':'选择一首诗，慢慢读。';
 if(!p)return;
 $('flashcard-position').textContent=`第 ${flashIndex+1} / ${visibleList.length} 首`;
 $('flashcard-location').textContent=`${gradeName(p.grade)} · ${p.term}册`;
 $('flashcard-tag').textContent=p.modern?'现代诗词 · 补充篇目':'古诗词';
 $('flashcard-title').textContent=p.title;
 $('flashcard-author').textContent=p.dynasty==='作者待考'?'作者待考':`${p.dynasty} · ${p.author}`;
 $('flashcard-prompt').textContent=p.modern?'想一想，你在课本中读过这首作品吗？':'还记得这首诗吗？想一想，再翻开。';
 $('flashcard-prompt').hidden=flashRevealed;
 $('flashcard-answer').hidden=!flashRevealed;
 if($('flashcard-study'))$('flashcard-study').hidden=!flashRevealed;
 $('flashcard-lines').innerHTML=p.lines.map(line=>`<p class="poem-line">${esc(line)}</p>`).join('');
 $('flashcard-note').textContent=p.modern?'本页保留标题与作者，正文请参阅课本。':'诗文存在异文，背诵与默写请以所用课本为准。';
 renderStudy('flashcard-study',p);
 $('flip-card').textContent=flashRevealed?'合上 · 再想一想':p.modern?'翻开 · 看篇目说明':'翻开 · 看诗句';
 $('flip-card').setAttribute('aria-expanded',String(flashRevealed));
 $('flashcard-read').textContent=learned.has(p.id)?'已读 ✓ · 点击取消':'标为已读 ✓';
 $('flashcard-read').setAttribute('aria-pressed',String(learned.has(p.id)));
 $('prev-card').disabled=flashIndex===0;
 $('next-card').disabled=flashIndex>=visibleList.length-1;
}
function moveCard(offset){
 const next=flashIndex+offset;
 if(next<0||next>=visibleList.length)return;
 flashIndex=next;flashId=visibleList[next].id;flashRevealed=false;renderFlashcards();
 if(document.activeElement.disabled)$('flip-card').focus({preventScroll:true});
}
function toggleRead(id){if(learned.has(id)){learned.delete(id);toast('已取消已读标记');}else{learned.add(id);toast('又读完一首，诗意慢慢积累。');}save();render();if(current)updateReadButton();}
function updateReadButton(){if(current)$('read-button').textContent=learned.has(current.id)?'已读 ✓ · 点击取消':'标为已读 ✓';}
function showPoem(id, list=visibleList){
 current=POEMS.find(p=>p.id===id);if(!current)return;
 readerList=[...list];reciting=false;
 $('reader-title').textContent=current.title;
 $('reader-location').textContent=`${gradeName(current.grade)} · ${current.term}册`;
 $('reader-author').textContent=current.dynasty==='作者待考'?'作者待考':`${current.dynasty} · ${current.author}`;
 $('reader-tag').textContent=current.modern?'现代诗词 · 补充篇目':current.title.includes('节选')?'古诗词 · 节选':'古诗词阅读';
 $('reader-note').textContent=current.modern?'本页保留标题与作者，正文请参阅课本。现代作品采用传统诗词形式，作为补充篇目列入。':current.title==='画'?'《画》的作者有不同说法，本页不作确定归属。':current.title==='迢迢牵牛星'?'选自《古诗十九首》。文字与标点请以所用课本为准。':current.title==='采薇（节选）'?'选自《诗经·小雅》。本页仅展示课本常见节选。':'诗文存在异文，背诵与默写请以所用课本为准。';
 updateReadButton();renderBody();
 const index=readerList.findIndex(p=>p.id===id);$('reader-index').textContent=`${index+1} / ${readerList.length}`;
 $('prev-poem').disabled=index<=0;$('next-poem').disabled=index<0||index>=readerList.length-1;
 if(!$('reader').open){$('reader').showModal();document.body.style.overflow='hidden';}
 $('reader').scrollTop=0;
}
function renderBody(){
 const p=current;$('recite-button').disabled=!p.lines.length;
 $('recite-button').textContent=reciting?'显示全文':'背诵模式';
 $('reader-body').innerHTML=p.lines.length?p.lines.map((l,i)=>reciting?`<button class="poem-line recall masked" data-line="${i}" aria-label="揭示第${i+1}行诗句">点击揭示 · 第${i+1}行</button>`:`<p class="poem-line">${esc(l)}</p>`).join(''):'<p class="modern-preview">现代诗词补充篇目<br>请结合所用课本阅读。</p>';
 renderStudy('reader-study',p);if($('reader-study'))$('reader-study').hidden=reciting;
}
function closeReader(){ $('reader').close(); }
$('grade-nav').addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;const next=Number(a.hash.slice(-1));grade=next;term='all';query='';$('search').value='';onlyLearned=false;render();});
document.querySelector('.brand').addEventListener('click',()=>{grade=1;term='all';query='';$('search').value='';onlyLearned=false;render();});
window.addEventListener('hashchange',()=>{const match=location.hash.match(/^#grade-([1-6])$/);if(match&&grade!==Number(match[1])){grade=Number(match[1]);term='all';query='';$('search').value='';onlyLearned=false;render();}});
$('search').addEventListener('input',e=>{query=e.target.value;term='all';render();});
document.querySelectorAll('[data-term]').forEach(b=>b.addEventListener('click',()=>{term=b.dataset.term;render();}));
$('learned-filter').addEventListener('click',()=>{onlyLearned=!onlyLearned;render();});
$('reset-filters').addEventListener('click',()=>{query='';term='all';onlyLearned=false;$('search').value='';render();});
$('poem-grid').addEventListener('click',e=>{const read=e.target.closest('[data-read]');if(read){toggleRead(read.dataset.read);return;}const card=e.target.closest('[data-poem]');if(card)showPoem(card.dataset.poem);});
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{
 view=b.dataset.view;
 try { localStorage.setItem('xiaoxue-shici-view-v1',view); } catch {}
 renderFlashcards();
}));
$('flip-card').addEventListener('click',()=>{flashRevealed=!flashRevealed;renderFlashcards();});
$('flashcard-read').addEventListener('click',()=>{
 if(flashId)toggleRead(flashId);
 if($('flashcards').hidden)$('reset-filters').focus({preventScroll:true});
});
$('prev-card').addEventListener('click',()=>moveCard(-1));
$('next-card').addEventListener('click',()=>moveCard(1));
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-study-expand]');if(!button)return;
 const expanded=button.dataset.studyExpand==='true';
 button.closest('.poem-study').querySelectorAll('.study-group').forEach(group=>{group.open=expanded;});
});
$('collection').addEventListener('keydown',e=>{
 if(view!=='flashcards'||!visibleList.length||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.target.isContentEditable)return;
 if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();moveCard(e.key==='ArrowLeft'?-1:1);}
});
$('close-reader').addEventListener('click',closeReader);
$('reader').addEventListener('close',()=>{document.body.style.overflow='';current=null;});
$('reader').addEventListener('click',e=>{if(e.target===$('reader')){const rect=$('reader').getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)closeReader();}});
$('recite-button').addEventListener('click',()=>{reciting=!reciting;renderBody();});
$('reader-body').addEventListener('click',e=>{const line=e.target.closest('[data-line]');if(!line)return;const n=Number(line.dataset.line),masked=line.classList.toggle('masked');line.textContent=masked?`点击揭示 · 第${n+1}行`:current.lines[n];line.setAttribute('aria-label',masked?`揭示第${n+1}行诗句`:`隐藏第${n+1}行诗句：${current.lines[n]}`);});
$('read-button').addEventListener('click',()=>toggleRead(current.id));
function adjacent(offset){const i=readerList.findIndex(p=>p.id===current.id);if(readerList[i+offset])showPoem(readerList[i+offset].id,readerList);}
$('prev-poem').addEventListener('click',()=>adjacent(-1));$('next-poem').addEventListener('click',()=>adjacent(1));
function about(){ $('about').showModal();document.body.style.overflow='hidden'; }
$('about-button').addEventListener('click',about);$('footer-about').addEventListener('click',about);$('close-about').addEventListener('click',()=>$('about').close());$('about').addEventListener('close',()=>{document.body.style.overflow='';});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!$('reader').open&&!$('about').open&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();$('search').focus();}if($('reader').open&&!['INPUT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName)){if(e.key==='ArrowLeft')adjacent(-1);if(e.key==='ArrowRight')adjacent(1);}});
render();
})();
