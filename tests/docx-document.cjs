const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const JSZip = require('jszip');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
const { readDOCXDocument } = require('../src/lib/ai/docx-document.ts');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP9sAAAAASUVORK5CYII=', 'base64');
async function fixture(text, count = 0, mime = 'image/png', bytes = png, external = false) {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="${mime}"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
  zip.file('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="doc" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/_rels/document.xml.rels', `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${Array.from({length:count}, (_,i)=>`<Relationship Id="im${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${external ? 'file:///must-not-read.png' : `media/image${i}.png`}" ${external ? 'TargetMode="External"' : ''}/>`).join('')}</Relationships>`);
  zip.file('word/document.xml', `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p>${Array.from({length:count}, (_,i)=>`<w:p><w:r><w:drawing><wp:inline><wp:docPr id="${i+1}" name="Image ${i+1}"/><a:graphic><a:graphicData><pic:pic><pic:blipFill><a:blip r:${external?'link':'embed'}="im${i}"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`).join('')}</w:body></w:document>`);
  for(let i=0;i<count;i++) zip.file(`word/media/image${i}.png`,bytes);
  return zip.generateAsync({type:'nodebuffer'});
}
(async () => {
  assert.deepEqual(await readDOCXDocument(await fixture('Receive order')), {text:'Receive order',images:[]});
  const mixed = await readDOCXDocument(await fixture('Receive order', 2));
  assert.equal(mixed.text, 'Receive order');
  assert.deepEqual(mixed.images.map(i=>i.name), ['Document image 1','Document image 2']);
  assert.ok(mixed.images.every(i=>i.dataUrl === `data:image/png;base64,${png.toString('base64')}`));
  assert.equal((await readDOCXDocument(await fixture('',1))).images.length,1);
  await assert.rejects(readDOCXDocument(await fixture('Many',3)), e=>e.status===413);
  await assert.rejects(readDOCXDocument(await fixture('Unsupported',1,'image/tiff')), e=>e.status===422);
  await assert.rejects(readDOCXDocument(await fixture('Bad image',1,'image/png',Buffer.from('invalid'))));
  await assert.rejects(readDOCXDocument(await fixture('Large image',1,'image/png',Buffer.alloc(3*1024*1024+1))), e=>e.status===413);
  await assert.rejects(readDOCXDocument(await fixture('External',1,'image/png',png,true)), e=>e.status===422);
  await assert.rejects(readDOCXDocument(await fixture('x'.repeat(20001))), e=>e.status===413);
  await assert.rejects(readDOCXDocument(Buffer.from('not a DOCX')));
  console.log('PASS DOCX text, image order, image-only documents, size limits, unsupported/corrupt images and external image blocking');
  const Module = require('node:module');
  const path = require('node:path');
  const originalLoad = Module._load;
  Module._load = function(id,parent,isMain) {
    if(id==='@/lib/auth') return {authorizeProcess:async()=>null};
    if(id==='@/lib/db/prisma') return {prisma:{process:{findUnique:async()=>({status:'Draft'})}}};
    if(id.startsWith('@/')) id=path.join(__dirname,'../src',id.slice(2));
    return originalLoad.call(this,id,parent,isMain);
  };
  const {NextRequest} = require('next/server');
  const {POST} = require('../src/app/api/processes/[id]/document/route.ts');
  Module._load = originalLoad;
  const upload = async buffer => POST(new NextRequest('http://localhost/api/processes/p/document?name=test.docx', {method:'POST',body:new Uint8Array(buffer)}), {params:Promise.resolve({id:'p'})});
  for(const text of ['Receive order','']) {
    const response=await upload(await fixture(text,1));
    assert.equal(response.status,200);
    const result=await response.json();
    assert.equal(result.text,text);
    assert.equal(result.images.length,1);
    assert.equal(result.visual,true);
  }
  assert.equal((await upload(await fixture(''))).status,422);
  assert.equal((await upload(await fixture('Many',3))).status,413);
  console.log('PASS document API returns image attachments, accepts image-only DOCX, rejects empty and over-limit documents');
  if (process.argv[2]) {
    const actual = await readDOCXDocument(fs.readFileSync(process.argv[2]));
    assert.ok(actual.text.length > 0);
    assert.equal(actual.images.length,1);
    console.log(JSON.stringify({documentCharacters:actual.text.length,embeddedImages:actual.images.length,imageBytes:Buffer.from(actual.images[0].dataUrl.split(',')[1],'base64').length}));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
