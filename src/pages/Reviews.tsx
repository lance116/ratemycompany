import { getCompanies } from "@/data/companies";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Star, Search, MessageSquare } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Reviews = () => {
  const companies = getCompanies();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-primary text-primary"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            SWE Internship Reviews
          </h1>
          <p className="text-muted-foreground">
            Read detailed reviews from UWaterloo software engineering interns
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search companies or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <Link key={company.id} to={`/company/${company.id}`}>
              <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="h-12 w-12 object-contain"
                    />
                    <div>
                      <h3 className="font-bold text-foreground">{company.name}</h3>
                      <div className="flex items-center space-x-1">
                        {renderStars(company.rating)}
                        <span className="text-sm text-muted-foreground ml-1">
                          ({company.reviews.length})
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {company.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {company.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {company.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{company.tags.length - 2}
                      </Badge>
                    )}
                  </div>

                  {company.reviews.length > 0 ? (
                    <div className="border-t pt-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          Latest Review
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        "{company.reviews[0].content}"
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        {renderStars(company.reviews[0].rating)}
                        <span className="text-xs text-muted-foreground">
                          - {company.reviews[0].author || "Anonymous"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t pt-4 text-center">
                      <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No reviews yet
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Be the first to review!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No companies found matching "{searchTerm}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;