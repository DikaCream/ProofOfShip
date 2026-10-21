"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONTRACT_ADDRESS, addressExplorerUrl, START_POINTS } from "@/lib/config";
import { pts, shortAddress } from "@/lib/format";
import { useTx, useUser } from "@/lib/hooks";
import { getUser } from "@/lib/pos";
import { useWallet } from "@/lib/WalletProvider";
import { TxLog } from "./ui";

const NAV = [
  { href: "/", label: "Departures" },
  { href: "/new", label: "Book cargo" },
  { href: "/builders", label: "Crews" },
  { href: "/rules", label: "Rules & trust" },
];

export function Header() {
  const path = usePathname();
  const w = useWallet();
  const user = useUser(w.address);
  const tx = useTx();
  const needsPoints = !!w.address && user.data && !user.data.claimed;
  return (
    <header>
      <div className="hazard-thin" />
      <div className="flex flex-wrap items-center justify-between gap-3 bg-ink px-4 py-2 text-label">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="stencil text-2xl text-hazard sm:text-3xl">Proof of Ship</span>
          <span className="hidden mono text-[11px] tracking-[.2em] text-label/70 sm:inline">LAUNCH CONTROL · STUDIONET 61999</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2 mono text-[12px]">
          {w.address && user.data && <span className="border-2 border-hazard px-2 py-0.5 text-hazard">{pts(user.data.balance)} pts</span>}
          {needsPoints && (
            <button className="btn !px-3 !py-1" disabled={tx.busy}
              onClick={() => tx.run("claim_points", [], { key: "claim_points", verify: async () => ((await getUser(w.address as string)).claimed ? null : "points not credited") })}>
              Claim {pts(START_POINTS)} pts
            </button>
          )}
          {w.address && !w.isCorrectChain && <button className="btn btn-safety !px-3 !py-1" onClick={w.switchChain}>Switch to Studionet</button>}
          {w.address ? (
            <span className="flex items-center gap-2">
              <Link className="link" href={`/builder/${w.address}`}>{shortAddress(w.address)}</Link>
              <button className="opacity-70 hover:opacity-100" onClick={w.disconnect} title="Disconnect">✕</button>
            </span>
          ) : (
            <button className="btn !px-3 !py-1" onClick={w.connect} disabled={w.isConnecting}>
              {w.isConnecting ? "Connecting…" : w.isMetaMaskAvailable ? "Connect MetaMask" : "Install MetaMask"}
            </button>
          )}
        </div>
      </div>
      <nav className="flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-ink bg-label/85 px-2">
        <div className="flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              className={`stencil border-r-2 border-ink px-3 py-2 text-[15px] ${path === n.href ? "bg-hazard" : "hover:bg-hazard/40"}`}>
              {n.label}
            </Link>
          ))}
        </div>
        {CONTRACT_ADDRESS && (
          <a className="mono text-[11px] link pr-2" href={addressExplorerUrl(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer">
            contract {shortAddress(CONTRACT_ADDRESS)}
          </a>
        )}
      </nav>
      {w.error && <p className="bg-halt px-3 py-1 mono text-[12px] text-label">{w.error}</p>}
      {(tx.status || tx.error) && <div className="mx-auto max-w-[1180px] px-3"><TxLog status={tx.status} hash={tx.hash} error={tx.error} /></div>}
    </header>
  );
}

