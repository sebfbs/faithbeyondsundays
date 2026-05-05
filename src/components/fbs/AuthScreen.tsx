import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Mode = "welcome" | "signin" | "signup";

export default function AuthScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"google" | "apple" | "email" | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  // Forgot password
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading("google");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message || "Google sign-in failed");
      setLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setLoading("apple");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message || "Apple sign-in failed");
      setLoading(null);
    }
  };

  const handleEmailSignUp = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading("email");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
    } else {
      setSignUpSuccess(true);
    }
    setLoading(null);
  };

  const handleEmailSignIn = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }
    setLoading("email");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    }
    setLoading(null);
  };

  const handleForgotPassword = async () => {
    setError(null);
    if (!email.trim()) {
      setError("Enter your email address above");
      return;
    }
    setLoading("email");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
    setLoading(null);
  };

  // Welcome screen
  if (mode === "welcome") {
    return (
      <div
        className="w-full min-h-screen flex flex-col items-center justify-center animate-fade-in"
        style={{
          background:
            "linear-gradient(180deg, hsl(207, 65%, 62%) 0%, hsl(207, 55%, 75%) 25%, hsl(22, 55%, 88%) 60%, hsl(40, 30%, 97%) 100%)",
        }}
      >
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <p className="text-lg font-semibold max-w-[260px] leading-relaxed" style={{ color: "hsl(0, 0%, 100%)" }}>
            Stay connected to Sunday's message all week long
          </p>
        </div>
        <div className="w-full max-w-[430px] px-8 pb-12 space-y-3">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-semibold text-base py-4 rounded-2xl tap-active shadow-card transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading === "google" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </button>

          {/* Apple Sign In */}
          <button
            onClick={handleAppleSignIn}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 bg-black text-white font-semibold text-base py-4 rounded-2xl tap-active shadow-card transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading === "apple" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            )}
            Continue with Apple
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-gray-400/40" />
            <span className="text-xs font-medium text-gray-600">or</span>
            <div className="flex-1 h-px bg-gray-400/40" />
          </div>

          {/* Email buttons */}
          <button
            onClick={() => setMode("signup")}
            className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-base py-4 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90"
          >
            <Mail size={18} />
            Sign Up with Email
          </button>

          <button
            onClick={() => setMode("signin")}
            className="w-full text-center text-sm font-medium text-gray-600 tap-active py-2"
          >
            Already have an account? <span className="underline">Sign In</span>
          </button>

          {/* Terms & Privacy */}
          <p className="text-[10px] text-center text-gray-500 leading-relaxed pt-1">
            By continuing, you agree to our{" "}
            <button onClick={() => navigate("/terms")} className="underline">Terms of Service</button>{" "}
            and{" "}
            <button onClick={() => navigate("/privacy")} className="underline">Privacy Policy</button>
          </p>
        </div>
      </div>
    );
  }

  // Sign Up success — check email
  if (signUpSuccess) {
    return (
      <div
        className="mx-auto flex flex-col min-h-screen px-6 items-center justify-center text-center"
        style={{ background: "hsl(var(--background))", maxWidth: 430, width: "100%" }}
      >
        <div className="w-16 h-16 rounded-full bg-amber/15 flex items-center justify-center mb-5">
          <Mail size={28} className="text-amber" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
        <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed mb-6">
          We sent a verification link to <span className="font-semibold text-foreground">{email}</span>. Click the link to activate your account.
        </p>
        <button
          onClick={() => { setSignUpSuccess(false); setMode("signin"); setPassword(""); setError(null); }}
          className="text-sm font-medium text-amber tap-active"
        >
          ← Back to Sign In
        </button>
      </div>
    );
  }

  // Sign In / Sign Up form
  const isSignUp = mode === "signup";

  return (
    <div
      className="mx-auto flex flex-col min-h-screen px-6"
      style={{ background: "hsl(var(--background))", maxWidth: 430, width: '100%', position: 'relative' }}
    >
      <div className="pt-14 pb-6">
        <button onClick={() => { setMode("welcome"); setError(null); setForgotMode(false); setResetSent(false); }} className="mb-4 tap-active">
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {forgotMode ? "Reset Password" : isSignUp ? "Create Account" : "Welcome Back"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {forgotMode
            ? "Enter your email and we'll send a reset link"
            : isSignUp ? "Sign up with your email" : "Sign in to your account"}
        </p>
      </div>

      <div className="space-y-3 flex-1">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          autoComplete="email"
          inputMode="email"
          className="w-full bg-card rounded-2xl px-4 py-4 text-base text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-amber/40 appearance-none"
        />

        {!forgotMode && (
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              inputMode="text"
              className="w-full bg-card rounded-2xl px-4 py-4 pr-12 text-base text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-amber/40 appearance-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground tap-active"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        )}

        {isSignUp && !forgotMode && (
          <p className="text-xs text-muted-foreground ml-1">
            At least 6 characters
          </p>
        )}

        {/* Forgot password link — only on sign-in */}
        {!isSignUp && !forgotMode && (
          <button
            onClick={() => { setForgotMode(true); setError(null); }}
            className="text-xs font-medium text-amber tap-active ml-1"
          >
            Forgot password?
          </button>
        )}

        {/* Reset sent confirmation */}
        {resetSent && (
          <div className="bg-amber/10 rounded-2xl p-4 text-center animate-fade-in">
            <p className="text-sm font-semibold text-foreground mb-1">Reset link sent!</p>
            <p className="text-xs text-muted-foreground">Check your email for the password reset link.</p>
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive ml-1">{error}</p>
        )}

        {/* Social sign-in options — not in forgot mode */}
        {!forgotMode && (
          <div className="pt-2 space-y-2">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-3 bg-card text-foreground font-medium text-sm py-3.5 rounded-2xl tap-active shadow-card transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading === "google" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Continue with Google
            </button>
            <button
              onClick={handleAppleSignIn}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-3 bg-foreground text-background font-medium text-sm py-3.5 rounded-2xl tap-active shadow-card transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading === "apple" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              )}
              Continue with Apple
            </button>
          </div>
        )}
      </div>

      <div className="pb-12 pt-6 space-y-3">
        {forgotMode ? (
          <>
            <button
              onClick={handleForgotPassword}
              disabled={loading !== null || resetSent}
              className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-base py-4 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading === "email" ? <Loader2 size={18} className="animate-spin" /> : null}
              Send Reset Link
            </button>
            <button
              onClick={() => { setForgotMode(false); setResetSent(false); setError(null); }}
              className="w-full text-center text-sm text-muted-foreground tap-active py-2"
            >
              ← Back to Sign In
            </button>
          </>
        ) : (
          <>
            <button
              onClick={isSignUp ? handleEmailSignUp : handleEmailSignIn}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-base py-4 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading === "email" ? <Loader2 size={18} className="animate-spin" /> : null}
              {isSignUp ? "Create Account" : "Sign In"}
            </button>

            <button
              onClick={() => { setMode(isSignUp ? "signin" : "signup"); setError(null); }}
              className="w-full text-center text-sm text-muted-foreground tap-active py-2"
            >
              {isSignUp ? (
                <>Already have an account? <span className="font-medium text-amber">Sign In</span></>
              ) : (
                <>Don't have an account? <span className="font-medium text-amber">Sign Up</span></>
              )}
            </button>

            {isSignUp && (
              <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
                By creating an account, you agree to our{" "}
                <button onClick={() => navigate("/terms")} className="underline">Terms of Service</button>{" "}
                and{" "}
                <button onClick={() => navigate("/privacy")} className="underline">Privacy Policy</button>
                {". "}By signing up, you confirm you are 13 or older.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}