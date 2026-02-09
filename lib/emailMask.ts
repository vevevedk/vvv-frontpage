export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  const masked = local.charAt(0) + '****';
  return `${masked}@${domain}`;
}
