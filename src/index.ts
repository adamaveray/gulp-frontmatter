import { Transform } from 'node:stream';

import graymatter from 'gray-matter';
import type Vinyl from 'vinyl';

import PluginError from './lib/PluginError';
import readVinylFile from './lib/readVinylFile';

interface VinylWithData extends Vinyl {
  data: Record<string, unknown> | undefined;
}

export interface Options {
  /** Whether to strip the frontmatter section from the outputted file contents */
  strip: boolean;
}

const newlinesRegex = /^[\n\r]/u;
const stripLeadingNewlines = (string: string): string => string.replace(newlinesRegex, '');

export default function frontmatter(options: Partial<Options> = {}): Transform {
  const { strip = true } = options;

  return new Transform({
    objectMode: true,
    async transform(file: VinylWithData, encoding, callback) {
      if (file.isNull()) {
        this.push(file);
        callback();
        return;
      }

      // Load file
      const contents = await readVinylFile(file);
      if (contents == null) {
        callback(new PluginError('Unsupported file'));
        return;
      }

      const { data, content } = graymatter(contents);
      file = file.clone({ contents: !strip });
      file.data = { ...file.data, ...data };
      if (strip) {
        file.contents = Buffer.from(stripLeadingNewlines(content));
      }
      callback(null, file);
    },
  });
}
