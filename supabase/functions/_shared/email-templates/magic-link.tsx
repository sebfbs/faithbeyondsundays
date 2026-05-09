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
  churchName: string
  churchLogoUrl: string | null
  isVerification?: boolean
}

export const MagicLinkEmail = ({
  confirmationUrl,
  churchName,
  churchLogoUrl,
  isVerification = false,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{isVerification ? `Verify your profile for ${churchName}` : `Your login link for ${churchName}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={accentBar} />
        {churchLogoUrl && (
          <Section style={logoSection}>
            <Img src={churchLogoUrl} alt={churchName} height="80" style={logo} />
          </Section>
        )}
        <Heading style={h1}>
          {isVerification ? 'Verify your profile' : `Sign in to ${churchName}`}
        </Heading>
        <Text style={text}>
          {isVerification
            ? 'Tap the button below to verify your profile. This link will expire shortly.'
            : 'Tap the button below to sign in. This link will expire shortly.'}
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            {isVerification ? 'Verify my profile' : 'Sign In'}
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

const main = { backgroundColor: '#FFFBF4', fontFamily: "'DM Sans', 'Open Sans', Arial, sans-serif" }
const container = { backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '0 0 40px', maxWidth: '520px', margin: '32px auto' }
const accentBar = { backgroundColor: '#1D2333', height: '6px', borderRadius: '16px 16px 0 0' }
const logoSection = { textAlign: 'center' as const, padding: '32px 0 16px' }
const logo = { margin: '0 auto', maxWidth: '200px' }
const h1 = {
  fontSize: '26px',
  fontWeight: 'bold' as const,
  color: '#1D2333',
  margin: '0 0 16px',
  padding: '0 32px',
  lineHeight: '1.3',
}
const text = {
  fontSize: '15px',
  color: '#4B5563',
  lineHeight: '1.7',
  margin: '0 0 16px',
  padding: '0 32px',
}
const buttonSection = { textAlign: 'center' as const, margin: '24px 0 32px' }
const button = {
  backgroundColor: '#ffffff',
  color: '#1D2333',
  fontSize: '16px',
  fontWeight: '700' as const,
  borderRadius: '50px',
  padding: '16px 36px',
  textDecoration: 'none',
  border: '2px solid #1D2333',
}
const footer = { fontSize: '12px', color: '#9ca3af', margin: '0', padding: '0 32px' }
