import Link from "next/link";
import React from "react";
import { DK_EMAIL, DK_PHONE_DISPLAY, DK_PHONE_TEL } from "../../lib/dk/siteContent";

export default function DkFooter() {
  return (
    <footer className="mt-16 border-t border-black/5 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="text-lg font-bold text-primary">veveve</div>
          <p className="mt-2 text-sm text-gray-600">
            Personlig performance marketing for danske virksomheder.
          </p>
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-900">Kontakt</div>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>
              <a className="hover:text-primary transition-colors" href={`mailto:${DK_EMAIL}`}>
                {DK_EMAIL}
              </a>
            </li>
            {DK_PHONE_DISPLAY && DK_PHONE_TEL && (
              <li>
                <a className="hover:text-primary transition-colors" href={DK_PHONE_TEL}>
                  {DK_PHONE_DISPLAY}
                </a>
              </li>
            )}
            <li>Danmark</li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-900">Links</div>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>
              <Link className="hover:text-primary transition-colors" href="/ydelser">
                Ydelser
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary transition-colors" href="/priser">
                Priser
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary transition-colors" href="/cases">
                Cases
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary transition-colors" href="/kontakt">
                Kontakt
              </Link>
            </li>
            <li>
              <a className="hover:text-primary transition-colors" href="https://veveve.io">
                veveve.io (platform)
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-black/5 py-6">
        <p className="text-center text-xs text-gray-500">
          © {new Date().getFullYear()} veveve. Alle rettigheder forbeholdes.
        </p>
      </div>
    </footer>
  );
}

