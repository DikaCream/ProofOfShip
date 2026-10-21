import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Saira_Stencil } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SITE_URL } from "@/lib/config";
import { Header } from "@/components/Header";
import { PendingTxs } from "@/components/PendingTxs";

const stencil = Saira_Stencil({ subsets: ["latin"], weight: "700", variable: "--font-stencil", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-plex", display: "swap" });

const title = "ProofOfShip: build commitments judged by AI validators";
const description =
  "Builders post public commitments with locked acceptance criteria and a points stake. At the deadline GenLayer validators read the proof and rule SHIPPED, PARTIAL or NOT SHIPPED, criterion by criterion.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  applicationName: "ProofOfShip",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
  openGraph: { type: "website", url: "/", siteName: "ProofOfShip", title, description },
};

export const viewport: Viewport = { themeColor: "#141210" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${stencil.variable} ${archivo.variable} ${plex.variable}`}>
      <body>
        <Providers>
          <Header />
          <div className="mx-auto max-w-[1180px] px-3 pb-16 sm:px-6">
            <PendingTxs />
            <main>{children}</main>
            <footer className="mt-16">
              <div className="hazard-thin" />
              <p className="mt-3 mono text-[12px] text-ink-2">
                ProofOfShip runs on GenLayer Studionet (a temporary test network). Points are non-monetary test units with no value.
                Verdicts are produced by AI validators reading public pages and can be wrong; see <a className="link" href="/rules">Rules &amp; trust</a>.
              </p>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
