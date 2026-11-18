import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { URL } from 'node:url';
import { db, ROOT, DATA, areas, types, amenitiesList, propertySelect, propertyJoin, parseProperty, slugify, hashPassword, verifyPassword, audit, queryPublic } from './src/database.mjs';
import { seedIfEmpty } from './src/seed.mjs';

const envPath=path.join(ROOT,'.env');
if(fs.existsSync(envPath)) for(const line of fs.readFileSync(envPath,'utf8').split(/\r?\n/)) {
  const match=line.match(/^\s*([A-Z_]+)=(.*)\s*$/);
  if(match && process.env[match[1]]===undefined) process.env[match[1]]=match[2].trim().replace(/^['"]|['"]$/g,'');
}
seedIfEmpty();
const port=Number(process.env.PORT)||3001, host=process.env.HOST||'127.0.0.1';
const production=process.env.NODE_ENV==='production';
const cookieSecure=production||process.env.COOKIE_SECURE==='1';
const staticRoot=path.join(ROOT,'public');
const htmlTemplate=fs.readFileSync(path.join(staticRoot,'index.html'),'utf8');
const buckets=new Map();
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.webmanifest':'application/manifest+json'};
const T={};
mime['.ttf']='font/ttf';
mime['.woff2']='font/woff2';
function json(res,data,status=200,headers={}) {send(res,status,JSON.stringify(data),{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});}
function send(res,status,data,headers={}) { res.writeHead(status,headers);res.end(data); }
function error(status,message,code='INVALID_REQUEST') { const e=new Error(message);e.status=status;e.code=code;throw e; }
function secureHeaders(res,req) {
  const policy=["default-src 'self'", "base-uri 'self'", "object-src 'none'", `frame-ancestors ${req.url?.startsWith('/assets/map-explorer.html')?"'self'":"'none'"}`, "form-action 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline'", "font-src 'self'", "connect-src 'self'", "img-src 'self' https://images.unsplash.com https://tile.openstreetmap.org data: blob:", "frame-src 'self' https://www.google.com https://maps.google.com", "upgrade-insecure-requests"].filter(x=>!(x==='upgrade-insecure-requests'&&!production)).join('; ');
  res.setHeader('Content-Security-Policy',policy);
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options',req.url?.startsWith('/assets/map-explorer.html')?'SAMEORIGIN':'DENY');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  if(production)res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains');
}
function ipOf(req) { return (process.env.TRUST_PROXY==='1' ? req.headers['x-forwarded-for']?.split(',')[0].trim() : null) || req.socket.remoteAddress || 'local'; }
function rate(req,group,max,windowMs) {
  const now=Date.now(),key=group+':'+ipOf(req);
  let rec=buckets.get(key);
  if(!rec||now-rec.start>=windowMs) {rec={start:now,count:0};buckets.set(key,rec);}
  if(++rec.count>max) error(429,'Too many requests. Please try later.','RATE_LIMITED');
  if(buckets.size>5000) for(const [k,v] of buckets) if(now-v.start>2*3600000)buckets.delete(k);
}
function checkOrigin(req) {
  if(!['POST','PUT','PATCH','DELETE'].includes(req.method))return;
  const origin=req.headers.origin;
  if(!origin) {if(production)error(403,'Origin header required.');return;}
  const proto=(process.env.TRUST_PROXY==='1'&&req.headers['x-forwarded-proto'])|| (req.socket.encrypted?'https':'http');
  const expected=new URL(`${proto}://${req.headers.host||'localhost'}`);
  let got;try{got=new URL(origin);}catch{error(403,'Origin not allowed.');}
  if(got.origin!==expected.origin)error(403,'Origin not allowed.');
}
async function body(req,limit=1024*1024) {
  if(!req.headers['content-type']?.startsWith('application/json'))error(415,'Expected application/json.');
  const size=Number(req.headers['content-length']||0);if(size>limit)error(413,'Payload too large.');
  const chunks=[];let total=0;
  for await(const chunk of req){total+=chunk.length;if(total>limit)error(413,'Payload too large.');chunks.push(chunk);}
  let obj;try{obj=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{error(400,'Invalid JSON.');}
  if(!obj||Array.isArray(obj)||typeof obj!=='object')error(400,'Expected a JSON object.');
  return obj;
}
const clean=(v,max=300)=>String(v??'').trim().slice(0,max);
const str=(v,max=300)=> {if(typeof v!=='string')error(422,'Please provide valid text.'); const s=v.trim();if(!s||s.length>max)error(422,`Text must contain 1–${max} characters.`);return s;};
const positiveInt=(v,min,max,field)=>{const n=Number(v);if(!Number.isSafeInteger(n)||n<min||n>max)error(422,`Invalid ${field}.`);return n;};
const boolean=(v)=>v===true||v===1||v==='1';
function email(v) {const x=str(v,180).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x))error(422,'Invalid email address.');return x;}
function userSafe(u){ if(!u)return null;return {id:u.id,name:u.name,email:u.email,role:u.role,phone:u.phone,whatsapp:u.whatsapp,bio:u.bio,avatar_url:u.avatar_url,active:Boolean(u.active)}; }
function auth(req) {
  const match=(req.headers.cookie||'').match(/(?:^|;\s*)mg_session=([a-f0-9]{64})(?:;|$)/);
  if(!match)return null;
  const hash=crypto.createHash('sha256').update(match[1]).digest('hex');
  const row=db.prepare('SELECT s.csrf,s.expires_at,u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?').get(hash);
  if(!row||row.expires_at<Date.now()||!row.active)return null;
  return {user:row,csrf:row.csrf,hash};
}
function requiredAuth(req){const a=auth(req);if(!a)error(401,'Please sign in to continue.','UNAUTHENTICATED');return a;}
function requireRole(a,role){if(a.user.role!==role)error(403,'You do not have permission for this action.','FORBIDDEN');}
function csrf(req,a){if(req.headers['x-csrf-token']!==a.csrf)error(403,'Session verification failed. Refresh and try again.','CSRF');}
function own(a,property){if(a.user.role!=='admin'&&property.agent_id!==a.user.id)error(403,'This listing belongs to another agent.','FORBIDDEN');}
function cookie(res,value,clear=false){res.setHeader('Set-Cookie',`mg_session=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${clear?0:604800}${cookieSecure?'; Secure':''}`);}
function propertyById(id){return db.prepare(`SELECT ${propertySelect} FROM ${propertyJoin} WHERE p.id=?`).get(id);}
function statusFor(req){return req.method==='GET'?'GET':'ACTION';}
function validatePhotos(photos){
  if(!Array.isArray(photos)||photos.length>20)error(422,'You can use up to 20 images.');
  return photos.map(url=>{
    if(typeof url!=='string'||url.length>350||!(/^(https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+(?:\?[^\s]*)?|\/uploads\/[a-f0-9-]+\.(webp|jpg|jpeg|png)|\/assets\/demo-residence-\d{2}\.svg)$/.test(url)))error(422,'Upload images using the photo uploader.');
    return url;
  });
}
function listingInput(obj,a,existing=null){
  const ref=str(obj.ref,40).toUpperCase();if(!/^[A-Z0-9-]{3,40}$/.test(ref))error(422,'Reference: letters, numbers and hyphens only.');
  const title=str(obj.title,150);
  const purpose=['buy','rent'].includes(obj.purpose)?obj.purpose:error(422,'Choose buy or rent.');
  const area=areas.includes(obj.area)?obj.area:error(422,'Choose a supported area.');
  const type=types.includes(obj.type)?obj.type:error(422,'Choose a property type.');
  const bedrooms=positiveInt(obj.bedrooms,0,10,'bedrooms');
  const bathrooms=positiveInt(obj.bathrooms,type==='Plot'?0:1,15,'bathrooms');
  if(type==='Plot'&&(bedrooms!==0||bathrooms!==0))error(422,'A plot must have zero bedrooms and bathrooms.');
  const size_sqft=positiveInt(obj.size_sqft,100,100000,'size');
  const price_aed=positiveInt(obj.price_aed,1000,1000000000,'price');
  const description=str(obj.description,6000);
  const amenities=Array.isArray(obj.amenities) ? [...new Set(obj.amenities.filter(s=>amenitiesList.includes(s)))].slice(0,16) : [];
  const photos=validatePhotos(obj.photos||[]);
  const status=['active','draft','sold','rented'].includes(obj.status)?obj.status:'active';
  const featured=boolean(obj.featured)?1:0;
  let agent_id=a.user.id;
  if(a.user.role==='admin'){
    agent_id=positiveInt(obj.agent_id||existing?.agent_id||a.user.id,1,100000,'agent');
    const agent=db.prepare("SELECT id FROM users WHERE id=? AND role='agent' AND active=1").get(agent_id);
    if(!agent)error(422,'Choose an active agent.');
  }
  const lat=Number(obj.latitude),lng=Number(obj.longitude);
  const latitude=Number.isFinite(lat)&&lat>=-90&&lat<=90?lat:null;
  const longitude=Number.isFinite(lng)&&lng>=-180&&lng<=180?lng:null;
  return {ref,title,purpose,area,type,bedrooms,bathrooms,size_sqft,price_aed,description,amenities_json:JSON.stringify(amenities),photos_json:JSON.stringify(photos),furnished:boolean(obj.furnished)?1:0,featured,status,agent_id,latitude,longitude};
}
function csvEscape(s) {const raw=String(s??'');const v=/^\s*[=+\-@]/.test(raw)?`'${raw}`:raw;return /[",\r\n]/.test(v)?`"${v.replaceAll('"','""')}"`:v;}
function csvOutput(rows,headers){return '\uFEFF'+[headers.join(','),...rows.map(r=>headers.map(h=>csvEscape(r[h])).join(','))].join('\r\n');}
function parseCSV(text) {
  const rows=[];let row=[],item='',quote=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(quote){if(c==='"'&&text[i+1]==='"'){item+='"';i++;}else if(c==='"')quote=false;else item+=c;}
    else if(c==='"')quote=true;else if(c===','){row.push(item);item='';}else if(c==='\n'){row.push(item.replace(/\r$/,''));rows.push(row);row=[];item='';}else item+=c;}
  if(quote)error(422,'Unclosed CSV quote.'); if(item||row.length){row.push(item.replace(/\r$/,''));rows.push(row);}
  const head=(rows.shift()||[]).map(x=>x.replace(/^\uFEFF/,'').trim());
  if(!head.length)error(422,'CSV file is empty.');
  return rows.filter(x=>x.some(v=>v.trim())).map(r=>Object.fromEntries(head.map((h,i)=>[h,(r[i]||'').trim()])));
}
async function sendLeadEmail(lead,property) {
  const key=process.env.RESEND_API_KEY,from=process.env.RESEND_FROM_EMAIL;
  if(!key||!from)return {status:'demo_queued',note:'Email not sent: demo mode. Configure Resend to enable live notifications.'};
  const admin=db.prepare("SELECT email FROM users WHERE role='admin' AND active=1 LIMIT 1").get()?.email;
  const to=property.agent_email,cc=process.env.ADMIN_NOTIFICATION_EMAIL||admin;
  const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text=`New property inquiry\n\nListing: ${property.ref} — ${property.title}\nAgent: ${property.agent_name}\nName: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone}\nMessage: ${lead.message}\n`;
  try{
    const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[to],cc:cc&&cc!==to?[cc]:[],subject:`Property inquiry ${property.ref} — ${lead.name}`,text,html:`<h2>New listing inquiry</h2><p>${escapeHtml(text).replaceAll('\n','<br>')}</p>`}),signal:AbortSignal.timeout(8000)});
    if(!response.ok){return{status:'failed',note:`Provider rejected request (HTTP ${response.status})`};}
    return{status:'submitted',note:'Accepted by email provider. Final inbox delivery is not guaranteed by API acceptance.'};
  }catch{return{status:'failed',note:'Unable to contact email provider. Retry manually.'};}
}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function seoHtml(pathname){
  let title='Marina Gate Properties | Exceptional Dubai Homes';
  let desc='Explore carefully selected homes for sale and rent in Dubai Marina, JBR and Business Bay. Connect directly with specialist property advisers.';
  let prop=null;
  const match=pathname.match(/^\/(buy|rent)\/(dubai-marina|jbr|business-bay)\/([a-z0-9-]+)\/?$/);
  if(match){const r=db.prepare(`SELECT ${propertySelect} FROM ${propertyJoin} WHERE p.slug=? AND p.purpose=? AND p.status='active'`).get(match[3],match[1]);if(r){prop=parseProperty(r);title=`${r.title} | Marina Gate Properties`;desc=`${r.bedrooms} beds · ${r.bathrooms} baths · ${r.size_sqft} sqft in ${r.area}. AED ${r.price_aed.toLocaleString('en-US')} ${r.purpose==='rent'?'/ year':''}. Contact ${r.agent_name}.`;}}
  if(pathname==='/properties')title='Dubai Properties for Sale & Rent | Marina Gate Properties';
  if(pathname==='/map')title='Explore Properties on an Interactive Map | Marina Gate Properties';
  if(pathname==='/login')title='Agent Sign In | Marina Gate Properties';
  const origin=process.env.APP_BASE_URL?.startsWith('https://')?process.env.APP_BASE_URL:'http://localhost:'+port;
  const canonical=escapeHtml(origin+pathname);
  const meta=`<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(desc)}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="${prop?'product':'website'}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(desc)}"><meta property="og:url" content="${canonical}">${prop?`<meta property="og:image" content="${escapeHtml(prop.photos[0]||'')}">`:''}`;
  const template=production?htmlTemplate:fs.readFileSync(path.join(staticRoot,'index.html'),'utf8');
  return template.replace('<!-- SEO_META -->',meta);
}
function sitemap(){const base=(process.env.APP_BASE_URL||`http://localhost:${port}`).replace(/\/$/,'');const all=['/','/properties','/map','/communities','/about'];for(const p of db.prepare("SELECT purpose,area,slug,updated_at FROM properties WHERE status='active'").all())all.push(`/${p.purpose}/${slugify(p.area)}/${p.slug}`);return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${all.map(p=>`<url><loc>${escapeHtml(base+p)}</loc></url>`).join('')}</urlset>`;}

async function api(req,res,u){
  const pathname=u.pathname, method=req.method, search=Object.fromEntries(u.searchParams);
  if(method==='GET'&&pathname==='/api/config')return json(res,{areas,types,amenities:amenitiesList,emailConfigured:!!(process.env.RESEND_API_KEY&&process.env.RESEND_FROM_EMAIL),demo:true});
  if(method==='GET'&&pathname==='/api/listings')return json(res,queryPublic(search));
  if(method==='GET'&&pathname==='/api/map/listings'){
    const rows=db.prepare(`SELECT ${propertySelect} FROM ${propertyJoin} WHERE p.status='active' ORDER BY p.featured DESC,p.id ASC LIMIT 300`).all();
    return json(res,{items:rows.map(parseProperty),total:rows.length,schematic:true});
  }
  if(method==='GET'&&pathname==='/api/featured')return json(res,queryPublic({limit:6,sort:'featured'}).items.filter(p=>p.featured).slice(0,6));
  if(method==='GET'&&pathname.startsWith('/api/listings/')){
    const slug=decodeURIComponent(pathname.slice('/api/listings/'.length));
    const r=db.prepare(`SELECT ${propertySelect} FROM ${propertyJoin} WHERE p.slug=? AND p.status='active'`).get(slug);
    if(!r)error(404,'Property not found.');return json(res,parseProperty(r));
  }
  if(method==='GET'&&pathname==='/api/auth/me'){
    const a=auth(req);return json(res,{user:a?userSafe(a.user):null,csrf:a?.csrf||null});
  }
  if(method==='POST'&&pathname==='/api/auth/login'){
    rate(req,'login',15,900000);
    const b=await body(req);const mail=email(b.email);const pwd=str(b.password,128);
    const user=db.prepare('SELECT * FROM users WHERE email=? AND active=1').get(mail);
    if(!user||!verifyPassword(pwd,user.password_hash))error(401,'Incorrect email or password.','LOGIN_FAILED');
    const token=crypto.randomBytes(32).toString('hex'),token_hash=crypto.createHash('sha256').update(token).digest('hex');
    const csrfToken=crypto.randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions(token_hash,user_id,csrf,expires_at) VALUES(?,?,?,?)').run(token_hash,user.id,csrfToken,Date.now()+7*86400000);
    cookie(res,token);audit(user.id,'auth.login','user',user.id);
    return json(res,{user:userSafe(user),csrf:csrfToken});
  }
  if(method==='POST'&&pathname==='/api/auth/change-password'){
    rate(req,'password-change',12,3600000);
    const a=requiredAuth(req);csrf(req,a);
    const b=await body(req,3000);
    const current=str(b.current_password,128);
    const next=str(b.new_password,128);
    if(next.length<12||!/[A-Z]/.test(next)||!/[a-z]/.test(next)||!/[0-9]/.test(next)||!/[^A-Za-z0-9]/.test(next))
      error(422,'Use at least 12 characters, including uppercase, lowercase, a number and a symbol.');
    const person=db.prepare('SELECT password_hash FROM users WHERE id=?').get(a.user.id);
    if(!verifyPassword(current,person.password_hash))error(403,'Current password is incorrect.','INVALID_PASSWORD');
    if(verifyPassword(next,person.password_hash))error(422,'New password must differ from the current password.');
    db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hashPassword(next),a.user.id);
    // Keep this browser signed in but immediately revoke every other session.
    db.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash<>?').run(a.user.id,a.hash);
    audit(a.user.id,'auth.password_changed','user',a.user.id);
    return json(res,{ok:true,notice:'Password updated. Other sessions have been signed out.'});
  }
  if(method==='POST'&&pathname==='/api/auth/logout'){
    const a=auth(req);if(a){csrf(req,a);db.prepare('DELETE FROM sessions WHERE token_hash=?').run(a.hash);audit(a.user.id,'auth.logout','user',a.user.id);}
    cookie(res,'',true);return json(res,{ok:true});
  }
  if(method==='POST'&&pathname==='/api/analytics/view'){
    rate(req,'pageviews',600,3600000);
    const b=await body(req,3000),p=clean(b.path,250);
    const valid=['/','/properties','/map','/communities','/about','/contact'].includes(p)||/^\/(buy|rent)\/(dubai-marina|jbr|business-bay)\/[a-z0-9-]+$/.test(p);
    if(!valid)error(422,'Invalid analytics page.');
    db.prepare("INSERT INTO analytics_views(day,pathname,views) VALUES(date('now'),?,1) ON CONFLICT(day,pathname) DO UPDATE SET views=views+1").run(p);
    return json(res,{ok:true});
  }
  if(method==='POST'&&pathname==='/api/inquiries'){
    rate(req,'inquiry',6,3600000);
    const b=await body(req,12000);
    if(b.website)return json(res,{ok:true,notice:'Your request has been received.'});
    const propertyId=positiveInt(b.property_id,1,1000000,'property');
    const p=propertyById(propertyId);if(!p||p.status!=='active')error(404,'This listing is not available.');
    const lead={name:str(b.name,120),email:email(b.email),phone:str(b.phone,35),message:str(b.message,1500)};
    if(!/^[+\d\s()\-]{7,35}$/.test(lead.phone))error(422,'Please enter a valid phone number.');
    const leadId=Number(db.prepare('INSERT INTO inquiries(property_id,agent_id,name,email,phone,message) VALUES(?,?,?,?,?,?)').run(p.id,p.agent_id,lead.name,lead.email,lead.phone,lead.message).lastInsertRowid);
    audit(null,'inquiry.created','inquiry',leadId,`Property ${p.ref}; Agent ${p.agent_id}`);
    const delivery=await sendLeadEmail(lead,p);
    db.prepare('UPDATE inquiries SET email_status=?,email_note=?,email_attempts=1,last_email_attempt=CURRENT_TIMESTAMP WHERE id=?').run(delivery.status,delivery.note,leadId);
    return json(res,{ok:true,reference:`INQ-${String(leadId).padStart(5,'0')}`,email_status:delivery.status,notice:'Your inquiry has been recorded and assigned to the listing agent.'},201);
  }
  if(!pathname.startsWith('/api/portal')&&!pathname.startsWith('/api/uploads'))error(404,'Endpoint not found.');
  const a=requiredAuth(req);
  if(!['GET','HEAD'].includes(method))csrf(req,a);
  if(method==='GET'&&pathname==='/api/portal/stats'){
    const filter=a.user.role==='admin'?'':'AND agent_id=?';const arg=a.user.role==='admin'?[]:[a.user.id];
    const listingCount=db.prepare(`SELECT COUNT(*) n FROM properties WHERE status='active' ${filter}`).get(...arg).n;
    const featured=db.prepare(`SELECT COUNT(*) n FROM properties WHERE status='active' AND featured=1 ${filter}`).get(...arg).n;
    const leadCount=db.prepare(`SELECT COUNT(*) n FROM inquiries WHERE 1=1 ${filter}`).get(...arg).n;
    const newLeads=db.prepare(`SELECT COUNT(*) n FROM inquiries WHERE status='new' ${filter}`).get(...arg).n;
    const latest=db.prepare(`SELECT i.id,i.name,i.email,i.status,i.email_status,i.created_at,p.title,p.ref,p.id AS property_id,u.name AS agent_name FROM inquiries i JOIN properties p ON p.id=i.property_id JOIN users u ON u.id=i.agent_id WHERE 1=1 ${a.user.role==='admin'?'':'AND i.agent_id=?'} ORDER BY i.created_at DESC,i.id DESC LIMIT 6`).all(...arg);
    const byArea=db.prepare(`SELECT area,COUNT(*) count FROM properties WHERE status='active' ${filter} GROUP BY area ORDER BY count DESC`).all(...arg);
    const byPurpose=db.prepare(`SELECT purpose,COUNT(*) count FROM properties WHERE status='active' ${filter} GROUP BY purpose`).all(...arg);
    const views30d=db.prepare("SELECT COALESCE(SUM(views),0) AS n FROM analytics_views WHERE day >= date('now','-30 days')").get().n;
    return json(res,{listingCount,featured,leadCount,newLeads,latest,byArea,byPurpose,views30d,role:a.user.role});
  }
  if(method==='GET'&&pathname==='/api/portal/listings'){
    const filter=a.user.role==='admin'?'':'AND p.agent_id=?';const arg=a.user.role==='admin'?[]:[a.user.id];
    const vals=[...arg];let add='';
    if(search.q&&search.q.length<=100){add=' AND (p.title LIKE ? OR p.ref LIKE ?)';vals.push('%'+search.q+'%','%'+search.q+'%');}
    if(search.status&&['active','draft','sold','rented','deleted'].includes(search.status)){add+=' AND p.status=?';vals.push(search.status);}
    const rows=db.prepare(`SELECT ${propertySelect} FROM ${propertyJoin} WHERE 1=1 ${filter} ${add} ORDER BY p.updated_at DESC,p.id DESC LIMIT 250`).all(...vals).map(parseProperty);
    return json(res,{items:rows});
  }
  if(method==='GET'&&pathname==='/api/portal/leads'){
    const where=a.user.role==='admin'?'':'WHERE i.agent_id=?';const args=a.user.role==='admin'?[]:[a.user.id];
    const rows=db.prepare(`SELECT i.*,p.title,p.ref,p.slug,p.purpose,p.area,u.name AS agent_name FROM inquiries i JOIN properties p ON p.id=i.property_id JOIN users u ON u.id=i.agent_id ${where} ORDER BY i.created_at DESC,i.id DESC LIMIT 1000`).all(...args);
    return json(res,{items:rows});
  }
  if(method==='GET'&&pathname==='/api/portal/leads/export.csv'){
    const where=a.user.role==='admin'?'':'WHERE i.agent_id=?';const args=a.user.role==='admin'?[]:[a.user.id];
    const rows=db.prepare(`SELECT i.id AS inquiry_id,i.created_at,i.name,i.email,i.phone,i.message,i.status,i.email_status,i.internal_notes,i.follow_up_at,p.ref AS property_ref,u.name AS agent_name FROM inquiries i JOIN properties p ON p.id=i.property_id JOIN users u ON u.id=i.agent_id ${where} ORDER BY i.created_at DESC`).all(...args);
    const head=['inquiry_id','created_at','name','email','phone','message','status','email_status','internal_notes','follow_up_at','property_ref','agent_name'];
    return send(res,200,csvOutput(rows,head),{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="marina-gate-inquiries.csv"','Cache-Control':'no-store'});
  }
  if(method==='PATCH'&&/^\/api\/portal\/leads\/\d+$/.test(pathname)){
    const id=Number(pathname.split('/').pop());const r=db.prepare('SELECT * FROM inquiries WHERE id=?').get(id);
    if(!r)error(404,'Inquiry not found.');if(a.user.role!=='admin'&&r.agent_id!==a.user.id)error(403,'You cannot edit this inquiry.');
    const b=await body(req);
    if(!['new','contacted','qualified','closed'].includes(b.status))error(422,'Choose a valid lead status.');
    const notes=b.internal_notes===undefined?r.internal_notes:typeof b.internal_notes==='string'&&b.internal_notes.length<=2000?b.internal_notes.trim():error(422,'Notes must be 2,000 characters or fewer.');
    let followUp=r.follow_up_at;
    if(Object.hasOwn(b,'follow_up_at')) {
      if(b.follow_up_at===null||b.follow_up_at==='')followUp=null;
      else if(typeof b.follow_up_at==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(b.follow_up_at)&&!Number.isNaN(Date.parse(b.follow_up_at))&&new Date(b.follow_up_at).toISOString().startsWith(b.follow_up_at))followUp=b.follow_up_at;
      else error(422,'Follow-up date must be a real YYYY-MM-DD date.');
    }
    db.prepare('UPDATE inquiries SET status=?,internal_notes=?,follow_up_at=? WHERE id=?').run(b.status,notes,followUp,id);
    audit(a.user.id,'inquiry.follow_up','inquiry',id,`status=${b.status}; follow_up=${followUp||'none'}`);
    return json(res,{ok:true});
  }
  if(method==='POST'&&/^\/api\/portal\/leads\/\d+\/retry-email$/.test(pathname)){
    const id=Number(pathname.split('/')[4]);
    const lead=db.prepare('SELECT * FROM inquiries WHERE id=?').get(id);
    if(!lead)error(404,'Inquiry not found.');
    if(a.user.role!=='admin'&&lead.agent_id!==a.user.id)error(403,'Not your inquiry.');
    if(lead.email_status==='submitted')error(409,'Provider has already accepted this email.');
    const p=propertyById(lead.property_id);
    const result=await sendLeadEmail(lead,p);
    db.prepare('UPDATE inquiries SET email_status=?,email_note=?,email_attempts=email_attempts+1,last_email_attempt=CURRENT_TIMESTAMP WHERE id=?').run(result.status,result.note,id);
    audit(a.user.id,'inquiry.email_retry','inquiry',id,result.status);
    return json(res,{ok:true,email_status:result.status,message:result.note});
  }
  if(method==='GET'&&pathname==='/api/portal/team'){
    requireRole(a,'admin');const rows=db.prepare("SELECT id,name,email,role,phone,whatsapp,bio,avatar_url,active,created_at FROM users WHERE role='agent' ORDER BY id").all();
    const count=db.prepare("SELECT agent_id,COUNT(*) count FROM properties WHERE status='active' GROUP BY agent_id").all();
    const map=new Map(count.map(x=>[x.agent_id,x.count]));return json(res,{items:rows.map(r=>({...r,active:Boolean(r.active),listings:map.get(r.id)||0}))});
  }
  if(method==='GET'&&pathname==='/api/portal/audit'){
    requireRole(a,'admin');return json(res,{items:db.prepare('SELECT a.*,u.name AS actor FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT 100').all()});
  }
  if(method==='PATCH'&&/^\/api\/portal\/team\/\d+$/.test(pathname)){
    requireRole(a,'admin');const id=Number(pathname.split('/').pop());const r=db.prepare("SELECT * FROM users WHERE id=? AND role='agent'").get(id);if(!r)error(404,'Agent not found.');
    const b=await body(req);const name=str(b.name,90),phone=clean(b.phone,35),whatsapp=clean(b.whatsapp,25),bio=clean(b.bio,600),active=boolean(b.active)?1:0;
    if(whatsapp&&!/^\d{7,18}$/.test(whatsapp))error(422,'WhatsApp must use international digits without +.');
    db.prepare('UPDATE users SET name=?,phone=?,whatsapp=?,bio=?,active=? WHERE id=?').run(name,phone,whatsapp,bio,active,id);
    if(!active)db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);
    audit(a.user.id,'agent.updated','user',id,`active=${active}`);return json(res,{ok:true});
  }
  if(method==='POST'&&/^\/api\/portal\/team\/\d+\/reset-password$/.test(pathname)){
    requireRole(a,'admin');const id=Number(pathname.split('/')[4]);const r=db.prepare("SELECT id FROM users WHERE id=? AND role='agent'").get(id);if(!r)error(404,'Agent not found.');
    const password=crypto.randomBytes(15).toString('base64url')+'!B6';
    db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hashPassword(password),id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);
    audit(a.user.id,'agent.password_reset','user',id);return json(res,{password,notice:'Shown only once. Share via a secure channel and ask the agent to change it.'});
  }
  if(method==='POST'&&pathname==='/api/uploads'){
    rate(req,'upload',35,3600000);const b=await body(req,6*1024*1024);const data=str(b.data,5*1024*1024);
    const m=data.match(/^data:image\/(webp|jpeg|png);base64,([a-zA-Z0-9+/=]+)$/);if(!m)error(422,'Only JPG, PNG and WebP images are accepted.');
    const buffer=Buffer.from(m[2],'base64');if(buffer.length>2*1024*1024||buffer.length<100)error(422,'Image must be under 2 MB after optimization.');
    const isJpg=buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff;
    const isPNG=buffer.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'));
    const isWebP=buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP';
    if(!((m[1]==='jpeg'&&isJpg)||(m[1]==='png'&&isPNG)||(m[1]==='webp'&&isWebP)))error(422,'Image content does not match its declared type.');
    const ext=m[1]==='jpeg'?'jpg':m[1];const name=crypto.randomUUID()+'.'+ext;
    fs.writeFileSync(path.join(staticRoot,'uploads',name),buffer,{flag:'wx',mode:0o644});
    audit(a.user.id,'photo.uploaded','file',name,`${buffer.length} bytes`);return json(res,{url:'/uploads/'+name,bytes:buffer.length},201);
  }
  if(method==='POST'&&pathname==='/api/portal/listings'){
    const b=await body(req,120000);const p=listingInput(b,a);
    const slug=`${slugify(p.title)}-${slugify(p.ref)}`;
    if(db.prepare('SELECT id FROM properties WHERE ref=? OR slug=?').get(p.ref,slug))error(409,'Listing reference already exists.');
    const result=db.prepare(`INSERT INTO properties(ref,slug,title,purpose,area,type,bedrooms,bathrooms,size_sqft,price_aed,furnished,description,amenities_json,photos_json,latitude,longitude,agent_id,featured,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(p.ref,slug,p.title,p.purpose,p.area,p.type,p.bedrooms,p.bathrooms,p.size_sqft,p.price_aed,p.furnished,p.description,p.amenities_json,p.photos_json,p.latitude,p.longitude,p.agent_id,p.featured,p.status);
    audit(a.user.id,'listing.created','property',result.lastInsertRowid,p.ref);return json(res,{ok:true,id:Number(result.lastInsertRowid),slug},201);
  }
  if(/^\/api\/portal\/listings\/\d+$/.test(pathname)){
    const id=Number(pathname.split('/').pop()),r=propertyById(id);
    if(!r)error(404,'Listing not found.');own(a,r);
    if(method==='PATCH'){
      const b=await body(req,120000),p=listingInput(b,a,r);
      const conflict=db.prepare('SELECT id FROM properties WHERE ref=? AND id<>?').get(p.ref,id);if(conflict)error(409,'Listing reference already exists.');
      db.prepare(`UPDATE properties SET ref=?,title=?,purpose=?,area=?,type=?,bedrooms=?,bathrooms=?,size_sqft=?,price_aed=?,furnished=?,description=?,amenities_json=?,photos_json=?,latitude=?,longitude=?,agent_id=?,featured=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
        .run(p.ref,p.title,p.purpose,p.area,p.type,p.bedrooms,p.bathrooms,p.size_sqft,p.price_aed,p.furnished,p.description,p.amenities_json,p.photos_json,p.latitude,p.longitude,p.agent_id,p.featured,p.status,id);
      audit(a.user.id,'listing.updated','property',id,p.ref);return json(res,{ok:true});
    }
    if(method==='DELETE'){
      db.prepare("UPDATE properties SET status='deleted',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(id);
      audit(a.user.id,'listing.deleted','property',id,r.ref);return json(res,{ok:true});
    }
  }
  if(method==='POST'&&pathname==='/api/portal/import'){
    requireRole(a,'admin');const b=await body(req,3*1024*1024);const input=str(b.csv,2*1024*1024);
    const rows=parseCSV(input);if(rows.length>300)error(422,'Maximum 300 listings per import.');
    const defaults={amenities:[],photos:[],featured:false,status:'active',furnished:false,description:'Contact our agent for details.',bathrooms:1};
    const problems=[],payload=[];
    rows.forEach((r,i)=>{try{
      const p=listingInput({...defaults,...r,bedrooms:Number(r.bedrooms),bathrooms:Number(r.bathrooms)||1,price_aed:Number(r.price_aed),size_sqft:Number(r.size_sqft),furnished:r.furnished==='yes'||r.furnished==='1',agent_id:Number(r.agent_id),description:r.description||defaults.description},a);
      payload.push(p);
    }catch(e){problems.push({line:i+2,error:e.message});}});
    if(problems.length)return json(res,{ok:false,problems:problems.slice(0,30)},422);
    if(new Set(payload.map(p=>p.ref)).size!==payload.length)error(422,'CSV contains duplicate property references.');
    let imported=0,updated=0;
    db.exec('BEGIN IMMEDIATE');try{
      const insert=db.prepare('INSERT INTO properties(ref,slug,title,purpose,area,type,bedrooms,bathrooms,size_sqft,price_aed,furnished,description,amenities_json,photos_json,latitude,longitude,agent_id,featured,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
      const update=db.prepare('UPDATE properties SET title=?,purpose=?,area=?,type=?,bedrooms=?,bathrooms=?,size_sqft=?,price_aed=?,furnished=?,description=?,agent_id=?,updated_at=CURRENT_TIMESTAMP WHERE ref=?');
      for(const p of payload){
        if(db.prepare('SELECT id FROM properties WHERE ref=?').get(p.ref)){
          update.run(p.title,p.purpose,p.area,p.type,p.bedrooms,p.bathrooms,p.size_sqft,p.price_aed,p.furnished,p.description,p.agent_id,p.ref);updated++;
        }else{insert.run(p.ref,`${slugify(p.title)}-${slugify(p.ref)}`,p.title,p.purpose,p.area,p.type,p.bedrooms,p.bathrooms,p.size_sqft,p.price_aed,p.furnished,p.description,p.amenities_json,p.photos_json,p.latitude,p.longitude,p.agent_id,p.featured,p.status);imported++;}
      }
      db.exec('COMMIT');
    }catch(e){db.exec('ROLLBACK');throw e;}
    audit(a.user.id,'listings.csv_import','property','batch',`created=${imported} updated=${updated}`);
    return json(res,{ok:true,imported,updated,warning:'CSV records imported. Photos from Google Drive must be migrated separately using the uploader.'});
  }
  error(404,'Endpoint not found.');
}

const server=http.createServer(async(req,res)=>{
  secureHeaders(res,req);
  try{
    const u=new URL(req.url,`http://${req.headers.host||'localhost'}`);
    if(u.pathname.includes('..')||u.pathname.includes('\\'))error(400,'Invalid path.');
    checkOrigin(req);
    if(u.pathname.startsWith('/api/'))return await api(req,res,u);
    if(req.method!=='GET'&&req.method!=='HEAD')error(405,'Method not allowed.');
    if(u.pathname==='/health')return json(res,{ok:true,service:'marina-gate-demo'});
    if(u.pathname==='/sitemap.xml')return send(res,200,sitemap(),{'Content-Type':'application/xml; charset=utf-8'});
    if(u.pathname==='/robots.txt')return send(res,200,`User-agent: *\nAllow: /\nDisallow: /portal\nDisallow: /login\nSitemap: ${(process.env.APP_BASE_URL||`http://localhost:${port}`)}/sitemap.xml\n`,{'Content-Type':'text/plain'});
    if(u.pathname==='/favicon.ico')return send(res,204,'');
    if(u.pathname.startsWith('/assets/')||u.pathname.startsWith('/uploads/')){
      const p=path.resolve(staticRoot,'.'+u.pathname);
      if(!p.startsWith(staticRoot+path.sep))error(403,'Invalid path.');
      if(!fs.existsSync(p)||!fs.statSync(p).isFile())error(404,'Asset not found.');
      const ext=path.extname(p).toLowerCase();if(!mime[ext])error(415,'Unsupported asset.');
      const cacheControl=['.css','.js','.html'].includes(ext)?'no-cache':'public, max-age=86400';
      res.writeHead(200,{'Content-Type':mime[ext],'Cache-Control':cacheControl,'X-Content-Type-Options':'nosniff'});return fs.createReadStream(p).pipe(res);
    }
    if(u.pathname==='/manifest.webmanifest'){
      return json(res,{name:'Marina Gate Properties',short_name:'Marina Gate',start_url:'/',display:'standalone',theme_color:'#192b2a',background_color:'#f8f7f4'});
    }
    const html=seoHtml(u.pathname);return send(res,200,html,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'});
  }catch(err){
    const status=Number(err.status)||500;
    if(status>=500)console.error('[server]',err);
    if(!res.headersSent)json(res,{error:status>=500?'Unexpected server error.':err.message,code:err.code||'ERROR'},status);
  }
});
// Retry failed email-provider submissions at 25-second intervals (maximum 3 automatic attempts).
// Final delivery to the recipient mailbox must still be checked during acceptance testing.
let retryRunning=false;
if(process.env.RESEND_API_KEY&&process.env.RESEND_FROM_EMAIL){
  const timer=setInterval(async()=>{
    if(retryRunning)return;retryRunning=true;
    try{
      const rows=db.prepare(`SELECT * FROM inquiries WHERE email_status='failed' AND email_attempts<3 AND (last_email_attempt IS NULL OR unixepoch('now') - unixepoch(last_email_attempt) >= 25) ORDER BY id LIMIT 10`).all();
      for(const lead of rows){
        const p=propertyById(lead.property_id);if(!p)continue;
        const result=await sendLeadEmail(lead,p);
        db.prepare('UPDATE inquiries SET email_status=?,email_note=?,email_attempts=email_attempts+1,last_email_attempt=CURRENT_TIMESTAMP WHERE id=?').run(result.status,result.note,lead.id);
        audit(null,'inquiry.auto_email_retry','inquiry',lead.id,result.status);
      }
    }catch(err){console.error('[email retry]',err.message);}finally{retryRunning=false;}
  },25000);
  timer.unref();
}
server.listen(port,host,()=>console.log(`\nMARINA GATE PROPERTY DEMO — http://${host}:${port}\nCredentials: ${path.join(DATA,'demo-credentials.txt')}\nEmail: ${process.env.RESEND_API_KEY&&process.env.RESEND_FROM_EMAIL?'provider configured':'DEMO MODE (not sent)'}\n`));

