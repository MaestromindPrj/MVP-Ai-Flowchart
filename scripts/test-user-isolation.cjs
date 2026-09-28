const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const base = process.env.TEST_BASE_URL || 'http://localhost:3100';
const emails = [0, 1].map(i => 'isolation-' + randomUUID() + '-' + i + '@example.test');
const password = randomUUID() + 'Aa!';
async function request(path, method = 'GET', cookie, body) {
  const response = await fetch(base + path, { method, headers: { ...(cookie ? { cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, redirect: 'manual' });
  const text = await response.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: response.status, data, cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
(async () => {
 try {
  assert.equal((await request('/api/processes')).status, 401);
  const cookies = [];
  for (const email of emails) {
    const result = await request('/api/auth/register', 'POST', null, { email, name: 'Isolation test', password });
    assert.equal(result.status, 201, JSON.stringify(result.data)); assert.ok(result.cookie); cookies.push(result.cookie);
  }
  assert.equal((await request('/api/auth/login', 'POST', null, { email: emails[0], password: 'incorrect-password' })).status, 401);
  assert.equal((await request('/api/auth/register', 'POST', null, { email: emails[0], name: 'Duplicate', password })).status, 409);
  const created = await request('/api/processes', 'POST', cookies[0], { name: 'Isolation test flowchart', creatorId: 'spoofed', ownerEmail: emails[1] });
  assert.equal(created.status, 201, JSON.stringify(created.data));
  const chart = created.data.process;
  assert.equal(chart.ownerEmail, emails[0]);
  assert.equal((await request('/api/processes', 'GET', cookies[0])).data.processes.length, 1);
  assert.equal((await request('/api/processes', 'GET', cookies[1])).data.processes.length, 0);
  const path = '/api/processes/' + chart.id;
  for (const [suffix, method, body] of [['','GET'],['','PATCH',{name:'Stolen'}],['','DELETE'],['/messages','GET'],['/messages','POST',{message:'Intrusion'}],['/participants','GET'],['/participants','POST',{name:'X',role:'Y'}],['/participants/'+chart.participants[0].id,'DELETE'],['/versions','GET'],['/versions','POST',{}],['/versions/'+chart.versions[0].id+'/restore','POST',{}],['/finalize','POST',{}]]) {
    assert.equal((await request(path + suffix, method, cookies[1], body)).status, 404, method + suffix);
  }
  assert.equal((await request('/api/ai/process-message', 'POST', cookies[1], {processId:chart.id,message:'Edit',currentProcess:{nodes:[],edges:[]}})).status,404);
  assert.equal((await request('/processes/'+chart.id,'GET',cookies[1])).status,404);
  assert.equal((await request(path,'GET',cookies[0])).status,200);
  async function uploadDocument(name, contents, cookie = cookies[0]) {
    const response = await fetch(base + path + '/document?name=' + encodeURIComponent(name), { method:'POST', headers:{cookie}, body:contents });
    return {status:response.status, data:await response.json()};
  }
  assert.equal((await uploadDocument('process.txt','Order received. Manager approves. Ship order.')).status,200);
  const { jsPDF } = require('jspdf'); const pdf = new jsPDF(); pdf.text('Order received. Manager approves. Ship order.',10,10);
  const parsedPdf = await uploadDocument('process.pdf',Buffer.from(pdf.output('arraybuffer')));
  assert.equal(parsedPdf.status,200,JSON.stringify(parsedPdf.data)); assert.match(parsedPdf.data.text,/Manager approves/);
  const JSZip = require('jszip'); const zip = new JSZip();
  zip.file('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Manager approves the order.</w:t></w:r></w:p></w:body></w:document>');
  const parsedDocx = await uploadDocument('process.docx',await zip.generateAsync({type:'nodebuffer'}));
  assert.equal(parsedDocx.status,200,JSON.stringify(parsedDocx.data)); assert.match(parsedDocx.data.text,/Manager approves/);
  assert.equal((await uploadDocument('empty.txt','')).status,422);
  assert.equal((await uploadDocument('invalid.pdf','Not a PDF')).status,422);
  assert.equal((await uploadDocument('process.exe','Process')).status,400);
  assert.equal((await uploadDocument('long.txt','x'.repeat(20001))).status,413);
  assert.equal((await uploadDocument('large.txt',Buffer.alloc(4*1024*1024+1))).status,413);
  assert.equal((await uploadDocument('process.txt','Process',cookies[1])).status,404);
  const sharePath = path + '/shares';
  assert.equal((await request(sharePath,'POST',cookies[0],{email:emails[1],permission:'admin'})).status,400);
  assert.equal((await request(sharePath,'POST',cookies[0],{email:emails[1],permission:'view'})).status,200);
  assert.equal((await uploadDocument('process.txt','Process',cookies[1])).status,403);
  const sharedList = await request('/api/processes?search=Isolation','GET',cookies[1]);
  assert.equal(sharedList.data.processes.length,1); assert.equal(sharedList.data.processes[0].permission,'view');
  assert.equal((await request(path,'GET',cookies[1])).status,200);
  assert.equal((await request('/processes/'+chart.id,'GET',cookies[1])).status,200);
  assert.equal((await request('/processes/'+chart.id+'/versions','GET',cookies[1])).status,200);
  for (const [suffix,method,body] of [['','PATCH',{name:'Blocked'}],['','DELETE'],['/messages','POST',{message:'Blocked'}],['/participants','POST',{name:'X',role:'Y'}],['/participants/'+chart.participants[0].id,'DELETE'],['/versions','POST',{}],['/versions/'+chart.versions[0].id+'/restore','POST',{}],['/finalize','POST',{}]]) assert.equal((await request(path+suffix,method,cookies[1],body)).status,403,method+suffix);
  assert.equal((await request('/api/ai/process-message','POST',cookies[1],{processId:chart.id,message:'Edit',currentProcess:{nodes:[],edges:[]}})).status,403);
  assert.equal((await request(sharePath,'GET',cookies[1])).status,403);
  assert.equal((await request(sharePath,'POST',cookies[0],{email:emails[1],permission:'edit'})).status,200);
  assert.equal((await request(path,'PATCH',cookies[1],{name:'Shared edit saved'})).status,200);
  assert.equal((await request(path+'/messages','POST',cookies[1],{message:'Editor message'})).status,201);
  assert.equal((await request(path+'/versions','POST',cookies[1],{processData:{nodes:[],edges:[]}})).status,201);
  assert.equal((await request(path,'DELETE',cookies[1])).status,403);
  assert.equal((await request(sharePath,'POST',cookies[1],{email:emails[1],permission:'edit'})).status,403);
  const accessList = await request(sharePath,'GET',cookies[0]); assert.equal(accessList.data.shares.length,1);
  assert.equal((await request(sharePath,'POST',cookies[0],{email:emails[1],permission:'view'})).status,200);
  assert.equal((await request(path,'PATCH',cookies[1],{name:'Downgraded'})).status,403);
  assert.equal((await request(sharePath,'DELETE',cookies[0],{userId:accessList.data.shares[0].userId})).status,200);
  assert.equal((await request(path,'GET',cookies[1])).status,404);
  assert.equal((await request('/api/processes','GET',cookies[1])).data.processes.length,0);
  const me = await request('/api/auth/me','GET',cookies[0]); assert.equal(me.data.user.email,emails[0]); assert.equal(me.data.user.passwordHash,undefined);
  assert.equal((await request('/api/auth/logout','POST',cookies[0])).status,200);
  assert.equal((await request('/api/processes','GET',cookies[0])).status,401);
  assert.equal((await request('/api/auth/login','POST',null,{email:emails[0],password})).status,200);
  console.log('PASS: registration, credentials, creator assignment, account isolation, nested routes, direct links, PDF/DOCX/text imports and limits, view/edit sharing, downgrade, revocation, owner-only administration, login and session revocation');
 } finally {
   const users = await prisma.user.findMany({where:{email:{in:emails}},select:{id:true,organizationId:true}});
   await prisma.process.deleteMany({where:{creatorId:{in:users.map(u=>u.id)}}});
   await prisma.user.deleteMany({where:{id:{in:users.map(u=>u.id)}}});
   await prisma.organization.deleteMany({where:{id:{in:users.map(u=>u.organizationId).filter(Boolean)}}});
   await prisma.$disconnect();
 }
})().catch(error => { console.error(error); process.exitCode = 1; });
