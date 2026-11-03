const params = new URLSearchParams(location.search);
if(params.get('auto'))location.replace(base+'/auto/'+encodeURIComponent(params.get('auto'))+(params.get('zestaw')?'?zestaw='+encodeURIComponent(params.get('zestaw')):''));
const brandSelect = byId('car-brand'), modelSelect = byId('car-model'), yearSelect = byId('car-year');
const versionsBox = byId('car-versions'), goButton = byId('car-go');
let desiredKit = 'Kabina', chosen = null;
function choose(vehicle) {chosen = vehicle;goButton.disabled = !vehicle;}
goButton.onclick=()=>{if(chosen)selectVehicle(chosen,desiredKit);};
byId('other').onclick=() => openRequest([brandSelect.value,modelSelect.value,yearSelect.value].filter(Boolean).join(' '),'Dobór indywidualny');
byId('partner').onclick=() => openRequest('','Współpraca partnerska');
const thisYear = new Date().getFullYear();
function yearRange(v) {
  const found = v.years.match(/(?:19|20)\d{2}/g)||[];
  return [+found[0], found.length>1 ? +found[1] : thisYear];
}
function fillSelect(select, placeholder, values) {
  select.replaceChildren(new Option(placeholder,''), ...values.map(value=>new Option(value,value)));
  select.disabled = !values.length;
}
const modelVersions = () => vehicles.filter(v=>v.brand===brandSelect.value && v.model===modelSelect.value);
fillSelect(brandSelect,'Marka',[...new Set(vehicles.map(v=>v.brand))].sort((a,b)=>a.localeCompare(b,'pl')));
brandSelect.onchange=()=>{
  fillSelect(modelSelect,'Model',[...new Set(vehicles.filter(v=>v.brand===brandSelect.value).map(v=>v.model))].sort((a,b)=>a.localeCompare(b,'pl',{numeric:true})));
  fillSelect(yearSelect,'Rok',[]);versionsBox.hidden=true;choose(null);
  if(brandSelect.value)modelSelect.focus();
};
modelSelect.onchange=()=>{
  const years = new Set();
  for (const v of modelVersions()) {const [from,to]=yearRange(v);for(let y=to;y>=from;y--)years.add(y);}
  fillSelect(yearSelect,'Rok',[...years].sort((a,b)=>b-a).map(String));
  versionsBox.hidden=true;choose(null);
  if(modelSelect.value)yearSelect.focus();
};
yearSelect.onchange=()=>{
  const year = +yearSelect.value;
  const found = modelVersions().filter(v=>{const [from,to]=yearRange(v);return year>=from&&year<=to;});
  versionsBox.hidden = found.length<2;
  choose(found.length===1 ? found[0] : null);
  if (found.length===1) {goButton.focus();return;}
  const list = versionsBox.querySelector('div');list.replaceChildren();
  for (const v of found) {
    const button=document.createElement('button');button.type='button';button.className='finder-version';
    button.textContent=v.detail;button.setAttribute('aria-pressed','false');
    button.onclick=()=>{
      list.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      choose(v);goButton.focus();
    };
    list.append(button);
  }
};
function focusFinder() {
  brandSelect.focus({preventScroll:true});
}
document.querySelectorAll('a[href="#dobierz"]').forEach(a=>a.onclick=()=>{desiredKit=a.id==='trunk-link'?'Bagażnik':'Kabina';focusFinder();});
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
