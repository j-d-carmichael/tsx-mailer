import { describe, it, expect } from 'vitest';
import { jsx, jsxs, Fragment, render, renderToString } from './jsx-runtime';

describe('jsx-runtime', () => {
  describe('jsx factory', () => {
    it('creates a VNode for intrinsic elements', () => {
      const node = jsx('div', { className: 'test' });
      
      expect(node).toEqual({
        type: 'div',
        props: { className: 'test', key: undefined },
        children: [],
      });
    });

    it('handles children prop', () => {
      const node = jsx('p', { children: 'Hello' });
      
      expect(node.children).toEqual(['Hello']);
    });

    it('handles multiple children with jsxs', () => {
      const node = jsxs('div', { children: ['Hello', ' ', 'World'] });
      
      expect(node.children).toEqual(['Hello', ' ', 'World']);
    });

    it('handles nested elements', () => {
      const child = jsx('span', { children: 'inner' });
      const parent = jsx('div', { children: child });
      
      expect(parent.children).toEqual([child]);
    });
  });

  describe('renderToString', () => {
    it('renders a simple element', () => {
      const node = jsx('div', { children: 'Hello' });
      const html = renderToString(node);
      
      expect(html).toBe('<div>Hello</div>');
    });

    it('renders nested elements', () => {
      const node = jsx('div', {
        children: jsx('span', { children: 'nested' }),
      });
      const html = renderToString(node);
      
      expect(html).toBe('<div><span>nested</span></div>');
    });

    it('renders attributes', () => {
      const node = jsx('a', { href: 'https://example.com', children: 'Link' });
      const html = renderToString(node);
      
      expect(html).toBe('<a href="https://example.com">Link</a>');
    });

    it('converts className to class', () => {
      const node = jsx('div', { className: 'container' });
      const html = renderToString(node);
      
      expect(html).toBe('<div class="container"></div>');
    });

    it('renders void elements correctly', () => {
      const node = jsx('br', {});
      const html = renderToString(node);
      
      expect(html).toBe('<br />');
    });

    it('renders img as void element', () => {
      const node = jsx('img', { src: 'test.png', alt: 'Test' });
      const html = renderToString(node);
      
      expect(html).toBe('<img src="test.png" alt="Test" />');
    });

    it('renders boolean attributes', () => {
      const node = jsx('input', { type: 'checkbox', checked: true, disabled: false });
      const html = renderToString(node);
      
      expect(html).toBe('<input type="checkbox" checked />');
    });

    it('escapes HTML in text content', () => {
      const node = jsx('div', { children: '<script>alert("xss")</script>' });
      const html = renderToString(node);
      
      expect(html).toBe('<div>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</div>');
    });

    it('escapes HTML in attributes', () => {
      const node = jsx('div', { title: 'Say "hello"' });
      const html = renderToString(node);
      
      expect(html).toBe('<div title="Say &quot;hello&quot;"></div>');
    });

    it('handles style objects', () => {
      const node = jsx('div', {
        style: { backgroundColor: 'red', fontSize: '16px' },
      });
      const html = renderToString(node);
      
      expect(html).toBe('<div style="background-color: red; font-size: 16px"></div>');
    });

    it('handles null and undefined children', () => {
      const node = jsxs('div', { children: ['Hello', null, undefined, 'World'] });
      const html = renderToString(node);
      
      expect(html).toBe('<div>HelloWorld</div>');
    });

    it('handles boolean children (should be ignored)', () => {
      const node = jsxs('div', { children: [true, 'visible', false] });
      const html = renderToString(node);
      
      expect(html).toBe('<div>visible</div>');
    });

    it('handles number children', () => {
      const node = jsx('span', { children: 42 });
      const html = renderToString(node);
      
      expect(html).toBe('<span>42</span>');
    });

    it('handles array children', () => {
      const items = ['a', 'b', 'c'];
      const node = jsx('ul', {
        children: items.map(item => jsx('li', { children: item })),
      });
      const html = renderToString(node);
      
      expect(html).toBe('<ul><li>a</li><li>b</li><li>c</li></ul>');
    });
  });

  describe('Fragment', () => {
    it('creates a fragment node', () => {
      const node = Fragment({ children: [jsx('span', { children: 'a' }), jsx('span', { children: 'b' })] });
      
      expect(node.type).toBe('fragment');
    });

    it('renders fragment children without wrapper', () => {
      const node = Fragment({
        children: [jsx('span', { children: 'a' }), jsx('span', { children: 'b' })],
      });
      const html = render(node);
      
      expect(html).toBe('<span>a</span><span>b</span>');
    });
  });

  describe('function components', () => {
    it('renders function components', () => {
      const Greeting = (props: { name: string }) => jsx('h1', { children: `Hello, ${props.name}!` });
      
      const node = jsx(Greeting, { name: 'World' });
      const html = renderToString(node);
      
      expect(html).toBe('<h1>Hello, World!</h1>');
    });

    it('renders nested function components', () => {
      const Inner = (props: { text: string }) => jsx('span', { children: props.text });
      const Outer = (props: { text: string }) => jsx('div', { children: jsx(Inner, { text: props.text }) });
      
      const node = jsx(Outer, { text: 'nested' });
      const html = renderToString(node);
      
      expect(html).toBe('<div><span>nested</span></div>');
    });
  });

  describe('render', () => {
    it('handles fragments specially', () => {
      const node = Fragment({ children: [jsx('a', {}), jsx('b', {})] });
      const html = render(node);
      
      expect(html).toBe('<a></a><b></b>');
    });

    it('falls back to renderToString for non-fragments', () => {
      const node = jsx('div', { children: 'test' });
      const html = render(node);
      
      expect(html).toBe('<div>test</div>');
    });
  });
});
