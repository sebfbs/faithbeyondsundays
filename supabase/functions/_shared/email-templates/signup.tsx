/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  churchName: string
  churchLogoUrl: string | null
}

export const SignupEmail = ({
  siteUrl,
  recipient,
  confirmationUrl,
  churchName,
  churchLogoUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {churchName} — confirm your email</Preview>
    <Body style={main}>
      <Container style={container}>
        {churchLogoUrl && (
          <Section style={logoSection}>
            <Img src={churchLogoUrl} alt={churchName} height="80" style={logo} />
          </Section>
        )}
        <Heading style={h1}>Welcome to {churchName}!</Heading>
        <Text style={text}>
          Thanks for joining{' '}
          <Link href={siteUrl} style={link}>
            <strong>{churchName}</strong>
          </Link>
          . Stay connected to Sunday's message all week long.
        </Text>
        <Text style={text}>
          Confirm your email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) to get started:
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Get Started
          </Button>
        </Section>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', 'Open Sans', Arial, sans-serif" }
const container = { padding: '40px 32px' }
const logoSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { margin: '0 auto', maxWidth: '200px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#1D2333',
  margin: '0 0 16px',
}
const text = {
  fontSize: '15px',
  color: '#7A8299',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const link = { color: '#E09A00', textDecoration: 'underline' }
const buttonSection = { textAlign: 'center' as const, margin: '8px 0 32px' }
const button = {
  backgroundColor: '#E09A00',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '16px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#9ca3af', margin: '24px 0 0' }
