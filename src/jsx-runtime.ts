// Custom JSX runtime for rendering to HTML strings (no React needed)

export type Child = string | number | boolean | null | undefined | VNode | Child[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentType = (props: any) => VNode;

export interface VNode {
  type: string | ComponentType;
  props: Record<string, unknown>;
  children: Child[];
}

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

const BOOLEAN_ATTRS = new Set([
  'disabled', 'checked', 'readonly', 'required', 'hidden',
  'selected', 'multiple', 'autofocus', 'autoplay', 'controls',
  'loop', 'muted', 'open', 'defer', 'async'
]);

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderAttrs(props: Record<string, unknown>): string {
  const attrs: string[] = [];
  
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'key' || key === 'ref') continue;
    if (value === false || value === null || value === undefined) continue;
    
    // Handle className -> class
    const attrName = key === 'className' ? 'class' : key;
    
    if (BOOLEAN_ATTRS.has(attrName) && value === true) {
      attrs.push(attrName);
    } else if (typeof value === 'string' || typeof value === 'number') {
      attrs.push(`${attrName}="${escapeHtml(String(value))}"`);
    } else if (typeof value === 'object' && attrName === 'style') {
      // Handle style objects
      const styleStr = Object.entries(value as Record<string, string | number>)
        .map(([k, v]) => {
          const cssKey = k.replace(/([A-Z])/g, '-$1').toLowerCase();
          return `${cssKey}: ${v}`;
        })
        .join('; ');
      attrs.push(`style="${escapeHtml(styleStr)}"`);
    }
  }
  
  return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
}

function renderChildren(children: Child[]): string {
  return children
    .map(child => {
      if (child === null || child === undefined || child === false || child === true) {
        return '';
      }
      if (typeof child === 'string') {
        return escapeHtml(child);
      }
      if (typeof child === 'number') {
        return String(child);
      }
      if (Array.isArray(child)) {
        return renderChildren(child);
      }
      return renderToString(child);
    })
    .join('');
}

export function renderToString(node: VNode | string | number | null | undefined): string {
  if (node === null || node === undefined) {
    return '';
  }
  
  if (typeof node === 'string' || typeof node === 'number') {
    return escapeHtml(String(node));
  }
  
  const { type, props, children } = node;
  
  // Function component
  if (typeof type === 'function') {
    const result = type({ ...props, children });
    return renderToString(result);
  }
  
  // Intrinsic element
  const attrs = renderAttrs(props);
  const childrenHtml = renderChildren(children);
  
  if (VOID_ELEMENTS.has(type)) {
    return `<${type}${attrs} />`;
  }
  
  return `<${type}${attrs}>${childrenHtml}</${type}>`;
}

// JSX factory function (automatic runtime)
export function jsx(
  type: string | ComponentType,
  props: Record<string, unknown> | null,
  key?: string
): VNode {
  const { children, ...rest } = props || {};
  const childArray = children === undefined ? [] : Array.isArray(children) ? children : [children];
  
  return {
    type,
    props: { ...rest, key },
    children: childArray as Child[],
  };
}

export const jsxs = jsx;
export const jsxDEV = jsx;

// Fragment support
export function Fragment(props: { children?: Child[] }): VNode {
  return {
    type: 'fragment',
    props: {},
    children: props.children || [],
  };
}

// Special handling for Fragment in renderToString
const originalRenderToString = renderToString;
export { originalRenderToString };

// Override to handle fragments
export function render(node: VNode | string | number | null | undefined): string {
  if (node && typeof node === 'object' && node.type === 'fragment') {
    return renderChildren(node.children);
  }
  return originalRenderToString(node);
}
