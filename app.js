const params = new URLSearchParams(location.search);
if(params.get('auto'))location.replace(base+'/auto/'+encodeURIComponent(params.get('auto'))+(params.get('zestaw')?'?zestaw='+encodeURIComponent(params.get('zestaw')):''));
byId('other').onclick=() => openRequest(search.value,'Dobór indywidualny');
byId('partner').onclick=() => openRequest('','Współpraca partnerska');
const search = byId('car-search');
const panel = byId('car-panel');
const options = byId('car-options');
let desiredKit = 'Kabina', activeIndex = -1, matches = [];
function searchMatches(text) {
  const query = normal(text).split(' ').filter(Boolean);
  return vehicles.filter(v => query.every(q => {
    if (/^(19|20)\d\d$/.test(q)) {
      const range = v.years.match(/(?:19|20)\d{2}/g)||[];
      return range.length && +q>=+range[0] && (range.length===1 || +q<=+range[1]);
    }
    return v.terms.some(term=>term.startsWith(q));
  }));
}
function closeSearch() {
  panel.hidden=true;search.setAttribute('aria-expanded','false');
  search.removeAttribute('aria-activedescendant');activeIndex=-1;
}
function setActive(index) {
  activeIndex=index;
  Array.from(options.children).forEach((li,i)=>li.setAttribute('aria-selected',String(i===index)));
  if(index>=0) {
    const active=options.children[index];search.setAttribute('aria-activedescendant',active.id);active.scrollIntoView({block:'nearest',behavior:'instant'});
  } else search.removeAttribute('aria-activedescendant');
}
function showOptions() {
  matches=searchMatches(search.value);
  options.replaceChildren();activeIndex=-1;search.removeAttribute('aria-activedescendant');
  byId('car-meta').textContent=matches.length?'Wybierz generację · '+matches.length+' wyników':'Brak dopasowania. Spróbuj nazwy modelu lub kodu generacji.';
  matches.forEach((v,i)=>{
    const li=document.createElement('li');li.id='option-'+v.code;li.setAttribute('role','option');li.setAttribute('aria-selected','false');
    const left=document.createElement('strong');left.textContent=v.name;
    const right=document.createElement('small');right.textContent=v.detail;
    li.append(left,right);li.onclick=()=>selectVehicle(v,desiredKit);options.append(li);
  });
  panel.hidden=false;search.setAttribute('aria-expanded','true');
}
function focusFinder() {
  search.focus({preventScroll:true});search.select();showOptions();
}
search.addEventListener('input',showOptions);search.addEventListener('focus',showOptions);
search.addEventListener('click',()=>{if(panel.hidden)showOptions();});
byId('open-options').onclick=()=>{if(panel.hidden)focusFinder();else closeSearch();};
search.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeSearch();return;}
  if(!['ArrowDown','ArrowUp','Enter'].includes(e.key)) return;
  e.preventDefault();if(panel.hidden)showOptions();
  if(!matches.length)return;
  if(e.key==='Enter') { if(activeIndex>=0 || matches.length===1)selectVehicle(matches[Math.max(0,activeIndex)],desiredKit);else setActive(0); }
  else setActive(e.key==='ArrowDown'?Math.min(matches.length-1,activeIndex+1):Math.max(0,activeIndex-1));
});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.finder'))closeSearch();});
byId('dobierz').addEventListener('focusout',e=>{if(!byId('dobierz').contains(e.relatedTarget))closeSearch();});
document.querySelectorAll('a[href="#dobierz"]').forEach(a=>a.onclick=()=>{desiredKit=a.id==='trunk-link'?'Bagażnik':'Kabina';search.value='';focusFinder();});
function selectVehicle(vehicle,kit) {
  location.href=cardUrl(vehicle,Object.hasOwn(vehicle.kits,kit)?kit:baseKit(vehicle));
}
let filter='all',limit=6;
function renderStore() {
  const list=vehicles.filter(v=>filter==='all'||v.status===filter);
  const grid=byId('store-grid');grid.replaceChildren();
  list.slice(0,limit).forEach((v,i)=>{
    const link=document.createElement('a');link.className='store-item';link.dataset.status=v.status;const kit=baseKit(v);link.href=cardUrl(v,kit);
    const art=document.createElement('div');art.className='store-art';
    const color=colors[i%colors.length];
    const img=document.createElement('img');img.src=photo(color.id+(i%2?'-rear':'-front'));img.alt='';img.loading='lazy';
    const tag=document.createElement('span');tag.dataset.status=v.status;tag.textContent=statusLabels[v.status];
    const caption=document.createElement('small');caption.textContent='Zdjęcie dostawcy';
    art.append(img,tag,caption);
    const body=document.createElement('div');body.className='store-body';
    const title=document.createElement('h3');title.textContent=v.name;
    const info=document.createElement('p');info.textContent=v.detail;
    const foot=document.createElement('div');const price=document.createElement('strong');price.textContent=kit+' · '+money(v.kits[kit]);
    foot.append(price,v.status==='out'?'Powiadom ↗':'↗');body.append(title,info,foot);link.append(art,body);grid.append(link);
  });
  byId('store-status').textContent=list.length?'Wyświetlono '+Math.min(limit,list.length)+' z '+list.length+' wersji.':'Wszystkie zestawy w tej grupie są dostępne na zamówienie.';
  byId('more-cars').hidden=list.length<=limit;byId('back-to-orders').hidden=!!list.length;
  document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));
}
function setFilter(value){filter=value;limit=6;renderStore();}
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>setFilter(b.dataset.filter));
byId('back-to-orders').onclick=()=>setFilter('order');
byId('more-cars').onclick=()=>{const previous=limit;limit+=6;renderStore();byId('store-grid').children[previous]?.focus({preventScroll:true});};
document.querySelector('[data-filter="stock"]').hidden=!vehicles.some(v=>v.status==='stock');
renderStore();
options.addEventListener('mousedown',e=>e.preventDefault());
