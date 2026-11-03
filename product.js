const shippingLabels = {
  sea: 'Morski · ok. 8–12 tyg.',
  air: 'Lotniczy · ok. 2–3 tyg.'
};
const descriptions = {
  'Kabina': 'Dywaniki do pierwszego i drugiego rzędu siedzeń.',
  'Bagażnik': 'Osobna mata coil na podłogę bagażnika.',
  'Kabina + bagażnik': 'Dywaniki do pierwszego i drugiego rzędu oraz mata do bagażnika.',
  'Pełny zestaw': 'Rozszerzony komplet na wszystkie rzędy siedzeń razem z bagażnikiem.',
  'Premium 6D': 'Zestaw do kabiny z profilowaną podstawą i wyjmowaną wkładką coil.'
};
const orderDialog = byId('order');
const shippingChoice = () => document.querySelector('input[name="shipping"]:checked').value;
let selected, chosenKit, chosenColor = 'szary', chosenPhoto = 0;
function renderProduct(vehicle,kit) {
  selected=vehicle;chosenKit=kit;
  byId('product-title').textContent=vehicle.name;
  byId('product-generation').textContent=vehicle.detail;
  byId('kits').querySelectorAll('label').forEach(label=>label.remove());
  for(const [name,price] of Object.entries(vehicle.kits)){
    const label=document.createElement('label');label.className='kit-choice';
    const radio=document.createElement('input');radio.type='radio';radio.name='kit';radio.value=name;radio.checked=name===kit;
    const value=document.createElement('small');value.textContent=money(price);
    radio.onchange=()=>{chosenKit=name;history.replaceState(null,'',cardUrl(vehicle,name));updateProduct();};
    label.append(radio,name,value);byId('kits').append(label);
  }
  byId('colors').querySelectorAll('label').forEach(label=>label.remove());
  colors.forEach(color=>{
    const label=document.createElement('label');label.className='swatch';
    const radio=document.createElement('input');radio.type='radio';radio.name='color';radio.value=color.id;radio.checked=color.id===chosenColor;
    const dot=document.createElement('i');dot.style.background=color.swatch;
    radio.onchange=()=>{chosenColor=color.id;chosenPhoto=0;updateProduct();};
    label.append(radio,dot,color.label);byId('colors').append(label);
  });
  byId('shipping').querySelector('[value="sea"]').checked=true;
  updateProduct();
}
function kitPhotos() {
  if(chosenKit==='Premium 6D') return [{file:'premium-6d',alt:'Trzyczęściowy zestaw Premium 6D z profilowaną czarną podstawą i wkładką coil.',caption:'Zdjęcie dostawcy · przykładowy komplet'}];
  const label=colors.find(c=>c.id===chosenColor).label.toLowerCase();
  const cabin=[{file:chosenColor+'-front',alt:'Dywanik coil, kolor '+label+', pod kierownicą w przykładowym aucie.',caption:'Zdjęcie dostawcy · przykładowe auto'},{file:chosenColor+'-rear',alt:'Dywanik coil, kolor '+label+', w drugim rzędzie przykładowego auta.',caption:'Zdjęcie dostawcy · drugi rząd'}];
  const trunk=[{file:'trunk-colors',alt:'Mata coil w bagażniku z próbkami pięciu kolorów.',caption:'Zdjęcie dostawcy · bagażnik i próbki kolorów'},{file:'trunk-red',alt:'Czerwona mata coil w bagażniku.',caption:'Zdjęcie dostawcy · przykładowy bagażnik'}];
  const shared=[{file:'macro-real',alt:'Zbliżenie pętelkowego splotu coil.',caption:'Zdjęcie dostawcy · splot'},{file:'backing',alt:'Spód dywanika z antypoślizgową podstawą.',caption:'Zdjęcie dostawcy · spód dywanika'}];
  return [...(chosenKit==='Bagażnik'?trunk:chosenKit==='Kabina'?cabin:[...cabin,...trunk]),...shared];
}
function showPhoto(list,index) {
  chosenPhoto=index;
  const item=list[index];
  byId('product-image').src=photo(item.file);byId('product-image').alt=item.alt;byId('product-caption').textContent=item.caption+', wykrój zależy od modelu';
  Array.from(byId('product-thumbs').children).forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
}
function updateProduct() {
  const list=kitPhotos(),premium=chosenKit==='Premium 6D',out=selected.status==='out';
  byId('product-thumbs').replaceChildren(...list.map((item,i)=>{
    const button=document.createElement('button');button.type='button';button.setAttribute('aria-label','Zdjęcie '+(i+1)+' z '+list.length);
    const img=document.createElement('img');img.src=photo(item.file);img.alt='';
    button.append(img);button.onclick=()=>showPhoto(list,i);return button;
  }));
  showPhoto(list,Math.min(chosenPhoto,list.length-1));
  byId('kit-description').textContent=descriptions[chosenKit];
  byId('product-price').textContent=money(kitTotal(selected,chosenKit,shippingChoice()));
  document.querySelectorAll('#shipping .kit-choice').forEach(label=>{
    const way=label.querySelector('input').value;
    label.querySelector('small').textContent=(way==='air'?'ok. 2–3 tyg. · ':'ok. 8–12 tyg. · ')+money(kitTotal(selected,chosenKit,way));
  });
  byId('colors').hidden=premium;
  byId('product-spec').textContent=premium?'Dostępne kolory potwierdzimy przy doborze.':'Pętle 20 mm, antypoślizgowa podstawa i podkładka pod piętę kierowcy.';
  const status=byId('product-status');status.dataset.status=selected.status;status.textContent=out?'Niedostępne · sprawdzamy wykrój dla tej generacji':statusLabels[selected.status];
  byId('shipping').hidden=out;
  const action=byId('order-open');
  if(!offline){action.textContent=out?'Powiadom o dostępności ↗':'Zamów w przedsprzedaży ↗';if(out)action.dataset.variant='notify';else delete action.dataset.variant;}
}
const code = decodeURIComponent(location.pathname.replace(/\/$/,'').replace(/\.html$/,'').split('/').pop());
const vehicle = vehicles.find(v=>v.code===code);
const wanted = new URLSearchParams(location.search).get('zestaw');
document.querySelectorAll('input[name="shipping"]').forEach(radio=>radio.onchange=updateProduct);
renderProduct(vehicle,Object.keys(vehicle.kits).find(k=>kitSlug(k)===wanted)||baseKit(vehicle));
const form = byId('order-form'), submit = byId('order-submit'), orderStatus=byId('order-status');
let busy=false, lastAttempt=null;
const sendingClose=orderDialog.querySelector('.close');
sendingClose.onclick=()=>{if(!busy)orderDialog.close();};
orderDialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
function currentOrder(){
  const delivery=document.querySelector('input[name="shipping"]:checked').value;
  return {brand:selected.brand,model:selected.model,generation:selected.generation,years:selected.years,kit:chosenKit,shipping:delivery,color:chosenKit==='Premium 6D'?'':chosenColor,year:Number(byId('order-year').value),body:byId('order-body').value,fuel:byId('order-fuel').value,steering:byId('order-steering').value,notes:byId('order-notes').value.trim()};
}
if(offline)byId('order-open').textContent='Pobierz kartę zestawu ↓';
byId('order-open').onclick=()=>{
  if(selected.status==='out'){openRequest(selected.name+' · '+selected.detail,'Powiadomienie o dostępności');return;}
  const delivery=shippingLabels[currentOrder().shipping];
  const colorName=colors.find(c=>c.id===currentOrder().color)?.label;
  const kit=[chosenKit,colorName,money(kitTotal(selected,chosenKit,currentOrder().shipping))+' z transportem'].filter(Boolean).join(' · ');
  if(offline){
    openRequest(selected.name+' · '+selected.detail,kit);
    dialog.querySelector('form > p').textContent='Wersja offline. Pobierz kartę zestawu do późniejszego zamówienia. Dane pozostają w przeglądarce.';
    byId('notes').value='Transport: '+delivery;updateDraft();return;
  }
  form.hidden=false;submit.disabled=false;orderStatus.textContent='';byId('order-title').textContent='Twój zestaw';
  const range=selected.years.match(/(?:19|20)\d{2}/g)||[];
  byId('order-year').max=new Date().getFullYear()+1;byId('order-year').placeholder=range.length?'np. '+range[range.length-1]:'';
  byId('order-summary').textContent=selected.name+' · '+selected.detail+' / '+kit+' / '+delivery;
  orderDialog.showModal();byId('order-email').focus();
};
async function retryKey(payload){
  const bytes=new TextEncoder().encode(JSON.stringify(payload));
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
  const signature=Array.from(digest,n=>n.toString(16).padStart(2,'0')).join('');
  try{lastAttempt=JSON.parse(sessionStorage.getItem('coilmat-pending-order'))||lastAttempt;}catch{}
  if(lastAttempt?.signature!==signature){
    lastAttempt={signature,key:crypto.randomUUID()};
    try{sessionStorage.setItem('coilmat-pending-order',JSON.stringify(lastAttempt));}catch{}
  }
  return lastAttempt.key;
}
function orderYearError(){
  const year=Number(byId('order-year').value),range=selected.years.match(/(?:19|20)\d{2}/g)||[];
  if(!year||!range.length)return '';
  const last=range.length>1?+range[1]:new Date().getFullYear()+1;
  return year<+range[0]||year>last?'Ta generacja obejmuje lata '+selected.years+'.':'';
}
byId('order-year').oninput=()=>byId('order-year').setCustomValidity('');byId('order-fuel').onchange=()=>byId('order-fuel').setCustomValidity('');
form.onsubmit=async event=>{
  event.preventDefault();
  byId('order-year').setCustomValidity(orderYearError());byId('order-fuel').setCustomValidity(/bez hybrydy/.test(selected.years)&&/hybryda|plug-in/.test(byId('order-fuel').value)?'Ta wersja nie jest dostępna dla hybryd.':'');
  if(busy||!form.reportValidity())return;
  if(demo){orderStatus.textContent='Wersja demonstracyjna: rezerwacja nie została wysłana.';orderStatus.focus();return;}
  busy=true;submit.disabled=true;sendingClose.disabled=true;byId('order-email').readOnly=true;
  orderStatus.textContent='Zapisywanie rezerwacji…';
  const payload={...currentOrder(),email:byId('order-email').value.trim()};
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),20000);
  try{
    const key=await retryKey(payload);
    const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,key}),signal:controller.signal});
    if(!response.ok)throw new Error('request');
    const result=await response.json();
    if(typeof result.number!=='string'||!result.number.trim())throw new Error('response');
    form.hidden=true;byId('order-title').textContent='Rezerwacja zapisana';
    orderStatus.textContent='Numer rezerwacji: '+result.number+'. Sprzedawca skontaktuje się z Tobą na podany adres e-mail, aby potwierdzić szczegóły.';
    orderStatus.focus();
    try{sessionStorage.removeItem('coilmat-pending-order');}catch{}
    lastAttempt=null;
  } catch{
    orderStatus.textContent='Nie udało się potwierdzić zapisu. Sprawdź połączenie i spróbuj ponownie z tym samym adresem e-mail.';
  } finally {
    clearTimeout(timer);busy=false;submit.disabled=false;sendingClose.disabled=false;byId('order-email').readOnly=false;
  }
};
