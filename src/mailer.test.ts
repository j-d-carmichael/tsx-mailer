import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import nodemailer from 'nodemailer';
import { TsxMailer, createMailer } from './mailer';
import { jsx } from './jsx-runtime';
import type { MailerConfig, EmailTemplate } from './types';

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

describe('TsxMailer', () => {
  const mockConfig: MailerConfig = {
    smtp: {
      host: 'smtp.example.com',
      port: 587,
      auth: {
        user: 'testuser',
        pass: 'testpass',
      },
    },
    defaultFrom: 'noreply@example.com',
  };

  let mockTransporter: {
    sendMail: ReturnType<typeof vi.fn>;
    verify: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockTransporter = {
      sendMail: vi.fn().mockResolvedValue({
        messageId: '<test-message-id@example.com>',
        accepted: ['recipient@example.com'],
        rejected: [],
      }),
      verify: vi.fn().mockResolvedValue(true),
      close: vi.fn(),
    };

    vi.mocked(nodemailer.createTransport).mockReturnValue(mockTransporter as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('creates a nodemailer transport with correct config', () => {
      new TsxMailer(mockConfig);

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'testuser',
          pass: 'testpass',
        },
      });
    });

    it('defaults secure to true for port 465', () => {
      new TsxMailer({
        smtp: {
          host: 'smtp.example.com',
          port: 465,
        },
      });

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ secure: true })
      );
    });

    it('respects explicit secure setting', () => {
      new TsxMailer({
        smtp: {
          host: 'smtp.example.com',
          port: 587,
          secure: true,
        },
      });

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ secure: true })
      );
    });
  });

  describe('createMailer', () => {
    it('returns a TsxMailer instance', () => {
      const mailer = createMailer(mockConfig);
      expect(mailer).toBeInstanceOf(TsxMailer);
    });
  });

  describe('compile', () => {
    it('compiles a template to HTML and text', () => {
      const mailer = new TsxMailer(mockConfig);
      const template: EmailTemplate<{ name: string }> = ({ name }) =>
        jsx('div', { children: `Hello, ${name}!` });

      const result = mailer.compile(template, { name: 'World' });

      expect(result.html).toContain('Hello, World!');
      expect(result.text).toContain('Hello, World!');
    });

    it('wraps content in HTML structure if not present', () => {
      const mailer = new TsxMailer(mockConfig);
      const template: EmailTemplate = () => jsx('p', { children: 'Test' });

      const result = mailer.compile(template, {});

      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('<html>');
      expect(result.html).toContain('<body>');
    });

    it('preserves existing HTML structure', () => {
      const mailer = new TsxMailer(mockConfig);
      const template: EmailTemplate = () =>
        jsx('html', {
          children: jsx('body', { children: 'Content' }),
        });

      const result = mailer.compile(template, {});

      expect(result.html).toContain('<!DOCTYPE html>');
      // Should not double-wrap
      expect(result.html.match(/<html/g)?.length).toBe(1);
    });

    it('converts HTML to plain text', () => {
      const mailer = new TsxMailer(mockConfig);
      const template: EmailTemplate = () =>
        jsx('div', {
          children: [
            jsx('h1', { children: 'Title' }),
            jsx('p', { children: 'Paragraph text' }),
          ],
        });

      const result = mailer.compile(template, {});

      // html-to-text uppercases headings
      expect(result.text.toUpperCase()).toContain('TITLE');
      expect(result.text).toContain('Paragraph text');
    });
  });

  describe('send', () => {
    it('sends an email with compiled template', async () => {
      const mailer = new TsxMailer(mockConfig);
      const template: EmailTemplate<{ name: string }> = ({ name }) =>
        jsx('p', { children: `Hello, ${name}!` });

      const result = await mailer.send(template, {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        props: { name: 'World' },
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@example.com',
          to: 'recipient@example.com',
          subject: 'Test Subject',
          html: expect.stringContaining('Hello, World!'),
          text: expect.stringContaining('Hello, World!'),
        })
      );
      expect(result.messageId).toBe('<test-message-id@example.com>');
    });

    it('uses custom from address when provided', async () => {
      const mailer = new TsxMailer(mockConfig);
      const template: EmailTemplate = () => jsx('p', { children: 'Test' });

      await mailer.send(template, {
        to: 'recipient@example.com',
        subject: 'Test',
        from: 'custom@example.com',
        props: {},
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'custom@example.com',
        })
      );
    });

    it('handles multiple recipients', async () => {
      const mailer = new TsxMailer(mockConfig);
      const template: EmailTemplate = () => jsx('p', { children: 'Test' });

      await mailer.send(template, {
        to: ['a@example.com', 'b@example.com'],
        subject: 'Test',
        props: {},
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'a@example.com, b@example.com',
        })
      );
    });

    it('handles cc and bcc', async () => {
      const mailer = new TsxMailer(mockConfig);
      const template: EmailTemplate = () => jsx('p', { children: 'Test' });

      await mailer.send(template, {
        to: 'recipient@example.com',
        subject: 'Test',
        cc: 'cc@example.com',
        bcc: ['bcc1@example.com', 'bcc2@example.com'],
        props: {},
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          cc: 'cc@example.com',
          bcc: 'bcc1@example.com, bcc2@example.com',
        })
      );
    });

    it('handles replyTo', async () => {
      const mailer = new TsxMailer(mockConfig);
      const template: EmailTemplate = () => jsx('p', { children: 'Test' });

      await mailer.send(template, {
        to: 'recipient@example.com',
        subject: 'Test',
        replyTo: 'reply@example.com',
        props: {},
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          replyTo: 'reply@example.com',
        })
      );
    });

    it('returns send result with accepted/rejected', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: '<id>',
        accepted: ['a@example.com'],
        rejected: ['b@example.com'],
      });

      const mailer = new TsxMailer(mockConfig);
      const template: EmailTemplate = () => jsx('p', { children: 'Test' });

      const result = await mailer.send(template, {
        to: ['a@example.com', 'b@example.com'],
        subject: 'Test',
        props: {},
      });

      expect(result.accepted).toEqual(['a@example.com']);
      expect(result.rejected).toEqual(['b@example.com']);
    });
  });

  describe('sendRaw', () => {
    it('sends raw HTML email', async () => {
      const mailer = new TsxMailer(mockConfig);

      await mailer.sendRaw({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<h1>Hello</h1>',
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: '<h1>Hello</h1>',
          text: expect.any(String),
        })
      );
    });

    it('uses provided text when given', async () => {
      const mailer = new TsxMailer(mockConfig);

      await mailer.sendRaw({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<h1>Hello</h1>',
        text: 'Custom plain text',
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Custom plain text',
        })
      );
    });
  });

  describe('verify', () => {
    it('returns true when connection succeeds', async () => {
      const mailer = new TsxMailer(mockConfig);
      mockTransporter.verify.mockResolvedValue(true);

      const result = await mailer.verify();

      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('returns false when connection fails', async () => {
      const mailer = new TsxMailer(mockConfig);
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      const result = await mailer.verify();

      expect(result).toBe(false);
    });
  });

  describe('close', () => {
    it('closes the transporter', () => {
      const mailer = new TsxMailer(mockConfig);
      mailer.close();

      expect(mockTransporter.close).toHaveBeenCalled();
    });
  });

  describe('named email addresses', () => {
    it('formats named from address', async () => {
      const mailer = new TsxMailer({
        smtp: { host: 'smtp.test.com', port: 587 },
        defaultFrom: { name: 'Support Team', email: 'support@example.com' },
      });
      const template: EmailTemplate = () => jsx('p', { children: 'Test' });

      await mailer.send(template, {
        to: 'recipient@example.com',
        subject: 'Test',
        props: {},
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Support Team <support@example.com>',
        })
      );
    });

    it('formats named to address', async () => {
      const mailer = new TsxMailer(mockConfig);
      const template: EmailTemplate = () => jsx('p', { children: 'Test' });

      await mailer.send(template, {
        to: { name: 'John Doe', email: 'john@example.com' },
        subject: 'Test',
        props: {},
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'John Doe <john@example.com>',
        })
      );
    });

    it('formats multiple named recipients', async () => {
      const mailer = new TsxMailer(mockConfig);
      const template: EmailTemplate = () => jsx('p', { children: 'Test' });

      await mailer.send(template, {
        to: [
          { name: 'Alice', email: 'alice@example.com' },
          { name: 'Bob', email: 'bob@example.com' },
        ],
        subject: 'Test',
        props: {},
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'Alice <alice@example.com>, Bob <bob@example.com>',
        })
      );
    });

    it('formats named replyTo address', async () => {
      const mailer = new TsxMailer(mockConfig);
      const template: EmailTemplate = () => jsx('p', { children: 'Test' });

      await mailer.send(template, {
        to: 'recipient@example.com',
        subject: 'Test',
        replyTo: { name: 'Help Desk', email: 'help@example.com' },
        props: {},
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          replyTo: 'Help Desk <help@example.com>',
        })
      );
    });
  });

  describe('subject prefix/suffix', () => {
    it('applies subject prefix', async () => {
      const mailer = new TsxMailer({
        ...mockConfig,
        subjectPrefix: '[MyApp] ',
      });
      const template: EmailTemplate = () => jsx('p', { children: 'Test' });

      await mailer.send(template, {
        to: 'recipient@example.com',
        subject: 'Welcome',
        props: {},
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: '[MyApp] Welcome',
        })
      );
    });

    it('applies subject suffix', async () => {
      const mailer = new TsxMailer({
        ...mockConfig,
        subjectSuffix: ' - MyApp',
      });
      const template: EmailTemplate = () => jsx('p', { children: 'Test' });

      await mailer.send(template, {
        to: 'recipient@example.com',
        subject: 'Welcome',
        props: {},
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Welcome - MyApp',
        })
      );
    });

    it('applies both prefix and suffix', async () => {
      const mailer = new TsxMailer({
        ...mockConfig,
        subjectPrefix: '[MyApp] ',
        subjectSuffix: ' (automated)',
      });
      const template: EmailTemplate = () => jsx('p', { children: 'Test' });

      await mailer.send(template, {
        to: 'recipient@example.com',
        subject: 'Welcome',
        props: {},
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: '[MyApp] Welcome (automated)',
        })
      );
    });
  });

  describe('template metadata', () => {
    it('uses subject from template metadata', async () => {
      const mailer = new TsxMailer(mockConfig);
      const template: EmailTemplate = () => ({
        body: jsx('p', { children: 'Test' }),
        meta: { subject: 'Template Subject' },
      });

      await mailer.send(template, {
        to: 'recipient@example.com',
        props: {},
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Template Subject',
        })
      );
    });

    it('uses from address from template metadata', async () => {
      const mailer = new TsxMailer(mockConfig);
      const template: EmailTemplate = () => ({
        body: jsx('p', { children: 'Test' }),
        meta: {
          subject: 'Test',
          from: { name: 'Template Sender', email: 'template@example.com' },
        },
      });

      await mailer.send(template, {
        to: 'recipient@example.com',
        props: {},
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Template Sender <template@example.com>',
        })
      );
    });

    it('uses replyTo from template metadata', async () => {
      const mailer = new TsxMailer(mockConfig);
      const template: EmailTemplate = () => ({
        body: jsx('p', { children: 'Test' }),
        meta: {
          subject: 'Test',
          replyTo: 'template-reply@example.com',
        },
      });

      await mailer.send(template, {
        to: 'recipient@example.com',
        props: {},
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          replyTo: 'template-reply@example.com',
        })
      );
    });

    it('options override template metadata', async () => {
      const mailer = new TsxMailer(mockConfig);
      const template: EmailTemplate = () => ({
        body: jsx('p', { children: 'Test' }),
        meta: {
          subject: 'Template Subject',
          from: 'template@example.com',
        },
      });

      await mailer.send(template, {
        to: 'recipient@example.com',
        subject: 'Override Subject',
        from: 'override@example.com',
        props: {},
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Override Subject',
          from: 'override@example.com',
        })
      );
    });

    it('throws error when no subject provided', async () => {
      const mailer = new TsxMailer(mockConfig);
      const template: EmailTemplate = () => jsx('p', { children: 'Test' });

      await expect(
        mailer.send(template, {
          to: 'recipient@example.com',
          props: {},
        })
      ).rejects.toThrow('Email subject is required');
    });

    it('applies prefix/suffix to template subject', async () => {
      const mailer = new TsxMailer({
        ...mockConfig,
        subjectPrefix: '[App] ',
      });
      const template: EmailTemplate = () => ({
        body: jsx('p', { children: 'Test' }),
        meta: { subject: 'From Template' },
      });

      await mailer.send(template, {
        to: 'recipient@example.com',
        props: {},
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: '[App] From Template',
        })
      );
    });
  });
});
