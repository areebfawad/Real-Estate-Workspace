import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {db,DATA,hashPassword,slugify,areas,types,amenitiesList} from './database.mjs';

const firstNames = ['Amelia','Omar','Sophia','Zain','Nadia','Daniel','Aisha','Ryan','Layla'];
const lastNames = ['Harrington','Khalid','Rahman','Siddiqui','Farooq','Bennett','Khan','Ahmed','Saleh'];
const phoneNums = ['971501001101','971501001102','971501001103','971501001104','971501001105','971501001106','971501001107','971501001108','971501001109'];
const photoIds = [
  'photo-1600607687920-4e2a09cf159d', 'photo-1600566753086-00f18fb6b3ea',
  'photo-1600210492486-724fe5c67fb0', 'photo-1600607687939-ce8a6c25118c',
  'photo-1600566753190-17f0baa2a6c3','photo-1600585154340-be6161a56a0c',
  'photo-1600573472592-401b489a3cdc','photo-1600607687644-c7171b42498f',
  'photo-1600573472591-ee6b68d14c68','photo-1600566752355-35792bedcfea',
  'photo-1600566753104-685f4f24cb4d','photo-1600607687920-4e2a09cf159d',
  'photo-1600573472550-8090b5e0745e','photo-1600566753051-f0b89df2dd90'
];
const places = {
  'Dubai Marina': ['Marina Promenade','Marina Gate','Marina Pinnacle','Princess Tower','Marina Quays','The Address Marina'],
  'JBR': ['Sadaf','Rimal','Bahar','Amwaj','Murjan','Shams'],
  'Business Bay': ['The Opus','DAMAC Towers','Executive Towers','Bay Square','Marquise Square','Peninsula']
};
const adjectives = ['Panoramic','Refined','Waterfront','Signature','Elegant','Iconic','Uninterrupted','Light-filled','Contemporary','Exceptional','Elevated','Bespoke'];
const coords = {'Dubai Marina':[25.0805,55.1403],JBR:[25.0783,55.1324],'Business Bay':[25.1864,55.2662]};
const img = (id,w=1200)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=82`;
export function seedIfEmpty() {
  const existing = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (existing) return false;
  const adminPassword = crypto.randomBytes(12).toString('base64url')+'!9a';
  const adminEmail='admin@marinagate.demo';
  const insUser=db.prepare('INSERT INTO users(name,email,password_hash,role,phone,whatsapp,bio,avatar_url) VALUES(?,?,?,?,?,?,?,?)');
  insUser.run('Rashid Al Mansoori',adminEmail,hashPassword(adminPassword),'admin','+971 50 100 1100','971501001100','Managing Partner · Dubai luxury real estate','');
  const logins=[{role:'admin',name:'Rashid Al Mansoori',email:adminEmail,password:adminPassword}];
  const agentIds=[];
  for(let i=0;i<9;i++) {
    const name=`${firstNames[i]} ${lastNames[i]}`; const email=`agent${i+1}@marinagate.demo`;
    const password=crypto.randomBytes(12).toString('base64url')+'!9a';
    const id=Number(insUser.run(name,email,hashPassword(password),'agent','+'+phoneNums[i],phoneNums[i],`Property advisor specialising in ${areas[i%3]} and Dubai's premier residential communities.`,'').lastInsertRowid);
    agentIds.push(id);logins.push({role:'agent',name,email,password});
  }
  const insert=db.prepare(`INSERT INTO properties(ref,slug,title,purpose,area,type,bedrooms,bathrooms,size_sqft,price_aed,furnished,description,amenities_json,photos_json,latitude,longitude,agent_id,featured,status,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const typeSeq=['Apartment','Penthouse','Apartment','Apartment','Villa','Studio','Apartment','Townhouse','Plot','Apartment'];
  const unitTitles=['Skyline Residence','Marina Collection','The Grand Suite','Waterfront Retreat','Urban Sanctuary','Terrace House','Harbour View','Penthouse Collection'];
  for(let i=0;i<60;i++) {
    const area=areas[i%3];
    const type=typeSeq[i%typeSeq.length];
    const purpose=type==='Plot'?'buy':((i%5===0 || i%5===3)?'rent':'buy');
    const beds=['Studio','Plot'].includes(type)?0:(type==='Penthouse'?4:1+(i%4)),baths=type==='Plot'?0:Math.max(1,beds+(i%3===0?1:0));
    const size=(type==='Plot'?3400:(beds===0?550:640+beds*430))+(i*47%520);
    const price=purpose==='buy'?Math.round(((type==='Penthouse'?4800000:900000)+beds*480000+i*30000)/50000)*50000:Math.round((59000+beds*30000+i*1300)/5000)*5000;
    const place=places[area][i%6];
    const title=type==='Plot'?`${adjectives[i%12]} Development Plot near ${place}`:`${adjectives[i%12]} ${beds===0?'Studio':beds+' Bedroom'} ${type} at ${place}`;
    const ref=`MGP-${String(i+1).padStart(4,'0')}`;
    const slug=`${slugify(title)}-${ref.toLowerCase()}`;
    const photos=[img(photoIds[i%photoIds.length]),img(photoIds[(i+5)%photoIds.length]),img(photoIds[(i+9)%photoIds.length])];
    const amenities=[amenitiesList[(i+0)%16],amenitiesList[(i+2)%16],amenitiesList[(i+4)%16],amenitiesList[(i+6)%16],amenitiesList[(i+8)%16],amenitiesList[(i+10)%16]];
    const description=type==='Plot'?`Illustrative residential plot opportunity in ${area}, Dubai. Reference-only concept data for the interactive map demonstration. Official plot boundaries, title, zoning and building permissions must be independently verified.`:`Introducing ${title.toLowerCase()}, a thoughtfully appointed ${type.toLowerCase()} in ${area}. An exceptional combination of design, generous proportions and a coveted Dubai location. Enjoy curated amenities, seamless connectivity and a lifestyle defined by comfort and sophistication. Contact our dedicated property advisor to arrange a private viewing.`;
    const date=new Date(Date.UTC(2026,9,1+(i%29))).toISOString();
    insert.run(ref,slug,title,purpose,area,type,beds,baths,size,price,i%3?1:0,description,JSON.stringify(amenities),JSON.stringify(photos),coords[area][0]+(i%9)*0.0003,coords[area][1]+(i%7)*0.0003,agentIds[i%9],i%6===0?1:0,'active',date,date);
  }
  // Demonstrate lead attribution on first use without using a real customer's data.
  const leadInsert=db.prepare(`INSERT INTO inquiries(property_id,agent_id,name,email,phone,message,status,email_status,created_at) VALUES(?,?,?,?,?,?,?,?,?)`);
  const sampleNames=['Oliver James','Fatima Saleh','Hassan Malik','Charlotte Green','Marcus Lee','Sophie Martin','Nora Ali','Ethan Ross'];
  for(let i=0;i<18;i++) {
    const property=db.prepare('SELECT id,agent_id FROM properties WHERE id=?').get((i*3)%60+1);
    const when=new Date(Date.UTC(2026,10,2+i%8,9+i%6,15)).toISOString();
    leadInsert.run(property.id,property.agent_id,sampleNames[i%sampleNames.length],`sample${i+1}@example.invalid`,'+971 50 000 0000','Sample demo inquiry — please arrange a private viewing.',i%5===0?'contacted':'new','demo_queued',when);
  }
  fs.mkdirSync(DATA,{recursive:true});
  fs.writeFileSync(path.join(DATA,'demo-credentials.txt'),[
    'MARINA GATE DEMO ACCOUNTS — GENERATED LOCALLY',
    'For evaluation only. NOT real client accounts. Never deploy this demo database to production.',
    '',...logins.map(x=>`${x.role.toUpperCase().padEnd(6)} | ${x.name.padEnd(20)} | ${x.email.padEnd(29)} | ${x.password}`),
    '', 'All nine agents have different passwords. Use the admin account to see all listings and leads.',
    'For reset: stop server, delete data/marina-gate.sqlite* and data/demo-credentials.txt, then npm run setup.'
  ].join('\n'),{mode:0o600});
  return true;
}
