import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { convert } from 'html-to-text';
import { render, type VNode } from './jsx-runtime';
import {
  formatEmailAddress,
  formatEmailAddresses,
  isTemplateResult,
  type MailerConfig,
  type EmailOptions,
  type SendResult,
  type CompiledEmail,
  type EmailTemplate,
  type EmailAddress,
} from './types';

export class TsxMailer {
  private transporter: Transporter<SMTPTransport.SentMessageInfo>;
  private config: MailerConfig;

  constructor(config: MailerConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure ?? config.smtp.port === 465,
      auth: config.smtp.auth,
      ...config.smtp.transportOptions,
    });
  }

  /**
   * Apply subject prefix/suffix from config
   */
  private formatSubject(subject: string): string {
    const prefix = this.config.subjectPrefix ?? '';
    const suffix = this.config.subjectSuffix ?? '';
    return `${prefix}${subject}${suffix}`;
  }

  /**
   * Compile a TSX template to HTML and plain text
   */
  compile<TProps>(
    template: EmailTemplate<TProps>,
    props: TProps
  ): CompiledEmail {
    const result = template(props);
    
    // Check if template returned metadata
    if (isTemplateResult(result)) {
      const html = this.renderHtml(result.body);
      const text = this.renderText(html);
      return { html, text, meta: result.meta };
    }
    
    // Template returned just a VNode
    const html = this.renderHtml(result);
    const text = this.renderText(html);
    return { html, text };
  }

  /**
   * Render a VNode to an HTML string with doctype
   */
  private renderHtml(vnode: VNode): string {
    const body = render(vnode);
    
    // If the template already includes html/body tags, return as-is
    if (body.toLowerCase().includes('<html')) {
      return `<!DOCTYPE html>\n${body}`;
    }
    
    // Wrap in basic HTML structure
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
${body}
</body>
</html>`;
  }

  /**
   * Convert HTML to plain text
   */
  private renderText(html: string): string {
    return convert(html, {
      wordwrap: 80,
      selectors: [
        { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
        { selector: 'img', format: 'skip' },
      ],
    });
  }

  /**
   * Send an email using a TSX template
   * 
   * Priority for metadata (subject, from, replyTo):
   * 1. Options passed to send() (highest priority)
   * 2. Template metadata (from TemplateResult)
   * 3. Mailer config defaults (lowest priority)
   */
  async send<TProps>(
    template: EmailTemplate<TProps>,
    options: EmailOptions<TProps>
  ): Promise<SendResult> {
    const { html, text, meta } = this.compile(template, options.props as TProps);

    // Resolve from address: options > template meta > config default
    const from = options.from ?? meta?.from ?? this.config.defaultFrom;
    
    // Resolve subject: options > template meta (required from one of them)
    const rawSubject = options.subject ?? meta?.subject;
    if (!rawSubject) {
      throw new Error('Email subject is required. Provide it in options or template metadata.');
    }
    const subject = this.formatSubject(rawSubject);

    // Resolve replyTo: options > template meta
    const replyTo = options.replyTo ?? meta?.replyTo;

    const result = await this.transporter.sendMail({
      from: from ? formatEmailAddress(from) : undefined,
      to: formatEmailAddresses(options.to),
      cc: options.cc ? formatEmailAddresses(options.cc) : undefined,
      bcc: options.bcc ? formatEmailAddresses(options.bcc) : undefined,
      replyTo: replyTo ? formatEmailAddress(replyTo) : undefined,
      subject,
      html,
      text,
    });

    return {
      messageId: result.messageId,
      accepted: result.accepted as string[],
      rejected: result.rejected as string[],
    };
  }

  /**
   * Send a raw email with pre-compiled HTML/text
   */
  async sendRaw(options: {
    to: EmailAddress | EmailAddress[];
    subject: string;
    html: string;
    text?: string;
    from?: EmailAddress;
    cc?: EmailAddress | EmailAddress[];
    bcc?: EmailAddress | EmailAddress[];
    replyTo?: EmailAddress;
  }): Promise<SendResult> {
    const from = options.from ?? this.config.defaultFrom;
    const subject = this.formatSubject(options.subject);

    const result = await this.transporter.sendMail({
      from: from ? formatEmailAddress(from) : undefined,
      to: formatEmailAddresses(options.to),
      cc: options.cc ? formatEmailAddresses(options.cc) : undefined,
      bcc: options.bcc ? formatEmailAddresses(options.bcc) : undefined,
      replyTo: options.replyTo ? formatEmailAddress(options.replyTo) : undefined,
      subject,
      html: options.html,
      text: options.text ?? this.renderText(options.html),
    });

    return {
      messageId: result.messageId,
      accepted: result.accepted as string[],
      rejected: result.rejected as string[],
    };
  }

  /**
   * Verify SMTP connection
   */
  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Close the transporter connection
   */
  close(): void {
    this.transporter.close();
  }
}

/**
 * Create a new TsxMailer instance
 */
export function createMailer(config: MailerConfig): TsxMailer {
  return new TsxMailer(config);
}
