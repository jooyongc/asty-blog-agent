/**
 * scripts/setup-glossaries.ts
 *
 * Run ONCE to upload glossary/ja.csv and glossary/zh.csv to DeepL
 * and print the resulting glossary IDs. Save those IDs to .env as
 * DEEPL_GLOSSARY_JA_ID and DEEPL_GLOSSARY_ZH_ID.
 *
 * CSV format: source_term,target_term  (no header)
 */

import * as deepl from 'deepl-node';

const translator = new deepl.Translator(process.env.DEEPL_API_KEY!);

async function uploadGlossary(name: string, target: deepl.TargetLanguageCode, csvPath: string) {
  const glossary = await translator.createGlossaryWithCsv(
    name,
    'en',
    target,
    csvPath
  );
  console.log(`Created ${name} for ${target}: ${glossary.glossaryId} (${glossary.entryCount} entries)`);
}

(async () => {
  await uploadGlossary('asty-ja-v1', 'ja', 'glossary/ja.csv');
  await uploadGlossary('asty-zh-v1', 'zh', 'glossary/zh.csv');
  console.log('\nAdd the IDs above to your .env file.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
