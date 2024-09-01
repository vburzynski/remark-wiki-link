import assert from 'assert';
import { describe, test } from 'mocha';
import { unified } from 'unified';
import markdown from 'remark-parse';
import { visit } from 'unist-util-visit';
import remark2markdown from 'remark-stringify';

import wikiLinkPlugin, { wikiLinkPlugin as namedWikiLinkPlugin } from '../src/index.ts';
import { Node, select } from 'unist-util-select';
import { WikiLinkNode } from 'mdast-util-wiki-link';

describe('remark-wiki-link', () => {
  test('parses a wiki link that has a matching permalink', () => {
    const processor = unified()
      .use(markdown)
      .use(wikiLinkPlugin, { permalinks: ['wiki_link'] });

    let ast: Node = processor.parse('[[Wiki Link]]');
    ast = processor.runSync(ast);

    visit(ast, 'wikiLink', (node: WikiLinkNode) => {
      assert.equal(node.data.exists, true);
      assert.equal(node.data.permalink, 'wiki_link');
      assert.equal(node.data.hName, 'a');
      assert.equal(node.data.hProperties?.className, 'internal');
      assert.equal(node.data.hProperties?.href, '#/page/wiki_link');
      assert.equal(node.data.hChildren?.[0].value, 'Wiki Link');
    });
  });

  test('parses a wiki link that has no matching permalink', () => {
    const processor = unified().use(markdown).use(wikiLinkPlugin, { permalinks: [] });

    let ast: Node = processor.parse('[[New Page]]');
    ast = processor.runSync(ast);

    visit(ast, 'wikiLink', (node: WikiLinkNode) => {
      assert.equal(node.data.exists, false);
      assert.equal(node.data.permalink, 'new_page');
      assert.equal(node.data.hName, 'a');
      assert.equal(node.data.hProperties?.className, 'internal new');
      assert.equal(node.data.hProperties?.href, '#/page/new_page');
      assert.equal(node.data.hChildren?.[0].value, 'New Page');
    });
  });

  test('handles wiki links with aliases', () => {
    const processor = unified().use(markdown).use(wikiLinkPlugin, {permalinks: [] });

    let ast: Node = processor.parse('[[Real Page:Page Alias]]');
    ast = processor.runSync(ast);

    visit(ast, 'wikiLink', (node: WikiLinkNode) => {
      assert.equal(node.data.exists, false);
      assert.equal(node.data.permalink, 'real_page');
      assert.equal(node.data.hName, 'a');
      assert.equal(node.data.alias, 'Page Alias');
      assert.equal(node.value, 'Real Page');
      assert.equal(node.data.hProperties?.className, 'internal new');
      assert.equal(node.data.hProperties?.href, '#/page/real_page');
      assert.equal(node.data.hChildren?.[0].value, 'Page Alias');
    });
  });

  test('handles wiki alias links with custom divider', () => {
    const processor = unified().use(markdown).use(wikiLinkPlugin, {
      permalinks: [],
      aliasDivider: '|',
    });

    let ast: Node = processor.parse('[[Real Page|Page Alias]]');
    ast = processor.runSync(ast);

    visit(ast, 'wikiLink', (node: WikiLinkNode) => {
      assert.equal(node.data.exists, false);
      assert.equal(node.data.permalink, 'real_page');
      assert.equal(node.data.hName, 'a');
      assert.equal(node.data.alias, 'Page Alias');
      assert.equal(node.value, 'Real Page');
      assert.equal(node.data.hProperties?.className, 'internal new');
      assert.equal(node.data.hProperties?.href, '#/page/real_page');
      assert.equal(node.data.hChildren?.[0].value, 'Page Alias');
    });
  });

  test('stringifies wiki links', () => {
    const processor = unified()
      .use(markdown)
      .use(remark2markdown)
      .use(wikiLinkPlugin, { permalinks: ['wiki_link'] });

    const stringified = processor.processSync('[[Wiki Link]]').toString().trim();
    assert.equal(stringified, '[[Wiki Link]]');
  });

  test('stringifies aliased wiki links', () => {
    const processor = unified().use(markdown).use(remark2markdown).use(wikiLinkPlugin);

    const stringified = processor.processSync('[[Real Page:Page Alias]]').toString().trim();
    assert.equal(stringified, '[[Real Page:Page Alias]]');
  });

  describe('configuration options', () => {
    test('uses pageResolver', () => {
      const identity = (name: string) => [name];

      const processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin, {
          pageResolver: identity,
          permalinks: ['A Page'],
        });

      let ast: Node = processor.parse('[[A Page]]');
      ast = processor.runSync(ast);

      visit(ast, 'wikiLink', (node: WikiLinkNode) => {
        assert.equal(node.data.exists, true);
        assert.equal(node.data.permalink, 'A Page');
        assert.equal(node.data.hProperties?.href, '#/page/A Page');
      });
    });

    test('uses newClassName', () => {
      const processor = unified().use(markdown).use(wikiLinkPlugin, {
        newClassName: 'new_page',
      });

      let ast: Node = processor.parse('[[A Page]]');
      ast = processor.runSync(ast);

      visit(ast, 'wikiLink', (node: WikiLinkNode) => {
        assert.equal(node.data.hProperties?.className, 'internal new_page');
      });
    });

    test('uses hrefTemplate', () => {
      const processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin, {
          hrefTemplate: (permalink: string) => permalink,
        });

      let ast: Node = processor.parse('[[A Page]]');
      ast = processor.runSync(ast);

      visit(ast, 'wikiLink', (node: WikiLinkNode) => {
        assert.equal(node.data.hProperties?.href, 'a_page');
      });
    });

    test('uses wikiLinkClassName', () => {
      const processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin, {
          wikiLinkClassName: 'wiki_link',
          permalinks: ['a_page'],
        });

      let ast: Node = processor.parse('[[A Page]]');
      ast = processor.runSync(ast);

      visit(ast, 'wikiLink', (node: WikiLinkNode) => {
        assert.equal(node.data.hProperties?.className, 'wiki_link');
      });
    });
  });

  describe('open wiki links', () => {
    test('handles open wiki links', () => {
      const processor = unified().use(markdown).use(wikiLinkPlugin, {
        permalinks: [],
      });

      let ast: Node = processor.parse('t[[\nt');
      ast = processor.runSync(ast);

      assert.equal(!select('wikiLink', ast), true);
    });

    test('handles open wiki links at end of file', () => {
      const processor = unified().use(markdown).use(wikiLinkPlugin, {
        permalinks: [],
      });

      let ast: Node = processor.parse('t [[');
      ast = processor.runSync(ast);

      assert.equal(!select('wikiLink', ast), true);
    });

    test('handles open wiki links with partial data', () => {
      const processor = unified().use(markdown).use(wikiLinkPlugin, {
        permalinks: [],
      });

      let ast: Node = processor.parse('t [[tt\nt');
      ast = processor.runSync(ast);

      assert.equal(!select('wikiLink', ast), true);
    });

    test('handles open wiki links with partial alias divider', () => {
      const processor = unified().use(markdown).use(wikiLinkPlugin, {
        aliasDivider: '::',
        permalinks: [],
      });

      let ast: Node = processor.parse('[[t::\n');
      ast = processor.runSync(ast);

      assert.equal(!select('wikiLink', ast), true);
    });

    test('handles open wiki links with partial alias', () => {
      const processor = unified().use(markdown).use(wikiLinkPlugin, {
        permalinks: [],
      });

      let ast: Node = processor.parse('[[t:\n');
      ast = processor.runSync(ast);

      assert.equal(!select('wikiLink', ast), true);
    });
  });

  test('exports the plugin with named exports', () => {
    assert.equal(wikiLinkPlugin, namedWikiLinkPlugin);
  });
});
