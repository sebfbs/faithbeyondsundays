/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

const LOGO_URL = 'https://imkpdqtjfgxblvzdlvjc.supabase.co/storage/v1/object/public/email-assets/FBS_Logo_white.png'

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code for Faith Beyond Sundays</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} alt="Faith Beyond Sundays" width="56" height="56" style={logo} />
        </Section>
        <Heading style={h1}>Your verification code</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code will expire shortly. If you didn't request it, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', 'Open Sans', Arial, sans-serif" }
const container = { padding: '40px 32px' }
const logoSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { borderRadius: '14px', margin: '0 auto', backgroundColor: '#4A8AB5' }
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
const codeStyle = {
  fontFamily: "'DM Sans', Courier, monospace",
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#E09A00',
  margin: '0 0 32px',
  letterSpacing: '4px',
}
const footer = { fontSize: '12px', color: '#9ca3af', margin: '24px 0 0' }
