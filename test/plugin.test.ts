import { readFileSync } from 'node:fs';
import { type Transform } from 'node:stream';

import Vinyl from 'vinyl';

import gulpFrontmatter from '../src';
import PluginError from '../src/lib/PluginError';

interface VinylWithData extends Vinyl {
  data: Record<string, unknown> | undefined;
}

function applyFileToStream<T extends Transform>(stream: T, file: Vinyl): T {
  stream.write(file);
  stream.end();
  return stream;
}

async function readStream<T>(stream: Transform): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const chunks: T[] = [];
    stream.on('data', (chunk: T) => {
      chunks.push(chunk);
    });
    stream.on('end', () => {
      resolve(chunks);
    });
    stream.on('error', (error) => {
      reject(error);
    });
  });
}

function getResourcePath(basename: string): string {
  return `${__dirname}/__resources__/${basename}`;
}

function loadFile(pathname: string): VinylWithData & { contents: Buffer } {
  const file = new Vinyl() as VinylWithData & { contents: Buffer };
  file.contents = readFileSync(pathname);
  return file;
}

function expectResult(result: VinylWithData[], expectedData: Record<string, unknown>, expectedContent?: string): void {
  expect(result.length).toEqual(1);
  expect(result[0]?.data).toEqual(expectedData);
  expect(result[0]?.contents?.toString('utf8')).toEqual(expectedContent);
}

describe('the plugin', () => {
  it('loads frontmatter and strips from output', async () => {
    const file = loadFile(getResourcePath('with-frontmatter.md'));
    const stream = applyFileToStream(gulpFrontmatter(), file);
    const result = await readStream<VinylWithData>(stream);

    expectResult(
      result,
      {
        'value-one': 'Hello World',
        'value-two': 123, // eslint-disable-line @typescript-eslint/no-magic-numbers -- Matching the file
        'value-three': ['a', 'b', 'c'],
      },
      `# Example File

Some example content.
`,
    );
  });

  it('preserves frontmatter when specified', async () => {
    const file = loadFile(getResourcePath('with-frontmatter.md'));
    const stream = applyFileToStream(gulpFrontmatter({ strip: false }), file);
    const result = await readStream<VinylWithData>(stream);

    expectResult(
      result,
      {
        'value-one': 'Hello World',
        'value-two': 123, // eslint-disable-line @typescript-eslint/no-magic-numbers -- Matching the file
        'value-three': ['a', 'b', 'c'],
      },
      file.contents.toString('utf8'),
    );
  });

  it('ignores files without frontmatter', async () => {
    const file = loadFile(getResourcePath('no-frontmatter.md'));
    const stream = applyFileToStream(gulpFrontmatter(), file);
    const result = await readStream<VinylWithData>(stream);

    expectResult(result, {}, file.contents.toString('utf8'));
  });

  it('handles null files', async () => {
    const file = new Vinyl();
    file.contents = null;
    const stream = applyFileToStream(gulpFrontmatter(), file);
    const result = await readStream<VinylWithData>(stream);

    expect(result.length).toEqual(1);
    expect(result[0]).toStrictEqual(file);
    expect(result[0]?.data).toBeUndefined();
  });

  it('rejects invalid files', async () => {
    const file = {
      isNull: () => false,
      isBuffer: () => false,
      isStream: () => false,
      basename: '',
    } as VinylWithData;
    const stream = applyFileToStream(gulpFrontmatter(), file);

    await expect(readStream(stream)).rejects.toThrowError(PluginError);
  });
});
