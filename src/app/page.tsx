"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const CAROUSEL_EXAMPLES = [
  {
    lane: "Booking Assistant",
    theme: {
      inquiryText: "text-[#2a86b2]",
      aiBadge: "border-[#b9d9ee] text-[#236a93]",
      replyBubble: "border-[#cfe0eb] bg-[#eef6fb]",
      activeDot: "bg-[#2a86b2]",
    },
    asks: ["Any slot tonight?", "Can I book with Anna?", "Need 2 back-to-back slots."],
    replies: ["7:00 PM or 7:45 PM works.", "Yes, Anna is free at 6:30 PM.", "Done - 5:30 PM and 6:15 PM."],
  },
  {
    lane: "FAQ Assistant",
    theme: {
      inquiryText: "text-[#1f7a55]",
      aiBadge: "border-[#b8e9d0] text-[#1f7a55]",
      replyBubble: "border-[#cbe8da] bg-[#eef9f2]",
      activeDot: "bg-[#1f7a55]",
    },
    asks: ["How much is facial cleaning?", "Open on Sunday?", "How long is a treatment?"],
    replies: ["From $88 per session.", "Yes, 10 AM - 4 PM.", "Usually 45 to 60 mins."],
  },
  {
    lane: "Support Assistant",
    theme: {
      inquiryText: "text-[#5b63b5]",
      aiBadge: "border-[#d8dcf8] text-[#5b63b5]",
      replyBubble: "border-[#dfe2f8] bg-[#f3f5ff]",
      activeDot: "bg-[#5b63b5]",
    },
    asks: ["Need to reschedule tomorrow.", "I did not get confirmation.", "Can I cancel now?"],
    replies: ["No problem - new slots: 11 AM or 2 PM.", "Just sent. Please check WhatsApp.", "Yes, cancelled. No fee applied."],
  },
];

