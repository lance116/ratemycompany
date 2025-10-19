import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Github, Linkedin, Trophy, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  fetchVoteMatchup,
  recordMatchup,
  VoteMatchupCompany,
  VoteMatchupPayload,
} from "@/data/companies";

type Selection = VoteMatchupCompany["id"] | "draw" | null;

type StatsDelta = {
  elo: number;
  rank: number;
};

type ViewportSize = {
  width: number;
  height: number;
};

type VoteLayout = ViewportSize & {
  isCompact: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isShortHeight: boolean;
  isLandscape: boolean;
};

const useViewportSize = (): ViewportSize => {
  const [viewport, setViewport] = useState<ViewportSize>(() => ({
    width: typeof window === "undefined" ? 0 : window.innerWidth,
    height: typeof window === "undefined" ? 0 : window.innerHeight,
  }));

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
    };
  }, []);

  return viewport;
};

const useVoteLayout = (): VoteLayout => {
  const viewport = useViewportSize();
  const { width, height } = viewport;

  const isCompact = width > 0 && width <= 420;
  const isTablet = width >= 768 && width < 1180;
  const isDesktop = width >= 1180;
  const isShortHeight = height > 0 && height < 760;
  const isLandscape = width > 0 && height > 0 && width > height;

  return {
    ...viewport,
    isCompact,
    isTablet,
    isDesktop,
    isShortHeight,
    isLandscape,
  };
};

