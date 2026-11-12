'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const categories = window.NOTE_CATEGORIES;
  const seeds = window.SEED_NOTES;
  const KEY = 'shiye-stat-notes-v1';
  const state = { category: 'all', view: 'all', query: '', sort: 'updated', current: null, editing: null };
  let personal = [], favorites = [], toastTimer;
  const categoryFor = id => categories.find(c => c.id === id);
  const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
  function validNote(n) {
    return n && typeof n.id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(n.id) &&
      typeof n.title === 'string' && n.title.trim().length > 0 && n.title.length <= 100 &&
      typeof n.summary === 'string' && n.summary.trim().length > 0 && n.summary.length <= 180 &&
      categoryFor(n.category) && typeof n.body === 'string' && n.body.trim().length > 0 && n.body.length <= 30000 &&
      validDate(n.updated) && Array.isArray(n.tags) && n.tags.length <= 8 && n.tags.every(t => typeof t === 'string' && t.length <= 30);
  }
  function cleanNote(n) { return {id:n.id,title:n.title,summary:n.summary,category:n.category,body:n.body,updated:n.updated,tags:[...n.tags]}; }
  function toast(message) { $('toast').textContent = message; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3400); }
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved) {
      if (saved.version !== 1 || !Array.isArray(saved.notes) || !Array.isArray(saved.favorites) || !saved.notes.every(validNote)) throw new Error('Invalid backup');
      personal = [...new Map(saved.notes.map(n => [n.id, cleanNote(n)])).values()];
      favorites = [...new Set(saved.favorites.filter(id => typeof id === 'string'))];
    }
  } catch { toast('無法讀取本機資料。你仍可瀏覽示範筆記；若有備份，可重新匯入。'); }
  function save(nextNotes = personal, nextFavorites = favorites) {
    try {
      localStorage.setItem(KEY, JSON.stringify({version:1, notes:nextNotes, favorites:nextFavorites}));
      personal = nextNotes; favorites = nextFavorites; return true;
    } catch { toast('儲存失敗：請確認瀏覽器允許本機儲存，或匯出目前資料。'); return false; }
  }
  function allNotes() { const map = new Map(seeds.map(n => [n.id,n])); personal.forEach(n => map.set(n.id,n)); return [...map.values()]; }
  function make(tag, className, text) { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el; }
  function isPersonal(id) { return personal.some(n => n.id === id); }
  const dateText = date => date.replaceAll('-', '.');
  function tagsNode(tags) { const box = make('div','tags'); tags.forEach(t => box.append(make('span','tag','# '+t))); return box; }
  function toggleFavorite(id) {
    const next = favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites,id];
    if (save(personal,next)) { render(); if (state.current === id) updateReaderFavorite(); }
  }
  function selectCategory(id) { state.category = id; state.view = 'all'; render(); }
  function renderNav(notes) {
    $('category-nav').replaceChildren();
    categories.forEach(c => { const b = make('button','nav-item'+(state.category === c.id && state.view === 'all' ? ' active' : '')); b.setAttribute('aria-pressed',String(state.category === c.id && state.view === 'all')); b.append(make('span','category-dot '+c.color),document.createTextNode(c.name),make('span','count',notes.filter(n => n.category === c.id).length)); b.onclick = () => selectCategory(c.id); $('category-nav').append(b); });
    document.querySelectorAll('[data-view]').forEach(b => { const active = b.dataset.view === state.view && state.category === 'all'; b.classList.toggle('active',active); b.setAttribute('aria-pressed',String(active)); });
    $('filter-tabs').replaceChildren();
    [{id:'all',name:'全部'},...categories].forEach(c => { const b = make('button','filter-tab'+(state.category === c.id?' active':''),c.name); b.setAttribute('aria-pressed',String(state.category === c.id)); b.onclick = () => {state.category=c.id; render();}; $('filter-tabs').append(b); });
  }
  const artText = {descriptive:'x̄ · s · median',probability:'X ~ N(μ, σ²)',inference:'estimate ± error',regression:'y = β₀ + β₁x',r:'< code / >'};
  function renderCard(note) {
    const cat = categoryFor(note.category), card = make('article','note-card');
    const art = make('div','card-art '+cat.color); art.setAttribute('aria-hidden','true'); art.append(make('span','art-sub',cat.name.toUpperCase()),make('span','art-label',artText[cat.id]),make('span','art-symbol',cat.symbol));
    const content = make('div','card-content'), top = make('div','card-top'), fav = make('button','favorite-btn',favorites.includes(note.id)?'★':'☆');
    fav.setAttribute('aria-pressed',String(favorites.includes(note.id))); fav.setAttribute('aria-label',(favorites.includes(note.id)?'取消收藏：':'收藏：')+note.title); fav.onclick = () => toggleFavorite(note.id);
    top.append(make('span','badge '+cat.color,cat.name),fav);
    const title = make('button','card-title',note.title); title.onclick = () => openReader(note.id);
    const bottom = make('div','card-bottom'); bottom.append(make('time','',dateText(note.updated)),make('span','',isPersonal(note.id)?'個人筆記 ↗':'示範筆記 ↗')); bottom.firstChild.dateTime=note.updated;
    const heading = make('h3'); heading.style.margin='0'; heading.append(title);
    content.append(top,heading,make('p','card-summary',note.summary),tagsNode(note.tags),bottom); card.append(art,content); return card;
  }
  function render() {
    const notes = allNotes(), favTotal = notes.filter(n => favorites.includes(n.id)).length;
    $('all-count').textContent = $('stat-total').textContent = notes.length;
    $('fav-count').textContent = $('stat-favorites').textContent = favTotal;
    renderNav(notes);
    const label = state.view === 'favorites' ? '我的收藏' : (categoryFor(state.category)?.name || '所有筆記');
    $('breadcrumb-title').textContent = label;
    $('notes-title').textContent = state.view === 'favorites' ? '我的收藏' : (categoryFor(state.category)?.name || '我的筆記');
    const q = state.query.trim().toLocaleLowerCase();
    const filtered = notes.filter(n => (state.category === 'all' || n.category === state.category) && (state.view !== 'favorites' || favorites.includes(n.id)) && (!q || [n.title,n.summary,n.body,...n.tags,categoryFor(n.category).name].join(' ').toLocaleLowerCase().includes(q)));
    filtered.sort((a,b) => state.sort === 'title' ? a.title.localeCompare(b.title,'zh-Hant') : state.sort === 'oldest' ? a.updated.localeCompare(b.updated) : b.updated.localeCompare(a.updated));
    $('result-count').textContent = '共 '+filtered.length+' 篇'+(q?'符合搜尋':'');
    $('notes-grid').replaceChildren(...filtered.map(renderCard)); $('empty-state').hidden = filtered.length > 0;
  }
  function updateReaderFavorite() { const yes = favorites.includes(state.current); $('reader-fav').textContent = yes?'★ 已收藏':'☆ 收藏'; $('reader-fav').setAttribute('aria-pressed',String(yes)); }
  function renderMarkdown(text, container) {
    container.replaceChildren(); let code = null, list = null, paragraph = [];
    function flush() { if (paragraph.length) { container.append(make('p','',paragraph.join('\n'))); paragraph=[]; } list=null; }
    function appendCode(lines) { const pre = make('pre'), btn = make('button','','複製程式碼'), inner = make('code','',lines.join('\n')); btn.onclick=async()=>{ try {await navigator.clipboard.writeText(inner.textContent);toast('程式碼已複製');}catch{toast('瀏覽器無法使用剪貼簿，請選取程式碼後複製。');} }; pre.append(btn,inner);container.append(pre); }
    for (const line of text.split(/\r?\n/)) {
      if (line.trim().startsWith('```')) { if (code !== null) { appendCode(code); code=null; } else { flush();code=[]; } continue; }
      if (code !== null) {code.push(line);continue;}
      if (/^##\s+/.test(line)) {flush();container.append(make('h2','',line.replace(/^##\s+/,'')));}
      else if (/^-\s+/.test(line)) { if(paragraph.length) flush(); if(!list){list=make('ul');container.append(list);} list.append(make('li','',line.replace(/^-\s+/,''))); }
      else if (!line.trim()) flush();
      else { list=null;paragraph.push(line); }
    }
    flush();if(code !== null) appendCode(code);
  }
  function openReader(id) {
    const note=allNotes().find(n=>n.id===id);if(!note)return;state.current=id;
    const cat=categoryFor(note.category);$('reader-category').className='badge '+cat.color;$('reader-category').textContent=cat.name;
    $('reader-title').textContent=note.title;$('reader-tags').replaceChildren(tagsNode(note.tags));
    $('reader-meta').textContent='更新於 '+dateText(note.updated)+' · '+(isPersonal(id)?'個人筆記 · 僅存於此瀏覽器':'示範學習內容 · 可編輯成自己的版本');
    renderMarkdown(note.body,$('reader-body'));
    if(!isPersonal(id) && note.sources?.length){ const links=make('div','source-links');links.append(make('p','','官方參考文件'));note.sources.forEach(s=>{const a=make('a','',s.label+' ↗');a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';links.append(a);});$('reader-body').append(links); }
    $('delete-note').hidden=!isPersonal(id);$('delete-note').textContent=seeds.some(n=>n.id===id)?'還原示範版本':'刪除個人筆記';updateReaderFavorite();if(!$('reader').open)$('reader').showModal();$('reader').scrollTop=0;
  }
  function openEditor(id=null) {
    state.editing=id;const note=id?allNotes().find(n=>n.id===id):null;
    if($('reader').open)$('reader').close();$('note-form').reset();
    $('editor-title').textContent=note?'把理解寫得更完整':'記下一個新發現';
    $('note-title').value=note?.title||'';$('note-summary').value=note?.summary||'';$('note-category').value=note?.category||(state.category==='all'?'descriptive':state.category);$('note-tags').value=note?.tags.join(', ')||'';$('note-body').value=note?.body||'';$('editor').showModal();
  }
  function today() {const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
  $('note-form').onsubmit=e=>{e.preventDefault();const note={id:state.editing||('note-'+crypto.randomUUID()),title:$('note-title').value.trim(),category:$('note-category').value,summary:$('note-summary').value.trim(),tags:[...new Set($('note-tags').value.split(/[,，]/).map(t=>t.trim()).filter(Boolean))].slice(0,8),body:$('note-body').value.trim(),updated:today()};if(!validNote(note)){toast('請填寫標題、摘要與內容；每個標籤請勿超過 30 字。');return;}if(save([...personal.filter(n=>n.id!==note.id),note])){$('editor').close();state.category='all';state.view='all';state.query='';$('search').value='';render();toast('筆記已儲存於此瀏覽器');openReader(note.id);}};
  $('new-note').onclick=()=>openEditor();$('edit-note').onclick=()=>openEditor(state.current);$('start-reading').onclick=()=>openReader('descriptive-basics');$('reader-fav').onclick=()=>toggleFavorite(state.current);
  $('delete-note').onclick=()=>{const restore=seeds.some(n=>n.id===state.current);$('delete-dialog').querySelector('h2').textContent=restore?'移除個人修改，還原示範版本？':'刪除這篇個人筆記？';$('confirm-delete').textContent=restore?'確認還原':'確認刪除';$('delete-dialog').showModal();};
  $('confirm-delete').onclick=()=>{const id=state.current;if(save(personal.filter(n=>n.id!==id),seeds.some(n=>n.id===id)?favorites:favorites.filter(f=>f!==id))){$('delete-dialog').close();$('reader').close();render();toast(seeds.some(n=>n.id===id)?'已移除個人修改，恢復示範筆記':'個人筆記已刪除');}};
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;state.category='all';render();});
  categories.forEach(c=>{const o=make('option','',c.name);o.value=c.id;$('note-category').append(o);});
  $('search').oninput=e=>{state.query=e.target.value;render();};$('sort').onchange=e=>{state.sort=e.target.value;render();};
  $('clear-filter').onclick=()=>{state.category='all';state.view='all';state.query='';$('search').value='';render();};
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.querySelector('dialog[open]')){e.preventDefault();$('search').focus();}});
  $('export-btn').onclick=()=>{const blob=new Blob([JSON.stringify({version:1,notes:personal,favorites},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=make('a');a.href=url;a.download='shiye-notes-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);toast('已匯出個人筆記與收藏；示範筆記保留於網站中');};
  $('import-btn').onclick=()=>$('import-file').click();
  $('mobile-export').onclick=()=>$('export-btn').click();$('mobile-import').onclick=()=>$('import-btn').click();
  $('import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5*1024*1024)throw new Error();const data=JSON.parse(await file.text());if(data.version!==1||!Array.isArray(data.notes)||data.notes.length>1000||!data.notes.every(validNote)||!Array.isArray(data.favorites)||!data.favorites.every(id=>typeof id==='string'&&id.length<=100))throw new Error();const map=new Map(personal.map(n=>[n.id,n]));let imported=0;data.notes.forEach(raw=>{const n=cleanNote(raw),existing=map.get(n.id);if(existing&&JSON.stringify(existing)!==JSON.stringify(n)){n.id='note-'+crypto.randomUUID();}map.set(n.id,n);imported++;});const nextFav=[...new Set([...favorites,...data.favorites])];if(save([...map.values()],nextFav)){render();toast('已匯入 '+imported+' 篇個人筆記；不同內容保留為另一篇');}}catch{toast('匯入失敗，請選擇由拾頁匯出的 JSON 備份（5 MB 以下）。');}finally{e.target.value='';}};
  render();
})();
