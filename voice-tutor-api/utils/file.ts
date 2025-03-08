import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export async function saveTempFile(buffer: Buffer, extension: string): Promise<string> {
  const tempPath = path.join(os.tmpdir(), `recording-${Date.now()}${extension}`);
  await fs.promises.writeFile(tempPath, buffer);
  return tempPath;
} 