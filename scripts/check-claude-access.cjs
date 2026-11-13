const {loadEnvConfig}=require('@next/env'); loadEnvConfig(process.cwd());
(async()=>{
 if(!process.env.ANTHROPIC_API_KEY) throw Error('ANTHROPIC_API_KEY is missing');
 const response=await fetch('https://api.anthropic.com/v1/models',{headers:{'x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},signal:AbortSignal.timeout(20000)});
 const data=await response.json();
 console.log(JSON.stringify({status:response.status,models:data.data?.filter(m=>m.id.includes('sonnet')).map(m=>m.id),errorType:data.error?.type}));
})().catch(()=>{console.error('Provider access check failed (network or missing configuration).');process.exitCode=1});
