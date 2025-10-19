import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLeaderboardCompanies, LeaderboardCompany } from "@/data/companies";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PayStats } from "@/components/ui/pay-stats";
import { Star, Trophy, Medal, Award } from "lucide-react";
import { Link } from "react-router-dom";

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

  const renderCompanyCard = (company: LeaderboardCompany, index: number, podiumRank?: number) => {
    const logo = company.logoUrl ?? defaultLogo;
    const reviewRating =
      company.averageReviewScore !== null ? company.averageReviewScore.toFixed(1) : "N/A";

    const reviewCountLabel = `${company.reviewCount} review${company.reviewCount === 1 ? "" : "s"}`;

    return (
      <Link to={`/company/${company.id}`} className="flex-1 max-w-xs" key={company.id}>
        <Card
          className={[
            "transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-2",
            podiumRank === 1 && "border-gold bg-gradient-to-b from-gold/20 to-gold/10 shadow-gold/30 transform scale-105",
            podiumRank === 2 && "border-silver bg-gradient-to-b from-silver/20 to-silver/10 shadow-silver/20",
            podiumRank === 3 && "border-bronze bg-gradient-to-b from-bronze/20 to-bronze/10 shadow-bronze/20",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              {podiumRank ? (
                <div className="flex flex-col items-center">
                  {getRankIcon(podiumRank)}
                  <span className="text-2xl font-bold mt-1">{`#${podiumRank}`}</span>
                </div>
              ) : (
                <Badge variant="outline" className="text-sm">
                  #{index}
                </Badge>
              )}
            </div>
            <img
              src={logo}
              alt={company.name}
              className={`object-contain mx-auto ${podiumRank === 1 ? "h-20 w-20" : "h-16 w-16"}`}
            />
            <h3 className="text-lg font-bold text-foreground mt-4 mb-1">
              {company.name}
            </h3>
            <div className="flex items-center justify-center space-x-2 mb-3 text-sm">
              <div className="flex items-center space-x-1">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">{company.elo}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">{reviewRating}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mb-2">{reviewCountLabel}</div>
            <PayStats pay={company.payDisplay} />
          </CardContent>
        </Card>
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
          <div className="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-4 md:space-y-0 justify-center">
            {podium.map((company, index) => renderCompanyCard(company, index + 1, index + 1))}
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
                        <img
                          src={logo}
                          alt={company.name}
                          className="h-12 w-12 object-contain"
                        />
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