const Vote = () => {
  const [selection, setSelection] = useState<Selection>(null);
  const [voteCount, setVoteCount] = useState<number>(0);
  const [companies, setCompanies] = useState<[VoteMatchupCompany, VoteMatchupCompany] | null>(null);
  const [statDeltas, setStatDeltas] = useState<Record<string, StatsDelta>>({});
  const [statTriggers, setStatTriggers] = useState<Record<string, number>>({});
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [voteLocked, setVoteLocked] = useState(false);
  const resetTimerRef = useRef<number | null>(null);
  const queryClient = useQueryClient();
  const layout = useVoteLayout();

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<VoteMatchupPayload>({
    queryKey: ["vote-matchup"],
    queryFn: fetchVoteMatchup,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (data) {
      setCompanies(data.companies);
      setVoteCount(typeof data.totalVotes === "number" ? data.totalVotes : 0);
      setSelection(null);
      setStatDeltas({});
      setStatTriggers({});
      setMutationError(null);
      setVoteLocked(false);
    }
  }, [data]);

  useEffect(
    () => () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    },
    []
  );

  const voteMutation = useMutation({
    mutationFn: recordMatchup,
    onSuccess: (rows) => {
      setMutationError(null);
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      rows.forEach((row) => {
        queryClient.invalidateQueries({ queryKey: ["company", row.company_id] });
        queryClient.invalidateQueries({ queryKey: ["companyEloHistory", row.company_id] });
        queryClient.invalidateQueries({ queryKey: ["companyReviews", row.company_id] });
      });

      if (!companies) {
      return;
      }

      const updates = new Map(
        rows.map((row) => [
          row.company_id,
          {
            elo: Math.round(Number(row.rating ?? 0)),
            rank: row.rank ?? null,
          },
        ])
      );

      const updatedDeltas: Record<string, StatsDelta> = {};

      setCompanies((prev) => {
        if (!prev) {
          return prev;
        }

        const next = prev.map((company) => {
          const update = updates.get(company.id);
          if (!update) {
            return company;
          }

          const eloDelta = update.elo - company.elo;
          let nextRank = company.rank;
          let rankDelta = 0;

          if (eloDelta !== 0) {
            const updatedRank =
              typeof update.rank === "number" && update.rank > 0 ? update.rank : company.rank;
            nextRank = updatedRank;
            rankDelta = company.rank - updatedRank;
          }

          updatedDeltas[company.id] = {
            elo: eloDelta,
            rank: rankDelta,
          };

          return {
            ...company,
            elo: update.elo,
            rank: nextRank,
          };
        }) as [VoteMatchupCompany, VoteMatchupCompany];

        return next;
      });

      setStatDeltas(updatedDeltas);
      setVoteCount((prev) => prev + 1);

      const now = Date.now();
      setStatTriggers((prev) => {
        const next = { ...prev };
        rows.forEach((row) => {
          next[row.company_id] = now;
        });
        return next;
      });

      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }

      resetTimerRef.current = window.setTimeout(() => {
        refetch();
      }, 900);
    },
    onError: (err: Error) => {
      setMutationError(err.message);
      setVoteLocked(false);
    },
  });

  if (isLoading && !companies) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-slate-900">
        Loading live matchup...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center text-slate-900">
        <p className="text-lg font-semibold">Something went wrong loading the matchup.</p>
        <p className="mt-2 text-sm text-slate-500">{error.message}</p>
        <Button className="mt-6" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!companies) {
    return null;
  }

  const [leftCompany, rightCompany] = companies;

  const handleCompanySelect = (companyId: string) => {
    if (!companies || voteMutation.isPending || voteLocked) {
      return;
    }

    setSelection(companyId);
    setVoteLocked(true);
    const now = Date.now();
    setStatTriggers((prev) => ({
      ...prev,
      [leftCompany.id]: now,
      [rightCompany.id]: now,
    }));

    const result: "a" | "b" = companyId === leftCompany.id ? "a" : "b";

    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    voteMutation.mutate({
        companyA: leftCompany.id,
        companyB: rightCompany.id,
      result,
    });
  };

  const handleDraw = () => {
    if (!companies || voteMutation.isPending || voteLocked) {
      return;
    }

    setSelection("draw");
    setVoteLocked(true);
    const now = Date.now();
    setStatTriggers((prev) => ({
      ...prev,
      [leftCompany.id]: now,
      [rightCompany.id]: now,
    }));

    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    voteMutation.mutate({
      companyA: leftCompany.id,
      companyB: rightCompany.id,
      result: "draw",
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-slate-950">
      <BackgroundCanvas />
      <div
        className={cn(
          "relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-start sm:justify-center px-4 pt-0 pb-4 sm:py-12 sm:px-6 lg:px-8",
          layout.isCompact && "pt-4 pb-6",
          layout.isShortHeight && "sm:pt-9 sm:pb-10",
          layout.isTablet && "sm:px-8",
          layout.isDesktop && "sm:px-10"
        )}
      >
        <section
          className={cn(
            "rounded-[2rem] border border-slate-200/80 bg-white/80 px-6 pt-3 pb-5 sm:py-7 text-center shadow-[0_28px_60px_-38px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:px-9",
            layout.isCompact && "px-5 pb-4",
            layout.isShortHeight && "sm:py-6",
            layout.isTablet && "sm:px-10"
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-amber-500">
            Live Head-to-Head
          </p>
          <h1
            className={cn(
              "mt-2 sm:mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl md:text-[2.15rem]",
              layout.isCompact && "text-[1.7rem] leading-snug"
            )}
          >
            Which company would you rather work at?
          </h1>
          <p
            className={cn(
              "mt-2 sm:mt-3 text-sm text-slate-600 sm:text-base",
              layout.isCompact && "text-[0.85rem]"
            )}
          >
            Cast your vote and watch the Elo rankings update live. Upsets make the leaderboard swing!
          </p>
          <div
            className={cn(
              "mt-3 sm:mt-4 inline-flex items-center gap-3 rounded-full border border-amber-400/50 bg-amber-100/70 px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.4em] text-amber-600",
              layout.isCompact && "gap-2 px-4 py-1"
            )}
          >
            <Trophy
              className={cn("h-4 w-4 text-amber-500", layout.isCompact && "h-3.5 w-3.5")}
              strokeWidth={1.5}
            />
            <span className="tabular-nums text-slate-800">
              {voteCount.toLocaleString()} total votes recorded
            </span>
          </div>
          {mutationError && (
            <p className="mt-4 text-xs font-semibold text-rose-500">{mutationError}</p>
          )}
        </section>

        <section
          className={cn(
            "mt-3 sm:mt-6 flex flex-1 flex-col justify-center",
            layout.isCompact && "mt-4",
            layout.isShortHeight && "sm:mt-5"
          )}
        >
          <div
            className={cn(
              "rounded-[2.5rem] border border-slate-200 bg-white/90 p-4 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.55)] backdrop-blur sm:p-6",
              layout.isCompact && "rounded-[2rem] p-3",
              layout.isTablet && "sm:p-7"
            )}
          >
            <div
              className={cn(
                "grid grid-cols-2 items-stretch gap-3 sm:gap-4",
                layout.isCompact && "gap-2",
                layout.isTablet && "gap-5"
              )}
            >
              <CompanyCard
                company={leftCompany}
                isWinner={selection === leftCompany.id}
                isLoser={
                  selection !== null && selection !== "draw" && selection !== leftCompany.id
                }
                statDelta={statDeltas[leftCompany.id]}
                statTrigger={statTriggers[leftCompany.id]}
                disabled={voteMutation.isPending || voteLocked}
                onSelect={() => handleCompanySelect(leftCompany.id)}
                layout={layout}
              />

              <CompanyCard
                company={rightCompany}
                isWinner={selection === rightCompany.id}
                isLoser={
                  selection !== null && selection !== "draw" && selection !== rightCompany.id
                }
                statDelta={statDeltas[rightCompany.id]}
                statTrigger={statTriggers[rightCompany.id]}
                disabled={voteMutation.isPending || voteLocked}
                onSelect={() => handleCompanySelect(rightCompany.id)}
                layout={layout}
              />
            </div>
          </div>

          <div
            className={cn(
              "mt-3 sm:mt-2 flex justify-center",
              layout.isCompact && "mt-4"
            )}
          >
            <Button
              type="button"
              onClick={handleDraw}
              disabled={voteMutation.isPending || voteLocked}
              className={cn(
                "w-full max-w-xs rounded-2xl border border-amber-400/70 bg-amber-400 px-6 py-3 text-[0.8rem] font-semibold uppercase tracking-[0.42em] text-slate-900 shadow-[0_18px_40px_-28px_rgba(217,119,6,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80",
                "disabled:pointer-events-none disabled:bg-amber-400 disabled:text-slate-900 disabled:opacity-100 disabled:shadow-[0_12px_28px_-24px_rgba(217,119,6,0.65)]",
                selection === "draw" && "ring-2 ring-amber-400/80 ring-offset-2 ring-offset-white",
                layout.isCompact && "max-w-sm px-5 py-2.5 text-[0.72rem] tracking-[0.36em]"
              )}
            >
              Draw/Tie
            </Button>
          </div>
        </section>
      </div>

      {isFetching && (
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-white/30 via-white/10 to-transparent" />
      )}

      <footer className="relative z-10 border-t border-slate-200/80 bg-white/85 w-full">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-10 text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          {/* Mobile branding */}
          <div className="sm:hidden flex items-center gap-2 mb-4 w-full">
            <img src="/ratemycompany.png" alt="ratemycompany" className="h-8 w-8 object-contain flex-shrink-0" />
            <span className="font-bold text-foreground">ratemycompany.ca</span>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-slate-800">
              &copy; 2025 Lance Yan. All rights reserved.
            </p>
            <p className="text-sm">
              If you want a company featured or noticed a bug/mistake, feel free to contact me:
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              asChild
              variant="ghost"
              className="h-10 w-10 rounded-full border border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
            >
              <a href="https://www.linkedin.com/in/lance-yan/" target="_blank" rel="noreferrer">
                <Linkedin className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">LinkedIn</span>
              </a>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-10 w-10 rounded-full border border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
            >
              <a href="https://github.com/lance116" target="_blank" rel="noreferrer">
                <Github className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">GitHub</span>
              </a>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-10 w-10 rounded-full border border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
            >
              <a href="https://x.com/cnnguan" target="_blank" rel="noreferrer">
                <Twitter className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">X (Twitter)</span>
              </a>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

type CardProps = {
  company: VoteMatchupCompany;
  isWinner: boolean;
  isLoser: boolean;
  statDelta?: StatsDelta;
  statTrigger?: number;
  disabled?: boolean;
  onSelect: () => void;
  layout: VoteLayout;
};

const CompanyCard = ({
  company,
  isWinner,
  isLoser,
  statDelta,
  statTrigger,
  disabled,
  onSelect,
  layout,
}: CardProps) => {
  const logoSrc = company.logoUrl ?? "/placeholder.svg";
  const [wasTouched, setWasTouched] = useState(false);
  const sizeVariant = layout.isCompact ? "compact" : layout.isTablet ? "tablet" : "default";

  const handleClick = () => {
    setWasTouched(true);
    onSelect();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "vote-card relative flex h-full min-h-[20rem] w-full flex-col justify-between overflow-hidden rounded-[2rem] border border-slate-200/85 bg-gradient-to-br from-white via-slate-50/80 to-white px-5 py-6 text-left transition-all duration-300 ease-out sm:px-6 sm:py-7 sm:text-center",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70",
        "disabled:cursor-not-allowed disabled:opacity-80",
        sizeVariant === "compact" && "min-h-[18rem] rounded-[1.7rem] px-3.5 py-5 sm:px-5",
        layout.isShortHeight && "min-h-[18.5rem]",
        sizeVariant === "tablet" && "min-h-[21.5rem] px-5 py-6 sm:px-7",
        layout.isLandscape && !layout.isDesktop && "sm:text-left",
        !isWinner &&
        !isLoser &&
        !wasTouched &&
        "hover:-translate-y-0.5 hover:border-amber-300/70 hover:bg-white hover:brightness-105 hover:saturate-110 hover:shadow-[0_36px_72px_-40px_rgba(217,119,6,0.35)]",
        isWinner &&
          "winner-glow border-amber-300/80 bg-gradient-to-br from-amber-50/90 via-white to-amber-100/60 shadow-[0_36px_72px_-40px_rgba(217,119,6,0.35)] brightness-110 saturate-110",
        isLoser && "sm:loser-sink border-slate-200/60 opacity-70 brightness-90 saturate-75"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          isWinner && "bg-[radial-gradient(circle_at_top,rgba(252,211,77,0.35),transparent_70%)]"
        )}
      />
      <div
        className={cn(
          "relative z-10 flex h-full flex-col items-center justify-between gap-4 text-center",
          sizeVariant === "compact" && "gap-3",
          sizeVariant === "tablet" && "gap-5",
          layout.isLandscape && "justify-center"
        )}
      >
        <div
          className={cn(
            "flex w-full flex-col items-center gap-4",
            sizeVariant === "compact" && "gap-3"
          )}
        >
          <div
            className={cn(
              "flex w-full min-h-[10rem] items-center justify-center overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white px-4 py-8 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)]",
              sizeVariant === "compact" && "min-h-[8.5rem] rounded-[1.35rem] px-3.5 py-6",
              sizeVariant === "tablet" && "min-h-[11.5rem] rounded-[1.65rem] px-5 py-8"
            )}
          >
            <img
              src={logoSrc}
              alt={`${company.name} logo`}
              className={cn(
                "h-20 w-auto object-contain",
                sizeVariant === "compact" && "h-16",
                sizeVariant === "tablet" && "h-24"
              )}
            />
          </div>

          <div
            className={cn(
              "flex w-full flex-col items-center gap-2",
              sizeVariant === "compact" && "gap-1.5"
            )}
          >
            <h2
              className={cn(
                "flex min-h-[6.5rem] items-center justify-center text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-3xl",
                sizeVariant === "compact" && "min-h-[5.5rem] text-xl",
                sizeVariant === "tablet" && "text-[1.75rem] sm:text-[2.15rem]"
              )}
            >
              {company.name}
            </h2>

            <div
              className={cn(
                "flex min-h-[3.5rem] items-center justify-center",
                sizeVariant === "compact" && "min-h-[3rem]"
              )}
            >
              <div
                className={cn(
                  "flex flex-wrap items-baseline gap-2",
                  sizeVariant === "compact" && "gap-1.5"
                )}
              >
                <AnimatedStat
                  label="Elo"
                  value={company.elo}
                  delta={statDelta?.elo}
                  trigger={statTrigger}
                  size={sizeVariant}
                />
                <AnimatedStat
                  label="Rank"
                  value={company.rank}
                  delta={statDelta?.rank}
                  trigger={statTrigger}
                  size={sizeVariant}
                />
              </div>
            </div>
          </div>
        </div>

        {company.tags.length > 0 && (
          <div
            className={cn(
              "hidden w-full flex-wrap items-center justify-center gap-2 sm:flex",
              sizeVariant === "tablet" && "gap-2.5"
            )}
          >
            {company.tags.map((trait) => (
              <span
                key={trait}
                className="rounded-full border border-slate-200 bg-slate-100 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.45em] text-slate-600"
              >
                {trait}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
};

type AnimatedStatProps = {
  label: string;
  value: number;
  delta?: number;
  trigger?: number;
  size?: "compact" | "tablet" | "default";
};

const AnimatedStat = ({ label, value, delta, trigger, size = "default" }: AnimatedStatProps) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"rise" | "fall" | "steady">("steady");
  const intervalRef = useRef<number | null>(null);
  const prevValueRef = useRef<number>(value);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (trigger === undefined) {
      setDisplayValue(value);
      prevValueRef.current = value;
      setDirection("steady");
      return;
    }

    const previous = prevValueRef.current;
    if (previous === value) {
      setDisplayValue(value);
      prevValueRef.current = value;
      setDirection("steady");
      return;
    }

    const diff = value - previous;
    if (diff < 0) {
      setDirection("rise");
    } else if (diff > 0) {
      setDirection("fall");
    } else {
      setDirection("steady");
    }

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

    setIsAnimating(true);
    let current = previous;
    const step = diff > 0 ? 1 : -1;
    const steps = Math.max(1, Math.abs(Math.round(diff)));
    const intervalDuration = Math.max(24, Math.min(75, 260 / steps));

    intervalRef.current = window.setInterval(() => {
      if (current === value) {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsAnimating(false);
        prevValueRef.current = value;
        return;
      }

      current += step;
      if ((step > 0 && current > value) || (step < 0 && current < value)) {
        current = value;
      }
      setDisplayValue(current);
    }, intervalDuration);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [value, trigger]);

  useEffect(() => {
    if (trigger === undefined) {
      return;
    }
    const timeout = window.setTimeout(() => setIsAnimating(false), 950);
    return () => window.clearTimeout(timeout);
  }, [trigger]);

  const deltaRounded =
    delta !== undefined && !Number.isNaN(delta) ? Math.round(delta) : undefined;
  const showDelta = trigger !== undefined && deltaRounded !== undefined;
  const deltaClass =
    deltaRounded !== undefined && deltaRounded > 0
      ? "text-emerald-500"
      : deltaRounded !== undefined && deltaRounded < 0
      ? "text-rose-500"
      : "text-slate-400";

  const sizeStyles = {
    default: {
      container: "gap-1.5 px-3.5 py-1.5",
      label: "text-[10px] tracking-[0.38em]",
      value: "text-lg",
      delta: "text-[0.75rem]",
      innerGap: "gap-1.5",
    },
    compact: {
      container: "gap-1 px-2.5 py-1",
      label: "text-[9px] tracking-[0.34em]",
      value: "text-base",
      delta: "text-xs",
      innerGap: "gap-1",
    },
    tablet: {
      container: "gap-1.5 px-4 py-1.75",
      label: "text-[10px] tracking-[0.4em]",
      value: "text-xl",
      delta: "text-sm",
      innerGap: "gap-1.5",
    },
  } as const;

  const { container, label: labelSize, value: valueSize, delta: deltaSize, innerGap } =
    sizeStyles[size];

  return (
    <div
      className={cn(
        "vote-stat flex items-baseline rounded-full bg-white/70 shadow-[0_16px_32px_-30px_rgba(15,23,42,0.6)] backdrop-blur-sm transition-transform",
        container,
        isAnimating && "vote-stat--pulse",
        direction === "rise" && "vote-stat--rise",
        direction === "fall" && "vote-stat--fall"
      )}
    >
      <span
        className={cn(
          "font-semibold uppercase text-slate-500",
          labelSize
        )}
      >
        {label}:
      </span>
      <div className={cn("flex items-baseline", innerGap)}>
        <span className={cn("font-semibold text-slate-900 tabular-nums", valueSize)}>
          {displayValue}
        </span>
        {showDelta && (
          <span className={cn("font-semibold tabular-nums", deltaSize, deltaClass)}>
            {deltaRounded !== undefined
              ? deltaRounded > 0
                ? `+${deltaRounded}`
                : deltaRounded < 0
                ? deltaRounded
                : "+0"
              : null}
          </span>
        )}
      </div>
    </div>
  );
};

const BackgroundCanvas = () => (
  <div aria-hidden className="pointer-events-none">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(253,224,71,0.32),transparent_62%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(253,186,116,0.18),transparent_70%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(99,102,241,0.12),transparent_72%)] blur-3xl" />
    <div className="absolute inset-x-0 top-0 h-56 sm:h-40 bg-gradient-to-b from-amber-200 via-amber-100/30 to-transparent" />
    <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-amber-100 via-transparent to-transparent" />
  </div>
);

export default Vote;
