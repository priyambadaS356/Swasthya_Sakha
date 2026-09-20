import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, QrCode, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { roles } from "../data";
import { loginSuccess } from "../store/authSlice";
import { api } from "../api";
import Modal from "../components/Modal";

const DEMO_USERNAMES = {
  patient: "patient",
  healthWorker: "worker",
  doctor: "doctor",
  facilityAdmin: "facility",
  districtAdmin: "district",
};

export default function Login() {
  const [role, setRole] = useState("patient");
  const [qr, setQr] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const enteredUsername = form.username?.value?.trim();
    const username = enteredUsername || DEMO_USERNAMES[role];
    const password = form.password?.value;

    try {
      const data = await api("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          role,
        }),
      });

      dispatch(loginSuccess(data));
      nav("/dashboard");
    } catch (err) {
      console.error("Login Error:", err);
      const msg = typeof err === "string" ? err : err?.message || "Server error. Please verify backend service.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const currentRoleObj = roles?.find((r) => r.id === role) || roles[0];

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_.9fr] bg-[#f6f9fc]">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex bg-[#0b2239] text-white p-12 relative overflow-hidden">
        <div className="max-w-xl self-center relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-teal-400 text-[#0b2239] grid place-items-center font-black">
              SS
            </div>
            <div>
              <div className="text-xl font-bold">Swasthya Sakha</div>
              <div className="text-sm text-slate-300">
                Connected public healthcare
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-black leading-tight">
            One workspace for the whole care journey.
          </h1>
          <p className="text-slate-300 mt-5 text-lg leading-8">
            Multilingual intake, ABHA-ready registration, facility intelligence,
            triage, referrals and teleconsultation — designed for connected and
            low-connectivity settings.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-9">
            {[
              "5 role-based workspaces",
              "Offline-ready architecture",
              "GIS facility visibility",
              "Referral & follow-up tracking",
            ].map((x) => (
              <div
                key={x}
                className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm flex gap-2"
              >
                <CheckCircle2 size={17} className="text-teal-300 shrink-0" />
                {x}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -right-28 -bottom-28 w-96 h-96 rounded-full border-[60px] border-teal-400/10" />
      </div>

      {/* Right Login Form Panel */}
      <div className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-lg">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-teal-600 text-white grid place-items-center font-black">
              SS
            </div>
            <b>Swasthya Sakha</b>
          </div>
          <div className="card p-7 sm:p-9">
            <div className="mb-7">
              <p className="text-teal-700 text-xs font-bold uppercase tracking-wider">
                Secure sign in
              </p>
              <h2 className="text-3xl font-black mt-2">Welcome back</h2>
              <p className="text-sm text-muted mt-2">
                Choose your role to open the right workspace.
              </p>
            </div>

            {/* Role Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {(roles || []).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    role === r.id
                      ? "border-teal-500 bg-teal-50 ring-2 ring-teal-500/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold text-sm">{r.label}</div>
                  <div className="text-[11px] text-muted mt-1">{r.hint}</div>
                </button>
              ))}
            </div>

            {/* Login Form */}
            <form onSubmit={submit} className="space-y-4">
              <label className="block text-sm font-semibold">
                Mobile / User ID
                <input
                  name="username"
                  required
                  className="mt-1.5 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 transition-colors"
                  placeholder={
                    role === "patient" ? "10-digit mobile" : "Enter user ID"
                  }
                />
              </label>
              <label className="block text-sm font-semibold">
                Password
                <input
                  name="password"
                  required
                  type="password"
                  className="mt-1.5 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 transition-colors"
                  placeholder="••••••••"
                />
              </label>

              {error && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0b2239] text-white rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 hover:bg-[#12355b] disabled:opacity-60 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Signing in...
                  </>
                ) : (
                  <>
                    Sign in as {currentRoleObj?.label}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {role === "patient" && (
              <button
                type="button"
                onClick={() => setQr(true)}
                className="w-full mt-3 border border-teal-200 text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <QrCode size={18} /> Scan ABHA QR instead
              </button>
            )}

            <div className="flex gap-2 items-start mt-6 text-[11px] text-muted">
              <ShieldCheck size={15} className="text-teal-600 shrink-0" />
              Demo authentication for prototype. Production deployment should
              use ABDM/ABHA consent, identity, and session flows.
            </div>
          </div>
        </div>
      </div>

      {/* ABHA Modal */}
      <Modal
        open={qr}
        onClose={() => setQr(false)}
        title="ABHA QR registration"
      >
        <div className="border-2 border-dashed border-teal-200 bg-teal-50 rounded-2xl p-8 text-center">
          <QrCode size={90} className="mx-auto text-teal-700" />
          <h4 className="font-bold mt-4">QR scanner placeholder</h4>
          <p className="text-sm text-muted mt-1">
            Connect the camera scanner to the official ABHA flow in production.
          </p>
          <button
            type="button"
            onClick={() => {
              setQr(false);
              dispatch(
                loginSuccess({
                  user: { name: "Asha Patil", role: "patient" },
                  token: "demo-token",
                })
              );
              nav("/dashboard");
            }}
            className="mt-5 bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors"
          >
            Use demo ABHA
          </button>
        </div>
      </Modal>
    </div>
  );
}