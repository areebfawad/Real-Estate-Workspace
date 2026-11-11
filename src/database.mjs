import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const ROOT = path.resolve(import.meta.dirname, '..');
export const DATA = process.env.MG_DATA_DIR ? path.resolve(process.env.MG_DATA_DIR) : path.join(ROOT, 'data');
fs.mkdirSync(DATA, { recursive: true });
export const db = new DatabaseSync(path.join(DATA, 'marina-gate.sqlite'), { timeout: 5000 });
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','agent')),
  phone TEXT NOT NULL DEFAULT '', whatsapp TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '', avatar_url TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf TEXT NOT NULL, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT, ref TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL, purpose TEXT NOT NULL CHECK (purpose IN ('buy','rent')),
  area TEXT NOT NULL, type TEXT NOT NULL, bedrooms INTEGER NOT NULL, bathrooms INTEGER NOT NULL,
  size_sqft INTEGER NOT NULL, price_aed INTEGER NOT NULL, furnished INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL, amenities_json TEXT NOT NULL DEFAULT '[]',
  photos_json TEXT NOT NULL DEFAULT '[]', latitude REAL, longitude REAL,
  agent_id INTEGER NOT NULL REFERENCES users(id),
  featured INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT, property_id INTEGER NOT NULL REFERENCES properties(id),
  agent_id INTEGER NOT NULL REFERENCES users(id), name TEXT NOT NULL, email TEXT NOT NULL,
  phone TEXT NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new',
  email_status TEXT NOT NULL DEFAULT 'demo_queued', email_note TEXT NOT NULL DEFAULT '',
  email_attempts INTEGER NOT NULL DEFAULT 0, last_email_attempt TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS analytics_views (
  day TEXT NOT NULL, pathname TEXT NOT NULL, views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(day,pathname)
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL, entity TEXT NOT NULL, entity_id TEXT NOT NULL, details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_props_search ON properties(status,purpose,area,type,bedrooms,price_aed);
CREATE INDEX IF NOT EXISTS idx_props_agent ON properties(agent_id,status);
CREATE INDEX IF NOT EXISTS idx_inquiries_agent ON inquiries(agent_id,created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
`);

// Idempotent migrations for existing demo databases and freshly seeded installs.
const existingLeadColumns=db.prepare('PRAGMA table_info(inquiries)').all().map(r=>r.name);
if(!existingLeadColumns.includes('internal_notes'))db.exec("ALTER TABLE inquiries ADD COLUMN internal_notes TEXT NOT NULL DEFAULT ''");
if(!existingLeadColumns.includes('follow_up_at'))db.exec('ALTER TABLE inquiries ADD COLUMN follow_up_at TEXT');
const leadColumns=db.prepare('PRAGMA table_info(inquiries)').all().map(r=>r.name);
if(!leadColumns.includes('email_attempts'))db.exec('ALTER TABLE inquiries ADD COLUMN email_attempts INTEGER NOT NULL DEFAULT 0');
if(!leadColumns.includes('last_email_attempt'))db.exec('ALTER TABLE inquiries ADD COLUMN last_email_attempt TEXT');

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
export function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, hex] = stored.split(':');
  if (!/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(hex)) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(actual, Buffer.from(hex, 'hex'));
}
export function audit(actorId, action, entity, entityId, details='') {
  db.prepare('INSERT INTO audit_logs(actor_id,action,entity,entity_id,details) VALUES(?,?,?,?,?)')
    .run(actorId || null, action, entity, String(entityId), String(details).slice(0,500));
}
export const areas = ['Dubai Marina', 'JBR', 'Business Bay'];
export const types = ['Apartment', 'Penthouse', 'Villa', 'Townhouse', 'Studio', 'Plot'];
export const amenitiesList = ['Balcony','Sea View','Marina View','City View','Swimming Pool','Gym','Parking','Concierge','Security','Study','Maids Room','Built-in Wardrobes','Central AC','Private Terrace','Children’s Play Area','Pet Friendly'];
export const propertySelect = `p.*, u.name AS agent_name,u.email AS agent_email,u.phone AS agent_phone,u.whatsapp AS agent_whatsapp,u.bio AS agent_bio,u.avatar_url AS agent_avatar`;
export const propertyJoin = `properties p JOIN users u ON u.id=p.agent_id`;
export function parseProperty(r) {
  if (!r) return null;
  return {
    ...r, furnished: Boolean(r.furnished), featured: Boolean(r.featured),
    amenities: JSON.parse(r.amenities_json || '[]'), photos: JSON.parse(r.photos_json || '[]')
  };
}
export function slugify(s) { return String(s).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100); }

export function queryPublic(raw={}) {
  const where = ["p.status='active'"]; const vals = [];
  const exact = [['purpose',['buy','rent']],['area',areas],['type',types]];
  for (const [key,allowed] of exact) if (allowed.includes(raw[key])) {where.push(`p.${key}=?`);vals.push(raw[key]);}
  if (raw.bedrooms !== undefined && raw.bedrooms !== '' && Number.isInteger(+raw.bedrooms) && +raw.bedrooms>=0 && +raw.bedrooms<=10) {where.push('p.bedrooms>=?');vals.push(+raw.bedrooms);}
  if (raw.furnished==='yes'||raw.furnished==='no') {where.push('p.furnished=?');vals.push(raw.furnished==='yes'?1:0);}
  if (raw.minPrice && Number.isFinite(+raw.minPrice) && +raw.minPrice>0) {where.push('p.price_aed>=?');vals.push(+raw.minPrice);}
  if (raw.maxPrice && Number.isFinite(+raw.maxPrice) && +raw.maxPrice>0) {where.push('p.price_aed<=?');vals.push(+raw.maxPrice);}
  if (raw.q && String(raw.q).length<=100) {where.push('(p.title LIKE ? OR p.ref LIKE ? OR p.description LIKE ?)');const term=`%${String(raw.q).replaceAll('%','\\%').replaceAll('_','\\_')}%`;vals.push(term,term,term);}
  const sort = ({newest:'p.created_at DESC,p.id DESC',oldest:'p.created_at ASC,p.id ASC',price_asc:'p.price_aed ASC',price_desc:'p.price_aed DESC'})[raw.sort]||'p.featured DESC,p.created_at DESC,p.id DESC';
  const total = db.prepare(`SELECT COUNT(*) AS n FROM ${propertyJoin} WHERE ${where.join(' AND ')}`).get(...vals).n;
  const limit = Math.max(1,Math.min(24,Number(raw.limit)||12));
  const page = Math.max(1,Math.min(1000,Number(raw.page)||1));
  const items = db.prepare(`SELECT ${propertySelect} FROM ${propertyJoin} WHERE ${where.join(' AND ')} ORDER BY ${sort} LIMIT ? OFFSET ?`).all(...vals,limit,(page-1)*limit).map(parseProperty);
  return { items,total,page,limit,pages:Math.ceil(total/limit) };
}
