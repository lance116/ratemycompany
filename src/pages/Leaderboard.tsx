import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLeaderboardCompanies, LeaderboardCompany } from "@/data/companies";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PayStats } from "@/components/ui/pay-stats";
import { TierBadge } from "@/components/ui/tier-badge";
import { Star, Trophy, Medal, Award, Search as SearchIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import SiteFooter from "@/components/SiteFooter";
import { getEloTier } from "@/lib/elo";

const defaultLogo = "https://placehold.co/120x120?text=Logo";

const Leaderboard = () => {
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboardCompanies,
    staleTime: 1000 * 30,
  });

  const podium = useMemo(() => companies.slice(0, 3), [companies]);
  const rest = useMemo(() => companies.slice(3), [companies]);

  const [search, setSearch] = useState("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement | null>(null);

  const matchingCompanies = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return [];
    }
    return companies.filter(company => company.name.toLowerCase().includes(query)).slice(0, 8);
  }, [companies, search]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!suggestionRef.current) {
        return;
      }
      if (!suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  const handleSuggestionSelect = (companyId: string) => {
    const target = document.getElementById(`company-card-${companyId}`);
    if (target) {
      setSearch("");
      window.requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      setHighlightedId(companyId);
      window.setTimeout(() => {
        setHighlightedId(prev => (prev === companyId ? null : prev));
      }, 1600);
    }
    setShowSuggestions(false);
  };

  const formatTag = (tag: string) =>
    tag
      .split(/[\s_-]+/)
      .map(chunk => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
      .join(" ");

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-gold" />;
      case 2:
        return <Medal className="h-6 w-6 text-silver" />;
      case 3:
        return <Award className="h-6 w-6 text-bronze" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "border-gold bg-gradient-to-r from-gold/10 to-gold/5 shadow-gold";
      case 2:
        return "border-silver bg-gradient-to-r from-silver/10 to-silver/5";
      case 3:
        return "border-bronze bg-gradient-to-r from-bronze/10 to-bronze/5";
      default:
        return "";
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const renderCompanyCard = (
    company: LeaderboardCompany,
    displayRank: number,
    options?: {
      podiumRank?: number;
      wrapperClass?: string;
      cardClass?: string;
      cardHeightClass?: string;
      logoBoxClass?: string;
    }
  ) => {
    const logo = company.logoUrl ?? defaultLogo;
    const reviewRating =
      company.averageReviewScore !== null ? company.averageReviewScore.toFixed(1) : "N/A";

    const reviewCountLabel = `${company.reviewCount} review${company.reviewCount === 1 ? "" : "s"}`;
    const {
      podiumRank,
      wrapperClass = "",
      cardClass = "",
      cardHeightClass = "",
      logoBoxClass = "h-24 w-24",
    } = options ?? {};
    const tierLabel = getEloTier(company.elo);

    return (
      <Link
        to={`/company/${company.id}`}
        id={`company-card-${company.id}`}
        className={cn("w-full md:flex-1 md:basis-0 md:max-w-xs", wrapperClass)}
        key={company.id}
      >
        <div className="relative flex h-full flex-col justify-end">
          <Card
            className={cn(
              "relative flex flex-col border-2 bg-card/90 backdrop-blur transition-all duration-300 hover:shadow-xl",
              podiumRank === 1 && "border-gold shadow-gold/40",
              podiumRank === 2 && "border-silver shadow-silver/40",
              podiumRank === 3 && "border-bronze shadow-bronze/40",
              highlightedId === company.id && "ring-2 ring-amber-300/70 ring-offset-2 ring-offset-background",
              cardClass,
              cardHeightClass
            )}
          >
            {podiumRank && (
              <div
                className={cn(
                  "shine-wrapper",
                  podiumRank === 1 && "shine-wrapper--gold",
                  podiumRank === 2 && "shine-wrapper--silver",
                  podiumRank === 3 && "shine-wrapper--bronze"
                )}
                aria-hidden="true"
              />
            )}
            <CardContent className="relative z-10 flex flex-1 flex-col items-center justify-between p-4 md:p-6 text-center">
              <div className="mb-2 md:mb-4">
                {podiumRank ? (
                  <div className="flex flex-col items-center">
                    {getRankIcon(podiumRank)}
                    <span className="text-xl md:text-2xl font-bold mt-1">{`#${podiumRank}`}</span>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-sm">
                    #{displayRank}
                  </Badge>
                )}
              </div>
              <div
                className={cn("mx-auto flex items-center justify-center rounded-lg bg-muted/50", logoBoxClass)}
              >
                <img
                  src={logo}
                  alt={company.name}
                  className="h-[65%] w-[65%] object-contain"
                />
              </div>
              <div className="space-y-3">
                <div className="flex flex-col items-center gap-1">
                  <h3 className="text-lg font-bold text-foreground h-14 flex items-center justify-center">
                    {company.name}
                  </h3>
                  <TierBadge label={tierLabel} />
                </div>
                <div className="h-12 flex items-center justify-center">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">Elo: {company.elo}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">{reviewRating}</span>
                    </div>
                  </div>
                </div>
                <div className="h-5 flex items-center justify-center text-xs text-muted-foreground">{reviewCountLabel}</div>
                <div className="h-8 flex items-center justify-center">
                  <PayStats pay={company.payDisplay} className="justify-center" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Link>
    );
  };

  return (
    <>
      <div className="relative min-h-screen overflow-hidden bg-white text-slate-950">
        <LeaderboardBackground />
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Company Leaderboard</h1>
            <p className="text-muted-foreground">
              Rankings based on community votes using the chess ELO rating system
            </p>
          </div>

          <div className="mb-12">
            <div className="grid grid-cols-3 gap-3 md:flex md:items-end md:justify-center md:space-x-6">
              {[
                {
                  company: podium[1],
                  rank: 2,
                  options: {
                    podiumRank: 2,
                    wrapperClass: "col-span-1 md:order-1",
                    cardHeightClass: "min-h-[300px] md:min-h-[360px]",
                    logoBoxClass: "h-16 w-16 md:h-24 md:w-24",
                  },
                },
                {
                  company: podium[0],
                  rank: 1,
                  options: {
                    podiumRank: 1,
                    wrapperClass: "col-span-1 md:order-2",
                    cardHeightClass: "min-h-[340px] md:min-h-[420px]",
                    logoBoxClass: "h-16 w-16 md:h-28 md:w-28",
                  },
                },
                {
                  company: podium[2],
                  rank: 3,
                  options: {
                    podiumRank: 3,
                    wrapperClass: "col-span-1 md:order-3",
                    cardHeightClass: "min-h-[260px] md:min-h-[340px]",
                    logoBoxClass: "h-16 w-16 md:h-20 md:w-20",
                  },
                },
              ]
                .filter(slot => slot.company)
                .map(slot => renderCompanyCard(slot.company!, slot.rank, slot.options))}
            </div>
          </div>

          <div className="relative mt-6">
            <div className="relative z-20 mb-4 flex justify-center md:justify-start">
              <div className="relative w-full max-w-xs" ref={suggestionRef}>
                <SearchIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="leaderboard-search-input"
                  type="text"
                  value={search}
                  onChange={event => {
                    setSearch(event.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => matchingCompanies.length > 0 && setShowSuggestions(true)}
                  placeholder="Search companies…"
                  className="w-full rounded-full border border-amber-200/70 bg-white/95 pl-8 pr-3 py-1 text-xs text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-300/70"
                />
                {matchingCompanies.length > 0 && showSuggestions && (
                  <div className="absolute top-full left-0 mt-2 w-full overflow-hidden rounded-2xl border border-amber-200/60 bg-white/95 shadow-[0_18px_45px_-25px_rgba(15,23,42,0.45)] backdrop-blur-sm">
                    <ul className="divide-y divide-slate-100 text-sm">
                      {matchingCompanies.map(company => (
                        <li key={company.id}>
                          <button
                            type="button"
                            onClick={() => handleSuggestionSelect(company.id)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left transition hover:bg-amber-50/80"
                          >
                            <span className="flex items-center gap-2">
                              <span className="inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-muted/60">
                                <img
                                  src={company.logoUrl ?? defaultLogo}
                                  alt=""
                                  className="h-5 w-5 object-contain"
                                />
                              </span>
                              <span className="font-medium text-slate-800">{company.name}</span>
                            </span>
                            <span className="text-xs font-semibold text-amber-500">
                              #{company.rank}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 scroll-smooth">
              {rest.map((company, index) => {
                const rank = index + 4;
                const logo = company.logoUrl ?? defaultLogo;
              const reviewRating =
                  company.averageReviewScore !== null ? company.averageReviewScore.toFixed(1) : "N/A";
              const reviewCountLabel = `${company.reviewCount} review${
                  company.reviewCount === 1 ? "" : "s"
                }`;
                const tierLabel = getEloTier(company.elo);

                return (
                  <Link
                    key={company.id}
                    to={`/company/${company.id}`}
                    id={`company-card-${company.id}`}
                  >
                    <Card
                      className={cn(
                        "border-2 border-white/50 bg-white/80 transition-all duration-300 hover:-translate-y-1 hover:border-amber-200/60 hover:shadow-lg",
                        highlightedId === company.id &&
                          "ring-2 ring-amber-300/70 ring-offset-2 ring-offset-background",
                        getRankStyle(rank)
                      )}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 w-12 flex justify-center">
                            {getRankIcon(rank)}
                          </div>

                          <div className="flex-shrink-0">
                            <div className="h-20 w-20 rounded-md bg-white/70 flex items-center justify-center shadow-sm">
                              <img
                                src={logo}
                                alt={company.name}
                                className="h-16 w-16 object-contain"
                              />
                            </div>
                          </div>

                          <div className="flex-grow">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xl font-bold text-foreground">{company.name}</h3>
                              <TierBadge label={tierLabel} />
                            </div>
                            <p className="text-muted-foreground text-sm mb-2">
                              {company.description || "No description available yet."}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {company.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {formatTag(tag)}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Trophy className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-foreground">Elo: {company.elo}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-foreground">{reviewRating}</span>
                              </div>
                              <div>{reviewCountLabel}</div>
                              <PayStats pay={company.payDisplay} />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
};

export default Leaderboard;

const LeaderboardBackground = () => (
  <div aria-hidden className="pointer-events-none">
    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-amber-200 via-white/40 to-transparent" />
  </div>
);
