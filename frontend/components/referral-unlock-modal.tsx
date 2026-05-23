"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type ReferralUnlockModalProps = {
  isOpen: boolean;
  onClose: () => void;
  referralCount: number;
  referralTarget?: number;
  referralLink: string;
};

function copyWithExecCommand(text: string): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "true");
  textArea.setAttribute("aria-hidden", "true");
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  textArea.style.left = "-9999px";
  textArea.style.opacity = "0";
  textArea.style.pointerEvents = "none";
  document.body.appendChild(textArea);

  const activeElement = document.activeElement as HTMLElement | null;
  const selection = document.getSelection();
  const previousRanges: Range[] = [];
  if (selection && selection.rangeCount > 0) {
    for (let index = 0; index < selection.rangeCount; index += 1) {
      previousRanges.push(selection.getRangeAt(index).cloneRange());
    }
  }

  let copied = false;
  try {
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);

    const isIOS =
      typeof navigator !== "undefined" && /ipad|iphone|ipod/i.test(navigator.userAgent);
    if (isIOS && selection) {
      const range = document.createRange();
      range.selectNodeContents(textArea);
      selection.removeAllRanges();
      selection.addRange(range);
      textArea.setSelectionRange(0, textArea.value.length);
    }

    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    if (selection) {
      selection.removeAllRanges();
      previousRanges.forEach((range) => selection.addRange(range));
    }
    if (activeElement && typeof activeElement.focus === "function") {
      activeElement.focus();
    }
    if (textArea.parentNode) {
      textArea.parentNode.removeChild(textArea);
    }
  }

  return copied;
}

async function copyTextSafely(text: string): Promise<boolean> {
  if (!text) {
    return false;
  }

  if (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function" &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back to execCommand for restricted mobile/network contexts.
    }
  }

  return copyWithExecCommand(text);
}

type CopyStatus = "idle" | "copied" | "error";

export function ReferralUnlockModal({
  isOpen,
  onClose,
  referralCount,
  referralTarget = 5,
  referralLink
}: ReferralUnlockModalProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const linkInputRef = useRef<HTMLInputElement>(null);
  const safeCount = Number.isFinite(referralCount) ? Math.max(0, referralCount) : 0;
  const progressPercent = useMemo(
    () => Math.min(100, (safeCount / referralTarget) * 100),
    [referralTarget, safeCount]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (copyStatus !== "copied") {
      return;
    }
    const timeoutId = window.setTimeout(() => setCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copyStatus]);

  const handleCopyLink = async () => {
    const copied = await copyTextSafely(referralLink);
    if (copied) {
      setCopyStatus("copied");
      return;
    }

    if (linkInputRef.current) {
      linkInputRef.current.focus();
      linkInputRef.current.select();
    }
    setCopyStatus("error");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#020714]/70 px-4 py-6 backdrop-blur-sm"
        >
          <motion.section
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 250, damping: 25 }}
            className="relative w-full max-w-md rounded-3xl border border-blue-300/30 bg-[linear-gradient(165deg,#090f2e_0%,#0a1538_48%,#141138_100%)] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-300/30 bg-blue-500/10 text-slate-200 transition hover:bg-blue-500/20"
            >
              X
            </button>

            <div className="pr-8">
              <h3 className="text-xl font-bold leading-tight text-white">
                Unlock Premium Live Feed for FREE! 🚀
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                See exactly who Kissed, Married, or Killed you in your area. Invite 5 friends to
                register via your unique link to instantly unlock the feed!
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-300/20 bg-[#071537]/80 p-3">
              <div className="flex items-center justify-between gap-3 text-xs text-slate-200">
                <span>Referral Progress</span>
                <span className="font-semibold text-cyan-200">
                  {safeCount} / {referralTarget} Friends Joined.
                </span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-900/70">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 shadow-[0_0_18px_rgba(96,165,250,0.65)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                />
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200/80">
                Your Unique Invite Link
              </p>
              <div className="flex items-center gap-2">
                <input
                  ref={linkInputRef}
                  type="text"
                  readOnly
                  value={referralLink}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-blue-300/20 bg-[#071535] px-3 text-xs text-slate-100 outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    void handleCopyLink();
                  }}
                  disabled={!referralLink}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/40 bg-gradient-to-r from-cyan-500/25 to-blue-500/35 px-3 text-xs font-semibold text-cyan-100 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {copyStatus === "copied"
                    ? "Copied!"
                    : copyStatus === "error"
                      ? "Tap and hold to copy"
                      : "Copy Invite Link"}
                </button>
              </div>
              {copyStatus === "error" ? (
                <p className="mt-2 text-[11px] text-amber-200">
                  Your browser blocked automatic copy. Long-press the link field and copy manually.
                </p>
              ) : null}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
