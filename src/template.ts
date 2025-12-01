import type { VNode } from './jsx-runtime';
import type { EmailMeta, TemplateResult } from './types';

/**
 * Helper to create a template result with metadata
 * Use this to define subject, from, replyTo within your template
 * 
 * @example
 * ```tsx
 * export function WelcomeEmail({ name }: Props) {
 *   return email({
 *     subject: `Welcome, ${name}!`,
 *     from: { name: 'Support Team', email: 'support@example.com' },
 *     body: (
 *       <html>
 *         <body>
 *           <h1>Welcome, {name}!</h1>
 *         </body>
 *       </html>
 *     ),
 *   });
 * }
 * ```
 */
export function email(options: {
  body: VNode;
  subject?: string;
  from?: EmailMeta['from'];
  replyTo?: EmailMeta['replyTo'];
}): TemplateResult {
  const { body, ...meta } = options;
  return {
    body,
    meta: Object.keys(meta).length > 0 ? meta : undefined,
  };
}
