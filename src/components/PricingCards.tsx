"use client";

import React, { useState } from "react";
import { Check, Info } from "lucide-react";

interface PricingCardsProps {
  onSelectPlan: (planName: string) => void;
}

export default function PricingCards({ onSelectPlan }: PricingCardsProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const plans = [
    {
      id: "community",
      name: "Community",
      badge: "Free",
      tab: null,
      tabType: null,
      description:
        "For hobbyists and small teams ready to join QuizForge's open-source community.",
      buttonText: "Install open source",
      buttonStyle:
        "bg-[#EFEFEF] hover:bg-[#E5E5E5] text-neutral-900 font-medium border border-transparent hover:border-neutral-300",
      everythingLine: "Everything you need to get started with QuizForge:",
      features: [
        {
          title: "Build securely on infrastructure you trust",
          description:
            "Provision unlimited self-hosted workspaces on the infrastructure you already own.",
        },
        {
          title: "Interactive coding quiz engine",
          description:
            "Run test-driven coding quizzes with instant compilation and standard I/O assertions.",
        },
        {
          title: "Standard question banks",
          description:
            "Multiple-choice, fill-in-the-blank, multi-file code challenges, and automated unit testing.",
        },
        {
          title: "Open-source community ecosystem",
          description:
            "Deploy via Docker Compose, Helm chart, or Kubernetes with complete documentation.",
        },
      ],
    },
    {
      id: "premium",
      name: "Premium",
      badge: "Annually per user",
      tab: "INCLUDES AUDIT LOGS",
      tabType: "gray",
      tabTooltip:
        "Full audit trails, compliance tracking, and administrative controls for educational and enterprise workloads.",
      description:
        "For enterprises ready to achieve world-class security, scalability, and developer experience.",
      buttonText: "Get a demo",
      buttonStyle:
        "bg-[#EFEFEF] hover:bg-[#E5E5E5] text-neutral-900 font-medium border border-transparent hover:border-neutral-300",
      everythingLine: "Everything in Community, plus:",
      features: [
        {
          title: "Keep every test action accountable",
          description:
            "Audit keystrokes, restrict copy-pasting, and track attempt telemetry so candidates operate within your policies.",
        },
        {
          title: "Enterprise SSO & directory sync",
          description:
            "Integrate Okta, Google Workspace, Azure AD, and SCIM directory sync for automated student cohort onboarding.",
        },
        {
          title: "Centralized administration & analytics",
          description:
            "Track benchmark scores, percentile analytics, and time-to-solve distribution across groups.",
        },
        {
          title: "Production SLA & dedicated support",
          description:
            "Guaranteed 99.9% uptime SLA, customer success manager, and 24/7 priority support.",
        },
      ],
    },
    {
      id: "ai-premium",
      name: "AI Premium",
      badge: "Custom",
      tab: "UNLOCKS CODING WORKSPACE",
      tabType: "purple",
      tabTooltip:
        "Full sandboxed browser coding environments with real-time AI code reviews and instant grading.",
      description:
        "For enterprises scaling their AI-native transformation on trusted infrastructure.",
      buttonText: "Start a trial",
      buttonStyle:
        "bg-[#7B0FE8] hover:bg-[#680ec7] text-white font-medium shadow-[0_2px_8px_rgba(123,15,232,0.25)] hover:shadow-[0_4px_14px_rgba(123,15,232,0.35)]",
      everythingLine: "Everything in Premium, plus:",
      features: [
        {
          title: "Orchestrate fully self-hosted AI workflows",
          description:
            "Run QuizForge Agents natively in your panel, with no vendor SaaS or third-party agent wrapper.",
        },
        {
          title: "Context-aware intelligent code hints",
          description:
            "Provide automated, adaptive hints based on test failures without spoiling the final quiz answer.",
        },
        {
          title: "Automated code review & anti-cheat heuristics",
          description:
            "Analyze code stylometry, token distributions, and algorithmic complexity to detect non-authentic solutions.",
        },
        {
          title: "GPU-accelerated runtime containers",
          description:
            "Spin up sandboxes for AI/ML quizzes, PyTorch notebooks, and full-stack web applications in under 2 seconds.",
        },
      ],
    },
  ];

  return (
    <section id="pricing" className="pb-24 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl border ${
              plan.tabType === "purple"
                ? "border-neutral-200/90 border-t-2 border-t-[#7B0FE8]"
                : "border-neutral-200/90"
            } shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition-all flex flex-col justify-between overflow-hidden relative group`}
          >
            {/* Top Tab Header Bar */}
            <div className="h-9 w-full flex items-start justify-start">
              {plan.tab ? (
                <div className="relative">
                  <div
                    onMouseEnter={() => setActiveTooltip(plan.id)}
                    onMouseLeave={() => setActiveTooltip(null)}
                    className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.05em] uppercase px-3.5 py-1.5 rounded-br-lg select-none cursor-help transition-opacity ${
                      plan.tabType === "purple"
                        ? "bg-[#7B0FE8] text-white"
                        : "bg-[#E5E5E5] text-neutral-800"
                    }`}
                  >
                    <span>{plan.tab}</span>
                    <Info
                      className={`w-3.5 h-3.5 ${
                        plan.tabType === "purple"
                          ? "text-white/80"
                          : "text-neutral-600"
                      }`}
                    />
                  </div>

                  {/* Tab Tooltip */}
                  {activeTooltip === plan.id && plan.tabTooltip && (
                    <div className="absolute left-2 top-8 z-30 w-64 p-2.5 bg-neutral-900 text-white text-xs rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-150">
                      {plan.tabTooltip}
                    </div>
                  )}
                </div>
              ) : (
                /* Invisible placeholder spacer on Card 1 so all card titles align perfectly */
                <div className="h-9" />
              )}
            </div>

            {/* Card Main Body */}
            <div className="px-7 pt-4 pb-8 flex-1 flex flex-col">
              {/* Plan Name & Monospace Badge */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-[28px] font-bold tracking-tight text-neutral-950">
                  {plan.name}
                </h3>
                <span className="font-mono text-[11px] font-semibold text-neutral-600 bg-[#EFEFEF] px-2 py-0.5 rounded tracking-normal">
                  {plan.badge}
                </span>
              </div>

              {/* Short Gray Description */}
              <p className="mt-3 text-[14px] text-neutral-500 leading-snug min-h-[42px]">
                {plan.description}
              </p>

              {/* Action Button */}
              <div className="mt-6">
                <button
                  onClick={() => onSelectPlan(plan.name)}
                  className={`w-full py-3 px-6 rounded-full text-[14px] transition-all duration-150 active:scale-[0.99] cursor-pointer text-center ${plan.buttonStyle}`}
                >
                  {plan.buttonText}
                </button>
              </div>

              {/* Divider / Everything in... header */}
              <div className="mt-9 mb-5">
                <p className="text-[13px] font-medium text-neutral-700">
                  {plan.everythingLine}
                </p>
              </div>

              {/* Feature Checklist */}
              <ul className="space-y-5 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {/* Clean minimalist checkmark matching screenshot */}
                      <Check className="w-4 h-4 text-neutral-950 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-neutral-950 leading-tight">
                        {feature.title}
                      </h4>
                      <p className="text-[12.5px] text-neutral-500 mt-0.5 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
