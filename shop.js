const byId = id => document.getElementById(id);
const offline = location.protocol === 'file:';
const base = document.documentElement.dataset.base || '';
const demo = 'demo' in document.documentElement.dataset;
const colors = [
  {id:'szary',label:'Szary',swatch:'#77787a'},
  {id:'bezowy',label:'Beżowy',swatch:'#9a8467'},
  {id:'czerwony',label:'Czerwony',swatch:'#a3241c'},
  {id:'czarny',label:'Czarny',swatch:'#2c2d30'},
  {id:'brazowy',label:'Czekoladowy',swatch:'#54372a'}
];
const statusLabels = {order:'Na zamówienie',stock:'Od ręki',out:'Niedostępne'};
const photo = file => base+'/products/'+file+'.jpg';
const baseKit = v => Object.keys(v.kits)[0];
const roman = {'I':'1','II':'2','III':'3','IV':'4','V':'5','VI':'6','VII':'7','VIII':'8'};
function normal(text) {
  return text.toLowerCase().replaceAll('ł','l').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}
const vehicles = [];
for (const [brand,models] of Object.entries(DATA)) {
  for (const [model,versions] of Object.entries(models)) {
    for (const {g:generation,y:years,cabin,premium,trunk,fullset,status,air} of versions) {
      const name = brand+' '+model;
      const detail = [generation==='—'?'':generation,years].filter(Boolean).join(' · ');
      const kits = {[fullset?'Pełny zestaw':'Kabina']:cabin};
      if (trunk) {kits['Bagażnik']=449;kits['Kabina + bagażnik']=cabin+449;}
      if (premium) kits['Premium 6D']=premium;
      const code = normal(name+' '+detail).replaceAll(' ','-');
      const alias = [brand==='Volkswagen'?'VW':'',roman[generation]||'',model.replace(/^Seria /,'')].join(' ');
      const terms = normal(name+' '+generation+' '+alias).split(' ');
      vehicles.push({brand,model,generation,years,name,detail,code,kits,air:air||{},terms,status,stock:false});
    }
  }
}
const featured = ['BMW Seria 5|G30','Audi A4|B9','Volkswagen Golf|VII','Mercedes-Benz Klasa E|W213','Hyundai Palisade|LX2','Kia Carnival|KA4'];
const rank = v => {const n=featured.indexOf(v.name+'|'+v.generation);return n===-1?999:n;};
vehicles.sort((a,b)=>(a.status==='out')-(b.status==='out')||rank(a)-rank(b));
const money = value => value.toLocaleString('pl-PL')+' zł';
const kitTotal = (v,kit,shipping) => v.kits[kit]+(shipping==='air'?(v.air[kit]||0):0);
const kitSlug = kit => normal(kit).replaceAll(' ','-');
function cardUrl(vehicle, kit) {
  return base+'/auto/'+vehicle.code+(kit===baseKit(vehicle)?'':'?zestaw='+kitSlug(kit));
}
