import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import type { VNode } from './jsx-runtime';

/**
 * Email address with optional display name
 * Can be a string like "john@example.com" or { name: "John Doe", email: "john@example.com" }
 */
export type EmailAddress = string | { name: string; email: string };

/**
 * Format an EmailAddress to RFC 5322 format
 * e.g., "John Doe" <john@example.com>
 */
export function formatEmailAddress(address: EmailAddress): string {
  if (typeof address === 'string') {
    return address;
  }
  // Escape quotes in name and wrap in quotes if contains special chars
  const name = address.name.includes(',') || address.name.includes('"')
    ? `"${address.name.replace(/"/g, '\\"')}"`
    : address.name;
  return `${name} <${address.email}>`;
}

/**
 * Format multiple email addresses
 */
export function formatEmailAddresses(addresses: EmailAddress | EmailAddress[]): string {
  const arr = Array.isArray(addresses) ? addresses : [addresses];
  return arr.map(formatEmailAddress).join(', ');
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  /** Additional nodemailer transport options */
  transportOptions?: SMTPTransport.Options;
}

export interface MailerConfig {
  smtp: SmtpConfig;
  /** Default "from" address - can include name */
  defaultFrom?: EmailAddress;
  /** Prefix to add to all subjects, e.g., "[MyApp] " */
  subjectPrefix?: string;
  /** Suffix to add to all subjects, e.g., " - MyApp" */
  subjectSuffix?: string;
}

export interface EmailOptions<TProps = Record<string, unknown>> {
  /** Recipient(s) - can include names */
  to: EmailAddress | EmailAddress[];
  /** Email subject (can be overridden by template) */
  subject?: string;
  /** Sender address - can include name */
  from?: EmailAddress;
  /** CC recipients - can include names */
  cc?: EmailAddress | EmailAddress[];
  /** BCC recipients - can include names */
  bcc?: EmailAddress | EmailAddress[];
  /** Reply-to address - can include name */
  replyTo?: EmailAddress;
  /** Template props to pass to the TSX template */
  props?: TProps;
}

export interface SendResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

/**
 * Metadata that can be set by a template
 */
export interface EmailMeta {
  subject?: string;
  from?: EmailAddress;
  replyTo?: EmailAddress;
}

/**
 * Result from rendering a template, includes body and optional metadata
 */
export interface TemplateResult {
  body: VNode;
  meta?: EmailMeta;
}

/**
 * Email template function - can return just a VNode or a TemplateResult with metadata
 */
export interface EmailTemplate<TProps = Record<string, unknown>> {
  (props: TProps): VNode | TemplateResult;
}

/**
 * Check if a template result includes metadata
 */
export function isTemplateResult(result: VNode | TemplateResult): result is TemplateResult {
  return result !== null && typeof result === 'object' && 'body' in result;
}

export interface CompiledEmail {
  html: string;
  text: string;
  meta?: EmailMeta;
}
