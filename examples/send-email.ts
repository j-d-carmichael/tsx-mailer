import { createMailer } from 'tsx-mailer';
import { WelcomeEmail } from './templates/welcome';

// Create mailer instance with SMTP configuration
const mailer = createMailer({
  smtp: {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  },
  defaultFrom: 'noreply@example.com',
});

async function main() {
  // Verify SMTP connection
  const isConnected = await mailer.verify();
  if (!isConnected) {
    console.error('Failed to connect to SMTP server');
    process.exit(1);
  }

  // Send email using TSX template
  const result = await mailer.send(WelcomeEmail, {
    to: 'user@example.com',
    subject: 'Welcome to Our Service!',
    props: {
      name: 'John Doe',
      activationLink: 'https://example.com/activate?token=abc123',
      companyName: 'Acme Inc',
    },
  });

  console.log('Email sent!', result.messageId);

  // Close connection when done
  mailer.close();
}

main().catch(console.error);
