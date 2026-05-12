import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ChurchData {
  id: string;
  name: string;
  logo_192_url: string | null;
}

type Device = "ios-safari" | "ios-other" | "android" | "desktop";

function detectDevice(): Device {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  if (isIOS && /CriOS|FxiOS|OPiOS|mercury/.test(ua)) return "ios-other";
  if (isIOS) return "ios-safari";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-middle">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function IOSSafariInstructions({ churchName }: { churchName: string }) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 space-y-5">
      <div className="text-center">
        <p className="text-base font-bold text-gray-900">Add to Your Home Screen</p>
        <p className="text-xs text-gray-500 mt-1">Follow these steps in Safari</p>
      </div>
      <div className="space-y-4">
        <Step number={1}>
          Tap the <span className="font-semibold text-gray-900 tracking-widest">···</span> button at the bottom right of Safari
        </Step>
        <Step number={2}>
          Tap <span className="font-semibold text-gray-900">"Share"</span> from the menu
        </Step>
        <Step number={3}>
          Scroll down and tap <span className="font-semibold text-gray-900">"View More"</span>
        </Step>
        <Step number={4}>
          Tap <span className="font-semibold text-gray-900">"Add to Home Screen"</span>
        </Step>
        <Step number={5}>
          Tap <span className="font-semibold text-gray-900">"Add"</span> — you're in. Open <span className="font-semibold text-gray-900">{churchName}</span> from your home screen to get started
        </Step>
      </div>
    </div>
  );
}

function AndroidInstructions({ churchName }: { churchName: string }) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 space-y-5">
      <div className="text-center">
        <p className="text-base font-bold text-gray-900">Add to Your Home Screen</p>
        <p className="text-xs text-gray-500 mt-1">Follow these steps in Chrome</p>
      </div>
      <div className="space-y-4">
        <Step number={1}>
          Tap the <span className="font-semibold text-gray-900">⋮</span> menu in the top right corner of Chrome
        </Step>
        <Step number={2}>
          Tap <span className="font-semibold text-gray-900">"Add to Home screen"</span> or <span className="font-semibold text-gray-900">"Install app"</span>
        </Step>
        <Step number={3}>
          Tap <span className="font-semibold text-gray-900">"Add"</span> to confirm
        </Step>
        <Step number={4}>
          Open <span className="font-semibold text-gray-900">{churchName}</span> from your home screen to get started
        </Step>
      </div>
    </div>
  );
}

function IOSOtherBrowserWarning() {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-amber/10 flex items-center justify-center mx-auto">
        <span className="text-2xl">🧭</span>
      </div>
      <div className="text-center space-y-2">
        <p className="text-base font-bold text-gray-900">Open in Safari</p>
        <p className="text-sm text-gray-600 leading-relaxed">
          To add this app to your home screen, you need to open this page in <span className="font-semibold text-gray-900">Safari</span>.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Copy the link above, open Safari, and paste it in the address bar.
        </p>
      </div>
    </div>
  );
}

function DesktopMessage() {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
        <span className="text-2xl">📱</span>
      </div>
      <div className="text-center space-y-2">
        <p className="text-base font-bold text-gray-900">Open on Your Phone</p>
        <p className="text-sm text-gray-600 leading-relaxed">
          Open this link on your iPhone or Android phone to install the app.
        </p>
      </div>
    </div>
  );
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-6 h-6 rounded-full bg-amber flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-xs font-bold text-white">{number}</span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{children}</p>
    </div>
  );
}

function NotFoundScreen({ onSearch }: { onSearch: () => void }) {
  return (
    <div
      className="w-full min-h-screen flex flex-col items-center justify-center px-6"
      style={{
        background:
          "linear-gradient(180deg, hsl(207, 65%, 62%) 0%, hsl(207, 55%, 75%) 25%, hsl(22, 55%, 88%) 60%, hsl(40, 30%, 97%) 100%)",
      }}
    >
      <div className="max-w-[340px] w-full space-y-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto">
          <span className="text-3xl">🔍</span>
        </div>
        <h1 className="text-xl font-bold text-white">Church Not Found</h1>
        <p className="text-white/80 text-sm leading-relaxed">
          We couldn't find that church. Search below to find yours, or ask your pastor for the correct link.
        </p>
        <button
          onClick={onSearch}
          className="w-full bg-white text-gray-800 font-semibold text-sm py-4 rounded-2xl shadow-lg tap-active"
        >
          Search for My Church
        </button>
      </div>
    </div>
  );
}

export default function ChurchLandingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const churchCode = searchParams.get("church") || "";
  const [church, setChurch] = useState<ChurchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [device] = useState<Device>(detectDevice);

  useEffect(() => {
    if (!churchCode) {
      navigate("/", { replace: true });
      return;
    }

    supabase
      .from("churches")
      .select("id, name, logo_192_url")
      .eq("code", churchCode)
      .eq("is_active", true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setChurch(data as ChurchData);
          localStorage.setItem("fbs_church_code", churchCode);
          localStorage.setItem("fbs_church_id", data.id);
          localStorage.setItem("fbs_church_name", data.name);
          localStorage.setItem("fbs_joined_via", "church_link");
          if (data.logo_192_url) {
            localStorage.setItem("fbs_church_logo", data.logo_192_url);
          }
        }
        setLoading(false);
      });
  }, [churchCode, navigate]);

  if (loading) {
    return (
      <div
        className="w-full min-h-screen flex items-center justify-center"
        style={{
          background:
            "linear-gradient(180deg, hsl(207, 65%, 62%) 0%, hsl(207, 55%, 75%) 25%, hsl(22, 55%, 88%) 60%, hsl(40, 30%, 97%) 100%)",
        }}
      >
        <Loader2 size={32} className="animate-spin text-white" />
      </div>
    );
  }

  if (notFound) {
    return <NotFoundScreen onSearch={() => navigate("/")} />;
  }

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center"
      style={{
        background:
          "linear-gradient(180deg, hsl(207, 65%, 62%) 0%, hsl(207, 55%, 75%) 25%, hsl(22, 55%, 88%) 60%, hsl(40, 30%, 97%) 100%)",
      }}
    >
      {/* Church branding */}
      <div
        className="pt-safe flex flex-col items-center text-center px-6 pb-6"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 3.5rem)" }}
      >
        {church?.logo_192_url ? (
          <img
            src={church.logo_192_url}
            alt={church!.name}
            className="w-24 h-24 rounded-3xl shadow-lg mb-4 object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-3xl bg-white/25 flex items-center justify-center mb-4 shadow-lg">
            <span className="text-4xl font-bold text-white">{church!.name[0]}</span>
          </div>
        )}
        <h1 className="text-2xl font-bold text-white">{church!.name}</h1>
        <p className="text-white/75 text-sm mt-1">Daily faith content from your church</p>
      </div>

      {/* Install instructions card */}
      <div className="w-full max-w-[430px] px-5 pb-12">
        {device === "ios-other" && <IOSOtherBrowserWarning />}
        {device === "ios-safari" && <IOSSafariInstructions churchName={church!.name} />}
        {device === "android" && <AndroidInstructions churchName={church!.name} />}
        {device === "desktop" && <DesktopMessage />}
      </div>
    </div>
  );
}
