const fs=require('fs'),ts=require('typescript');
require('@next/env').loadEnvConfig(process.cwd());
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const {AnthropicAIProcessService}=require('../src/lib/ai/anthropic-process-service.ts');
const {getDailyTokenUsage}=require('../src/lib/ai/usage.ts');
process.env.AI_PROVIDER='anthropic';
(async()=>{
 const result=await new AnthropicAIProcessService().sendMessage('smoke','Create a minimal flowchart with only Start connected to End. Keep the explanation to one sentence.',{nodes:[],edges:[]});
 console.log(JSON.stringify({success:true,nodes:result.processUpdate?.nodes.length,edges:result.processUpdate?.edges.length,tokens:getDailyTokenUsage()[0]?.tokensUsed}));
})().catch(e=>{console.error(e.message);process.exitCode=1});
