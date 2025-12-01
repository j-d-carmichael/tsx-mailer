import type { VNode, Child } from './jsx-runtime';

declare global {
  namespace JSX {
    type Element = VNode;
    
    interface ElementChildrenAttribute {
      children: {};
    }
    
    interface IntrinsicElements {
      // Document
      html: HtmlAttributes;
      head: HtmlAttributes;
      body: HtmlAttributes;
      
      // Metadata
      title: HtmlAttributes;
      meta: MetaAttributes;
      link: LinkAttributes;
      style: StyleAttributes;
      
      // Content sectioning
      header: HtmlAttributes;
      footer: HtmlAttributes;
      main: HtmlAttributes;
      section: HtmlAttributes;
      article: HtmlAttributes;
      aside: HtmlAttributes;
      nav: HtmlAttributes;
      div: HtmlAttributes;
      
      // Text content
      p: HtmlAttributes;
      h1: HtmlAttributes;
      h2: HtmlAttributes;
      h3: HtmlAttributes;
      h4: HtmlAttributes;
      h5: HtmlAttributes;
      h6: HtmlAttributes;
      span: HtmlAttributes;
      pre: HtmlAttributes;
      blockquote: HtmlAttributes;
      hr: HtmlAttributes;
      br: HtmlAttributes;
      
      // Inline text
      a: AnchorAttributes;
      strong: HtmlAttributes;
      b: HtmlAttributes;
      em: HtmlAttributes;
      i: HtmlAttributes;
      u: HtmlAttributes;
      s: HtmlAttributes;
      small: HtmlAttributes;
      sub: HtmlAttributes;
      sup: HtmlAttributes;
      code: HtmlAttributes;
      
      // Lists
      ul: HtmlAttributes;
      ol: HtmlAttributes;
      li: HtmlAttributes;
      dl: HtmlAttributes;
      dt: HtmlAttributes;
      dd: HtmlAttributes;
      
      // Tables
      table: TableAttributes;
      thead: HtmlAttributes;
      tbody: HtmlAttributes;
      tfoot: HtmlAttributes;
      tr: HtmlAttributes;
      th: ThAttributes;
      td: TdAttributes;
      caption: HtmlAttributes;
      colgroup: HtmlAttributes;
      col: ColAttributes;
      
      // Media
      img: ImgAttributes;
      
      // Forms (for interactive emails)
      form: FormAttributes;
      input: InputAttributes;
      button: ButtonAttributes;
      textarea: TextareaAttributes;
      select: SelectAttributes;
      option: OptionAttributes;
      label: LabelAttributes;
      
      // Other
      center: HtmlAttributes;
      font: FontAttributes;
    }
    
    interface HtmlAttributes {
      children?: Child | Child[];
      key?: string | number;
      id?: string;
      className?: string;
      style?: string | Record<string, string | number>;
      title?: string;
      lang?: string;
      dir?: 'ltr' | 'rtl' | 'auto';
      hidden?: boolean;
      'data-*'?: string;
      [key: `data-${string}`]: string | undefined;
    }
    
    interface MetaAttributes extends HtmlAttributes {
      charset?: string;
      name?: string;
      content?: string;
      httpEquiv?: string;
    }
    
    interface LinkAttributes extends HtmlAttributes {
      href?: string;
      rel?: string;
      type?: string;
      media?: string;
    }
    
    interface StyleAttributes extends HtmlAttributes {
      type?: string;
      media?: string;
    }
    
    interface AnchorAttributes extends HtmlAttributes {
      href?: string;
      target?: '_blank' | '_self' | '_parent' | '_top';
      rel?: string;
      download?: string | boolean;
    }
    
    interface ImgAttributes extends HtmlAttributes {
      src?: string;
      alt?: string;
      width?: string | number;
      height?: string | number;
      loading?: 'lazy' | 'eager';
    }
    
    interface TableAttributes extends HtmlAttributes {
      border?: string | number;
      cellPadding?: string | number;
      cellSpacing?: string | number;
      width?: string | number;
      align?: 'left' | 'center' | 'right';
      bgcolor?: string;
    }
    
    interface ThAttributes extends HtmlAttributes {
      colSpan?: number;
      rowSpan?: number;
      scope?: 'col' | 'row' | 'colgroup' | 'rowgroup';
      align?: 'left' | 'center' | 'right';
      valign?: 'top' | 'middle' | 'bottom';
      width?: string | number;
      height?: string | number;
      bgcolor?: string;
    }
    
    interface TdAttributes extends HtmlAttributes {
      colSpan?: number;
      rowSpan?: number;
      align?: 'left' | 'center' | 'right';
      valign?: 'top' | 'middle' | 'bottom';
      width?: string | number;
      height?: string | number;
      bgcolor?: string;
    }
    
    interface ColAttributes extends HtmlAttributes {
      span?: number;
      width?: string | number;
    }
    
    interface FormAttributes extends HtmlAttributes {
      action?: string;
      method?: 'get' | 'post';
      encType?: string;
      target?: string;
    }
    
    interface InputAttributes extends HtmlAttributes {
      type?: string;
      name?: string;
      value?: string | number;
      placeholder?: string;
      disabled?: boolean;
      readonly?: boolean;
      required?: boolean;
      checked?: boolean;
      maxLength?: number;
      minLength?: number;
      max?: string | number;
      min?: string | number;
      step?: string | number;
      pattern?: string;
      size?: number;
      width?: string | number;
      height?: string | number;
    }
    
    interface ButtonAttributes extends HtmlAttributes {
      type?: 'button' | 'submit' | 'reset';
      name?: string;
      value?: string;
      disabled?: boolean;
    }
    
    interface TextareaAttributes extends HtmlAttributes {
      name?: string;
      placeholder?: string;
      rows?: number;
      cols?: number;
      disabled?: boolean;
      readonly?: boolean;
      required?: boolean;
      maxLength?: number;
      minLength?: number;
    }
    
    interface SelectAttributes extends HtmlAttributes {
      name?: string;
      disabled?: boolean;
      required?: boolean;
      multiple?: boolean;
      size?: number;
    }
    
    interface OptionAttributes extends HtmlAttributes {
      value?: string;
      selected?: boolean;
      disabled?: boolean;
    }
    
    interface LabelAttributes extends HtmlAttributes {
      htmlFor?: string;
    }
    
    interface FontAttributes extends HtmlAttributes {
      color?: string;
      face?: string;
      size?: string | number;
    }
  }
}

export {};
