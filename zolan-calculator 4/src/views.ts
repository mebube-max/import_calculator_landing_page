import {calc,categories,type Model,type Row} from './engine';
import {experience,freight,other,otherSubtotal,inclusionGroups,SIMPLE_OTHER_ID} from './experience';
import {config} from './config';
export const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export const money=(v:{toFixed:(n:number)=>string}|null|undefined)=>{if(v===null||v===undefined)return 'Not available';const n=Number(v.toFixed(2));return (n<0?'−':'')+'₦'+Math.abs(n).toLocaleString('en-NG',{minimumFractionDigits:n%1===0?0:2,maximumFractionDigits:2});};
export const fmt=(v:{toFixed:(n:number)=>string}|null|undefined,suffix='')=>v===null||v===undefined?'Not available':v.toFixed(2)+suffix;
export const helpCopy:Record<string,string>={
 'Minimum price':'This covers the item’s landed cost and selling expenses. It does not cover fixed business costs or taxes.',
 'Whole-order estimate':'Assumes all sellable items sell at the entered price and selling expenses stay the same.',
 'Lower-price comparison':'Shows what changes if you reduce your selling price. Percentage fees are recalculated; other costs stay the same.',
 'Total supplier payment':'The full naira amount you’ll pay for the goods. Include the supplier-payment fee if it is part of that total.',
 'Price per item':'What your supplier charges for one item, before shipping and other costs.',
 'Exchange rate':'How many naira you’ll pay for one yuan or dollar. Use your payment provider’s quote.',
 'Separate payment fee':'Add this only if it is charged on top of your exchange rate. A total naira supplier payment already includes its payment fee.',
 'Shipping':'The cost of moving your goods from China to Nigeria. Check which other charges are included.',
 'Other import and delivery costs':'Costs outside your shipping quote, such as duty, clearing and transport to your shop or warehouse.',
 'Combined quote':'One price may cover several charges. Mark what is included so those charges are not counted twice.',
 'Selling expenses per item':'The average cost of making one sale, such as packaging, advertising, fees and delivery you cover.',
 'Sellable items':'If some items are damaged or unusable, the shipment cost is shared across the items you can sell.',
 'Advertising':'For example, ₦20,000 spent to generate 10 completed sales is ₦2,000 per sale.',
 'Returns or replacements':'Spread expected return or replacement expenses across your sales. Do not count pre-sale damaged stock here again.',
 'Cost per sellable item':'Your landed inventory cost divided by the number of items you expect to sell.',
 'What each sale leaves you':'Selling price minus landed cost and selling expenses. You still need to cover overhead, financing and business taxes.',
 'Margin after selling expenses':'The percentage of your selling price left after item and selling costs. It is not final net profit.',
 'Cash needed for this shipment':'The upfront cash to buy and land the goods, including import taxes you pay.',
 'Sales to recover shipment cash':'How many sales could cover your upfront shipment outlay after setting aside selling expenses. This assumes immediate customer payment and excludes other cash payments.',
 'Recoverable tax':'Change this only after confirming with your accountant. A recoverable tax may still need to be paid upfront.',
 'Target margin':'The share of selling price you want left after item and selling costs, before overhead and taxes.',
 'Operating break-even':'How many sales are needed to cover the fixed business costs you entered for the selected period.',
 'Selling price per item':'Enter product revenue after separately collected sales tax. Do not add delivery charges the customer pays separately to your product selling price.'
};
export const help=(label:string)=>`<button type="button" class="help-button" aria-label="Help: ${esc(label)}" data-help="${esc(label)}">i</button>`;
export const button=(text:string,action:string,cls='')=>`<button type="button" class="${cls}" data-action="${esc(action)}">${text}</button>`;
let fieldCount=0;
export function input(label:string,key:string,value:string,opts:{hint?:string;help?:string;type?:string;placeholder?:string;readonly?:boolean;disabled?:boolean;unit?:string;max?:number}={}){
 const suffix=++fieldCount;const id='field-'+key+'-'+suffix;return `<div class="field"><div class="field-label"><label for="${id}">${label}</label>${opts.help?help(opts.help):''}</div><div class="input-shell">${opts.unit?`<span class="input-unit">${esc(opts.unit)}</span>`:''}<input id="${id}" data-key="${key}" value="${esc(value)}" type="${opts.type||'text'}" ${!opts.type?'inputmode="decimal"':''} ${opts.max?`maxlength="${opts.max}"`:''} placeholder="${esc(opts.placeholder||'')}" ${opts.readonly?'readonly':''} ${opts.disabled?'disabled':''} aria-describedby="hint-${key}-${suffix} err-${key}-${suffix}"></div><small id="hint-${key}-${suffix}">${opts.hint||''}</small><span class="error" id="err-${key}-${suffix}" hidden></span></div>`;
}
export function select(label:string,key:string,value:string,options:string[][]){const suffix=++fieldCount;return `<div class="field"><label for="field-${key}-${suffix}">${label}</label><select id="field-${key}-${suffix}" data-key="${key}" aria-describedby="err-${key}-${suffix}">${options.map(([v,l])=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(l)}</option>`).join('')}</select><span class="error" id="err-${key}-${suffix}" hidden></span></div>`}
export const currencies=[['NGN','NGN · naira'],['CNY','CNY · yuan'],['USD','USD · dollars']];
export const statusOptions=[['estimate','Enter an amount'],['included','Included in another quote'],['na','Not applicable'],['unknown','I don’t know yet']];
export const disclosure=(id:string,label:string,body:string,open=false,cls='')=>`<details id="${id}" class="disclosure ${cls}" ${open?'open':''}><summary>${label}<span aria-hidden="true">＋</span></summary><div class="disclosure-body">${body}</div></details>`;
const check=(label:string,key:string,checked:boolean)=>`<label class="check"><input type="checkbox" data-key="${key}" ${checked?'checked':''}>${label}</label>`;
export function rateField(m:Model,currency:string,context='logistics'){
 if(currency==='NGN')return '';
 const key=context==='supplier'&&m.advanced?(currency==='CNY'?'supplierCny':'supplierUsd'):(currency==='CNY'?'cny':'usd');
 return input(currency==='CNY'?'Naira for ¥1':'Naira for US$1',key,m[key],{unit:'₦',help:'Exchange rate',hint:context==='supplier'?'Use the rate your payment provider will charge.':'Use the conversion rate for this cost.'});
}
export function stepOne(m:Model){const e=experience(m),r=calc(m);return `
 <p class="section-intro">How many items are you buying, and what will you pay your supplier?</p>
 <div class="grid core-grid">${input('How many items?','q',m.q,{placeholder:'For example, 100',hint:'Enter the total number you’re buying.'})}
 ${input('Total supplier payment','total',m.mode==='total'?m.total:r.landingValid?r.payment.toFixed(2):'',{unit:'₦',readonly:m.mode!=='total',help:'Total supplier payment',placeholder:'Enter the full amount',hint:m.mode==='total'?'Enter the full naira amount for the goods, including any supplier-payment fee.':'Calculated from your active per-item price and conversion rate.'})}</div>
 <p class="inline-subtotal" id="supplier-subtotal"></p>
 ${m.mode!=='total'?`<p class="mode-note">Your per-item price is active. Separate total-payment values are kept but excluded. ${button('Use a naira total instead','totalmode','link-button')}</p>`:''}
 ${input('Product name <span class="optional">optional</span>','productName',m.productName||'',{type:'text',max:100,placeholder:'For example, handbags'})}
 ${disclosure('foreign-entry','Enter the price in yuan or dollars instead',`
  <p class="help-text">This is an alternative to entering a full naira payment. Only one payment entry is used.</p>
  <div class="grid">${input('Price per item','unit',m.unit,{help:'Price per item'})}${select('Currency','currency',m.currency,currencies)}${rateField(m,m.currency,'supplier')}</div>
  ${m.mode==='total'?button('Use this price entry','foreignmode','secondary'):''}
  ${m.mode!=='total'?disclosure('payment-fees','Add a separate payment fee',`
   ${check('Add a fee on top of my rate','experience.feeEnabled',e.feeEnabled)}
   <div class="grid">${input('Fixed fee','fee',m.fee,{unit:'₦',help:'Separate payment fee',disabled:!e.feeEnabled||m.mode==='allin'})}${input('Percentage fee','feePct',m.feePct,{unit:'%',hint:'Applies to the converted supplier invoice only.',disabled:!e.feeEnabled||m.mode==='allin'})}</div>
   ${check('Already included in my rate','allin',m.mode==='allin')}
   <p class="help-text">${m.mode==='allin'?'Your all-in rate is active. Separate fee amounts are retained and excluded.':'Fees are added only when enabled and charged separately.'}</p>`,e.feeEnabled||m.mode==='allin'):''}
 `)}
 ${disclosure('goods-details','Add more details',`
  ${check('Allow for damaged or unusable items','experience.sellableAdjusted',e.sellableAdjusted)}
  <div id="sellable-fields">${e.sellableAdjusted?input('How many items do you expect to sell?','s',m.s,{help:'Sellable items',hint:'Your shipment cost will be shared across these items.'})+disclosure('loss-helper','Estimate from a damage percentage',input('Damaged or unusable items %','aux.loss','',{unit:'%'})+'<p id="loss-suggestion" class="help-text"></p>'+button('Use rounded sellable quantity','loss')):''}</div>
  ${check('Use separate supplier and logistics exchange rates','advanced',m.advanced)}
  ${m.advanced?`<div class="grid">${input('Supplier naira for ¥1','supplierCny',m.supplierCny,{unit:'₦',help:'Exchange rate'})}${input('Supplier naira for US$1','supplierUsd',m.supplierUsd,{unit:'₦',help:'Exchange rate'})}${input('Logistics naira for ¥1','cny',m.cny,{unit:'₦'})}${input('Logistics naira for US$1','usd',m.usd,{unit:'₦'})}</div>`:''}
  <div class="grid">${input('Quote date','rateDate',m.rateDate,{type:'date'})}${input('Quote notes','rateNote',m.rateNote,{type:'text',max:300})}</div>
  ${input('Product description','description',m.description,{type:'text',max:200})}<p class="help-text">No live exchange rate or quote validity is implied.</p>
 `)}
 <div class="step-actions">${button('Next: getting them to Nigeria →','next:2','primary')}</div>`;
}
const userLabel:Record<string,string>={'China domestic delivery':'Delivery within China','Sourcing/agent fee':'Agent or sourcing fee','International freight':'International shipping','Cargo insurance':'Insurance','Customs duty':'Customs duty','Import VAT/tax':'Import taxes','Clearing agent fee':'Clearing','Port/terminal charges':'Port or terminal charges','Local transportation':'Delivery to your location'};
export function costEditor(m:Model,r:Row,i:number){const included=m.rows.find(x=>x.id!==r.id&&x.includes.includes(r.category)&&!['unknown','na','included'].includes(x.status)&&x.id!==SIMPLE_OTHER_ID);const prefix=`rows.${i}`;
 return disclosure('cost-'+r.id,`${esc(userLabel[r.category]||r.label)} <span class="row-status">${esc(included?'Included in '+included.label:r.status==='unknown'?'Not entered':r.status==='na'?'Not applicable':r.status==='included'?'Included in another quote':r.amount+' '+(r.percent?'%':r.currency))}</span>`,`
 ${select('Cost status',prefix+'.status',r.status,[['unknown','I don’t know yet'],['na','Not applicable'],['estimate','Estimated amount'],['quoted','Quoted amount'],['actual','Actual amount'],['included','Included in another quote']])}
 ${r.status==='included'?select('Included in',prefix+'.includedIn',r.includedIn||'', [['','Choose a quote'],...m.rows.filter(x=>x.id!==r.id&&x.id!==SIMPLE_OTHER_ID).map(x=>[x.id,x.label])]):''}
 ${included?`<p class="inclusion-note">Included in ${esc(included.label)}. Remove the category from that quote before editing this row.</p>`:`<div class="grid">${input(r.percent?'Your percentage rate':'Amount',prefix+'.amount',r.amount,{unit:r.percent?'%':undefined,disabled:r.status==='na'||r.status==='included'})}${!r.percent?select('Currency',prefix+'.currency',r.currency,currencies)+select('Amount covers',prefix+'.basis',r.basis,[['batch','Whole shipment'],['unit','Each item ordered']])+rateField(m,r.currency,r.context):''}</div>`}
 ${r.basis==='unit'?'<p class="help-text">Multiplied by quantity ordered, including unusable items.</p>':''}
 ${disclosure('extra-'+r.id,'More cost settings',`
  <div class="grid">${input('Cost label',prefix+'.label',r.label,{type:'text',max:100})}${select('Category',prefix+'.category',r.category,categories.map(x=>[x,userLabel[x]||x]))}${select('Conversion rate',prefix+'.context',r.context,[['logistics','Logistics rate'],['supplier','Supplier-payment rate']])}${input('Quote notes',prefix+'.exclusions',r.exclusions,{type:'text'})}</div>
  ${r.includes.length?'<p class="help-text">This combined quote includes costs listed in Advanced import settings.</p>':''}
 `)}
 <span class="error" id="rowerr-${r.id}" hidden></span>
 ${i>=categories.length?button('Remove this cost','removecost:'+r.id,'link-button'):''}
 `,false,'cost-row');
}
function coreCost(m:Model,r:Row,label:string,hint:string){const i=m.rows.indexOf(r),prefix='rows.'+i;const includedOptions=[['','Choose a quote'],...m.rows.filter(x=>x.id!==r.id&&(x.category==='International freight'||x.id===SIMPLE_OTHER_ID||x.includes.length)).map(x=>[x.id,x.label])];return `${select('For '+label.toLowerCase(),prefix+'.status',['quoted','actual'].includes(r.status)?'estimate':r.status,statusOptions)}${input(label,prefix+'.amount',r.amount,{unit:r.currency==='NGN'?'₦':r.currency==='CNY'?'¥':'US$',help:label,placeholder:'Enter the shipment total',hint,disabled:r.status==='na'||r.status==='included'||(r.status==='unknown'&&!!r.amount)})}${r.status==='included'?select('Included in',prefix+'.includedIn',r.includedIn||'',includedOptions):''}`}
export function stepTwo(m:Model){const e=experience(m),f=freight(m),o=other(m),fi=m.rows.indexOf(f),r=calc(m);const shippingComplex=f.percent||f.basis==='unit';return `
 <p class="section-intro">Add what you’ll pay to get the goods to your shop or warehouse.</p>
 ${shippingComplex?`<p class="mode-note">Shipping uses detailed rate or per-item settings. Review its calculated total below.</p>${input('Shipping','display.shipping',r.trace.find(x=>x.id===f.id)?.ngn||'',{readonly:true,unit:'₦',help:'Shipping'})}`:coreCost(m,f,'Shipping','Enter the cost of moving the goods from China to Nigeria.')}
 ${disclosure('shipping-currency','Use a shipping quote in yuan or dollars',select('Shipping currency',`rows.${fi}.currency`,f.currency,currencies)+rateField(m,f.currency),f.currency!=='NGN')}
 ${disclosure('shipping-inclusions','My quote includes other costs',`
  <p class="field-label">What does it include? ${help('Combined quote')}</p>
  <div class="check-grid">${inclusionGroups.map(g=>`<label class="check"><input type="checkbox" data-group="${g.label}" ${g.categories.every(c=>f.includes.includes(c))?'checked':''}>${g.label}</label>`).join('')}</div>
  ${check('I’m not sure','experience.shippingUnsure',e.shippingUnsure)}
  ${e.shippingUnsure?'<p class="missing-note">Check what your shipping company includes. Extra charges may still apply.</p>':''}
  <div id="overlap-review"></div>
 `,f.includes.length>0||e.shippingUnsure)}
 <div class="cost-divider"></div>
 ${e.costMode==='simple'?coreCost(m,o,'Other import and delivery costs','Add costs outside your shipping quote, such as duty, clearing and delivery to your location.'):`${input('Other import and delivery costs','display.other',otherSubtotal(m).toFixed(2),{readonly:true,unit:'₦',help:'Other import and delivery costs',hint:'Total of your active detailed costs, excluding shipping. Your simple total is retained and excluded.'})}<p class="mode-note">Detailed costs are active. ${button('Return to a single total','simplecosts','link-button')}</p>`}
 ${disclosure('cost-breakdown','Break these costs down',`
  <p class="help-text">Use separate quotes instead of a single other-cost total. We won’t invent a breakdown for your total.</p>
  ${e.costMode==='simple'?`<p class="mode-note">These detailed values are kept but excluded from your current estimate.</p>${button('Use detailed costs instead','detailedcosts','secondary')}`:'<p class="mode-note">Detailed costs are active. The total above is read-only and is not added again.</p>'}
  ${m.rows.map((cost,i)=>cost.id===SIMPLE_OTHER_ID?'':costEditor(m,cost,i)).join('')}
  <div class="actions">${button('Add another cost','addcost','secondary')}${button('Add a combined quote','addquote','secondary')}</div>
 `,false)}
 ${disclosure('import-advanced','Advanced import settings',`
  <p class="help-text">Use the rates and amounts for your shipment. This is not an official customs assessment. These settings apply to active detailed costs.</p>
  <div class="grid">${input('HS code','hs',m.hs,{type:'text',max:50})}${select('Shipping method','method',m.method,['Air','Sea LCL','Sea FCL','Courier','Other'].map(x=>[x,x]))}</div>
  ${e.costMode==='simple'?'<p class="mode-note">Choose detailed costs to apply tax rates, recovery or detailed quote inclusions.</p>':''}
  ${m.rows.filter(cost=>cost.id!==SIMPLE_OTHER_ID).map(cost=>{const i=m.rows.indexOf(cost),p='rows.'+i;return disclosure('tax-'+cost.id,esc(userLabel[cost.category]||cost.label),`
   ${check('Estimate from my own percentage and base',p+'.percent',cost.percent)}
   ${cost.percent?`<div class="grid">${input('Your rate %',p+'.amount',cost.amount,{unit:'%',disabled:e.costMode==='simple'})}${select('Base',p+'.base',cost.base,[['supplier',m.mode==='total'?'Total supplier payment in NGN':'Supplier invoice in NGN'],['manual','My customs value'],['selected','Selected costs']])}</div>${cost.base==='manual'?`<div class="grid">${input('Customs value',p+'.note',cost.note)}${select('Customs value currency',p+'.baseCurrency',cost.baseCurrency,currencies)}${cost.baseCurrency!=='NGN'?input('Customs naira per currency unit',p+'.customsRate',cost.customsRate,{unit:'₦',hint:'Independent of your supplier and logistics rates.'}):''}</div>`:cost.base==='selected'?`<div class="check-grid">${m.rows.filter(x=>x.id!==cost.id&&x.id!==SIMPLE_OTHER_ID).map(x=>`<label class="check"><input type="checkbox" data-ref="${cost.id}" value="${x.id}" ${cost.refs.includes(x.id)?'checked':''}>${esc(userLabel[x.category]||x.label)}</label>`).join('')}</div>`:''}`:''}
   ${['Customs duty','Import VAT/tax','Other levies'].includes(cost.category)?input('Recoverable tax portion',p+'.recover',cost.recover,{unit:'%',help:'Recoverable tax',hint:'Change only if confirmed with your accountant.',disabled:e.costMode==='simple'}):''}
   ${cost.includes.length||cost.label==='Combined logistics quote'?`<p class="field-label">Included categories ${help('Combined quote')}</p><div class="check-grid">${categories.map(c=>`<label class="check"><input type="checkbox" data-include="${cost.id}" value="${c}" ${cost.includes.includes(c)?'checked':''}>${esc(userLabel[c]||c)}</label>`).join('')}</div>${input('Excluded charges / notes',p+'.exclusions',cost.exclusions,{type:'text'})}`:''}
   ${input('Notes',p+'.note',cost.note,{type:'text',disabled:cost.percent&&cost.base==='manual'})}
  `)}).join('')}
 `)}
 ${disclosure('shipping-helper','Estimate shipping from weight or size',`
  <p class="help-text">Use a provider’s final quote when available. These helpers fill the shipping row only when you choose “Use this estimate”.</p>
  ${select('Shipping estimate','experience.helperMode',e.helperMode,[['Air','Air: weight estimate'],['Sea','Sea: volume-only estimate']])}
  <div class="grid">${['length','width','height','count',...(e.helperMode==='Air'?['actual','divisor','rounding']:[]),'rate','minimum','surcharge'].map(k=>input(({length:'Package length (cm)',width:'Width (cm)',height:'Height (cm)',count:'Number of identical packages',actual:'Total actual weight (kg)',divisor:'Provider volumetric divisor',rounding:'Provider weight rounding increment (kg)',rate:e.helperMode==='Air'?'Price per chargeable kg (NGN)':'Price per CBM (NGN)',minimum:e.helperMode==='Air'?'Minimum charge (NGN)':'Minimum billable CBM',surcharge:'Fixed surcharge (NGN)'} as Record<string,string>)[k],'experience.helper.'+k,e.helper[k]||'')).join('')}</div>
  <div id="shipping-estimate" class="helper-result"></div>${button('Use this estimate','shipping','secondary')}<p class="help-text">Changing these inputs never replaces an entered shipping quote automatically.</p>
 `)}
 <div class="step-actions">${button('← Your goods','back:1','link-button')}${button('Next: selling them →','next:3','primary')}</div>`;
}
export function stepThree(m:Model,aux:Record<string,string>){const e=experience(m),r=calc(m);return `
 <p class="section-intro">What will you sell each item for, and what will each sale cost?</p>
 ${input('Selling price per item','price',m.price,{unit:'₦',help:'Selling price per item',hint:'Enter what you expect to receive for the product.',placeholder:'For example, 25,000'})}
 ${select('Selling expenses', 'experience.sellingStatus',e.sellingStatus,[['entered','Enter my selling expenses'],['na','No selling expenses'],['unknown','I don’t know yet']])}
 ${input('Selling expenses per item',e.sellingMode==='simple'?'experience.sellingTotal':'display.selling',e.sellingMode==='simple'?e.sellingTotal:r.variable?.toFixed(2)||r.fixed.toFixed(2),{readonly:e.sellingMode==='detailed',disabled:e.sellingStatus==='na',unit:'₦',help:'Selling expenses per item',hint:e.sellingMode==='simple'?'Include packaging, ads, payment fees and delivery you cover.':'Calculated from detailed expenses. Percentage-based fees change with your selling price.'})}
 ${e.sellingMode==='detailed'?`<p class="mode-note">Detailed expenses are active. ${button('Use one selling-expense total','simpleselling','link-button')}</p>`:''}
 ${disclosure('selling-breakdown','Break down selling expenses',`
  ${e.sellingMode==='simple'?`<p class="mode-note">Detailed values are retained but excluded while your single total is active.</p>${button('Use detailed expenses instead','detailedselling','secondary')}`:'<p class="mode-note">Only the rows below contribute. The subtotal above is not added again.</p>'}
  <p class="help-text">Add only the costs involved in each sale. Optional rows you do not select can remain blank.</p>
  ${m.selling.map((x,i)=>`<div class="selling-row"><div class="field-label"><h4>${esc(x.label)}</h4>${help(i===1?'Advertising':i===5?'Returns or replacements':'Selling expenses per item')}</div><div class="grid">${input('Average NGN per sale','selling.'+i+'.amount',x.amount,{unit:'₦'})}${input('% of selling revenue','selling.'+i+'.pct',x.pct,{unit:'%'})}</div>${i===4?'<p class="help-text">Enter only the delivery cost you cover. If the customer pays the full cost separately, enter zero.</p>':i===5?'<p class="help-text">Use an average amount or revenue percentage, not both. Revenue percentage is an expense allowance, not a physical return rate. Pre-sale damaged stock is already allowed for in sellable items.</p>':''}</div>`).join('')}
  ${button('All my selling expenses are included','sellingcomplete','secondary')}
 `)}
 ${disclosure('ads-helper','Help me estimate advertising per sale',`
  <div class="grid">${input('Advertising spend','aux.adsSpend',aux.adsSpend||'',{unit:'₦',help:'Advertising'})}${input('Completed sales from that spend','aux.adsSales',aux.adsSales||'')}</div><div id="ads-estimate" class="helper-result"></div>${button('Use advertising estimate','advertising','secondary')}
 `)}
 ${disclosure('returns-helper','Estimate returns or replacements',`
  <div class="grid">${input('Expected return rate','aux.returnProb',aux.returnProb||'',{unit:'%',help:'Returns or replacements'})}${input('Average net expense per return','aux.returnCost',aux.returnCost||'',{unit:'₦'})}</div><div id="returns-estimate" class="helper-result"></div>${button('Use return expense estimate','returns','secondary')}
 `)}
 ${button('Help me set my price','openpricing','secondary')}
 <div class="step-actions">${button('← Getting them to Nigeria','back:2','link-button')}<a class="primary" href="#summary" data-action="viewresults">View results ↓</a></div>`;
}
export function page(m:Model,aux:Record<string,string>){fieldCount=0;return `
 <header><a class="brand" href="${config.zolanUrl}" target="_blank" rel="noopener"><span class="logo"><img src="${import.meta.env.BASE_URL}assets/logo.png" alt="Zolan"></span></a><nav><a href="${config.zolanUrl}" target="_blank" rel="noopener">Explore Zolan ↗</a></nav></header>
 <main><div class="hero"><p class="eyebrow">CHINA → NIGERIA · YOUR IMPORT PLAN</p><div class="hero-line"><div><h1>Check the numbers for your China order</h1><p class="intro">Add what you’ll pay, what it costs to bring the goods here, and what you’ll sell them for.</p></div>${button('Try an example','example','secondary')}</div></div>
 ${m.illustrative?`<div class="example-banner"><span>You’re viewing example figures. These are illustrative, not live quotes.</span>${button('Start my own calculation','own','link-button')}</div>`:''}
 <div class="toolbar"><span class="browser-note">Your figures stay in your browser.</span><div>${button('Saved calculations','saved','quiet')}${button('Save calculation','save','quiet')}${disclosure('toolbar-options','More options',`<div class="menu-actions">${button('Download Excel (.xlsx)','xlsx')}${button('Start a new calculation','own')}${button('Print / save as PDF','print')}</div>`)}</div></div>
 <p id="notice" role="status"></p>
 <div class="workspace" id="calculator"><div class="inputs">${[['1','Your goods',stepOne(m)],['2','Getting them to Nigeria',stepTwo(m)],['3','Selling them',stepThree(m,aux)]].map(([n,title,body])=>`<details class="step-section" id="step-${n}" ${n==='1'?'open':''}><summary><span class="step-number">${n}</span><h2>${title}</h2><span class="chevron" aria-hidden="true">＋</span></summary><div class="section-body">${body}</div></details>`).join('')}</div><aside id="summary" tabindex="-1"></aside></div>
 <section class="analysis" id="analysis"><div class="analysis-heading"><h2>A closer look at your order</h2><div class="actions">${button('Copy results','copy','quiet')}${button('Download Excel (.xlsx)','xlsx','quiet')}</div></div>
 ${disclosure('cash-details','See cash needed and recovery','<div id="cash-results"></div>')}
 ${disclosure('all-costs','See all costs','<div id="cost-results"></div>')}
 ${disclosure('more-results','See more results','<div id="more-results-content"></div>')}
 ${disclosure('scenarios','What if things change?',`<p class="section-intro">See how changes could affect your order.</p><div id="scenario-editors"></div>${button('Add a scenario','addscenario','secondary')}`)}
 ${disclosure('business-plan','Add a sales and business-cost plan',`
  ${check('Include a sales and business-cost plan','planning',m.planning)}
  <p class="help-text">Include only the share of business costs you want this product to cover. These costs are separate from inventory cost.</p>
  <div class="grid">${input('Expected sales per month','monthly',m.monthly)}${input('Months to plan for','months',m.months)}${input('Monthly business costs for this product','overhead',m.overhead,{unit:'₦'})}${input('One-off business costs','oneoff',m.oneoff,{unit:'₦'})}</div><div id="planning-results"></div>
 `)}
 </section><section class="final-cta" id="zolan-cta" hidden><div><p class="eyebrow">MONEY ACROSS BORDERS</p><h2>Ready to pay your Chinese supplier?</h2><p>Explore supplier payments with Zolan.</p></div><a class="primary" href="${config.zolanUrl}" target="_blank" rel="noopener">Explore Zolan ↗</a></section>
 <section class="faq"><h2>Helpful to know</h2>${disclosure('faq-tax','Does this calculate official customs charges?','<p>No. Enter the rates or amounts for your shipment. This is not an official customs assessment.</p>')}${disclosure('faq-profit','Is what each sale leaves me my final profit?','<p>It is your contribution after import and selling expenses. You still need to cover overhead, financing and business taxes.</p>')}${disclosure('faq-save','Where are my calculations saved?','<p>Saved on this browser. Download an Excel report to keep a copy of your figures. There is no cloud save or hosted sharing.</p>')}<a href="${config.articleUrl}" target="_blank" rel="noopener">Read the China import planning guide ↗</a></section></main><footer>Zolan · Money across borders.</footer>
 <dialog id="modal" aria-labelledby="modal-title"></dialog><dialog id="help-dialog" class="help-dialog" aria-labelledby="help-title"></dialog><section id="print-report" aria-label="Complete calculation report"></section>
 `;}
