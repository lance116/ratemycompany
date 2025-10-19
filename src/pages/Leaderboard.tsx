import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLeaderboardCompanies, LeaderboardCompany } from "@/data/companies";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PayStats } from "@/components/ui/pay-stats";
import { Star, Trophy, Medal, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const defaultLogo = "https://placehold.co/120x120?text=Logo";

const Leaderboard = () => {
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboardCompanies,
    staleTime: 1000 * 30,
  });

  const podium = useMemo(() => companies.slice(0, 3), [companies]);
  const rest = useMemo(() => companies.slice(3), [companies]);

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
        return "border-border hover:border-primary/20";
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
      pedestalClass?: string;
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
      pedestalClass = "h-2",
    } = options ?? {};

    return (
      <Link
        to={`/company/${company.id}`}
        className={cn("flex-1 basis-0 max-w-xs", wrapperClass)}
        key={company.id}
      >
        <div className="flex h-full flex-col justify-end">
          <Card
            className={cn(
              "relative flex flex-col border-2 bg-card/90 backdrop-blur transition-all duration-300 hover:shadow-xl",
              podiumRank === 1 && "border-gold shadow-gold/40",
              podiumRank === 2 && "border-silver shadow-silver/40",
              podiumRank === 3 && "border-bronze shadow-bronze/40",
              cardClass,
              cardHeightClass
            )}
          >
            {podiumRank === 1 && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <div className="absolute inset-0 opacity-60">
                  <div className="absolute -top-1/2 left-1/3 h-64 w-64 rotate-12 rounded-full bg-gradient-to-br from-gold/40 via-gold/10 to-transparent blur-lg" />
                  <div className="absolute bottom-[-30%] right-[-20%] h-56 w-56 rounded-full bg-gradient-to-tr from-gold/25 via-gold/5 to-transparent blur-3xl" />
                </div>
                <div className="absolute inset-0">
                  <svg className="h-full w-full opacity-40" viewBox="0 0 400 400" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                        <stop offset="40%" stopColor="rgba(255,255,255,0.08)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                      </linearGradient>
                    </defs>
                    <rect x="-50" y="-50" width="500" height="500" fill="url(#shine)" transform="rotate(20 200 200)" />
                  </svg>
                </div>
              </div>
            )}
            <CardContent className="flex flex-1 flex-col items-center justify-between p-6 text-center">
              <div className="mb-4">
                {podiumRank ? (
                  <div className="flex flex-col items-center">
                    {getRankIcon(podiumRank)}
                    <span className="text-2xl font-bold mt-1">{`#${podiumRank}`}</span>
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
                  className="h-[78%] w-[78%] object-contain"
                />
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-foreground">
                  {company.name}
                </h3>
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <div className="flex items-center space-x-1">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">{company.elo}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">{reviewRating}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{reviewCountLabel}</div>
                <PayStats pay={company.payDisplay} />
              </div>
            </CardContent>
          </Card>
          {podiumRank && (
            <div
              className={cn(
                "mt-3 hidden rounded-t-md md:block",
                pedestalClass,
                podiumRank === 1 && "bg-gradient-to-r from-gold/80 via-gold to-gold/80",
                podiumRank === 2 && "bg-gradient-to-r from-silver/70 via-silver to-silver/70",
                podiumRank === 3 && "bg-gradient-to-r from-bronze/70 via-bronze to-bronze/70"
              )}
            />
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background overflow-y-auto scroll-smooth">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            SWE Internship Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Rankings based on student votes using chess ELO rating system
          </p>
        </div>

        <div className="mb-12">
          <div className="flex flex-col items-center justify-center space-y-4 md:flex-row md:items-end md:space-x-6 md:space-y-0">
            {[
              {
                company: podium[1],
                rank: 2,
                options: {
                  podiumRank: 2,
                  wrapperClass: "md:order-1",
                  cardHeightClass: "md:min-h-[360px]",
                  logoBoxClass: "h-24 w-24 md:h-24 md:w-24",
                  pedestalClass: "md:h-3",
                },
              },
              {
                company: podium[0],
                rank: 1,
                options: {
                  podiumRank: 1,
                  wrapperClass: "md:order-2",
                  cardHeightClass: "md:min-h-[420px]",
                  logoBoxClass: "h-28 w-28 md:h-28 md:w-28",
                  pedestalClass: "md:h-5",
                },
              },
              {
                company: podium[2],
                rank: 3,
                options: {
                  podiumRank: 3,
                  wrapperClass: "md:order-3",
                  cardHeightClass: "md:min-h-[340px]",
                  logoBoxClass: "h-20 w-20 md:h-20 md:w-20",
                  pedestalClass: "md:h-2",
                },
              },
            ]
              .filter(slot => slot.company)
              .map(slot => renderCompanyCard(slot.company!, slot.rank, slot.options))}
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

            return (
              <Link key={company.id} to={`/company/${company.id}`}>
                <Card
                  className={`transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 ${getRankStyle(
                    rank
                  )}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-12 flex justify-center">
                        {getRankIcon(rank)}
                      </div>

                      <div className="flex-shrink-0">
                        <div className="h-20 w-20 rounded-md bg-muted/40 flex items-center justify-center">
                          <img
                            src={logo}
                            alt={company.name}
                            className="h-16 w-16 object-contain"
                          />
                        </div>
                      </div>

                      <div className="flex-grow">
                        <h3 className="text-xl font-bold text-foreground">
                          {company.name}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-2">
                          {company.description || "No description available yet."}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {company.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Trophy className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-foreground">{company.elo}</span>
                          </div>
                          <div className="flex items-center space-x-1">
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
  );
};

export default Leaderboard;
