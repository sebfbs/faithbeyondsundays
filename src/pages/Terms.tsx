import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-6 py-14 max-w-2xl mx-auto" style={{ background: "hsl(var(--background))" }}>
      <button onClick={() => navigate(-1)} className="mb-6 tap-active flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft size={18} />
        Back
      </button>
      <h1 className="text-2xl font-bold text-foreground mb-6">Terms of Service</h1>
      <p className="text-xs text-muted-foreground mb-8">Last updated: February 22, 2026</p>

      <div className="space-y-6 text-sm text-foreground/85 leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
          <p>By accessing or using Faith Beyond Sundays ("the App"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the App.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">2. Description of Service</h2>
          <p>Faith Beyond Sundays is a faith engagement platform that helps users stay connected to their church's sermons throughout the week through guided reflections, journal entries, community features, and daily devotionals.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">3. User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information when creating an account. You must be at least 13 years old to use the App.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">4. User Content</h2>
          <p>You retain ownership of content you create (journal entries, prayer requests, etc.). By using community features, you grant Faith Beyond Sundays a limited license to display your public profile information to other members of your church.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">5. Acceptable Use</h2>
          <p>You agree not to use the App to harass, abuse, or harm others; share inappropriate or offensive content; attempt to gain unauthorized access to other accounts; or violate any applicable laws.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">6. Reporting & Blocking</h2>
          <p>Users may report content or other users for violations of these terms. We review all reports and may take action including content removal, account warnings, or account suspension. Users may also block other users, which prevents further interaction.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">7. Intellectual Property</h2>
          <p>The App, including its design, features, and content (excluding user-generated content and sermon content provided by churches), is owned by Faith Beyond Sundays and protected by intellectual property laws.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">8. Disclaimers</h2>
          <p>The App is provided "as is" without warranties of any kind. Faith Beyond Sundays is not a substitute for professional counseling or pastoral care.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">9. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, Faith Beyond Sundays shall not be liable for any indirect, incidental, or consequential damages arising from your use of the App.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">10. Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time through the app settings, which permanently removes all your data.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">11. Changes to Terms</h2>
          <p>We may update these terms from time to time. Continued use of the App after changes constitutes acceptance of the updated terms.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">12. Contact</h2>
          <p>For questions about these terms, contact us at support@faithbeyondsundays.app.</p>
        </section>
      </div>
    </div>
  );
}