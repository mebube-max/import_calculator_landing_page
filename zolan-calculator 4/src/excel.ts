import {calc,type Model} from './engine';
import {experience} from './experience';
import {assumptions,resultValues} from './reports';
import type {ReportContext} from './insights';

// Standard OOXML with explicit text cells: customer notes are never formulas.
type Cell = {value:string|number;style?:number};
type Sheet = {name:string;rows:Cell[][];widths:number[]};
const cell=(value:string|number,style=0):Cell=>({value,style});
const xml=(value:unknown)=>String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function reportValue(value:string):Cell{
 if(/^−?₦[\d,]+(?:\.\d+)?$/.test(value))return cell(Number(value.replace('−','-').replace('₦','').replaceAll(',','')),3);
 if(/^−?[\d,]+(?:\.\d+)?%$/.test(value))return cell(Number(value.replace('−','-').replace('%','').replaceAll(',',''))/100,4);
 if(/^\d+$/.test(value))return cell(Number(value),2);
 return cell(value);
}
export function excelReport(m:Model,ctx:ReportContext={}):ArrayBuffer{
 const r=calc(m),e=experience(m);
 const sheets:Sheet[]=[{name:'Order summary',widths:[55,68],rows:[
  [cell('Zolan · Your order at a glance',1)],
  [cell('Order'),cell(m.name||m.productName||m.description||'My import plan')],
  [cell('Prepared'),cell(new Date().toLocaleDateString('en-GB',{timeZone:'Africa/Lagos'}))],
  [],[cell('Result',1),cell('Your figures',1)],
  ...resultValues(m,ctx).map(([label,value])=>[cell(label),reportValue(value)]),
  [],[cell('What these figures assume',1)],
  ...assumptions(m).map(note=>[cell(note)])
 ]},{name:'Order details',widths:[48,32,55],rows:[
  [cell('Your order details',1)],
  [cell('Product'),cell(m.productName||m.description||'Not entered')],
  [cell('Quantity ordered'),cell(Number(m.q),2)],
  [cell('Sellable items'),cell(Number(m.s),2)],
  [cell('Supplier payment (naira)'),cell(Number(r.payment.toFixed(2)),3)],
  [cell('Selling price per item'),m.price?cell(Number(m.price),3):cell('Not entered')],
  [cell('Selling expenses'),cell(e.sellingStatus)],
  [cell('Target margin'),m.target?cell(Number(m.target)/100,4):cell('Not entered')],
  [],[cell('Import cost',1),cell('Amount in naira',1),cell('Included / status',1)],
  ...r.trace.map(cost=>[cell(cost.label),cost.reason?cell('Not included'):cell(Number(cost.ngn),3),cell(cost.reason||cost.status+(cost.note?' · '+cost.note:''))]),
  [],[cell('Selling expense',1),cell('Per sale in naira',1),cell('Percentage of selling price',1)],
  ...(e.sellingMode==='simple'?[[cell('Total selling expenses'),cell(Number(e.sellingTotal||0),3),cell(e.sellingStatus)]]:m.selling.map(cost=>[cell(cost.label),cell(Number(cost.amount||0),3),cell(Number(cost.pct||0)/100,4)])),
  [],[cell('Figures reflect this calculation at download time. Changes in Excel do not update the calculator.')]
 ]}];
 const files:[string,string][]=[
  ['[Content_Types].xml',`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`],
  ['_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
  ['xl/workbook.xml',`<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s,i)=>`<sheet name="${xml(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`],
  ['xl/_rels/workbook.xml.rels',`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="styles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
  ['xl/styles.xml',`<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="&quot;₦&quot;#,##0.00;[Red]-&quot;₦&quot;#,##0.00"/><numFmt numFmtId="165" formatCode="0.00%"/></numFmts><fonts count="2"><font><sz val="11"/><color rgb="FF0D1B33"/><name val="Calibri"/></font><font><b/><sz val="12"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0D1B33"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5">${[0,0,3,164,165].map((n,i)=>`<xf numFmtId="${n}" fontId="${i===1?1:0}" fillId="${i===1?2:0}" borderId="0" xfId="0" applyAlignment="1" applyNumberFormat="1"><alignment vertical="top" wrapText="1"/></xf>`).join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`]
 ];
 sheets.forEach((sheet,i)=>files.push([`xl/worksheets/sheet${i+1}.xml`,`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="5" topLeftCell="A6" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${sheet.widths.map((width,j)=>`<col min="${j+1}" max="${j+1}" width="${width}" customWidth="1"/>`).join('')}</cols><sheetData>${sheet.rows.map((row,j)=>`<row r="${j+1}" ht="${row.length===1&&String(row[0].value).length>55?60:32}" customHeight="1">${row.map((c,k)=>`<c r="${String.fromCharCode(65+k)}${j+1}" s="${c.style||0}"${typeof c.value==='number'?'':' t="inlineStr"'}>${typeof c.value==='number'?`<v>${c.value}</v>`:`<is><t xml:space="preserve">${xml(c.value)}</t></is>`}</c>`).join('')}</row>`).join('')}</sheetData><mergeCells count="${sheet.rows.filter(row=>row.length===1).length}">${sheet.rows.map((row,j)=>row.length===1?`<mergeCell ref="A${j+1}:${String.fromCharCode(64+sheet.widths.length)}${j+1}"/>`: '').join('')}</mergeCells></worksheet>`]));
 return zip(files);
}
// Uncompressed ZIP avoids network dependencies and works offline in browsers.
function zip(files:[string,string][]):ArrayBuffer{
 const enc=new TextEncoder(),parts:Uint8Array[]=[],directory:Uint8Array[]=[];let offset=0;
 const header=(length:number)=>new Uint8Array(length);
 const put=(b:Uint8Array,o:number,v:number,size=4)=>{const d=new DataView(b.buffer);if(size===2)d.setUint16(o,v,true);else d.setUint32(o,v,true)};
 for(const [path,contents] of files){const name=enc.encode(path),data=enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+contents);let crc=0xffffffff;for(const byte of data){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}crc=(crc^0xffffffff)>>>0;
  const local=header(30+name.length);put(local,0,0x04034b50);put(local,4,20,2);put(local,12,33,2);put(local,14,crc);put(local,18,data.length);put(local,22,data.length);put(local,26,name.length,2);local.set(name,30);
  const central=header(46+name.length);put(central,0,0x02014b50);put(central,4,20,2);put(central,6,20,2);put(central,14,33,2);put(central,16,crc);put(central,20,data.length);put(central,24,data.length);put(central,28,name.length,2);put(central,42,offset);central.set(name,46);directory.push(central);parts.push(local,data);offset+=local.length+data.length;
 }
 const length=directory.reduce((n,b)=>n+b.length,0),end=header(22);put(end,0,0x06054b50);put(end,8,files.length,2);put(end,10,files.length,2);put(end,12,length);put(end,16,offset);parts.push(...directory,end);
 const output=new Uint8Array(offset+length+22);let cursor=0;for(const part of parts){output.set(part,cursor);cursor+=part.length}return output.buffer;
}
