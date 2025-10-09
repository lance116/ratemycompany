import { useParams, Link } from "react-router-dom";
import { getCompanies } from "@/data/companies";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LineChart } from "@/components/ui/line-chart";
import { PayStats } from "@/components/ui/pay-stats";
import { Star, ArrowLeft, MessageSquare, Trophy, TrendingUp, BarChart3, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { getEloHistory, EloHistoryEntry, addReview, getPeakRank, toggleReviewLike } from "@/utils/elo";

const CompanyDetails = () => {
  const companies = getCompanies();
  const { id } = useParams();
  const company = companies.find(c => c.id === parseInt(id || ""));
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [eloHistory, setEloHistory] = useState<EloHistoryEntry[]>([]);
  const [newReview, setNewReview] = useState({
    rating: 5,
    content: "",
    author: "",
    program: "",
    year: "",
    pay: 0,
    culture: 5,
    prestige: 5
  });

  // Simple user ID system (in a real app, this would come from authentication)
  const [userId] = useState(() => {
    let stored = localStorage.getItem('user-id');
    if (!stored) {
      stored = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('user-id', stored);
    }
    return stored;
  });

  useEffect(() => {
    if (company) {
      const history = getEloHistory(company.id);
      setEloHistory(history);
    }
  }, [company]);

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Company not found</h1>
          <Link to="/leaderboard">
            <Button variant="outline">Back to Leaderboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (company) {
      // Add the review to local storage
      addReview(company.id, {
        author: newReview.author || "Anonymous",
        rating: newReview.rating,
        content: newReview.content,
        program: newReview.program,
        year: newReview.year,
        pay: newReview.pay,
        culture: newReview.culture,
        prestige: newReview.prestige
      });
      
      // Refresh the page to show the new review
      window.location.reload();
    }
    
    setShowReviewForm(false);
    setNewReview({
      rating: 5,
      content: "",
      author: "",
      program: "",
      year: "",
      pay: 0,
      culture: 5,
      prestige: 5
    });
  };

  const renderStars = (rating: number, interactive = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? "fill-primary text-primary"
                : "text-muted-foreground"
            } ${interactive ? "cursor-pointer hover:text-primary" : ""}`}
            onClick={interactive && onChange ? () => onChange(star) : undefined}
          />
        ))}
      </div>
    );
  };

  const renderSlider = (value: number, onChange: (value: number) => void, label: string, max: number = 10) => {
    return (
      <div className="space-y-2">
        <Label>{label}: {value}/10</Label>
        <input
          type="range"
          min="1"
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1</span>
          <span>{max}</span>
        </div>
      </div>
    );
  };

  const handleLikeReview = (reviewId: number) => {
    if (company) {
      console.log('Liking review:', reviewId, 'for company:', company.id, 'user:', userId);
      toggleReviewLike(company.id, reviewId, userId);
      // Refresh the page to show updated likes
      window.location.reload();
    }
  };

  const rank = companies.indexOf(company) + 1;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link to="/leaderboard" className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={20} />
          <span>Back to Leaderboard</span>
        </Link>

        {/* Company Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start space-x-6">
              <img
                src={company.logo}
                alt={company.name}
                className="h-20 w-20 object-contain flex-shrink-0"
              />
              <div className="flex-grow">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">
                    {company.name}
                  </h1>
                  <Badge variant="outline" className="text-primary border-primary">
                    #{rank}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  {company.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {company.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center space-x-1">
                      <Trophy className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold text-foreground">
                        {company.elo}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">ELO Rating</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center space-x-1">
                      <Star className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold text-foreground">
                        {company.rating > 0 ? company.rating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">Overall Rating</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center space-x-1">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold text-foreground">
                        {company.reviews.length}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">Reviews</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center">
                      <PayStats pay={company.pay} className="text-lg" />
                    </div>
                    <span className="text-sm text-muted-foreground">Pay Rate</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ELO History Chart */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">ELO Rating History</h2>
            </div>
            
            {eloHistory.length > 0 ? (
              <div className="space-y-6">
                <LineChart 
                  data={eloHistory.map(entry => ({
                    x: entry.timestamp,
                    y: entry.elo,
                    label: new Date(entry.timestamp).toLocaleDateString()
                  }))}
                  width={600}
                  height={250}
                  className="mx-auto"
                />
                
                {/* Peak and Current Ratings with Ranks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-6 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {company.elo}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">Current Rating</div>
                    <div className="text-xs text-green-500 dark:text-green-300 mt-1">Current Rank: #{rank}</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {eloHistory.length > 0 ? Math.max(...eloHistory.map(h => h.elo)) : company.elo}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Peak Rating</div>
                    <div className="text-xs text-blue-500 dark:text-blue-300 mt-1">
                      Peak Rank: #{(() => {
                        if (eloHistory.length === 0) return rank;
                        
                        const peakElo = Math.max(...eloHistory.map(h => h.elo));
                        const currentElo = company.elo;
                        
                        // If current ELO is the peak ELO, use current rank
                        if (currentElo >= peakElo) {
                          return rank;
                        }
                        
                        // Otherwise, use the stored peak rank
                        return getPeakRank(company.id);
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No ELO History Yet
                </h3>
                <p className="text-muted-foreground">
                  ELO ratings will be tracked as students vote on this company.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Culture and Prestige Metrics */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Company Metrics</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Culture */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Culture</span>
                  <span className="text-sm text-muted-foreground">
                    {isNaN(company.culture) ? 'N/A' : `${company.culture}/10`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${isNaN(company.culture) ? 0 : (company.culture / 10) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
              </div>

              {/* Prestige */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Prestige</span>
                  <span className="text-sm text-muted-foreground">
                    {isNaN(company.prestige) ? 'N/A' : `${company.prestige}/10`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${isNaN(company.prestige) ? 0 : (company.prestige / 10) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Student Reviews</h2>
            <Button onClick={() => setShowReviewForm(!showReviewForm)}>
              Write a Review
            </Button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <Label htmlFor="rating">Rating</Label>
                    <div className="mt-1">
                      {renderStars(newReview.rating, true, (rating) =>
                        setNewReview({ ...newReview, rating })
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="author">Name (Optional)</Label>
                      <Input
                        id="author"
                        placeholder="Your name"
                        value={newReview.author}
                        onChange={(e) => setNewReview({ ...newReview, author: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="program">Program</Label>
                      <Input
                        id="program"
                        placeholder="e.g., Computer Science"
                        value={newReview.program}
                        onChange={(e) => setNewReview({ ...newReview, program: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        placeholder="e.g., 3A"
                        value={newReview.year}
                        onChange={(e) => setNewReview({ ...newReview, year: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="pay">Hourly Pay ($)</Label>
                      <Input
                        id="pay"
                        type="number"
                        placeholder="e.g., 25"
                        value={newReview.pay || ""}
                        onChange={(e) => setNewReview({ ...newReview, pay: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      {renderSlider(newReview.culture, (value) => setNewReview({ ...newReview, culture: value }), "Culture")}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      {renderSlider(newReview.prestige, (value) => setNewReview({ ...newReview, prestige: value }), "Prestige")}
                    </div>
                    <div></div>
                  </div>

                  <div>
                    <Label htmlFor="content">Review</Label>
                    <Textarea
                      id="content"
                      placeholder="Share your co-op experience..."
                      value={newReview.content}
                      onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                      required
                      rows={4}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <Button type="submit">Submit Review</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowReviewForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {company.reviews.length > 0 ? (
              company.reviews
                .sort((a, b) => {
                  // Sort by likes first (most liked first), then by date
                  const likesA = a.likes || 0;
                  const likesB = b.likes || 0;
                  
                  if (likesA !== likesB) {
                    return likesB - likesA; // Most liked first
                  }
                  
                  return new Date(b.date).getTime() - new Date(a.date).getTime(); // Then by date
                })
                .map((review, index) => (
                  <Card key={review.id} className={index < 3 ? "border-2 border-primary/20 bg-primary/5" : ""}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center space-x-2 mb-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-muted-foreground">
                              by {review.author || "Anonymous"}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {review.program} • {review.year} • {review.date}
                        </div>
                      </div>
                      
                      {/* Review Metrics */}
                      <div className="flex gap-4 text-right mb-4">
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {review.pay && review.pay > 0 ? `$${review.pay}/hr` : 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">Pay</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {review.culture && !isNaN(review.culture) ? `${review.culture}/10` : 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">Culture</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {review.prestige && !isNaN(review.prestige) ? `${review.prestige}/10` : 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">Prestige</div>
                        </div>
                      </div>
                      
                      <p className="text-foreground mb-4">{review.content}</p>
                      
                      {/* Like Button */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLikeReview(review.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                            review.likedBy && review.likedBy.includes && review.likedBy.includes(userId)
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Heart 
                            className={`h-3 w-3 ${
                              review.likedBy && review.likedBy.includes && review.likedBy.includes(userId) ? 'fill-current' : ''
                            }`} 
                          />
                          {review.likes || 0}
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No reviews yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to share your experience with {company.name}!
                  </p>
                  <Button onClick={() => setShowReviewForm(true)}>
                    Write the First Review
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;