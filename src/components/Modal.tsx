"use client";

import React, { useState } from "react";
import { X, CheckCircle2, ArrowRight } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "demo" | "login" | "plan";
  planName?: string;
}

export default function Modal({ isOpen, onClose, type, planName }: ModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      // Auto close after 2 seconds
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 relative animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-[#7B0FE8] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-neutral-950">Thank you!</h3>
            <p className="text-neutral-500 text-sm mt-2">
              {type === "login"
                ? "Magic login link dispatched to your inbox."
                : `We received your request for ${planName || "QuizForge"}. Our team will reach out shortly.`}
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#7B0FE8] bg-purple-50 px-2.5 py-1 rounded">
                QuizForge Access
              </span>
              <h3 className="text-2xl font-bold text-neutral-950 mt-3 tracking-tight">
                {type === "login"
                  ? "Welcome Back"
                  : type === "demo"
                  ? "Schedule a Technical Demo"
                  : `Get Started with ${planName}`}
              </h3>
              <p className="text-sm text-neutral-500 mt-1.5">
                {type === "login"
                  ? "Sign in with your enterprise credentials or email."
                  : "Experience secure sandboxed quiz grading and coding assessments."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {type !== "login" && (
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ada Lovelace"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B0FE8] focus:border-transparent transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Work / Educational Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ada@university.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B0FE8] focus:border-transparent transition-all"
                />
              </div>

              {type !== "login" && (
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Organization / Institution
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Institute"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B0FE8] focus:border-transparent transition-all"
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-6 rounded-full bg-[#7B0FE8] hover:bg-[#680ec7] text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>
                    {type === "login"
                      ? "Send Magic Link"
                      : type === "demo"
                      ? "Book Demo"
                      : "Continue"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-center text-neutral-400 mt-3">
                Protected by SOC 2 Type II compliance standards. No spam.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
