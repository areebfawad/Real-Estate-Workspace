import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';

const root=path.resolve(import.meta.dirname,'..');
const port=32089,base=`http://127.0.0.1:${port}`;
const testDataDir=fs.mkdtempSync(path.join(os.tmpdir(),'marina-gate-test-'));
const creds=path.join(testDataDir,'demo-credentials.txt');
let child;
async function req(endpoint,method='GET',body=null,session=null,csrf=null,extra={}) {
  const headers={};if(method!=='GET')headers.origin=base;Object.assign(headers,extra);
  if(body!==null)headers['content-type']='application/json';
  if(session)headers.cookie=session;if(csrf)headers['x-csrf-token']=csrf;
  const r=await fetch(base+endpoint,{method,headers,body:body===null?undefined:JSON.stringify(body),redirect:'manual'});
  const text=await r.text();return {status:r.status,data:r.headers.get('content-type')?.includes('application/json')?JSON.parse(text):text,headers:r.headers};
}
function credsFor(kind){const lines=fs.readFileSync(creds,'utf8').split('\n');const line=lines.find(x=>x.startsWith(kind));const [,name,email,password]=line.split('|').map(x=>x.trim());return {name,email,password};}
async function login(kind){const {email,password}=credsFor(kind);const r=await req('/api/auth/login','POST',{email,password});assert.equal(r.status,200);return {cookie:r.headers.get('set-cookie').split(';')[0],csrf:r.data.csrf,user:r.data.user};}

