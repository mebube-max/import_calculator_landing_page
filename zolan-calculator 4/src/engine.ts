import Decimal from 'decimal.js';
import type {Experience} from './experience';
Decimal.set({precision:40});
export const categories=['China domestic delivery','Sourcing/agent fee','Inspection','Consolidation','Warehouse charges','International freight','Cargo insurance','Customs duty','Import VAT/tax','Other levies','Documentation','Clearing agent fee','Port/terminal charges','Local transportation','Other landed cost'];
export type Row={id:string;label:string;category:string;amount:string;currency:string;basis:string;status:string;note:string;recover:string;percent:boolean;base:string;refs:string[];context:string;includes:string[];exclusions:string;baseCurrency:string;customsRate:string;includedIn?:string};
export type Scenario={name:string;fx:string;freight:string;price:string;sellable:string;sales:string;supplier?:string;priceAmount?:string;fxCurrency?:string};
export type Model={version:1;name:string;description:string;hs:string;method:string;q:string;s:string;unit:string;currency:string;cny:string;usd:string;advanced:boolean;supplierCny:string;supplierUsd:string;mode:string;total:string;fee:string;feePct:string;rateDate:string;rateNote:string;rows:Row[];price:string;selling:{label:string;amount:string;pct:string}[];target:string;planning:boolean;monthly:string;months:string;overhead:string;oneoff:string;scenarios:Scenario[];illustrative:boolean;experience?:Experience;combinedScenario?:Scenario;productName?:string};
export const row=(label:string,id:string=crypto.randomUUID()):Row=>({id,label,category:label,amount:'',currency:'NGN',basis:'batch',status:'unknown',note:'',recover:'0',percent:false,base:'supplier',refs:[],context:'logistics',includes:[],exclusions:'',baseCurrency:'NGN',customsRate:''});
export const blank=():Model=>({version:1,name:'',description:'',hs:'',method:'Air',q:'',s:'',unit:'',currency:'CNY',cny:'',usd:'',advanced:false,supplierCny:'',supplierUsd:'',mode:'separate',total:'',fee:'',feePct:'',rateDate:'',rateNote:'',rows:categories.map(x=>row(x)),price:'',selling:['Packaging','Advertising','Payment fees','Marketplace fees','Delivery you pay for','Returns or replacements','Other selling expense'].map(label=>({label,amount:'',pct:''})),target:'',planning:false,monthly:'',months:'1',overhead:'',oneoff:'',scenarios:[],illustrative:false});
export const sample=():Model=>{const m=blank();Object.assign(m,{name:'Illustrative handbag shipment',description:'Handbags',q:'100',s:'100',unit:'40',cny:'220',price:'25000',fee:'0',target:'20',planning:true,monthly:'20',overhead:'220000',oneoff:'0',illustrative:true});m.rows.forEach(r=>{r.status='na'});for(const [label,amount,currency] of [['China domestic delivery','150','CNY'],['Sourcing/agent fee','100','CNY'],['International freight','300000','NGN'],['Cargo insurance','15000','NGN'],['Customs duty','180000','NGN'],['Import VAT/tax','120000','NGN'],['Clearing agent fee','60000','NGN'],['Local transportation','50000','NGN']])Object.assign(m.rows.find(r=>r.label===label)!,{amount,currency,status:'estimate'});['500','2000','300','0','700','500','0'].forEach((a,i)=>m.selling[i].amount=a);return m};
export function num(v:string,required=false):Decimal{
 const x=v.trim().replace(/^[₦¥$]\s*/,'');if(!x){if(required)throw Error('Enter an amount.');return new Decimal(0)}
 if(!/^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$/.test(x))throw Error('Enter zero or a positive amount. Use a dot for decimals.');
 const d=new Decimal(x.replaceAll(',',''));if(d.gt('1000000000000'))throw Error('This amount is above the supported limit.');return d;
}
export function calc(m:Model){
 const errors:Record<string,string>={};
 const read=(v:string,key:string,required=false)=>{try{return num(v,required)}catch(e){errors[key]=(e as Error).message;return new Decimal(0)}};
 const q=read(m.q,'q',true),s=read(m.s,'s',true);
 if(!m.q.trim())errors.q='Enter the number of items.';else if(!q.isInteger())errors.q='Use a whole number.';else if(q.lt(1)||q.gt(1000000))errors.q='Enter between 1 and 1,000,000 items.';
 if(!s.isInteger())errors.s='Use a whole number.';else if(s.lt(1))errors.s='Enter at least one sellable item.';else if(s.gt(q))errors.s='This cannot be more than the quantity you’re buying.';
 const rate=(c:string,ctx='logistics')=>{if(c==='NGN')return new Decimal(1);let key=c==='CNY'?'cny':'usd';if(ctx==='supplier'&&m.advanced)key=c==='CNY'?'supplierCny':'supplierUsd';const d=read(m[key as keyof Model] as string,key,true);if(d.lte(0))errors[key]='Enter an exchange rate above zero.';return d};
 const invoice=m.mode==='total'?new Decimal(0):read(m.unit,'unit',true).mul(q);
 if(m.mode!=='total'&&!m.unit.trim())errors.unit='Enter the price per item.';
 const converted=m.mode==='total'?read(m.total,'total',true):invoice.mul(rate(m.currency,'supplier'));
 if(m.mode==='total'&&!m.total.trim())errors.total='Enter your supplier payment.';
 let payment=converted;
 if(m.mode==='separate'&&(!m.experience||m.experience.feeEnabled))payment=payment.add(read(m.fee,'fee')).add(converted.mul(read(m.feePct,'feePct')).div(100));
 if(payment.gt('1000000000000'))errors[m.mode==='total'?'total':'unit']='This amount is above the supported limit.';
 const effective=invoice.gt(0)?converted.div(invoice):null;
 const isActive=(r:Row)=>!m.experience||(m.experience.costMode==='detailed'?r.id!=='simple-import-total':r.id==='simple-import-total'||r.category==='International freight');
 const active=m.rows.filter(isActive),included=new Map<string,string>();
 for(const r of active.filter(r=>!['na','unknown','included'].includes(r.status)))for(const cat of r.includes){if(included.has(cat))errors[r.id]='Two quotes include '+cat+'. Review the overlap.';included.set(cat,r.id)}
 const shipping=active.find(r=>r.category==='International freight'),other=active.find(r=>r.id==='simple-import-total');
 if(m.experience?.costMode==='simple'&&shipping?.includes.length&&!['na','unknown','included'].includes(shipping.status)&&other&&!['na','unknown','included'].includes(other.status)&&!m.experience.overlapResolved){try{if(num(other.amount).gt(0))errors.overlap='Review whether your other costs overlap with the shipping quote.'}catch{/* The amount field has its own error. */}}
 const values=new Map<string,Decimal>(),visiting=new Set<string>();const missing:string[]=[];let recovery=new Decimal(0);
 const trace:{id:string;label:string;amount:string;currency:string;rate:string;ngn:string;status:string;reason:string;base:string;recover:string;note:string}[]=[];
 const evalRow=(r:Row):Decimal=>{
  if(values.has(r.id))return values.get(r.id)!;
  if(visiting.has(r.id)){errors[r.id]='These costs refer back to each other. Remove the circular reference.';return new Decimal(0)}
  visiting.add(r.id);let value=new Decimal(0),reason='',fx=new Decimal(1),baseText='';
  if(!isActive(r))reason='Inactive '+(r.id==='simple-import-total'?'simple total':'detailed row')+' (retained, excluded)';
  else if(included.has(r.category)&&included.get(r.category)!==r.id)reason='Included in '+(m.rows.find(x=>x.id===included.get(r.category))?.label||'quote');
  else if(r.status==='included'){
   const quote=active.find(x=>x.id===r.includedIn);
   if(!quote||quote.id===r.id||['unknown','na','included'].includes(quote.status))errors[r.id]='Choose an entered quote that includes this cost.';
   else reason='Included in '+quote.label;
  }else if(r.status==='na')reason='Not applicable';
  else if(r.status==='unknown'){missing.push(r.label);reason='I don’t know yet'}
  else{
   if(r.percent){const pct=read(r.amount,r.id,true);let base=m.mode==='total'?payment:converted;baseText=m.mode==='total'?'Total supplier payment in NGN':'Converted supplier invoice';
    if(r.base==='manual'){base=read(r.note,r.id+'base',true);baseText='Manual base '+r.note+' '+r.baseCurrency;if(r.baseCurrency!=='NGN'){const customs=read(r.customsRate,r.id+'customsRate',true);if(customs.lte(0))errors[r.id+'customsRate']='Enter a customs exchange rate above zero.';base=base.mul(customs);baseText+=' at '+r.customsRate+' NGN'}}
    if(r.base==='selected'){if(!r.refs.length)errors[r.id]='Select at least one cost for this percentage base.';base=r.refs.reduce((a,id)=>{const ref=m.rows.find(x=>x.id===id);if(!ref){errors[r.id]='A selected cost is missing.';return a}return a.add(evalRow(ref))},new Decimal(0));baseText='Selected costs: '+r.refs.map(id=>m.rows.find(x=>x.id===id)?.label||id).join(', ')}
    value=base.mul(pct).div(100);
   }else{fx=rate(r.currency,r.context);value=read(r.amount,r.id,true).mul(fx).mul(r.basis==='unit'?q:1);baseText=r.basis==='unit'?'Multiplied by ordered quantity':'Whole shipment'}
   if(value.gt('1000000000000'))errors[r.id]='This amount is above the supported limit.';
   const rp=read(r.recover,r.id+'recover');if(rp.gt(100))errors[r.id+'recover']='Enter a recoverable portion from 0 to 100%.';
   if(r.includes.length&&rp.gt(0))errors[r.id+'recover']='Itemise recoverable tax outside the combined quote.';
   recovery=recovery.add(value.mul(rp).div(100));
  }
  visiting.delete(r.id);values.set(r.id,value);trace.push({id:r.id,label:r.label,amount:r.amount,currency:r.percent?'%':r.currency,rate:fx.toString(),ngn:value.toString(),status:r.status,reason,base:baseText,recover:r.recover,note:r.note});return value;
 };
 let cash=payment;for(const r of m.rows)cash=cash.add(evalRow(r));
 if(m.experience?.shippingUnsure)missing.push('What the shipping quote includes');
 const econ=cash.sub(recovery),cost=s.gt(0)?econ.div(s):new Decimal(0);
 const landingValid=Object.keys(errors).length===0;
 let fixed=new Decimal(0),rp=new Decimal(0);
 if(m.experience?.sellingMode==='simple'){
  if(m.experience.sellingStatus==='unknown')missing.push('Selling expenses per item');
  if(m.experience.sellingStatus==='entered')fixed=read(m.experience.sellingTotal,'sellingTotal',true);
 }else if(m.experience?.sellingStatus!=='na'){m.selling.forEach((x,i)=>{fixed=fixed.add(read(x.amount,'sell'+i));rp=rp.add(read(x.pct,'pct'+i))});if(m.experience?.sellingStatus==='unknown')missing.push('Selling expenses per item');
  if(read(m.selling[5].amount,'sell5').gt(0)&&read(m.selling[5].pct,'pct5').gt(0))errors.sell5='Use an average amount or a revenue percentage, not both.';
 }
 const pricingValid=landingValid&&!Object.keys(errors).some(k=>k.startsWith('sell')||k.startsWith('pct'))&&m.experience?.sellingStatus!=='unknown';
 const fraction=rp.div(100),p=m.price.trim()?read(m.price,'price',true):null;
 if(p?.lte(0))errors.price='Enter a selling price above zero.';
 const salesValid=landingValid&&!Object.keys(errors).some(k=>k==='price'||k.startsWith('sell')||k.startsWith('pct'));
 const variable=p?fixed.add(p.mul(fraction)):null,contribution=p&&variable?p.sub(cost).sub(variable):null,gross=p?p.sub(cost):null,available=p&&variable?p.sub(variable):null;
 const target=m.target.trim()?read(m.target,'target'):null;if(target?.gte(100))errors.target='Enter a target margin below 100%.';
 const denominator=new Decimal(1).sub(fraction).sub(target?.div(100)||0);
 const targetPrice=target!==null&&denominator.gt(0)&&!errors.target&&pricingValid?cost.add(fixed).div(denominator).toDecimalPlaces(2,Decimal.ROUND_CEIL):null;
 let monthly:Decimal|null=null,k:Decimal|null=null,forecast:Decimal|null=null;
 if(m.planning){monthly=read(m.monthly,'monthly',true);const months=read(m.months,'months',true);if(!monthly.isInteger()||monthly.lte(0))errors.monthly='Enter expected monthly sales as a positive whole number.';if(!months.isInteger()||months.lte(0))errors.months='Enter a positive whole number of months.';k=read(m.overhead,'overhead').mul(months).add(read(m.oneoff,'oneoff'));forecast=Decimal.min(s,monthly.mul(months))}
 const planningValid=salesValid&&!['monthly','months','overhead','oneoff'].some(k=>errors[k]);
 const units=available?.gt(0)?cash.div(available).ceil():cash.isZero()&&available?.isZero()?new Decimal(0):null;
 const achievable=units!==null&&units.lte(s);
 return{errors,valid:Object.keys(errors).length===0,landingValid,salesValid,planningValid,pricingValid,missing,trace,invoice,payment,effective,cash,recovery,econ,cost,p,fixed,fraction,variable,gross,grossMargin:p&&gross?gross.div(p).mul(100):null,markup:gross&&cost.gt(0)?gross.div(cost).mul(100):null,contribution,margin:p&&contribution?contribution.div(p).mul(100):null,batch:contribution?.mul(s)||null,zeroPrice:pricingValid&&fraction.lt(1)?cost.add(fixed).div(new Decimal(1).sub(fraction)).toDecimalPlaces(2,Decimal.ROUND_CEIL):null,targetPrice,units,achievable,shortfall:available?Decimal.max(0,cash.sub(available.mul(s))):null,recoveryMonths:achievable&&monthly?.gt(0)&&planningValid?units!.div(monthly):null,sellthrough:monthly?.gt(0)&&planningValid?s.div(monthly):null,k,forecast,operating:contribution&&forecast&&k&&planningValid?contribution.mul(forecast).sub(k):null,breakEven:contribution?.gt(0)&&k&&planningValid?k.div(contribution).ceil():null};
}
export function scenario(m:Model,t:Scenario):Model{
 const b=structuredClone(m);const factor=(v:string)=>{if(!/^[+-]?\d*(?:\.\d+)?$/.test(v)||v==='-'||v==='+')throw Error('Enter a percentage change.');const d=new Decimal(v||0);if(d.lt(-100)||d.abs().gt(10000))throw Error('Changes must be between -100% and 10,000%.');return new Decimal(1).add(d.div(100))};
 const f=factor(t.fx);const currency=t.fxCurrency||m.currency;
 for(const key of (currency==='NGN'?[]:currency==='USD'?['usd','supplierUsd']:currency==='both'?['cny','supplierCny','usd','supplierUsd']:['cny','supplierCny']) as ('cny'|'supplierCny'|'usd'|'supplierUsd')[])if(b[key])b[key]=num(b[key]).mul(f).toString();
 if(t.supplier){if(b.mode==='total')b.total=num(b.total).mul(factor(t.supplier)).toString();else if(b.currency==='NGN')b.unit=num(b.unit).mul(factor(t.supplier)).toString();}
 b.rows.filter(r=>r.category==='International freight'||r.includes.includes('International freight')).forEach(r=>{if(r.amount)r.amount=num(r.amount).mul(factor(t.freight)).toString()});
 if(t.priceAmount!==undefined)b.price=num(t.priceAmount,true).toString();else if(b.price)b.price=num(b.price).mul(factor(t.price)).toString();if(t.sellable)b.s=t.sellable;
 if(b.monthly)b.monthly=Decimal.max(1,num(b.monthly).mul(factor(t.sales)).floor()).toString();return b;
}
export const stress:Scenario={name:'Combined changes',fx:'5',freight:'15',price:'-10',sellable:'',sales:'-50'};
export function shipping(mode:string,h:Record<string,string>){const n=(k:string)=>num(h[k]||'0');for(const k of ['length','width','height','count','rate'])if(n(k).lte(0))throw Error('Enter positive dimensions, package count and shipping rate.');if(!n('count').isInteger())throw Error('Package count must be a whole number.');const volume=n('length').mul(n('width')).mul(n('height')).mul(n('count')),cbm=volume.div(1000000);if(mode==='Sea')return{weight:cbm,amount:Decimal.max(cbm,n('minimum')).mul(n('rate')).add(n('surcharge')),unit:'CBM'};const divisor=n('divisor');if(divisor.lte(0))throw Error('Enter a volumetric divisor above zero.');let weight=Decimal.max(n('actual'),volume.div(divisor));if(n('rounding').gt(0))weight=weight.div(n('rounding')).ceil().mul(n('rounding'));return{weight,amount:Decimal.max(weight.mul(n('rate')),n('minimum')).add(n('surcharge')),unit:'chargeable kg'};}
export function validateImport(x:unknown):Model{
 if(!x||typeof x!=='object')throw Error('Invalid calculation file.');const m=(x as {input?:Model}).input||x as Model;const template=blank();if(m.version!==1)throw Error('Unsupported calculation version.');
 for(const k of Object.keys(template)){const a=m[k as keyof Model],b=template[k as keyof Model];if(typeof a!==typeof b||Array.isArray(b)!==Array.isArray(a))throw Error('Invalid field: '+k)}
 if(m.rows.length>100||m.scenarios.length>3||m.selling.length!==7)throw Error('Too many calculation rows.');
 for(const r of m.rows){if(!r||typeof r!=='object')throw Error('Invalid cost row.');for(const [k,v]of Object.entries(row(''))){if(typeof r[k as keyof Row]!==typeof v)throw Error('Invalid cost row.')}if(!['NGN','CNY','USD'].includes(r.currency)||!['unknown','estimate','quoted','actual','na','included'].includes(r.status)||!['NGN','CNY','USD'].includes(r.baseCurrency)||!['batch','unit'].includes(r.basis)||!['supplier','manual','selected'].includes(r.base)||!['logistics','supplier'].includes(r.context))throw Error('Invalid cost settings.');if(!Array.isArray(r.refs)||!Array.isArray(r.includes)||![...r.refs,...r.includes].every(s=>typeof s==='string'))throw Error('Invalid cost references.');if(r.includedIn!==undefined&&typeof r.includedIn!=='string')throw Error('Invalid included quote.');}
 if(m.productName!==undefined&&(typeof m.productName!=='string'||m.productName.length>100))throw Error('Invalid product name.');if(m.name.length>100||m.description.length>200)throw Error('Text too long.');
 for(const x of m.selling)if(!x||typeof x.label!=='string'||typeof x.amount!=='string'||typeof x.pct!=='string')throw Error('Invalid selling expense.');
 for(const t of [...m.scenarios,...(m.combinedScenario?[m.combinedScenario]:[])]){for(const k of ['name','fx','freight','price','sellable','sales'] as const)if(typeof t[k]!=='string')throw Error('Invalid scenario.');if(t.priceAmount!==undefined&&typeof t.priceAmount!=='string')throw Error('Invalid alternative price.');if(t.fxCurrency!==undefined&&!['CNY','USD','NGN','both'].includes(t.fxCurrency))throw Error('Invalid scenario currency.');if(t.supplier!==undefined&&typeof t.supplier!=='string')throw Error('Invalid supplier change.');}
 if(!['CNY','NGN','USD'].includes(m.currency)||!['separate','allin','total'].includes(m.mode))throw Error('Invalid payment settings.');if(new Set(m.rows.map(r=>r.id)).size!==m.rows.length)throw Error('Duplicate cost IDs.');
 if(m.experience){const e=m.experience;if(e.foreignMode!==undefined&&!['separate','allin'].includes(e.foreignMode))throw Error('Invalid saved payment mode.');if(!['simple','detailed'].includes(e.costMode)||!['simple','detailed'].includes(e.sellingMode)||!['entered','na','unknown'].includes(e.sellingStatus)||typeof e.sellingTotal!=='string'||!['Air','Sea'].includes(e.helperMode)||typeof e.appliedHelper!=='string')throw Error('Invalid entry mode.');for(const k of ['sellableAdjusted','feeEnabled','shippingUnsure','overlapResolved'] as const)if(typeof e[k]!=='boolean')throw Error('Invalid entry setting.');if(!e.helper||typeof e.helper!=='object'||Object.values(e.helper).some(v=>typeof v!=='string'))throw Error('Invalid shipping helper.');if(m.rows.filter(r=>r.id==='simple-import-total').length!==1)throw Error('Missing simple cost total.');}
 return structuredClone(m);
}
