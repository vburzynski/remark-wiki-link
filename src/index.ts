import type { Data, Plugin, Processor } from 'unified';

import { syntax, WikiLinkSyntaxOptions } from 'micromark-extension-wiki-link';
import { fromMarkdown, toMarkdown, type FromMarkdownOptions } from 'mdast-util-wiki-link';
import { Extension as MicromarkExtension } from 'micromark-util-types';
import { Extension as FromMarkdownExtension } from 'mdast-util-from-markdown';
import { Options as ToMarkdownOptions } from 'mdast-util-to-markdown';

type RemarkWikiLinkOptions = FromMarkdownOptions & WikiLinkSyntaxOptions;

let warningIssued: boolean = false;

declare module 'unified' {
  interface Data {
    micromarkExtensions?: MicromarkExtension[] | undefined
    fromMarkdownExtensions?: FromMarkdownExtension[] | undefined
    toMarkdownExtensions?: ToMarkdownOptions[] | undefined
  }
}

export const wikiLinkPlugin: Plugin = function wikiLinkPlugin(this: Processor, opts: Partial<RemarkWikiLinkOptions> = {}) {
  const data: Data = this.data();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (!warningIssued && ((this.Parser?.prototype?.blockTokenizers) || (this.Compiler?.prototype?.visitors)) ) {
    warningIssued = true;
    console.warn('[remark-wiki-link] Warning: please upgrade to remark 13 to use this plugin');
  }

  const micromarkExtensions = data.micromarkExtensions || (data.micromarkExtensions = []);
  const fromMarkdownExtensions = data.fromMarkdownExtensions || (data.fromMarkdownExtensions = []);
  const toMarkdownExtensions = data.toMarkdownExtensions || (data.toMarkdownExtensions = []);

  micromarkExtensions.push(syntax(opts));
  fromMarkdownExtensions.push(fromMarkdown(opts));
  toMarkdownExtensions.push(toMarkdown(opts));
}

export default wikiLinkPlugin;
