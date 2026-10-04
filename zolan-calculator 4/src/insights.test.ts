import test from 'node:test';import assert from 'node:assert/strict';
import {calc,num,validateImport,scenario} from './engine';
import {illustrative,fresh,experience,freight,other,updateQuantity} from './experience';
import {lowerPrice,activeAssumptions,pricingMessage} from './insights';
import {summary,csv,printReport,resultValues} from './reports';
import {money} from './views';
test('at-a-glance fixture, lower-price comparison and consistent report outputs',()=>{
 const m=illustrative(),before=JSON.stringify(m),r=calc(m),q=lowerPrice(m);
 assert.equal(r.zeroPrice?.toString(),'20600');assert.equal(r.targetPrice?.toString(),'25750');assert.equal(r.batch?.toString(),'440000');assert.equal(q.alternative,'22500');assert.equal(q.result?.contribution?.toString(),'1900');assert.equal(q.difference?.toString(),'-2500');assert.equal(JSON.stringify(m),before);
 const ctx={alternativePrice:'22500'};for(const output of [summary(m,ctx),csv(m,ctx),printReport(m,ctx)]){assert.match(output,/₦20,600/);assert.match(output,/₦25,750/);assert.match(output,/₦440,000/);assert.match(output,/₦1,900/);assert.match(output,/not applied/);assert.match(output,/illustrative/);}
 assert.equal(money(num('16600')),'₦16,600');assert.equal(money(num('16600.5')),'₦16,600.50');
});
test('percentage fees are recalculated at the comparison price and coverage rounds upward',()=>{
 const m=illustrative();m.selling[2].pct='10';const r=calc(m),q=lowerPrice(m,'22500');assert.equal(r.variable?.toString(),'6500');assert.equal(q.result?.variable?.toString(),'6250');assert.equal(q.result?.contribution?.toString(),'-350');assert.equal(q.difference?.toString(),'-2250');
 assert.equal(r.zeroPrice?.toString(),'22888.89');assert.equal(r.targetPrice?.toString(),'29428.58');
 const atMinimum=scenario(m,{name:'minimum',fx:'0',freight:'0',price:'0',sales:'0',sellable:'',priceAmount:r.zeroPrice!.toString()});assert.ok(calc(atMinimum).contribution!.gte(0));atMinimum.price=r.zeroPrice!.sub('0.01').toString();assert.ok(calc(atMinimum).contribution!.lt(0));
 m.price=r.targetPrice!.toString();assert.ok(calc(m).margin!.gte(20));
 m.selling[2].pct='100';assert.equal(calc(m).zeroPrice,null);assert.equal(calc(m).targetPrice,null);assert.match(pricingMessage(m),/no room/);
});
test('unknown expenses suppress complete pricing, explicit zero and missing shipment costs stay distinct',()=>{
 const m=fresh();updateQuantity(m,'10');m.total='1000';m.price='200';m.target='20';
 assert.equal(calc(m).zeroPrice,null);assert.equal(calc(m).targetPrice,null);assert.match(pricingMessage(m),/confirm selling expenses/);
 experience(m).sellingStatus='na';assert.equal(calc(m).zeroPrice?.toString(),'100');assert.match(resultValues(m).find(x=>x[0].startsWith('Minimum'))![1],/Provisional/);
 Object.assign(freight(m),{amount:'0',status:'actual'});Object.assign(other(m),{amount:'0',status:'actual'});assert.equal(calc(m).missing.length,0);assert.equal(calc(m).targetPrice?.toString(),'125');
 m.price='';assert.equal(calc(m).contribution,null);assert.equal(calc(m).zeroPrice?.toString(),'100');
 m.total='bad';assert.equal(calc(m).zeroPrice,null);assert.equal(calc(m).targetPrice,null);
});
test('sellable stock, recoverable tax, negative outcomes and active assumptions',()=>{
 const m=illustrative();m.s='95';experience(m).sellableAdjusted=true;assert.match(activeAssumptions(m).join(' '),/5 damaged/);assert.equal(calc(m).batch?.toFixed(2),'335000.00');
 m.rows.find(r=>r.category==='Import VAT/tax')!.recover='50';assert.match(activeAssumptions(m).join(' '),/still paid upfront/);assert.equal(calc(m).cash.toString(),'1660000');
 m.price='10000';assert.ok(calc(m).contribution!.lt(0));assert.match(summary(m),/Shortfall per sale/);assert.equal(calc(m).recoveryMonths,null);
 assert.ok(lowerPrice(m,'0').error);assert.ok(lowerPrice(m,'bad').error);assert.throws(()=>validateImport({...m,scenarios:[{name:'x',fx:'0',freight:'0',price:'0',sales:'0',sellable:'',priceAmount:{}}]}));
});
