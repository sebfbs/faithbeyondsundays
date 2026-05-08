import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email',
  invite: "You've been invited",
  magiclink: 'Your login link',
  recovery: 'Reset your password',
  email_change: 'Confirm your new email',
  reauthentication: 'Your verification code',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

const SITE_NAME = "faithbeyondsundays"
const ROOT_DOMAIN = "faithbeyondsundays.app"
const FROM_DOMAIN = "mail.faithbeyondsundays.com"

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify hook secret — set HOOK_SECRET in Supabase Edge Function env vars
    // and configure the same value in Supabase Auth > Hooks > Send Email

    // Supabase Send Email hook payload format:
    // { user: { id, email, ... }, email_data: { token, token_hash, redirect_to, email_action_type, site_url, token_new, token_hash_new } }
    const payload = await req.json()
    const { user, email_data } = payload

    if (!user?.email || !email_data) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Look up church branding from user metadata
    const churchCode = user?.user_metadata?.church_code
    let churchName = 'your church'
    let churchLogoUrl: string | null = null
    if (churchCode) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      const { data: church } = await supabaseAdmin
        .from('churches')
        .select('name, logo_url')
        .eq('code', churchCode)
        .single()
      if (church) {
        churchName = church.name
        churchLogoUrl = church.logo_url
      }
    }

    const emailType = email_data.email_action_type
    const EmailTemplate = EMAIL_TEMPLATES[emailType]

    if (!EmailTemplate) {
      console.error('Unknown email type:', emailType)
      return new Response(JSON.stringify({ error: `Unknown email type: ${emailType}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build the confirmation URL from Supabase's hook data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const redirectTo = email_data.redirect_to || `https://${ROOT_DOMAIN}`
    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=${emailType}&redirect_to=${encodeURIComponent(redirectTo)}`

    const templateProps = {
      siteName: SITE_NAME,
      siteUrl: `https://${ROOT_DOMAIN}`,
      recipient: user.email,
      confirmationUrl,
      token: email_data.token,
      email: user.email,
      newEmail: email_data.new_email || user.email,
      churchName,
      churchLogoUrl,
    }

    const html = await renderAsync(React.createElement(EmailTemplate, templateProps))
    const text = await renderAsync(React.createElement(EmailTemplate, templateProps), { plainText: true })

    // Send via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      console.error('RESEND_API_KEY not configured')
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        to: [user.email],
        subject: EMAIL_SUBJECTS[emailType] || 'Notification',
        html,
        text,
      }),
    })

    if (!resendRes.ok) {
      const errBody = await resendRes.text()
      console.error('Resend API error:', resendRes.status, errBody)
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resendData = await resendRes.json()
    console.log('Email sent successfully', { message_id: resendData.id, type: emailType, to: user.email })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('auth-email-hook error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
