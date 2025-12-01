/** @jsxImportSource tsx-mailer */

export interface WelcomeEmailProps {
  name: string;
  activationLink: string;
  companyName?: string;
}

export function WelcomeEmail({ name, activationLink, companyName = 'Our Company' }: WelcomeEmailProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Welcome to {companyName}</title>
      </head>
      <body style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <tr>
            <td style={{ padding: '40px' }}>
              <h1 style={{ color: '#2563eb', marginBottom: '24px' }}>
                Welcome to {companyName}!
              </h1>
              
              <p>Hi {name},</p>
              
              <p>
                Thank you for signing up! We're excited to have you on board.
              </p>
              
              <p>
                To get started, please activate your account by clicking the button below:
              </p>
              
              <table cellPadding="0" cellSpacing="0" style={{ margin: '32px 0' }}>
                <tr>
                  <td style={{ backgroundColor: '#2563eb', borderRadius: '6px' }}>
                    <a
                      href={activationLink}
                      style={{
                        display: 'inline-block',
                        padding: '14px 28px',
                        color: '#ffffff',
                        textDecoration: 'none',
                        fontWeight: 'bold',
                      }}
                    >
                      Activate Your Account
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style={{ color: '#666', fontSize: '14px' }}>
                If the button doesn't work, copy and paste this link into your browser:
                <br />
                <a href={activationLink} style={{ color: '#2563eb' }}>{activationLink}</a>
              </p>
              
              <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '32px 0' }} />
              
              <p style={{ color: '#666', fontSize: '12px' }}>
                This email was sent by {companyName}. If you didn't create an account, 
                you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}
