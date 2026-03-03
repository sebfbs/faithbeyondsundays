import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-6 py-14 max-w-2xl mx-auto" style={{ background: "hsl(var(--background))" }}>
      <button onClick={() => navigate(-1)} className="mb-6 tap-active flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft size={18} />
        Back
      </button>
      <h1 className="text-2xl font-bold text-foreground mb-6">Privacy Policy</h1>
      <p className="text-xs text-muted-foreground mb-8">Last updated: February 22, 2026</p>

      <div className="space-y-6 text-sm text-foreground/85 leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">1. Information We Collect</h2>
          <p>When you create an account, we collect your name, email address, and username. If you sign in with Google or Apple, we receive your name and email (and profile picture from Google) from the respective provider. We also collect data you create within the app, such as journal entries and prayer requests.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
          <p>We use your information to provide and improve the Faith Beyond Sundays experience, including personalizing content based on your church affiliation, enabling community features, and sending relevant notifications if you opt in.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">3. Data Sharing</h2>
          <p>We do not sell your personal information. Your journal entries and prayer requests marked as private are only visible to you. Community features share limited profile information (name, username) with other members of your church.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">4. Data Storage & Security</h2>
          <p>Your data is stored securely using industry-standard encryption. We use secure cloud infrastructure to protect your information from unauthorized access.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">5. Your Rights</h2>
          <p>You can access, update, or delete your account and associated data at any time through the app settings. To request a full data export or deletion, contact us at support@faithbeyondsundays.app.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">6. Cookies & Analytics</h2>
          <p>We use essential cookies for authentication. We may use anonymous analytics to understand app usage patterns and improve the experience.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">7. Children's Privacy</h2>
          <p>Faith Beyond Sundays is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you are under 13, please do not use the app.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">8. Changes to This Policy</h2>
          <p>We may update this policy from time to time. We will notify you of significant changes through the app or via email.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">9. Contact Us</h2>
          <p>If you have questions about this privacy policy, contact us at support@faithbeyondsundays.app.</p>
        </section>
      </div>
    </div>
  );
}