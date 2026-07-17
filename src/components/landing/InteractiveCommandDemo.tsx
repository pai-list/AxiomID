"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/context/language-context";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Wallet, Shield, Rocket } from "lucide-react";

interface LogEntry {
  text: string;
  type: "input" | "output" | "success" | "info";
}

function typeText(
  fullText: string,
  onChar: (t: string) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    let i = 0;
    const speed = 15 + Math.random() * 25;
    const interval = setInterval(() => {
      i++;
      onChar(fullText.slice(0, i));
      if (i >= fullText.length || signal?.aborted) {
        clearInterval(interval);
        resolve();
      }
    }, speed);

    signal?.addEventListener("abort", () => {
      clearInterval(interval);
      resolve();
    });
  });
}

export default function InteractiveCommandDemo() {
  const { t } = useLanguage();

  const COMMANDS = [
    {
      id: "connect",
      icon: Wallet,
      label: t("command_connect"),
      output: [
        { text: t("command_connect_output1"), type: "info" as const },
        { text: t("command_connect_output2"), type: "success" as const },
        { text: t("command_connect_output3"), type: "success" as const },
        { text: t("command_connect_output4"), type: "output" as const },
      ],
    },
    {
      id: "verify",
      icon: Shield,
      label: t("command_verify"),
      output: [
        { text: t("command_verify_output1"), type: "info" as const },
        { text: t("command_verify_output2"), type: "success" as const },
        { text: t("command_verify_output3"), type: "success" as const },
        { text: t("command_verify_output4"), type: "output" as const },
      ],
    },
    {
      id: "deploy",
      icon: Rocket,
      label: t("command_deploy"),
      output: [
        { text: t("command_deploy_output1"), type: "info" as const },
        { text: t("command_deploy_output2"), type: "success" as const },
        { text: t("command_deploy_output3"), type: "success" as const },
        { text: t("command_deploy_output4"), type: "output" as const },
        { text: t("command_deploy_output5"), type: "info" as const },
      ],
    },
  ];

  const [activeStep, setActiveStep] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>(() => [
    {
      text: t("command_initial_log"),
      type: "output" as const,
    },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentOutput, setCurrentOutput] = useState<LogEntry[]>([]);
  const [showCursor, setShowCursor] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const cursor = setInterval(() => setShowCursor((p) => !p), 530);
    return () => {
      clearInterval(cursor);
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, currentOutput]);

  const runCommand = async (index: number) => {
    if (isRunning || index > activeStep) return;
    setIsRunning(true);

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    const cmd = COMMANDS[index];
    setLogs((prev) => [...prev, { text: `$ ${cmd.label}`, type: "input" as const }].slice(-100));

    const outputLines: LogEntry[] = [];
    for (const line of cmd.output) {
      if (signal.aborted) break;
      const entry: LogEntry = { text: "", type: line.type };
      outputLines.push(entry);
      setCurrentOutput([...outputLines]);
      await typeText(
        line.text,
        (tText) => {
          if (!signal.aborted) {
            entry.text = tText;
            setCurrentOutput([...outputLines]);
          }
        },
        signal
      );
      if (signal.aborted) break;
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 150);
        signal.addEventListener("abort", () => clearTimeout(timeout));
      });
    }

    if (!signal.aborted) {
      setCurrentOutput([]);
      setLogs((prev) => [...prev, ...outputLines].slice(-100));
      setActiveStep((prev) => Math.min(prev + 1, COMMANDS.length));
      setIsRunning(false);
    }
  };

  const allDone = activeStep >= COMMANDS.length;

  return (
    <div className="w-full">
      {/* Top section: heading + command buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-[10px] font-mono text-electric-blue uppercase tracking-[0.2em]">
            {t("command_try_live")}
          </span>
          <h2 className="text-xl sm:text-2xl font-sans font-bold mt-1">
            {t("command_agent_loop")}
          </h2>
          <p className="text-sm text-subtle font-sans mt-1 max-w-md">
            {t("command_subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {COMMANDS.map((cmd, i) => {
            const Icon = cmd.icon;
            const done = i < activeStep;
            const current = i === activeStep;
            return (
              <motion.button
                key={cmd.id}
                whileHover={!isRunning && !done ? { scale: 1.03 } : {}}
                whileTap={!isRunning && !done ? { scale: 0.97 } : {}}
                transition={{ ease: [0.16, 1, 0.3, 1] }}
                onClick={() => runCommand(i)}
                disabled={isRunning || done || i > activeStep}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-2 focus-visible:outline-none ${
                  done
                    ? "bg-neon-green/10 border border-neon-green/20 text-neon-green"
                    : current || (!isRunning && i === activeStep)
                      ? "bg-electric-blue/10 border border-electric-blue/30 text-electric-blue"
                      : "bg-glass border border-glass-hover text-subtle"
                } disabled:opacity-70`}
              >
                {done ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : current && isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                {cmd.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Terminal */}
      <div className="rounded-2xl border border-glass bg-black/60 backdrop-blur-sm overflow-hidden">
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-glass bg-black/40">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-neon-green/60" />
          </div>
          <span className="text-[10px] font-mono text-subtle ml-2">
            {t("command_terminal_title")}
          </span>
        </div>

        {/* Terminal body */}
        <div className="p-4 sm:p-6 font-mono text-xs leading-relaxed max-h-[400px] overflow-y-auto">
          {logs.map((entry, i) => (
            <div key={i} className="mb-1">
              {entry.type === "input" ? (
                <div className="flex items-start gap-2">
                  <span className="text-neon-green shrink-0 select-none">$</span>
                  <span className="text-white">{entry.text.slice(2)}</span>
                </div>
              ) : entry.type === "success" ? (
                <div className="ml-4 text-neon-green/90">{entry.text}</div>
              ) : entry.type === "info" ? (
                <div className="ml-4 text-electric-blue/80">{entry.text}</div>
              ) : (
                <div className="ml-4 text-subtle">{entry.text}</div>
              )}
            </div>
          ))}

          {/* Current output streaming */}
          <AnimatePresence mode="popLayout">
            {currentOutput.map((entry, i) => (
              <motion.div
                key={`stream-${i}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ease: [0.16, 1, 0.3, 1] }}
                className="mb-1"
              >
                {entry.type === "success" ? (
                  <div className="ml-4 text-neon-green/90">
                    {entry.text}
                    {!entry.text.endsWith(" ") && showCursor && (
                      <span className="text-neon-green animate-pulse">▊</span>
                    )}
                  </div>
                ) : entry.type === "info" ? (
                  <div className="ml-4 text-electric-blue/80">
                    {entry.text}
                    {!entry.text.endsWith(" ") && showCursor && (
                      <span className="text-electric-blue animate-pulse">▊</span>
                    )}
                  </div>
                ) : (
                  <div className="ml-4 text-subtle">
                    {entry.text}
                    {!entry.text.endsWith(" ") && showCursor && (
                      <span className="text-subtle animate-pulse">▊</span>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {!isRunning && !allDone && (
            <div className="flex items-center gap-2 mt-2 text-subtle">
              <span className="text-neon-green">$</span>
              <span className="animate-pulse">▊</span>
            </div>
          )}

          {allDone && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 p-3 rounded-xl bg-neon-green/5 border border-neon-green/20"
            >
              <div className="flex items-center gap-2 text-neon-green font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                {t("command_complete")}
              </div>
              <div className="mt-2 text-[10px] text-subtle">
                {t("command_complete_sub")}
                <Link
                  href="/claim"
                  className="ml-1 text-electric-blue hover:underline focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-2 focus-visible:outline-none transition-all rounded"
                >
                  {t("command_try_real")}
                </Link>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
