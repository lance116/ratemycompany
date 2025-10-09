import { getCompanies } from "@/data/companies";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PayStats } from "@/components/ui/pay-stats";
import { Star, Trophy, Medal, Award } from "lucide-react";
import { Link } from "react-router-dom";

const Leaderboard = () => {
  const companies = getCompanies();
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

        {/* Olympic Podium - Top 3 */}
        <div className="mb-12">
          <div className="flex justify-center items-end space-x-4 mb-8">
            {/* 2nd Place - Silver */}
            {companies[1] && (
              <Link to={`/company/${companies[1].id}`} className="flex-1 max-w-xs">
                <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-2 border-silver bg-gradient-to-b from-silver/20 to-silver/10 shadow-silver/20">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      <Medal className="h-8 w-8 text-silver mx-auto mb-2" />
                      <span className="text-2xl font-bold text-silver">#2</span>
                    </div>
                    <img
                      src={companies[1].logo}
                      alt={companies[1].name}
                      className="h-16 w-16 object-contain mx-auto mb-3"
                    />
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {companies[1].name}
                    </h3>
                    <div className="flex items-center justify-center space-x-1 mb-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">
                        {companies[1].elo}
                      </span>
                    </div>
                    {companies[1].rating > 0 && (
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">
                          {companies[1].rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {companies[1].reviews.length} reviews
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}

            {/* 1st Place - Gold */}
            {companies[0] && (
              <Link to={`/company/${companies[0].id}`} className="flex-1 max-w-xs">
                <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-2 border-gold bg-gradient-to-b from-gold/20 to-gold/10 shadow-gold/30 transform scale-105">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      <Trophy className="h-10 w-10 text-gold mx-auto mb-2" />
                      <span className="text-3xl font-bold text-gold">#1</span>
                    </div>
                    <img
                      src={companies[0].logo}
                      alt={companies[0].name}
                      className="h-20 w-20 object-contain mx-auto mb-3"
                    />
                    <h3 className="text-xl font-bold text-foreground mb-1">
                      {companies[0].name}
                    </h3>
                    <div className="flex items-center justify-center space-x-1 mb-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">
                        {companies[0].elo}
                      </span>
                    </div>
                    {companies[0].rating > 0 && (
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">
                          {companies[0].rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {companies[0].reviews.length} reviews
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}

            {/* 3rd Place - Bronze */}
            {companies[2] && (
              <Link to={`/company/${companies[2].id}`} className="flex-1 max-w-xs">
                <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-2 border-bronze bg-gradient-to-b from-bronze/20 to-bronze/10 shadow-bronze/20">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      <Award className="h-8 w-8 text-bronze mx-auto mb-2" />
                      <span className="text-2xl font-bold text-bronze">#3</span>
                    </div>
                    <img
                      src={companies[2].logo}
                      alt={companies[2].name}
                      className="h-16 w-16 object-contain mx-auto mb-3"
                    />
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {companies[2].name}
                    </h3>
                    <div className="flex items-center justify-center space-x-1 mb-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">
                        {companies[2].elo}
                      </span>
                    </div>
                    {companies[2].rating > 0 && (
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">
                          {companies[2].rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {companies[2].reviews.length} reviews
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        </div>

        {/* Rest of the companies - Vertical List */}
        <div className="space-y-4 scroll-smooth">
          {companies.slice(3).map((company, index) => {
            const rank = index + 4; // Start from rank 4
            return (
              <Link key={company.id} to={`/company/${company.id}`}>
                <Card 
                  className={`transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 ${getRankStyle(rank)}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-12 flex justify-center">
                        {getRankIcon(rank)}
                      </div>

                      {/* Company Logo */}
                      <div className="flex-shrink-0">
                        <img
                          src={company.logo}
                          alt={company.name}
                          className="h-12 w-12 object-contain"
                        />
                      </div>

                      {/* Company Info */}
                      <div className="flex-grow">
                        <h3 className="text-xl font-bold text-foreground">
                          {company.name}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-2">
                          {company.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {company.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center space-x-1 mb-1">
                          <Trophy className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-foreground">
                            {company.elo}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">
                          ELO Rating
                        </div>
                        {company.rating > 0 && (
                          <>
                            <div className="flex items-center space-x-1 mb-1">
                              <Star className="h-4 w-4 text-primary" />
                              <span className="font-semibold text-foreground">
                                {company.rating.toFixed(1)}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground mb-1">
                              Overall Rating
                            </div>
                          </>
                        )}
                        <div className="mb-1">
                          <PayStats pay={company.pay} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {company.reviews.length} reviews
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Rankings are updated in real-time based on student votes. Click on any company to see detailed reviews.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;