test('FF-002 property platform: authentication, ownership, listing CRUD, leads, CSV, SEO',async(t)=>{
  if(!fs.existsSync(creds)) {
    const {execFileSync}=await import('node:child_process');execFileSync(process.execPath,['scripts/setup.mjs'],{cwd:root,stdio:'pipe',env:{...process.env,MG_DATA_DIR:testDataDir}});
  }
  child=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,PORT:String(port),HOST:'127.0.0.1',NODE_ENV:'development',MG_DATA_DIR:testDataDir},stdio:['ignore','pipe','pipe']});
  t.after(()=>{child?.kill('SIGTERM');fs.rmSync(testDataDir,{recursive:true,force:true});});
  let ready=false;for(let n=0;n<80;n++){try{const r=await req('/health');if(r.status===200){ready=true;break;}}catch{}await pause(100);}
  assert.ok(ready,'server started');
  const admin=await login('ADMIN');const agent1=await login('AGENT');
  const all=fs.readFileSync(creds,'utf8').split('\n').filter(x=>x.startsWith('AGENT'));
  const [, , agent2mail,agent2pwd]=all[1].split('|').map(x=>x.trim());
  const login2=await req('/api/auth/login','POST',{email:agent2mail,password:agent2pwd});assert.equal(login2.status,200);
  const agent2={cookie:login2.headers.get('set-cookie').split(';')[0],csrf:login2.data.csrf,user:login2.data.user};
  await t.test('public search filters return the correct area and transaction',async()=>{
    const r=await req('/api/listings?purpose=rent&area=JBR&bedrooms=2&sort=price_asc&limit=24');
    assert.equal(r.status,200);assert.ok(r.data.total>0);
    assert.ok(r.data.items.every(p=>p.purpose==='rent'&&p.area==='JBR'&&p.bedrooms>=2));
    assert.ok(r.data.items.every((p,i,arr)=>i===0||p.price_aed>=arr[i-1].price_aed));
    assert.equal((await req('/api/listings')).data.total,60);
  });
  await t.test('integrated map serves all active listings and supports plots',async()=>{
    const api=await req('/api/map/listings');
    assert.equal(api.status,200);
    assert.equal(api.data.total,60);
    assert.equal(api.data.items.length,60);
    assert.equal(api.data.items.filter(p=>p.type==='Plot').length,6);
    assert.ok(api.data.items.every(p=>p.ref&&p.slug&&p.agent_name&&p.id));
    const landing=await req('/');
    assert.equal(landing.status,200);
    const mapRoute=await req('/map');
    assert.equal(mapRoute.status,200);
    assert.match(mapRoute.data,/Interactive Map/i);
    const mapHtml=await req('/assets/map-explorer.html');
    assert.equal(mapHtml.status,200);
    assert.match(mapHtml.data,/map-integrated\.js/);
    assert.match(mapHtml.headers.get('content-security-policy'),/frame-ancestors 'self'/);
    assert.equal(mapHtml.headers.get('x-frame-options'),'SAMEORIGIN');
    const mapJs=await req('/assets/map-integrated.js');
    assert.equal(mapJs.status,200);
    assert.match(mapJs.data,/api\/map\/listings/);
    assert.match(mapJs.data,/api\/inquiries/);
    const plots=await req('/api/listings?type=Plot');
    assert.equal(plots.status,200);
    assert.equal(plots.data.total,6);
  });
  await t.test('agent sees only assigned properties, admin sees all',async()=>{
    const mine=await req('/api/portal/listings','GET',null,agent1.cookie);
    const other=await req('/api/portal/listings','GET',null,agent2.cookie);
    const all=await req('/api/portal/listings','GET',null,admin.cookie);
    assert.ok(mine.data.items.length>0);assert.ok(other.data.items.length>0);
    assert.ok(all.data.items.length>=60);
    assert.ok(mine.data.items.every(p=>p.agent_id===agent1.user.id));
    const forbidden=await req(`/api/portal/listings/${other.data.items[0].id}`,'DELETE',{},agent1.cookie,agent1.csrf);
    assert.equal(forbidden.status,403);
  });
  await t.test('CSRF and unauthorized requests are blocked',async()=>{
    assert.equal((await req('/api/portal/team')).status,401);
    assert.equal((await req('/api/portal/team','GET',null,agent1.cookie)).status,403);
    const r=await req('/api/portal/listings','POST',{},agent1.cookie,'invalid');assert.equal(r.status,403);
    const badOrigin=await req('/api/auth/logout','POST',{},admin.cookie,admin.csrf,{origin:'https://evil.example'});
    assert.equal(badOrigin.status,403);
  });
  let made;
  await t.test('agent can create, feature, edit, then soft-delete own listing',async()=>{
    const payload={ref:'MGP-T'+String(Date.now()).slice(-8),title:'Testing Marina Residence',purpose:'buy',area:'Dubai Marina',type:'Apartment',bedrooms:2,bathrooms:3,size_sqft:1500,price_aed:2500000,description:'End-to-end test property with safe, editable text.',amenities:['Gym','Parking'],photos:[],featured:true,status:'active',furnished:true};
    const r=await req('/api/portal/listings','POST',payload,agent1.cookie,agent1.csrf);assert.equal(r.status,201);made=r.data.id;
    const p=await req('/api/listings/'+r.data.slug);assert.equal(p.data.agent_id,agent1.user.id);assert.equal(p.data.featured,true);
    assert.ok((await req('/api/map/listings')).data.items.some(p=>p.id===made),'new property visible as map pin');
    const patch=await req(`/api/portal/listings/${made}`,'PATCH',{...payload,title:'Updated Test Residence',featured:false},agent1.cookie,agent1.csrf);
    assert.equal(patch.status,200);
    assert.equal((await req('/api/listings/'+r.data.slug)).data.title,'Updated Test Residence');
    assert.equal((await req(`/api/portal/listings/${made}`,'DELETE',{},agent1.cookie,agent1.csrf)).status,200);
    assert.equal((await req('/api/listings/'+r.data.slug)).status,404);
    assert.ok(!(await req('/api/map/listings')).data.items.some(p=>p.id===made),'archived property removed from map');
  });
  await t.test('visitor inquiry assigned by listing owner; agent scoped and admin exported',async()=>{
    const property=(await req('/api/portal/listings','GET',null,agent2.cookie)).data.items[0];
    const r=await req('/api/inquiries','POST',{property_id:property.id,name:'Demo Client',email:'lead@example.test',phone:'+971 50 123 4567',message:'Can I arrange a viewing?' });
    assert.equal(r.status,201);assert.match(r.data.reference,/INQ-/);assert.equal(r.data.email_status,'demo_queued');
    const myLeads=(await req('/api/portal/leads','GET',null,agent2.cookie)).data.items;
    const id=Number(r.data.reference.slice(4));const lead=myLeads.find(x=>x.id===id);
    assert.ok(lead);assert.equal(lead.agent_id,agent2.user.id);
    const otherLeads=(await req('/api/portal/leads','GET',null,agent1.cookie)).data.items;
    assert.ok(!otherLeads.some(x=>x.id===id));
    assert.equal((await req(`/api/portal/leads/${id}`,'PATCH',{status:'qualified'},agent1.cookie,agent1.csrf)).status,403);
    assert.equal((await req(`/api/portal/leads/${id}`,'PATCH',{status:'contacted'},agent2.cookie,agent2.csrf)).status,200);
    const exported=await req('/api/portal/leads/export.csv','GET',null,admin.cookie);
    assert.equal(exported.status,200);assert.ok(exported.data.includes('lead@example.test'));
  });
  await t.test('safe uploads reject false MIME and malformed payloads',async()=>{
    const r=await req('/api/uploads','POST',{data:'data:image/png;base64,'+Buffer.from('this is not an image').toString('base64')},agent1.cookie,agent1.csrf);
    assert.equal(r.status,422);
  });
  await t.test('actual PNG upload is validated, stored and publicly readable',async()=>{
    const file=fs.readFileSync(path.join(root,'tests','valid-upload-fixture.png'));
    const r=await req('/api/uploads','POST',{data:'data:image/png;base64,'+file.toString('base64')},agent1.cookie,agent1.csrf);
    assert.equal(r.status,201);assert.match(r.data.url,/^\/uploads\/[a-f0-9-]+\.png$/);
    const visible=await req(r.data.url);assert.equal(visible.status,200);
    fs.unlinkSync(path.join(root,'public',r.data.url));
  });
  await t.test('admin CSV import creates by reference and updates by reference',async()=>{
    const ref='CSV-'+String(Date.now()).slice(-9);
    const header='ref,title,purpose,area,type,bedrooms,bathrooms,size_sqft,price_aed,furnished,description,agent_id';
    const row=`${ref},Imported JBR Sample,buy,JBR,Apartment,2,3,1280,2200000,yes,CSV test listing,${agent1.user.id}`;
    const csv=header+'\n'+row;
    const first=await req('/api/portal/import','POST',{csv},admin.cookie,admin.csrf);
    assert.equal(first.status,200);assert.equal(first.data.imported,1);
    const second=await req('/api/portal/import','POST',{csv:csv.replace('2200000','2250000')},admin.cookie,admin.csrf);
    assert.equal(second.status,200);assert.equal(second.data.updated,1);
    const rows=(await req('/api/portal/listings','GET',null,admin.cookie)).data.items;
    const listing=rows.find(x=>x.ref===ref);
    assert.equal(listing.price_aed,2250000);
    assert.equal((await req(`/api/portal/listings/${listing.id}`,'DELETE',{},admin.cookie,admin.csrf)).status,200);
  });
  await t.test('follow-up notes stay private and are scoped to the assigned agent',async()=>{
    const mine=(await req('/api/portal/leads','GET',null,agent2.cookie)).data.items[0];
    assert.ok(mine);
    const payload={status:'qualified',internal_notes:'Private appointment notes – call on Friday.',follow_up_at:'2026-11-20'};
    const denied=await req(`/api/portal/leads/${mine.id}`,'PATCH',payload,agent1.cookie,agent1.csrf);
    assert.equal(denied.status,403);
    const saved=await req(`/api/portal/leads/${mine.id}`,'PATCH',payload,agent2.cookie,agent2.csrf);
    assert.equal(saved.status,200);
    const stored=(await req('/api/portal/leads','GET',null,agent2.cookie)).data.items.find(x=>x.id===mine.id);
    assert.equal(stored.internal_notes,payload.internal_notes);assert.equal(stored.follow_up_at,payload.follow_up_at);
    assert.equal((await req('/api/portal/leads','GET',null,agent1.cookie)).data.items.some(x=>x.id===mine.id),false);
    const publicResult=await req('/api/listings/'+stored.slug);
    assert.ok(!JSON.stringify(publicResult.data).includes('Private appointment notes'));
    const exportCSV=await req('/api/portal/leads/export.csv','GET',null,agent2.cookie);
    assert.ok(exportCSV.data.includes('Private appointment notes'));
    const badDate=await req(`/api/portal/leads/${mine.id}`,'PATCH',{status:'qualified',follow_up_at:'2026-02-30'},agent2.cookie,agent2.csrf);
    assert.equal(badDate.status,422);
  });
  await t.test('agent password change verifies current password and revokes other sessions',async()=>{
    const second=await req('/api/auth/login','POST',{email:agent1.user.email,password:credsFor('AGENT').password});
    assert.equal(second.status,200);
    const otherCookie=second.headers.get('set-cookie').split(';')[0];
    const wrong=await req('/api/auth/change-password','POST',{current_password:'incorrect',new_password:'StrongerSecret!2026'},agent1.cookie,agent1.csrf);
    assert.equal(wrong.status,403);
    const weak=await req('/api/auth/change-password','POST',{current_password:credsFor('AGENT').password,new_password:'abc123'},agent1.cookie,agent1.csrf);
    assert.equal(weak.status,422);
    const changed=await req('/api/auth/change-password','POST',{current_password:credsFor('AGENT').password,new_password:'StrongerSecret!2026'},agent1.cookie,agent1.csrf);
    assert.equal(changed.status,200);
    assert.equal((await req('/api/auth/me','GET',null,otherCookie)).data.user,null);
    assert.equal((await req('/api/auth/me','GET',null,agent1.cookie)).data.user.id,agent1.user.id);
    assert.equal((await req('/api/auth/login','POST',{email:agent1.user.email,password:credsFor('AGENT').password})).status,401);
    assert.equal((await req('/api/auth/login','POST',{email:agent1.user.email,password:'StrongerSecret!2026'})).status,200);
  });
  await t.test('offline-safe visual fallback assets are bundled',async()=>{
    for (const file of ['demo-residence-01.svg','demo-residence-06.svg','demo-residence-12.svg']) {
      const r=await req('/assets/'+file);assert.equal(r.status,200);assert.ok(r.data.includes('CONCEPT VISUAL'));
    }
  });
  await t.test('sitemap and SEO include clean listing paths',async()=>{
    const map=await req('/sitemap.xml');assert.equal(map.status,200);assert.ok(map.data.includes('/buy/dubai-marina/'));
    const row=(await req('/api/listings?limit=1')).data.items[0];
    const page=await req(`/${row.purpose}/${row.area.toLowerCase().replaceAll(' ','-')}/${row.slug}`);
    assert.ok(page.data.includes('<meta name="description"'));
    assert.ok(page.data.includes(row.title.replaceAll('&','&amp;')));
    const robots=await req('/robots.txt');assert.ok(robots.data.includes('Disallow: /portal'));
  });
});