export default function Home() {
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);

  useEffect(() => {
    const timerId = setInterval(() => {
      setActiveCarouselIndex((prev) => (prev + 1) % CAROUSEL_EXAMPLES.length);
    }, 5000);
    return () => clearInterval(timerId);
  }, []);

  const activeExample = CAROUSEL_EXAMPLES[activeCarouselIndex];
  const activeInquiryType = activeExample.lane.replace(" Assistant", "");

  const journeyStages = [
    {
      title: "For Front Desk",
      description:
        "Handle repetitive questions automatically and escalate complex conversations to your team only when needed.",
      icon: "chat",
    },
    {
      title: "For Bookings",
      description:
        "Guide customers to the right service, suggest best-fit slots, and confirm bookings directly in chat.",
      icon: "calendar",
    },
    {
      title: "For Growth",
      description:
        "Follow up on unbooked leads, nudge repeat visits at the right time, and improve retention over time.",
      icon: "chart",
    },
  ];

  const steps = [
    {
      step: "Step 1",
      title: "Connect your channels",
      text: "Link existing Business WhatsApp, Instagram, and web chat accounts in a few clicks.",
    },
    {
      step: "Step 2",
      title: "Set your booking rules",
      text: "Define services, staff schedules, and booking policies once.",
    },
    {
      step: "Step 3",
      title: "Go live with Clink",
      text: "Start converting conversations into bookings from day one.",
    },
  ];

  const sectionClass =
    "relative overflow-hidden rounded-[28px] border border-border/70 bg-card/90 p-8 shadow-[0_20px_55px_-28px_rgba(28,61,88,0.28)] backdrop-blur sm:p-10";
  const heroClass =
    "relative overflow-hidden rounded-[30px] border border-border/70 bg-[linear-gradient(140deg,#ffffff_0%,#f4f9fd_58%,#edf5fb_100%)] p-8 shadow-[0_26px_70px_-30px_rgba(23,65,98,0.25)] sm:p-10";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e8f1f9_0%,#f1f5f9_44%,#f1f5f9_100%)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#cde2f1] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-64 h-80 w-80 rounded-full bg-[#bddbe9] blur-3xl"
      />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-8">
        <Link
          className="inline-flex items-center gap-3.5 text-4xl font-semibold tracking-tight text-foreground"
          href="/"
        >
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl border border-[#bdd5e6] bg-[#eef5fb] shadow-sm">
            <Image
              src="/logo2.png"
              alt="Clink logo"
              width={46}
              height={46}
              className="h-11 w-11 object-contain mix-blend-multiply"
              priority
            />
          </span>
          <span>Clink</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted sm:flex">
          <a className="hover:text-foreground" href="#features">
            Features
          </a>
          <a className="hover:text-foreground" href="#">
            Pricing
          </a>
          <a className="hover:text-foreground" href="#">
            Blogs
          </a>
          <a className="hover:text-foreground" href="#">
            Sign In
          </a>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-16 pt-4 sm:gap-10 sm:px-8 sm:pt-10">
        <section className={heroClass}>
          <div
            aria-hidden
            className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#b7ffe0]/70 blur-3xl"
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-6xl sm:leading-[1.02]">
                Turn every chat into a booking
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
                Customer agent that converts chats into bookings and repeat customers for
                appointment-based businesses.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-ink shadow-[0_12px_24px_-14px_rgba(47,142,169,0.75)] hover:brightness-95"
                  href="#contact"
                >
                  Get Started
                </a>
                <a
                  className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-white px-5 text-sm font-semibold text-foreground hover:bg-surface"
                  href="#contact"
                >
                  Request Demo
                </a>
              </div>
            </div>

            <article className="rounded-3xl border border-[#c9dae7] bg-white/95 p-5 shadow-[0_20px_50px_-28px_rgba(18,62,91,0.55)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground sm:text-lg">
                  Automate customer{" "}
                  <span className={activeExample.theme.inquiryText}>{activeInquiryType}</span>{" "}
                  inquiries
                </h2>
              </div>

              <div className="mt-4 space-y-3">
                {activeExample.asks.map((ask, index) => (
                  <div key={ask} className="space-y-2">
                    <div className="ml-auto w-fit max-w-[92%] rounded-2xl rounded-br-md border border-border bg-[#f8fbfe] px-3 py-2 text-sm text-foreground shadow-sm">
                      {ask}
                    </div>
                    <div className="relative mt-2 max-w-[92%] pt-3">
                      <span
                        className={`absolute -left-2 top-0 inline-flex items-center gap-1 rounded-full border bg-white px-1.5 py-0.5 text-[10px] font-semibold shadow-sm ${activeExample.theme.aiBadge}`}
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-current">
                          <path d="M12 2.5 14.7 9.3l6.8 2.7-6.8 2.7-2.7 6.8-2.7-6.8-6.8-2.7 6.8-2.7L12 2.5Z" />
                        </svg>
                        Clink
                      </span>
                      <div
                        className={`rounded-2xl rounded-bl-md border px-3 py-2 text-sm text-foreground shadow-sm ${activeExample.theme.replyBubble}`}
                      >
                        {activeExample.replies[index]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex justify-end">
                <div className="flex items-center gap-1.5">
                  {CAROUSEL_EXAMPLES.map((example, index) => (
                    <button
                      key={example.lane}
                      type="button"
                      aria-label={`Show ${example.lane}`}
                      onClick={() => setActiveCarouselIndex(index)}
                      className={`h-2.5 rounded-full transition-all ${
                        index === activeCarouselIndex
                          ? `w-6 ${activeExample.theme.activeDot}`
                          : "w-2.5 bg-[#b6cede]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="grid gap-3 rounded-3xl border border-border/70 bg-card/85 p-4 shadow-[0_12px_30px_-22px_rgba(34,72,58,0.45)] sm:grid-cols-4 sm:p-5">
          <div className="rounded-2xl border border-[#d8b8ff]/70 bg-[linear-gradient(130deg,#ffffff_0%,#f5edff_100%)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6e3fa1]">Trusted By</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              Beauty, Aesthetic, Dental, GP, and Wellness Clinics
            </p>
          </div>
          <div className="rounded-2xl border border-[#96d8ff]/70 bg-[linear-gradient(130deg,#ffffff_0%,#eaf7ff_100%)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1f6e96]">Built For</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              SMBs using WhatsApp, Telegram, or Chat based Booking Management
            </p>
          </div>
          <div className="rounded-2xl border border-[#a7efcf]/70 bg-[linear-gradient(130deg,#ffffff_0%,#eafbf2_100%)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1f7a55]">Designed To</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              Provide 24/7 instant access and responses to your customers
            </p>
          </div>
          <div className="rounded-2xl border border-[#ffd2a8]/70 bg-[linear-gradient(130deg,#ffffff_0%,#fff3e8_100%)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9b5c1d]">Focused On</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              Increasing customer booking
            </p>
          </div>
        </section>

        <section className={sectionClass} id="use-cases">
          <div
            aria-hidden
            className="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-secondary/30 blur-3xl"
          />
          <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Streamline front office work, so you can focus on your business
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-muted sm:text-base">
              From first inquiry to repeat visit, Clink helps teams move faster, reduce manual
              work, and increase conversion at every step.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {journeyStages.map((item) => (
              <article
                key={item.title}
                className="group rounded-2xl border border-border bg-[linear-gradient(145deg,#ffffff_0%,#f2f7fb_100%)] p-5 shadow-[0_14px_30px_-24px_rgba(22,60,88,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_35px_-24px_rgba(22,60,88,0.55)]"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#bcd4e3] bg-[#eaf3f9] text-[#2f6f93]">
                  {item.icon === "chat" && (
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
                      <path d="M4 5h16v10H8l-4 4V5Z" strokeWidth="1.8" strokeLinejoin="round" />
                    </svg>
                  )}
                  {item.icon === "calendar" && (
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
                      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" strokeWidth="1.8" />
                      <path d="M7 3.5v4M17 3.5v4M3.5 10.5h17" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  )}
                  {item.icon === "chart" && (
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
                      <path d="M4 18h16M7 15v3M12 11v7M17 8v10" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={sectionClass} id="how-it-works">
          <div
            aria-hidden
            className="absolute -left-12 -top-20 h-52 w-52 rounded-full bg-secondary/35 blur-3xl"
          />
          <h2 className="relative text-3xl font-semibold tracking-tight text-foreground">
            Simple by Design
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {steps.map((item) => (
              <div key={item.step} className="rounded-2xl border border-border bg-surface/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary-ink">
                  {item.step}
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">{item.title}</p>
                <p className="mt-2 text-sm text-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer
        className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-6 pb-8 text-sm text-muted sm:flex-row sm:items-center sm:px-8"
        id="contact"
      >
        <p>© {new Date().getFullYear()} Clink. Built for appointment-based businesses.</p>
      </footer>
    </div>
  );
}
