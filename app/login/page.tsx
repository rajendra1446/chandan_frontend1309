"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, Factory, ShieldCheck, ArrowRight, Layers, Flame, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../lib/authContext";
import { loginSchema, registerSchema } from "../../lib/schemas";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, token } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [department, setDepartment] = useState("Management");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect
  React.useEffect(() => {
    if (token) {
      router.replace("/dashboard");
    }
  }, [token, router]);

  const handleFillDemo = () => {
    setIsRegister(false);
    setEmail("admin@chandansteel.com");
    setPassword("Admin@123");
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (isRegister) {
        const validated = registerSchema.parse({
          name,
          email,
          password,
          role,
          department
        });
        const res = await register(validated);
        if (res.success) {
          router.push("/dashboard");
        } else {
          setErrorMsg(res.message || "Registration failed.");
        }
      } else {
        const validated = loginSchema.parse({ email, password });
        const res = await login(validated.email, validated.password);
        if (res.success) {
          router.push("/dashboard");
        } else {
          setErrorMsg(res.message || "Invalid credentials.");
        }
      }
    } catch (err: any) {
      if (err.errors && Array.isArray(err.errors)) {
        setErrorMsg(err.errors[0]?.message || "Validation failed.");
      } else {
        setErrorMsg(err.message || "An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#090e1a] text-white select-none">
      {/* Left Brand Panel */}
      <div className="md:w-1/2 p-5 sm:p-8 md:p-16 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#090e1a] via-[#0d162d] to-[#121f42] border-b md:border-b-0 md:border-r border-slate-800">
        {/* Glow orb background effect */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-[1.5px] flex items-center justify-center shadow-lg shadow-orange-500/20">
            <div className="w-full h-full bg-[#090e1a] rounded-[14px] flex items-center justify-center">
              <Boxes className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wide text-white leading-tight">
              CHANDAN STEEL
            </h1>
            <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              MES & TRACEABILITY
            </span>
          </div>
        </div>

        {/* Center Copy & Value Props */}
        <div className="my-8 sm:my-12 relative z-10 space-y-5 sm:space-y-6 font-sans">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold font-sans">
            <Factory className="w-3.5 h-3.5" />
            <span>Production Execution & Billet Traceability</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight font-sans">
            Complete End-to-End <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500">
              Steel Manufacturing
            </span>{" "}
            Intelligence.
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed font-sans">
            Track multi-length billet casting, spectrometer chemical test certification, mill unit dispatches, rolling yields, and scrap recovery in a single real-time ledger.
          </p>

          <div className="space-y-2.5 sm:space-y-3 pt-2">
            {[
              "Multi-Length Casting (7.4m, 5.0m, 5.4m) with auto-weight calculation",
              "Spectrometry lab quality checks & mandatory approval gates",
              "Full Material Balance Ledger: Cast vs Dispatched vs Rolled vs Scrap"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 sm:gap-3 text-xs text-slate-300 font-medium font-sans">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-4 font-sans">
          <span>Chandan Steel Limited &copy; 2026</span>
          <span className="flex items-center gap-1.5 text-slate-400 font-medium font-sans">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ISO 9001:2015 Traceability
          </span>
        </div>
      </div>

      {/* Right Login / Register Card */}
      <div className="md:w-1/2 p-4 sm:p-8 md:p-16 flex items-center justify-center bg-[#f8fafc] text-slate-900 font-sans">
        <div className="w-full max-w-md">
          {/* Card Frame */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl border border-slate-200/80 font-sans">
            {/* Tab switch */}
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  !isRegister
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isRegister
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Register Account
              </button>
            </div>

            {/* Title */}
            <div className="mb-6">
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {isRegister ? "Create MES Operator Account" : "Sign in to Chandan MES"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isRegister
                  ? "Enter your details to create an account"
                  : "Access heat casting, dispatches and traceability"}
              </p>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rajendra Chaudhari"
                      className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Role
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="PLANT_MANAGER">PLANT MANAGER</option>
                        <option value="LAB_CHEMIST">LAB CHEMIST</option>
                        <option value="STORE_MANAGER">STORE MANAGER</option>
                        <option value="OPERATOR">OPERATOR</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Department
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. SMS / Rolling"
                        className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@chandansteel.com"
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{isRegister ? "Create Account & Login" : "Sign In to Dashboard"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Demo Fill */}
            {!isRegister && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="w-full py-2.5 px-3 rounded-xl border border-orange-200 bg-orange-50/50 hover:bg-orange-50 text-orange-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer font-sans"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                  <span>1-Click Demo Admin Credentials</span>
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  Pre-fills: <span className="font-mono text-slate-600">admin@chandansteel.com</span> / <span className="font-mono text-slate-600">Admin@123</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
