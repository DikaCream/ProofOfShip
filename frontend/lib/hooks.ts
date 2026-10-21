"use client";

import { useCallback, useEffect, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { CONTRACT_ADDRESS } from "./config";
import {
  getBackers, getBuilderCommitments, getBuilders, getCommitment, getCommitments, getLedger, getRounds, getSnapshots,
  getStats, getUser, sendTx, TxError, type TxOptions, type TxResult,
} from "./pos";
import { getProvider } from "./wallet";
import { useWallet } from "./WalletProvider";

const enabled = !!CONTRACT_ADDRESS;

export const PAGE_SIZE = 20;

/** Newest-first board, one bounded page at a time ("Load more" walks the whole history). */
export const useCommitments = (status: string) =>
  useInfiniteQuery({
    queryKey: ["pos", "list", status],
    queryFn: ({ pageParam }) => getCommitments(status, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.next_offset >= 0 ? last.next_offset : undefined),
    enabled,
    refetchInterval: 30_000,
  });

export const useBuilderCommitments = (builder: string) =>
  useInfiniteQuery({
    queryKey: ["pos", "builder-list", builder],
    queryFn: ({ pageParam }) => getBuilderCommitments(builder, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.next_offset >= 0 ? last.next_offset : undefined),
    enabled: enabled && !!builder,
  });

export const useBuilders = () =>
  useInfiniteQuery({
    queryKey: ["pos", "builders"],
    queryFn: ({ pageParam }) => getBuilders(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.next_offset >= 0 ? last.next_offset : undefined),
    enabled,
  });

export const useCommitment = (id: number | null) =>
  useQuery({ queryKey: ["pos", "c", id], queryFn: () => getCommitment(id as number), enabled: enabled && id !== null, refetchInterval: 8_000 });
export const useRounds = (id: number | null, n: number) =>
  useQuery({ queryKey: ["pos", "rounds", id, n], queryFn: () => getRounds(id as number), enabled: enabled && id !== null && n > 0 });
export const useSnapshots = (id: number | null, key: string) =>
  useQuery({ queryKey: ["pos", "snaps", id, key], queryFn: () => getSnapshots(id as number), enabled: enabled && id !== null && key !== "" });
export const useBackers = (id: number | null, n: number) =>
  useQuery({ queryKey: ["pos", "backers", id, n], queryFn: () => getBackers(id as number), enabled: enabled && id !== null && n > 0 });
export const useLedger = () => useQuery({ queryKey: ["pos", "ledger"], queryFn: getLedger, enabled, refetchInterval: 60_000 });

export const useUser = (user: string | null) =>
  useQuery({ queryKey: ["pos", "user", user], queryFn: () => getUser(user as string), enabled: enabled && !!user, refetchInterval: 20_000 });

export const useStats = () => useQuery({ queryKey: ["pos", "stats"], queryFn: getStats, enabled, refetchInterval: 15_000 });

/** Re-renders every `ms` so countdowns stay live. */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** Runs one contract write with live consensus status; refreshes all queries afterwards. */
export function useTx() {
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (functionName: string, args: unknown[], opts?: TxOptions): Promise<TxResult | null> => {
      const provider = getProvider();
      if (!address || !provider) {
        setError("Connect MetaMask first");
        return null;
      }
      setBusy(true);
      setError(null);
      setHash(null);
      setStatus("SIGNING");
      try {
        return await sendTx(address, provider, functionName, args, { onHash: setHash, onStatus: setStatus }, opts);
      } catch (e: any) {
        if (e instanceof TxError && e.hash) setHash(e.hash);
        setError(friendlyError(e));
        return null;
      } finally {
        setBusy(false);
        queryClient.invalidateQueries({ queryKey: ["pos"] });
      }
    },
    [address, queryClient],
  );

  // Hold the busy flag for the whole operation (also across re-renders) so a second click cannot double-submit.
  const reset = useCallback(() => {
    setStatus(null);
    setHash(null);
    setError(null);
  }, []);

  return { run, status, hash, error, busy, reset };
}

export function friendlyError(e: any): string {
  if (e?.code === 4001 || /user rejected|denied/i.test(e?.message ?? "")) {
    if (!(e instanceof TxError)) return "Transaction was rejected in your wallet";
  }
  return e?.shortMessage || e?.message || "Something went wrong";
}
