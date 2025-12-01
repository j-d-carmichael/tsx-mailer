/** @jsxImportSource tsx-mailer */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import nodemailer from 'nodemailer';
import { createMailer } from './mailer';
import type { EmailTemplate } from './types';

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

// Define a realistic email template
interface WelcomeEmailProps {
  userName: string;
  activationUrl: string;
  companyName: string;
}

const WelcomeEmail: EmailTemplate<WelcomeEmailProps> = ({
  userName,
  activationUrl,
  companyName,
}) => (
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Welcome to {companyName}</title>
    </head>
    <body style={{ fontFamily: 'Arial, sans-serif', margin: '0', padding: '20px' }}>
      <table width="100%" cellPadding="0" cellSpacing="0">
        <tr>
          <td>
            <h1 style={{ color: '#2563eb' }}>Welcome, {userName}!</h1>
            <p>Thank you for joining {companyName}.</p>
            <p>Please click the button below to activate your account:</p>
            <table cellPadding="0" cellSpacing="0">
              <tr>
                <td style={{ backgroundColor: '#2563eb', borderRadius: '4px', padding: '12px 24px' }}>
                  <a href={activationUrl} style={{ color: '#ffffff', textDecoration: 'none' }}>
                    Activate Account
                  </a>
                </td>
              </tr>
            </table>
            <p style={{ marginTop: '20px', color: '#666', fontSize: '12px' }}>
              If you didn't create this account, please ignore this email.
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>
);

// Order confirmation template with dynamic data
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationProps {
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  total: number;
}

const OrderConfirmation: EmailTemplate<OrderConfirmationProps> = ({
  orderNumber,
  customerName,
  items,
  total,
}) => (
  <html>
    <body style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h1>Order Confirmation</h1>
      <p>Hi {customerName},</p>
      <p>Thank you for your order #{orderNumber}!</p>
      
      <table width="100%" style={{ borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>Item</th>
            <th style={{ padding: '10px', textAlign: 'center' }}>Qty</th>
            <th style={{ padding: '10px', textAlign: 'right' }}>Price</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '10px' }}>{item.name}</td>
              <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>${item.price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} style={{ padding: '10px', fontWeight: 'bold' }}>Total</td>
            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>${total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </body>
  </html>
);

describe('Integration Tests', () => {
  let mockTransporter: {
    sendMail: ReturnType<typeof vi.fn>;
    verify: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockTransporter = {
      sendMail: vi.fn().mockResolvedValue({
        messageId: '<test@example.com>',
        accepted: ['user@example.com'],
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

  describe('WelcomeEmail template', () => {
    it('renders a complete welcome email with all props', () => {
      const mailer = createMailer({
        smtp: { host: 'smtp.test.com', port: 587 },
      });

      const { html, text } = mailer.compile(WelcomeEmail, {
        userName: 'John Doe',
        activationUrl: 'https://example.com/activate?token=abc123',
        companyName: 'Acme Corp',
      });

      // Check HTML structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('Welcome, John Doe!');
      expect(html).toContain('Acme Corp');
      expect(html).toContain('href="https://example.com/activate?token=abc123"');
      expect(html).toContain('Activate Account');

      // Check plain text version (headings are uppercased by html-to-text)
      expect(text.toUpperCase()).toContain('JOHN DOE');
      expect(text).toContain('Acme Corp');
      expect(text).toContain('Activate Account');
    });

    it('sends welcome email via SMTP', async () => {
      const mailer = createMailer({
        smtp: { host: 'smtp.test.com', port: 587 },
        defaultFrom: 'noreply@acme.com',
      });

      const result = await mailer.send(WelcomeEmail, {
        to: 'john@example.com',
        subject: 'Welcome to Acme Corp!',
        props: {
          userName: 'John',
          activationUrl: 'https://acme.com/activate',
          companyName: 'Acme Corp',
        },
      });

      expect(result.messageId).toBe('<test@example.com>');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          subject: 'Welcome to Acme Corp!',
          from: 'noreply@acme.com',
        })
      );
    });
  });

  describe('OrderConfirmation template', () => {
    it('renders order with multiple items', () => {
      const mailer = createMailer({
        smtp: { host: 'smtp.test.com', port: 587 },
      });

      const { html, text } = mailer.compile(OrderConfirmation, {
        orderNumber: 'ORD-12345',
        customerName: 'Jane Smith',
        items: [
          { name: 'Widget A', quantity: 2, price: 19.99 },
          { name: 'Widget B', quantity: 1, price: 29.99 },
          { name: 'Widget C', quantity: 3, price: 9.99 },
        ],
        total: 99.94,
      });

      // Check order details
      expect(html).toContain('ORD-12345');
      expect(html).toContain('Jane Smith');
      
      // Check items
      expect(html).toContain('Widget A');
      expect(html).toContain('Widget B');
      expect(html).toContain('Widget C');
      
      // Check prices
      expect(html).toContain('$19.99');
      expect(html).toContain('$29.99');
      expect(html).toContain('$9.99');
      expect(html).toContain('$99.94');

      // Check plain text
      expect(text).toContain('ORD-12345');
      expect(text).toContain('Jane Smith');
    });

    it('handles empty order items', () => {
      const mailer = createMailer({
        smtp: { host: 'smtp.test.com', port: 587 },
      });

      const { html } = mailer.compile(OrderConfirmation, {
        orderNumber: 'ORD-00000',
        customerName: 'Test User',
        items: [],
        total: 0,
      });

      expect(html).toContain('ORD-00000');
      expect(html).toContain('$0.00');
    });
  });

  describe('SMTP connection', () => {
    it('verifies connection successfully', async () => {
      const mailer = createMailer({
        smtp: { host: 'smtp.test.com', port: 587 },
      });

      const isConnected = await mailer.verify();
      
      expect(isConnected).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('handles connection failure gracefully', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('ECONNREFUSED'));
      
      const mailer = createMailer({
        smtp: { host: 'invalid.host', port: 587 },
      });

      const isConnected = await mailer.verify();
      
      expect(isConnected).toBe(false);
    });

    it('closes connection properly', () => {
      const mailer = createMailer({
        smtp: { host: 'smtp.test.com', port: 587 },
      });

      mailer.close();
      
      expect(mockTransporter.close).toHaveBeenCalled();
    });
  });

  describe('Email options', () => {
    it('sends to multiple recipients with cc and bcc', async () => {
      const mailer = createMailer({
        smtp: { host: 'smtp.test.com', port: 587 },
        defaultFrom: 'sender@example.com',
      });

      const SimpleEmail: EmailTemplate = () => <p>Test email</p>;

      await mailer.send(SimpleEmail, {
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Group Email',
        cc: 'manager@example.com',
        bcc: ['admin@example.com', 'audit@example.com'],
        replyTo: 'support@example.com',
        props: {},
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user1@example.com, user2@example.com',
          cc: 'manager@example.com',
          bcc: 'admin@example.com, audit@example.com',
          replyTo: 'support@example.com',
        })
      );
    });
  });
});
