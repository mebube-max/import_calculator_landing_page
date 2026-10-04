import Decimal from 'decimal.js';
import {blank,sample,row,num,calc,type Model,type Row,type Scenario} from './engine';
export const SIMPLE_OTHER_ID='simple-import-total';
export type Experience={costMode:'simple'|'detailed';sellingMode:'simple'|'detailed';sellingTotal:string;sellingStatus:'entered'|'na'|'unknown';sellableAdjusted:boolean;feeEnabled:boolean;shippingUnsure:boolean;overlapResolved:boolean;helper:Record<string,string>;helperMode:'Air'|'Sea';appliedHelper:string;foreignMode?:'separate'|'allin'};
export const defaultExperience=():Experience=>({costMode:'simple',sellingMode:'simple',sellingTotal:'',sellingStatus:'unknown',sellableAdjusted:false,feeEnabled:false,shippingUnsure:false,overlapResolved:false,helper:{},helperMode:'Air',appliedHelper:''});
export function experience(m:Model):Experience{if(!m.experience)m.experience=defaultExperience();return m.experience}
export function ensureSimpleRow(m:Model){if(!m.rows.some(r=>r.category==='International freight'))m.rows.push(row('International freight'));if(!m.rows.find(r=>r.id===SIMPLE_OTHER_ID)){const r=row('Other import and delivery costs',SIMPLE_OTHER_ID);r.category='Other landed cost';m.rows.push(r)}}
export function fresh():Model{const m=blank();m.mode='total';m.unit='';ensureSimpleRow(m);experience(m);return m}
export function illustrative():Model{const m=sample();ensureSimpleRow(m);m.total='880000';m.productName='Handbags';m.experience={...defaultExperience(),costMode:'detailed',sellingMode:'detailed',sellingStatus:'entered',sellingTotal:'4000'};return m}
export function initialise(m:Model):Model{ensureSimpleRow(m);if(!m.experience){m.experience={...defaultExperience(),costMode:'detailed',sellingMode:'detailed',sellingStatus:'entered',feeEnabled:!!(m.fee||m.feePct),sellableAdjusted:m.s!==m.q}}return m}
export function freight(m:Model):Row{return m.rows.find(r=>r.category==='International freight')!}
export function other(m:Model):Row{return m.rows.find(r=>r.id===SIMPLE_OTHER_ID)!}
export function updateQuantity(m:Model,value:string){const e=experience(m);m.q=value;if(!e.sellableAdjusted)m.s=value}
export function landingRows(m:Model){return m.rows.filter(r=>r.id!==SIMPLE_OTHER_ID&&r.category!=='International freight')}
export function switchCosts(m:Model,mode:'simple'|'detailed'){experience(m).costMode=mode;experience(m).overlapResolved=false}
export function switchSelling(m:Model,mode:'simple'|'detailed'){experience(m).sellingMode=mode}
export function entered(r:Row){return !['unknown','na','included'].includes(r.status)}
export function overlap(m:Model){const e=experience(m);const f=freight(m),o=other(m);if(e.costMode!=='simple'||!f.includes.length||!entered(f)||!entered(o))return false;try{return num(o.amount).gt(0)&&!e.overlapResolved}catch{return false}}
export function otherSubtotal(m:Model){const result=calc(m);return result.trace.filter(r=>r.id!==SIMPLE_OTHER_ID&&r.id!==freight(m).id&&!r.reason.startsWith('Inactive')).reduce((sum,r)=>sum.add(r.ngn),new Decimal(0))}
export function safeNum(value:string){try{return num(value)}catch{return null}}
export const inclusionGroups=[{label:'Delivery within China',categories:['China domestic delivery']},{label:'Customs duty and import taxes',categories:['Customs duty','Import VAT/tax','Other levies']},{label:'Clearing and port charges',categories:['Clearing agent fee','Port/terminal charges']},{label:'Delivery to my location',categories:['Local transportation']}];

export function combined(m:Model):Scenario{return m.combinedScenario??={name:'Combined changes',fx:'5',supplier:'5',freight:'15',price:'-10',sellable:'',sales:'-50'}}
export function scopedScenario(m:Model,t:Scenario):Scenario{return {...t,fx:m.mode==='total'||m.currency==='NGN'?'0':t.fx,fxCurrency:m.currency}}
