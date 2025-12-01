# tsx-mailer

Type-safe email templating with TSX and SMTP support. No React required.


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
  - [1. Enable JSX in your tsconfig.json](#1-enable-jsx-in-your-tsconfigjson)
  - [2. Create an email template](#2-create-an-email-template)
  - [3. Send the email](#3-send-the-email)
- [Email Addresses](#email-addresses)
- [API Reference](#api-reference)
  - [`createMailer(config)`](#createmailerconfig)
  - [`mailer.send(template, options)`](#mailersendtemplate-options)
  - [`email(options)` helper](#emailoptions-helper)
  - [`mailer.compile(template, props)`](#mailercompiletemplate-props)
  - [`mailer.sendRaw(options)`](#mailersendrawoptions)
  - [`mailer.verify()`](#mailerverify)
  - [`mailer.close()`](#mailerclose)
- [Template Best Practices](#template-best-practices)
  - [Use tables for layout](#use-tables-for-layout)
  - [Inline styles](#inline-styles)
  - [Supported HTML elements](#supported-html-elements)
- [TypeScript Support](#typescript-support)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Features

- **Type-safe templates**: Write email templates in TSX with full TypeScript support
- **No React dependency**: Uses a lightweight custom JSX runtime
- **HTML + Plain text**: Automatically generates both HTML and plain text versions
- **SMTP support**: Built on nodemailer for reliable email delivery
- **Named addresses**: Support for `"John Doe" <john@example.com>` format
- **Template metadata**: Define subject, from, replyTo inside templates
- **Subject prefix/suffix**: Automatically add app name to all subjects

## Installation

```bash
npm install tsx-mailer
```

## Quick Start

### 1. Enable JSX in your tsconfig.json

Add these two lines to your `compilerOptions` (if not already present):

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "tsx-mailer"
  }
}
```

If your project also uses React, set `jsxImportSource` to `"react"` instead, and use the per-file pragma in your email templates (see below).

### 2. Create an email template

Add the pragma comment at the top of each template file. This tells TypeScript to use tsx-mailer's JSX runtime for that file.

You have two options for what your template returns:

**Option A: Return just the JSX body**

```tsx
// templates/simple.tsx
/** @jsxImportSource tsx-mailer */

export function SimpleEmail({ message }: { message: string }) {
  return (
    <html>
      <body>
        <p>{message}</p>
      </body>
    </html>
  );
}
```

**Option B: Use the `email()` helper to include metadata**

The `email()` helper lets you define subject, from, and replyTo inside the template. All fields are optional except `body` - anything not set here can be provided (or overridden) when sending.

```tsx
// templates/welcome.tsx
/** @jsxImportSource tsx-mailer */
import { email } from 'tsx-mailer';

export interface WelcomeEmailProps {
  name: string;
  activationLink: string;
}

// Set subject in template, use default "from" from mailer config
export function WelcomeEmail({ name, activationLink }: WelcomeEmailProps) {
  return email({
    subject: `Welcome, ${name}!`,
    body: (
      <html>
        <body style={{ fontFamily: 'Arial, sans-serif' }}>
          <h1>Welcome, {name}!</h1>
          <p>Click below to activate your account:</p>
          <a href={activationLink}>Activate Account</a>
        </body>
      </html>
    ),
  });
}

// Set everything in the template
export function SupportEmail({ ticket }: { ticket: string }) {
  return email({
    subject: `Re: Ticket #${ticket}`,
    from: { name: 'Support Team', email: 'support@example.com' },
    replyTo: 'support@example.com',
    body: <html><body>...</body></html>,
  });
}
```

### 3. Send the email

```typescript
import { createMailer } from 'tsx-mailer';
import { WelcomeEmail } from './templates/welcome';

const mailer = createMailer({
  smtp: {
    host: 'smtp.example.com',
    port: 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  // Named sender address
  defaultFrom: { name: 'My App', email: 'noreply@example.com' },
  // Optional: add prefix/suffix to all subjects
  subjectPrefix: '[MyApp] ',
});

await mailer.send(WelcomeEmail, {
  // Named recipient
  to: { name: 'John Carmichael', email: 'john@gmail.com' },
  // Subject is optional if template provides it
  props: {
    name: 'John',
    activationLink: 'https://example.com/activate?token=abc',
  },
});
```

## Email Addresses

All address fields (`to`, `from`, `cc`, `bcc`, `replyTo`) support both formats:

```typescript
// Simple string
to: 'john@example.com'

// Named address
to: { name: 'John Carmichael', email: 'john@example.com' }

// Multiple recipients
to: [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' },
]
```

Named addresses are formatted as RFC 5322: `John Carmichael <john@example.com>`

## API Reference

### `createMailer(config)`

Creates a new mailer instance.

```typescript
interface MailerConfig {
  smtp: {
    host: string;
    port: number;
    secure?: boolean;  // true for 465, false for other ports
    auth?: {
      user: string;
      pass: string;
    };
  };
  defaultFrom?: EmailAddress;     // Default sender
  subjectPrefix?: string;         // e.g., "[MyApp] "
  subjectSuffix?: string;         // e.g., " - MyApp"
}

type EmailAddress = string | { name: string; email: string };
```

### `mailer.send(template, options)`

Send an email using a TSX template.

```typescript
interface EmailOptions<TProps> {
  to: EmailAddress | EmailAddress[];
  subject?: string;               // Optional if template provides it
  from?: EmailAddress;            // Overrides template/default
  cc?: EmailAddress | EmailAddress[];
  bcc?: EmailAddress | EmailAddress[];
  replyTo?: EmailAddress;
  props?: TProps;
}
```

**Priority for metadata** (subject, from, replyTo):
1. Options passed to `send()` (highest)
2. Template metadata (from `email()` helper)
3. Mailer config defaults (lowest)

### `email(options)` helper

Use inside templates to define metadata:

```tsx
import { email } from 'tsx-mailer';

export function MyTemplate(props: Props) {
  return email({
    subject: 'My Subject',
    from: { name: 'Sender', email: 'sender@example.com' },
    replyTo: 'reply@example.com',
    body: <html>...</html>,
  });
}
```

### `mailer.compile(template, props)`

Compile a template to HTML and plain text without sending.

```typescript
const { html, text } = mailer.compile(WelcomeEmail, { name: 'John', ... });
```

### `mailer.sendRaw(options)`

Send an email with pre-compiled HTML.

```typescript
await mailer.sendRaw({
  to: 'user@example.com',
  subject: 'Hello',
  html: '<h1>Hello World</h1>',
  text: 'Hello World',  // Optional, auto-generated if omitted
});
```

### `mailer.verify()`

Verify SMTP connection.

```typescript
const isConnected = await mailer.verify();
```

### `mailer.close()`

Close the SMTP connection.

## Template Best Practices

### Use tables for layout

Email clients have limited CSS support. Use tables for reliable layouts:

```tsx
<table width="100%" cellPadding="0" cellSpacing="0">
  <tr>
    <td style={{ padding: '20px' }}>
      Content here
    </td>
  </tr>
</table>
```

### Inline styles

Most email clients strip `<style>` tags. Use inline styles:

```tsx
<p style={{ color: '#333', fontSize: '16px' }}>
  Styled text
</p>
```

### Supported HTML elements

The JSX runtime supports all common HTML elements including:
- Document: `html`, `head`, `body`, `title`, `meta`, `style`
- Layout: `div`, `table`, `tr`, `td`, `th`
- Text: `p`, `h1`-`h6`, `span`, `a`, `strong`, `em`
- Lists: `ul`, `ol`, `li`
- Media: `img`
- Legacy: `center`, `font` (for older email clients)

## TypeScript Support

Templates are fully typed. Define your props interface:

```tsx
interface OrderConfirmationProps {
  orderNumber: string;
  items: Array<{ name: string; price: number }>;
  total: number;
}

function OrderConfirmation({ orderNumber, items, total }: OrderConfirmationProps) {
  return (
    <html>
      <body>
        <h1>Order #{orderNumber}</h1>
        <ul>
          {items.map(item => (
            <li>{item.name}: ${item.price}</li>
          ))}
        </ul>
        <p><strong>Total: ${total}</strong></p>
      </body>
    </html>
  );
}
```

## License

MIT
