/**
 * Lista modelos Gemini disponibles para esta API key.
 * Uso: npx tsx scripts/list-gemini-models.ts
 */
import * as dotenv from 'dotenv';
import path from 'path';
import {
  listAvailableGeminiModels,
  resolveGeminiModelId,
  clearGeminiModelCache,
} from '../src/lib/helpers/gemini-models.helper';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  clearGeminiModelCache();

  console.log('GEMINI_MODEL (env):', process.env.GEMINI_MODEL ?? '(no definido)');
  console.log('GEMINI_DEBUG:', process.env.GEMINI_DEBUG ?? '(no definido)');
  console.log('---');

  const models = await listAvailableGeminiModels();
  console.log(`Modelos con generateContent: ${models.length}\n`);
  for (const m of models) {
    console.log(`  ${m.id.padEnd(42)} | ${m.displayName ?? ''}`);
  }

  console.log('\n--- Resolución automática ---');
  const resolved = await resolveGeminiModelId({ purpose: 'script-list' });
  console.log('Modelo seleccionado:', resolved);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
