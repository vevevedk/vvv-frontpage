import Link from "next/link";
import React from "react";

type Props = {
  title: string;
  text?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export default function CtaBlock({
  title,
  text,
  primaryHref = "/kontakt#lead-form",
  primaryLabel = "Book et møde",
  secondaryHref,
  secondaryLabel,
}: Props) {
  return (
    <section className="bg-primary">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {text && <p className="mt-2 text-white/90">{text}</p>}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={primaryHref}
            className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary hover:bg-white/90 transition-colors"
          >
            {primaryLabel}
          </Link>
          {secondaryHref && secondaryLabel && (
            <Link
              href={secondaryHref}
              className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

