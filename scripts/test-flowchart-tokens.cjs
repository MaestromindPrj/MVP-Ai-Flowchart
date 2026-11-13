// Default: count input tokens only. --live explicitly enables paid generation.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
require('@next/env').loadEnvConfig(root);
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
const { AnthropicAIProcessService } = require('../src/lib/ai/anthropic-process-service.ts');
const { parseProcessData } = require('../src/lib/ai/validation.ts');

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('node scripts/test-flowchart-tokens.cjs [--case simple|medium|complex|all] [--live]\nDefaults to simple and input estimation only. --live spends API credits. Reports are saved to test-results/.');
    return;
  }
  let selected = 'simple';
  let live = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--live') live = true;
    else if (args[i] === '--case' && args[i + 1]) selected = args[++i];
    else throw Error('Unknown or incomplete option. Use --help.');
  }
  const scenarios = JSON.parse(fs.readFileSync(path.join(root, 'tests/flowchart-scenarios.json'), 'utf8'));
  const cases = scenarios.filter(item => selected === 'all' || item.id === selected);
  if (!cases.length) throw Error('Unknown case. Use simple, medium, complex or all.');
  if (!process.env.ANTHROPIC_API_KEY?.trim()) throw Error('Add ANTHROPIC_API_KEY to .env first.');
  const realFetch = global.fetch;
  const reports = [];
  for (const scenario of cases) {
    const entry = { case: scenario.id, mode: live ? 'live' : 'estimate', timestamp: new Date().toISOString() };
    const start = Date.now();
    let generated;
    // Intercept the production service request, so the count includes its actual
    // system prompt, graph, history and any future request-format changes.
    global.fetch = async (url, options) => {
      if (url !== 'https://api.anthropic.com/v1/messages') throw Error('Unexpected provider URL.');
      const body = JSON.parse(options.body);
      entry.model = body.model;
      entry.maximumOutputTokens = body.max_tokens;
      const countResponse = await realFetch('https://api.anthropic.com/v1/messages/count_tokens', {
        ...options,
        body: JSON.stringify({ model: body.model, system: body.system, messages: body.messages }),
      });
      if (!countResponse.ok) throw Error(`Token count failed (HTTP ${countResponse.status}).`);
      const count = await countResponse.json();
      if (!Number.isSafeInteger(count.input_tokens) || count.input_tokens < 0) throw Error('Invalid token count response.');
      entry.estimatedInputTokens = count.input_tokens;
      entry.inputEstimatePlusOutputCap = count.input_tokens + body.max_tokens;
      if (!live) return new Response(JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text: '{"responseMessage":"Estimate only"}' }] }));
      const response = await realFetch(url, { ...options, signal: AbortSignal.timeout(45000) });
      entry.httpStatus = response.status;
      if (response.ok) {
        const payload = await response.clone().json();
        entry.stopReason = payload.stop_reason;
        const u = payload.usage;
        if (u && Number.isSafeInteger(u.input_tokens) && Number.isSafeInteger(u.output_tokens)) {
          entry.inputTokens = u.input_tokens;
          entry.outputTokens = u.output_tokens;
          entry.cacheCreationTokens = u.cache_creation_input_tokens || 0;
          entry.cacheReadTokens = u.cache_read_input_tokens || 0;
          entry.totalTokens = entry.inputTokens + entry.outputTokens + entry.cacheCreationTokens + entry.cacheReadTokens;
        }
      }
      return response;
    };
    try {
      const graph = scenario.currentProcess ? parseProcessData(scenario.currentProcess) : { nodes: [], edges: [] };
      const result = await new AnthropicAIProcessService().sendMessage('token-test', scenario.prompt, graph, scenario.history || []);
      if (live) {
        generated = result;
        const update = result.processUpdate;
        const checks = {
          diagramReturned: !!update,
          minimumNodes: !!update && update.nodes.length >= scenario.minimumNodes,
          requiredTypes: !!update && scenario.requiredTypes.every(type => update.nodes.some(node => node.type === type)),
        };
        entry.checks = checks;
        entry.passed = Object.values(checks).every(Boolean);
        entry.nodes = update?.nodes.length || 0;
        entry.edges = update?.edges.length || 0;
        if (!entry.passed) process.exitCode = 1;
      } else entry.validation = 'Not run; no diagram generated.';
    } catch (error) {
      entry.error = error.message;
      process.exitCode = 1;
    } finally {
      global.fetch = realFetch;
      entry.durationMs = Date.now() - start;
    }
    const directory = path.join(root, 'test-results');
    fs.mkdirSync(directory, { recursive: true });
    const filename = `flowchart-${scenario.id}-${Date.now()}`;
    fs.writeFileSync(path.join(directory, `${filename}.json`), JSON.stringify({ ...entry, result: generated }, null, 2));
    reports.push(entry);
    // Stop on provider failures to avoid repeating failing calls across the suite.
    if (entry.error) break;
  }
  console.table(reports.map(row => ({
    case: row.case, mode: row.mode, estimatedInput: row.estimatedInputTokens,
    outputCap: row.maximumOutputTokens, actualInput: row.inputTokens,
    actualOutput: row.outputTokens, actualTotal: row.totalTokens,
    validation: row.error || (row.mode === 'live' ? (row.passed ? 'PASS' : 'FAIL') : 'not run'),
  })));
  console.log('Reports: test-results/. Output consumption is known only after generation. Checks validate structure and selected requirements, not full business correctness.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
