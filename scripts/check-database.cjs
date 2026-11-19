require('@next/env').loadEnvConfig(process.cwd());
const dns=require('node:dns').promises,net=require('node:net');
const {PrismaClient}=require('@prisma/client');
(async()=>{
 const u=new URL(process.env.DATABASE_URL);
 console.log(JSON.stringify({host:u.hostname,port:u.port||'5432',sslmode:u.searchParams.get('sslmode'),connectTimeout:u.searchParams.get('connect_timeout')}));
 try {await dns.lookup(u.hostname);console.log('DNS: OK')}catch(e){console.log('DNS: '+e.code);process.exitCode=1;return;}
 await new Promise(resolve=>{const s=net.createConnection({host:u.hostname,port:Number(u.port||5432)});s.setTimeout(8000);s.on('connect',()=>{console.log('TCP: OK');s.destroy();resolve()});s.on('timeout',()=>{console.log('TCP: TIMEOUT');s.destroy();resolve()});s.on('error',e=>{console.log('TCP: '+e.code);resolve()})});
 const p=new PrismaClient({log:[]});
 try {await p.$queryRawUnsafe('SELECT 1');console.log('Database query: OK')}catch(e){console.log(JSON.stringify({database:'FAILED',code:e.code||e.errorCode,name:e.name}));process.exitCode=1}finally{await p.$disconnect()}
})().catch(()=>{console.log('Invalid or missing DATABASE_URL');process.exitCode=1});
