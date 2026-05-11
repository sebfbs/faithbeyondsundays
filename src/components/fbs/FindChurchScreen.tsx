import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronDown, ChevronUp, Loader2, CheckCircle2 } from "lucide-react";

interface Church {
  id: string;
  name: string;
  code: string;
  logo_192_url: string | null;
}

export default function FindChurchScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);

  // Request form state
  const [churchName, setChurchName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: churches = [], isLoading } = useQuery<Church[]>({
    queryKey: ["public-churches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("churches")
        .select("id, name, code, logo_192_url")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const filtered = churches.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectChurch = (code: string) => {
    localStorage.setItem("fbs_joined_via", "direct_search");
    navigate(`/?church=${encodeURIComponent(code)}`);
  };

  const handleSubmitRequest = async () => {
    setSubmitError(null);
    if (!churchName.trim()) { setSubmitError("Please enter your church name"); return; }
    if (!requesterEmail.trim()) { setSubmitError("Please enter your email"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requesterEmail)) {
      setSubmitError("Please enter a valid email address");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("send-church-request", {
        body: {
          church_name: churchName.trim(),
          requester_email: requesterEmail.trim(),
          requester_name: requesterName.trim() || undefined,
        },
      });
      if (error) throw error;
      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div
      className="w-full min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(180deg, hsl(207, 65%, 62%) 0%, hsl(207, 55%, 75%) 25%, hsl(22, 55%, 88%) 60%, hsl(40, 30%, 97%) 100%)",
      }}
    >
      {/* Header */}
      <div className="pt-16 pb-6 px-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-1">Find Your Church</h1>
        <p className="text-white/80 text-sm">Search for your church to get the app</p>
      </div>

      {/* Search + list */}
      <div className="flex-1 px-5 max-w-[430px] w-full mx-auto space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search churches..."
            className="w-full bg-white rounded-2xl pl-10 pr-4 py-4 text-base text-gray-800 placeholder:text-gray-400 shadow-card focus:outline-none focus:ring-2 focus:ring-white/40"
          />
        </div>

        {/* Church list */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              {query ? `No churches found for "${query}"` : "No churches available yet"}
            </div>
          ) : (
            filtered.map((church, i) => (
              <button
                key={church.id}
                onClick={() => handleSelectChurch(church.code)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left tap-active hover:bg-gray-50 transition-colors ${
                  i < filtered.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                {church.logo_192_url ? (
                  <img
                    src={church.logo_192_url}
                    alt={church.name}
                    className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-bold text-blue-500">
                      {church.name[0]}
                    </span>
                  </div>
                )}
                <span className="font-medium text-gray-800 text-sm">{church.name}</span>
              </button>
            ))
          )}
        </div>

        {/* Request church section */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <button
            onClick={() => setRequestOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-4 text-sm font-medium text-gray-700 tap-active"
          >
            <span>Don't see your church?</span>
            {requestOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {requestOpen && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              {submitted ? (
                <div className="flex flex-col items-center py-4 gap-2">
                  <CheckCircle2 size={28} className="text-green-500" />
                  <p className="text-sm font-semibold text-gray-800">Request sent!</p>
                  <p className="text-xs text-gray-500 text-center">
                    We'll reach out to your church and get them set up.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Let us know your church and we'll reach out to get them onboarded.
                  </p>
                  <input
                    type="text"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    placeholder="Church name *"
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <input
                    type="email"
                    value={requesterEmail}
                    onChange={(e) => setRequesterEmail(e.target.value)}
                    placeholder="Your email *"
                    inputMode="email"
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <input
                    type="text"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    placeholder="Your name (optional)"
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  {submitError && (
                    <p className="text-xs text-red-500">{submitError}</p>
                  )}
                  <button
                    onClick={handleSubmitRequest}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-amber text-white font-semibold text-sm py-3 rounded-xl tap-active disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
                    Request My Church
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="pb-12" />
      </div>
    </div>
  );
}
