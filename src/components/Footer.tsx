import React from "react";
import { Link } from "react-router-dom";
import {
  GithubIcon,
  XIcon,
  LinkedinIcon,
  DiscordIcon,
  YoutubeIcon,
} from "./Icons";

export default function Footer() {
  const footerSections = [
    {
      title: "Solutions",
      links: [
        { name: "Install QuizForge", href: "#install" },
        { name: "QuizForge Premium", href: "#premium" },
        { name: "Changelog", href: "#changelog" },
        { name: "Compare", href: "#compare" },
        { name: "Integrations", href: "#integrations" },
        { name: "Pricing", href: "#pricing" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Resource Center", href: "#resources" },
        { name: "Blog", href: "#blog" },
        { name: "[Dev]olution Podcast", href: "#podcast" },
        { name: "Hands-on Courses", href: "#courses" },
        { name: "Events & Webinars", href: "#webinars" },
        { name: "Success Stories", href: "#stories" },
        { name: "Community", href: "#community" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "Partnerships", href: "#partnerships" },
        { name: "Careers", href: "#careers" },
        { name: "About QuizForge", href: "#about" },
        { name: "Brand Guidelines", href: "#brand" },
        { name: "Success Stories", href: "#stories" },
        { name: "Swag Store", href: "#swag" },
        { name: "Security", href: "#security" },
      ],
    },
    {
      title: "Sales & Support",
      links: [
        { name: "Contact Sales", href: "#contact" },
        { name: "Request a Demo", href: "#demo" },
        { name: "Start a trial", href: "#trial" },
        { name: "Discord Community", href: "#discord" },
      ],
    },
  ];

  return (
    <footer className="w-full bg-[#F5F5F5] pt-16 pb-12 px-4 sm:px-6 lg:px-8 border-t border-neutral-200/50">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 pb-16">
          {/* Logo Brand Mark on Left Column */}
          <div className="col-span-2 md:col-span-1 flex items-start">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="flex items-center gap-1.5">
                {/* Modern geometric monogram icon inspired by screenshot */}
                <div className="w-8 h-8 rounded-full border-4 border-black border-r-transparent rotate-45 flex items-center justify-center">
                  <div className="w-2 h-2 bg-black rounded-xs"></div>
                </div>
                <div className="w-4 h-4 bg-black rounded-[1px] ml-0.5"></div>
              </div>
            </Link>
          </div>

          {/* 4 Link Columns */}
          {footerSections.map((section) => (
            <div key={section.title} className="col-span-1">
              <h4 className="text-[14px] font-semibold text-neutral-800 mb-4 tracking-tight">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-[13px] text-neutral-600 hover:text-black transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar: Social, Legal Links, SOC 2 Badge, Copyright */}
        <div className="pt-8 border-t border-neutral-200/80 flex flex-col lg:flex-row items-center justify-between gap-6 text-[12px] text-neutral-500">
          {/* Left: Social Icons */}
          <div className="flex items-center space-x-2">
            {[
              {
                label: "X",
                component: <XIcon className="w-3.5 h-3.5 text-neutral-800" />,
                href: "https://x.com",
              },
              {
                label: "LinkedIn",
                component: (
                  <LinkedinIcon className="w-3.5 h-3.5 text-neutral-800" />
                ),
                href: "https://linkedin.com",
              },
              {
                label: "Discord",
                component: (
                  <DiscordIcon className="w-3.5 h-3.5 text-neutral-800" />
                ),
                href: "https://discord.com",
              },
              {
                label: "GitHub",
                component: (
                  <GithubIcon className="w-3.5 h-3.5 text-neutral-800" />
                ),
                href: "https://github.com",
              },
              {
                label: "YouTube",
                component: (
                  <YoutubeIcon className="w-3.5 h-3.5 text-neutral-800" />
                ),
                href: "https://youtube.com",
              },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="w-7 h-7 rounded-full bg-[#EAEAEA] hover:bg-[#DCDCDC] text-neutral-800 flex items-center justify-center transition-all active:scale-95"
              >
                {s.component}
              </a>
            ))}
          </div>

          {/* Middle: Legal Policies */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-neutral-600">
            <a href="#terms" className="hover:text-black transition-colors">
              Terms of Service
            </a>
            <a href="#privacy" className="hover:text-black transition-colors">
              Privacy Policy
            </a>
            <a href="#licenses" className="hover:text-black transition-colors">
              Licenses
            </a>
            <a href="#cookies" className="hover:text-black transition-colors">
              Manage Cookies
            </a>
          </div>

          {/* Right: SOC 2 Badge & Copyright */}
          <div className="flex items-center gap-5 flex-wrap justify-center">
            {/* SOC 2 Type II Audited Badge */}
            <div className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#0072CE] text-white flex items-center justify-center font-bold text-[8px] leading-tight shadow-xs text-center border border-[#005fa8]">
                AICPA
                <br />
                SOC
              </div>
              <span className="text-[12px] text-neutral-600 font-medium">
                SOC 2 Type II audited
              </span>
            </div>

            <span className="text-neutral-500">
              © 2026 QuizForge Technologies All Rights Reserved
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
