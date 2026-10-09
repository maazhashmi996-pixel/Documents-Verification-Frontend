import Link from 'next/link';
import React from 'react';
import { ArrowRight, GraduationCap, School, ShieldCheck } from 'lucide-react';
import Seal from '@/Components/Seal';
import VerifyLookup from '@/Components/VerifyLookup';
import { ROLES, RoleKey } from '@/lib/roles';

const icons = { student: GraduationCap, university: School, admin: ShieldCheck };
const order: RoleKey[] = ['student', 'university', 'admin'];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Seal size={640} color="#b8924a" className="absolute -right-48 -top-40 opacity-[0.07] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 sm:px-10 py-8 md:py-10">
        <header className="flex items-center gap-3">
          <Seal size={36} color="#b8924a" />
          <span className="font-display text-xl font-semibold text-ink">Qual Check</span>
        </header>

        <section className="mt-16 md:mt-24 max-w-2xl">
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1.08] text-ink">
            Academic credentials, verified at the source.
          </h1>
          <p className="mt-6 text-lg text-ink-soft leading-relaxed max-w-xl">
            Pick the portal that matches your account. Each one has its own sign in, and an account can only be used on its own card.
          </p>
        </section>

        <section className="mt-14 md:mt-20 grid gap-6 md:grid-cols-3">
          {order.map((key, i) => {
            const role = ROLES[key];
            const Icon = icons[key];
            const vars = {
              '--accent': role.accent,
              '--accent-deep': role.accentDeep,
              '--accent-soft': role.soft,
              animationDelay: `${i * 90}ms`,
            } as React.CSSProperties;

            return (
              <article
                key={key}
                style={vars}
                className="settle flex flex-col bg-white border border-line rounded-3xl p-8 shadow-[0_24px_60px_-34px_rgba(15,27,51,0.3)] transition-shadow hover:shadow-[0_30px_70px_-30px_rgba(15,27,51,0.38)]"
              >
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: role.soft, color: role.accentDeep }}>
                  <Icon size={26} />
                </span>

                <h2 className="font-display text-2xl text-ink mt-6">{role.title}</h2>
                <p className="text-ink-soft leading-relaxed mt-2 flex-1">{role.blurb}</p>

                <Link
                  href={`/login/${key}`}
                  className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl font-semibold text-white transition hover:brightness-110 active:scale-[0.99]"
                  style={{ background: role.solid }}
                >
                  Sign in as {role.title.toLowerCase()}
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href={`/signup/${key}`}
                  className="mt-3 inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold border border-line text-ink hover:border-[var(--accent)] hover:text-[var(--accent-deep)] transition"
                >
                  Create {role.article} {role.title.toLowerCase()} account
                </Link>
              </article>
            );
          })}
        </section>

        <section className="mt-6">
          <VerifyLookup />
        </section>

        <footer className="mt-16 pb-6 text-sm text-ink-soft">
          Qual Check document verification portal
        </footer>
      </div>
    </main>
  );
}
