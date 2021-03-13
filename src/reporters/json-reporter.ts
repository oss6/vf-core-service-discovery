import fs from 'fs';
import { PipelineItem } from '../types';

export default async function report(items: PipelineItem[]): Promise<void> {
  const fileName = 'vf-core-service-discovery-report.json';

  await fs.promises.writeFile(fileName, JSON.stringify(items, null, 4), 'utf-8');

  console.log(`\nReport saved in ${fileName}\n`);
}
