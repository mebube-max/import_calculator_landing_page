import {calc,scenario,num,type Model} from './engine';
import {experience} from './experience';
export type ReportContext={alternativePrice?:string};
export function lowerPrice(m:Model,value?:string){
 const base=calc(m);const alternative=value===undefined?(base.salesValid&&base.p?.gt(0)?base.p.mul('0.9').toDecimalPlaces(2).toString():''):value;
 try{const price=num(alternative,true);if(price.lte(0))throw Error('Enter an alternative price above zero.');
  const input=scenario(m,{name:'Lower-price comparison',fx:'0',freight:'0',price:'0',priceAmount:alternative,sellable:'',sales:'0'});
  const result=calc(input);return {alternative,result,difference:base.salesValid&&base.contribution&&result.salesValid&&result.contribution?result.contribution.sub(base.contribution):null,error:''};
 }catch(e){return {alternative,result:null,difference:null,error:alternative?(e as Error).message:'Enter an alternative selling price.'};}
}
export function activeAssumptions(m:Model){const r=calc(m),e=experience(m);const notes:string[]=[];
 if(r.landingValid&&num(m.q).gt(num(m.s)))notes.push('Allows for '+num(m.q).sub(num(m.s))+' damaged or unusable items');
 if(e.sellingMode==='detailed'&&e.sellingStatus!=='na'&&r.fraction.gt(0))notes.push('Includes '+r.fraction.mul(100)+'% selling fees');
 if(r.landingValid&&r.recovery.gt(0))notes.push('Excludes import tax marked as recoverable from item cost; it is still paid upfront');
 if(m.mode!=='total'&&m.currency!=='NGN'&&m.advanced)notes.push('Uses separate payment and shipping exchange rates');
 if(m.mode==='allin')notes.push('Supplier rate includes payment fees; separate fees are excluded');
 if(m.mode==='separate'&&e.feeEnabled&&(Number(m.fee)>0||Number(m.feePct)>0))notes.push('Adds separately charged supplier-payment fees');
 if(r.trace.some(x=>x.reason.includes('Included')))notes.push('Excludes charges included in another quote');
 if(e.shippingUnsure)notes.push('Shipping quote contents still need confirmation');
 if(e.overlapResolved)notes.push('Other costs were confirmed outside the shipping quote');
 return notes;
}
export function pricingMessage(m:Model){const r=calc(m);if(!r.landingValid)return 'Add valid order and import costs to plan your price.';
 if(experience(m).sellingStatus==='unknown')return 'Add or confirm selling expenses before estimating a minimum or target price.';
 if(!r.pricingValid)return 'Correct selling expenses to plan your price.';
 if(r.fraction.gte(1))return 'Percentage selling expenses leave no room to cover your item costs.';
 return '';
}
