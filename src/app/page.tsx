"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CAROUSEL_EXAMPLES = [
  {
    lane: "Booking Assistant",
    theme: {
      accent: "#22c55e",
      inquiryText: "text-[#22c55e]",
      userBubble: "border-[#475569] bg-[#475569]",
      clinkBadge: "border-[#22c55e]/50 bg-[#22c55e]/20 text-[#22c55e]",
      clinkBubble: "border-[#22c55e]/40 bg-[#22c55e]/10",
      activeDot: "bg-[#22c55e]",
    },
    asks: ["Any slot tonight?", "Can I book with Anna?", "Need 2 back-to-back slots."],
    replies: ["7:00 PM or 7:45 PM works.", "Yes, Anna is free at 6:30 PM.", "Done - 5:30 PM and 6:15 PM."],
  },
  {
    lane: "FAQ Assistant",
    theme: {
      accent: "#14b8a6",
      inquiryText: "text-[#14b8a6]",
      userBubble: "border-[#475569] bg-[#475569]",
      clinkBadge: "border-[#14b8a6]/50 bg-[#14b8a6]/20 text-[#14b8a6]",
      clinkBubble: "border-[#14b8a6]/40 bg-[#14b8a6]/10",
      activeDot: "bg-[#14b8a6]",
    },
    asks: ["How much is facial cleaning?", "Open on Sunday?", "How long is a treatment?"],
    replies: ["From $88 per session.", "Yes, 10 AM - 4 PM.", "Usually 45 to 60 mins."],
  },
  {
    lane: "Support Assistant",
    theme: {
      accent: "#8b5cf6",
      inquiryText: "text-[#8b5cf6]",
      userBubble: "border-[#475569] bg-[#475569]",
      clinkBadge: "border-[#8b5cf6]/50 bg-[#8b5cf6]/20 text-[#8b5cf6]",
      clinkBubble: "border-[#8b5cf6]/40 bg-[#8b5cf6]/10",
      activeDot: "bg-[#8b5cf6]",
    },
    asks: ["Need to reschedule tomorrow.", "I did not get confirmation.", "Can I cancel now?"],
    replies: ["No problem - new slots: 11 AM or 2 PM.", "Just sent. Please check WhatsApp.", "Yes, cancelled. No fee applied."],
  },
];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(session?.companyId ? "/dashboard" : "/onboarding");
    }
  }, [status, session?.companyId, router]);

  useEffect(() => {
    const timerId = setInterval(() => {
      setActiveCarouselIndex((prev) => (prev + 1) % CAROUSEL_EXAMPLES.length);
    }, 5000);
    return () => clearInterval(timerId);
  }, []);

  const activeExample = CAROUSEL_EXAMPLES[activeCarouselIndex];
  const activeInquiryType = activeExample.lane.replace(" Assistant", "");

  const BOOKING_FEATURES = [
    {
      id: "booking",
      title: "Book appointments directly in chat",
      description: (
        <>
          Guide customers to the right service, suggest available slots, and confirm bookings without leaving WhatsApp or your chat channel.{" "}
          <span className="font-semibold text-[#22c55e]">No external links, no handoffs—just instant conversions.</span>
        </>
      ),
      icon: "calendar",
      visualOrder: "right",
    },
    {
      id: "ai",
      title: "24/7 AI that knows your business",
      description: (
        <>
          Clink automatically learns from your company&apos;s FAQs, services, and policies—so{" "}
          <span className="font-semibold text-[#22c55e]">customers get immediate responses and never drop off waiting.</span>
        </>
      ),
      icon: "brain",
      visualOrder: "left",
    },
    {
      id: "followups",
      title: "Recover leads and nudge repeat visits",
      description: (
        <>
          Automatically follow up on unbooked inquiries, send repeat-visit reminders at the right time, and reactivate inactive customers.{" "}
          <span className="font-semibold text-[#22c55e]">Turn missed chats into bookings.</span>
        </>
      ),
      icon: "megaphone",
      visualOrder: "right",
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
    "relative overflow-hidden rounded-2xl border border-[#334155] bg-[#1e293b] p-8 sm:p-10";

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-8">
        <Link
          className="inline-flex items-center gap-3.5 text-2xl font-semibold tracking-tight text-white sm:text-3xl"
          href="/"
        >
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-[#1e293b]">
            <Image
              src="/logo2.png"
              alt="Clink logo"
              width={44}
              height={44}
              className="h-11 w-11 object-contain brightness-0 invert"
              priority
            />
          </span>
          <span>Clink</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-[#94a3b8] sm:flex">
          <a className="transition-colors hover:text-white" href="#features">
            Features
          </a>
          <a className="transition-colors hover:text-white" href="#">
            Pricing
          </a>
          <a className="transition-colors hover:text-white" href="#">
            Blogs
          </a>
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-[#475569] bg-transparent px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-[#64748b] hover:bg-[#1e293b]"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            Sign In
          </button>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-16 pt-4 sm:gap-10 sm:px-8 sm:pt-10">
        <section className="relative overflow-hidden rounded-2xl border border-[#334155] bg-[#1e293b] p-8 sm:p-10">
          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl sm:leading-[1.1]">
                Turn every chat{" "}
                <span className="text-[#22c55e]">into a booking</span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#94a3b8]">
                Customer agent that converts chats into bookings and repeat customers for
                appointment-based businesses.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-[#22c55e] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#16a34a]"
                  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                >
                  Get Started
                </button>
                <a
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-[#475569] bg-transparent px-5 text-sm font-semibold text-white transition-colors hover:border-[#64748b] hover:bg-[#334155]"
                  href="#contact"
                >
                  Request Demo
                </a>
              </div>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {["Outcome Based Pricing", "Handle 10x more conversations", "24/7 instant access", "No coding required"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[#94a3b8]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#22c55e]/20 text-[#22c55e]">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <article className="chat-animate-in rounded-xl border border-[#334155] bg-[#0f172a] p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-white sm:text-lg">
                  Automate customer{" "}
                  <span className={activeExample.theme.inquiryText}>{activeInquiryType}</span>{" "}
                  inquiries
                </h2>
              </div>

              <div key={activeCarouselIndex} className="mt-4 space-y-3">
                {activeExample.asks.map((ask, index) => (
                  <div key={ask} className="space-y-2">
                    <div
                      className={`chat-msg-user ml-auto w-fit max-w-[92%] rounded-2xl rounded-br-md border px-3 py-2 text-sm text-white ${activeExample.theme.userBubble}`}
                      style={{ animationDelay: `${index * 0.7}s` }}
                    >
                      {ask}
                    </div>
                    <div
                      className="chat-msg-clink relative mt-2 max-w-[92%] pt-3"
                      style={{ animationDelay: `${index * 0.7 + 0.35}s` }}
                    >
                      <span className={`absolute -left-2 top-0 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${activeExample.theme.clinkBadge}`}>
                        Clink
                      </span>
                      <div className={`rounded-2xl rounded-bl-md border px-3 py-2 text-sm text-white ${activeExample.theme.clinkBubble}`}>
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
                        index === activeCarouselIndex ? `w-6 ${example.theme.activeDot}` : "w-2.5 bg-[#475569]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-[#334155] bg-[#1e293b] p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border-l-2 border-[#22c55e] pl-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[#94a3b8]">Trusted By</p>
              <p className="mt-1 text-sm font-medium leading-snug text-white">
                Beauty, Aesthetic, Dental, GP, and Wellness Clinics
              </p>
            </div>
            <div className="border-l-2 border-[#22c55e] pl-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[#94a3b8]">Built For</p>
              <p className="mt-1 text-sm font-medium leading-snug text-white">
                SMBs using WhatsApp, Telegram, or Chat based Booking Management
              </p>
            </div>
            <div className="border-l-2 border-[#22c55e] pl-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[#94a3b8]">Designed To</p>
              <p className="mt-1 text-sm font-medium leading-snug text-white">
                Provide 24/7 instant access and responses to your customers
              </p>
            </div>
            <div className="border-l-2 border-[#22c55e] pl-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[#94a3b8]">Focused On</p>
              <p className="mt-1 text-sm font-medium leading-snug text-white">
                Increasing customer booking
              </p>
            </div>
          </div>
        </section>

        <section className={sectionClass} id="features">
          <header className="relative">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Everything you need to{" "}
              <span className="text-[#22c55e]">increase customer bookings</span>
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#94a3b8]">
              Three powerful ways to convert more chats into confirmed appointments.
            </p>
          </header>

          <div className="relative mt-8 space-y-6 sm:mt-10 sm:space-y-7">
            {BOOKING_FEATURES.map((feature) => (
              <article
                key={feature.id}
                className={`rounded-2xl border border-[#334155] bg-[#0f172a] p-6 sm:p-8 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:p-10 ${
                  feature.visualOrder === "left" ? "lg:[&>div:first-child]:order-2 lg:[&>div:last-child]:order-1" : ""
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#22c55e]/20 text-[#22c55e]">
                      {feature.icon === "calendar" && (
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
                          <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" strokeWidth="1.8" />
                          <path d="M7 3.5v4M17 3.5v4M3.5 10.5h17" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      )}
                      {feature.icon === "brain" && (
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
                          <path d="M12 2.5 14.7 9.3l6.8 2.7-6.8 2.7-2.7 6.8-2.7-6.8-6.8-2.7 6.8-2.7L12 2.5Z" strokeWidth="1.8" strokeLinejoin="round" />
                        </svg>
                      )}
                      {feature.icon === "megaphone" && (
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current">
                          <path d="M3 11l4-4h2l10 10v-6l4-4v12l-4-4h-2L3 11z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="max-w-xl text-sm leading-[1.7] text-[#94a3b8] sm:text-base">{feature.description}</p>
                </div>

                <div className="rounded-xl border border-[#334155] bg-[#0f172a] p-6">
                  {feature.id === "booking" && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="ml-auto w-fit max-w-[92%] rounded-2xl rounded-br-md border border-[#334155] bg-[#1e293b] px-3 py-2 text-sm text-white">
                          Any slot tonight?
                        </div>
                        <div className="relative mt-2 max-w-[92%] pt-3">
                          <span className="absolute -left-2 top-0 inline-flex items-center gap-1 rounded-full border border-[#22c55e]/50 bg-[#334155] px-2 py-0.5 text-[10px] font-semibold text-[#22c55e]">
                            Clink
                          </span>
                          <div className="rounded-2xl rounded-bl-md border border-[#334155] bg-[#1e293b] px-3 py-2 text-sm text-white">
                            7:00 PM or 7:45 PM works. Which do you prefer?
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="ml-auto w-fit max-w-[92%] rounded-2xl rounded-br-md border border-[#334155] bg-[#1e293b] px-3 py-2 text-sm text-white">
                          7 PM please
                        </div>
                        <div className="relative mt-2 max-w-[92%] pt-3">
                          <span className="absolute -left-2 top-0 inline-flex items-center gap-1 rounded-full border border-[#22c55e]/50 bg-[#334155] px-2 py-0.5 text-[10px] font-semibold text-[#22c55e]">
                            Clink
                          </span>
                          <div className="rounded-2xl rounded-bl-md border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-2 text-sm font-medium text-[#22c55e]">
                            Done. You&apos;re booked for 7:00 PM today.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {feature.id === "ai" && (
                    <div className="space-y-4">
                      <div className="ml-auto w-fit max-w-[92%] rounded-2xl rounded-br-md border border-[#334155] bg-[#1e293b] px-3 py-2 text-sm text-white">
                        How much is facial cleaning?
                      </div>
                      <div className="relative mt-2 max-w-[92%] pt-3">
                        <span className="absolute -left-2 top-0 inline-flex items-center gap-1 rounded-full border border-[#22c55e]/50 bg-[#334155] px-2 py-0.5 text-[10px] font-semibold text-[#22c55e]">
                          Clink
                        </span>
                        <div className="rounded-2xl rounded-bl-md border border-[#334155] bg-[#1e293b] px-3 py-2 text-sm text-white">
                          Facial cleaning starts from $88 per session. I can check availability if you&apos;d like to book.
                        </div>
                      </div>
                    </div>
                  )}
                  {feature.id === "followups" && (
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-white">Follow-up Campaigns</p>
                      <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-4">
                        <p className="text-3xl font-bold tracking-tight text-white">127</p>
                        <p className="mt-0.5 text-xs font-medium text-[#94a3b8]">of 180 follow-ups sent this week</p>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#334155]">
                          <div className="h-full w-[70%] rounded-full bg-[#22c55e]" />
                        </div>
                      </div>
                      <p className="text-xs font-medium text-[#94a3b8]">
                        Unbooked leads · Repeat reminders
                      </p>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={sectionClass} id="how-it-works">
          <h2 className="relative text-3xl font-semibold tracking-tight text-white">
            Get Started in <span className="text-[#22c55e]">Minutes</span>
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {steps.map((item) => (
              <div key={item.step} className="rounded-2xl border border-[#334155] bg-[#0f172a] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#22c55e]">
                  {item.step}
                </p>
                <p className="mt-2 text-base font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm text-[#94a3b8]">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer
        className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-6 pb-8 text-sm text-[#94a3b8] sm:flex-row sm:items-center sm:px-8"
        id="contact"
      >
        <p>© {new Date().getFullYear()} Clink. Built for appointment-based businesses.</p>
      </footer>
    </div>
  );
}
