import {seedIfEmpty,} from '../src/seed.mjs';
import {db} from '../src/database.mjs';
const seeded=seedIfEmpty();
console.log(seeded ? 'Created demo database: 60 sample properties, 9 agents, 1 admin, 18 sample inquiries.' : 'Database already initialized; existing accounts and data preserved.');
console.log('Demo login details: data/demo-credentials.txt');
console.log('Start site: npm start | Open http://localhost:3000');
db.close();
