const dialog = byId('request');
function openRequest(car,kit) {
  byId('request-form').reset();requestKey=null;
  byId('vehicle').value=car; byId('variant').value=kit; byId('form-status').textContent='';
  byId('vehicle').setCustomValidity('');dialog.showModal(); updateDraft();
}
dialog.querySelector('.close').onclick=() => dialog.close();
function requestText() {
  return ['COILMAT — zapytanie','Auto / studio: '+byId('vehicle').value.trim(), 'Wariant: '+byId('variant').value.trim(), 'Uwagi: '+byId('notes').value.trim()].join('\n');
}
function updateDraft() {
  byId('draft').href='mailto:?subject='+encodeURIComponent('COILMAT — zapytanie')+'&body='+encodeURIComponent(requestText());
}
byId('request-form').oninput=()=>{byId('vehicle').setCustomValidity('');updateDraft();};
function validRequest(){
  if(!byId('vehicle').value.trim()) byId('vehicle').setCustomValidity('Podaj samochód lub nazwę studia.');
  return byId('request-form').reportValidity();
}
byId('draft').onclick = event => { if(!validRequest()) event.preventDefault(); };
byId('request-form').onsubmit=async event=>{
  event.preventDefault(); if(!validRequest()) return;
  if(!offline){await sendRequest();return;}
  const url=URL.createObjectURL(new Blob([requestText()],{type:'text/plain;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='COILMAT-zapytanie.txt';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
  byId('form-status').textContent='Karta przygotowana do pobrania.';
};

async function sendRequest(){
  const submit=byId('request-submit'),status=byId('form-status');
  if(demo){status.textContent='Wersja demonstracyjna: zapytanie nie zostało wysłane.';return;}
  submit.disabled=true;status.textContent='Wysyłanie…';
  const payload={email:byId('request-email').value.trim(),vehicle:byId('vehicle').value.trim(),variant:byId('variant').value.trim(),notes:byId('notes').value.trim()};
  try{
    requestKey??=crypto.randomUUID();
    const response=await fetch('/api/requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,key:requestKey})});
    if(!response.ok)throw new Error('request');
    const result=await response.json();
    status.textContent='Dziękujemy. Numer zapytania: '+result.number+'. Odezwiemy się na podany adres.';
    requestKey=null;
  }catch{
    status.textContent='Nie udało się wysłać zapytania. Sprawdź połączenie i spróbuj ponownie.';
  }finally{submit.disabled=false;}
}

let requestKey=null;
byId('request-email-field').hidden=offline;byId('request-email').required=!offline;byId('draft').hidden=!offline;
if(offline){byId('request-intro').textContent='Przygotuj kartę do przekazania sprzedawcy. Dane pozostają w Twojej przeglądarce.';byId('request-submit').textContent='Pobierz kartę ↓';}
