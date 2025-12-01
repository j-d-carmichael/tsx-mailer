// Core exports
export { TsxMailer, createMailer } from './mailer';

// Template helper
export { email } from './template';

// JSX runtime exports for template authors
export { render, Fragment, type VNode, type Child } from './jsx-runtime';

// Type exports
export type {
  EmailAddress,
  SmtpConfig,
  MailerConfig,
  EmailOptions,
  SendResult,
  CompiledEmail,
  EmailTemplate,
  EmailMeta,
  TemplateResult,
} from './types';

// Utility exports
export { formatEmailAddress, formatEmailAddresses } from './types';
