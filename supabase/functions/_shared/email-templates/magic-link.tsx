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
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

const LOGO_URL = 'https://imkpdqtjfgxblvzdlvjc.supabase.co/storage/v1/object/public/email-assets/FBS_Logo_white.png'

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login link for Faith Beyond Sundays</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} alt="Faith Beyond Sundays" width="56" height="56" style={logo} />
        </Section>
        <Heading style={h1}>Your login link</Heading>
        <Text style={text}>
          Click below to sign in to Faith Beyond Sundays. This link will expire shortly.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Sign In
          </Button>
        </Section>
        <Text style={footer}>
          If you didn't request this, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

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
