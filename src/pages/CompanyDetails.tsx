import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchCompanyLeaderboardEntry,
  fetchCompanyEloHistory,
  fetchCompanyReviews,
  submitReview,
  toggleReviewReaction,
  CompanyReview,
} from "@/data/companies";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LineChart } from "@/components/ui/line-chart";
import { PayStats } from "@/components/ui/pay-stats";
import {
  Star,
  ArrowLeft,
  MessageSquare,
  Trophy,
  TrendingUp,
  BarChart3,
  Heart,
} from "lucide-react";
import { useSupabaseAuth } from "@/providers/SupabaseAuthProvider";
import { containsProhibitedSlur } from "@/lib/profanity";
import { cn } from "@/lib/utils";

const defaultLogo = "https://placehold.co/160x160?text=Logo";

const CompanyDetails = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useSupabaseAuth();
  const companyId = id ?? "";

  const {
    data: company,
    isLoading: companyLoading,
    isError: companyError,
  } = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => fetchCompanyLeaderboardEntry(companyId),
    enabled: Boolean(companyId),
  });

  const {
    data: history = [],
    isLoading: historyLoading,
  } = useQuery({
    queryKey: ["companyEloHistory", companyId],
    queryFn: () => fetchCompanyEloHistory(companyId),
    enabled: Boolean(companyId),
  });

  const {
    data: reviews = [],
    isLoading: reviewsLoading,
  } = useQuery({
    queryKey: ["companyReviews", companyId],
    queryFn: () => fetchCompanyReviews(companyId),
    enabled: Boolean(companyId),
  });

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    body: "",
    program: "",
    cohort: "",
    pay: "",
    culture: 5,
    prestige: 5,
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) {
        return;
      }

      const body = reviewForm.body.trim();
      const program = reviewForm.program.trim();
      const cohort = reviewForm.cohort.trim();

      if (containsProhibitedSlur(body) || containsProhibitedSlur(program) || containsProhibitedSlur(cohort)) {
        throw new Error("Please remove prohibited language from your review.");
      }

      const payload = {
        rating: reviewForm.rating,
        body,
        program: program || null,
        cohort: cohort || null,
        pay: reviewForm.pay ? Number(reviewForm.pay) : null,
        culture: reviewForm.culture,
        prestige: reviewForm.prestige,
        title: null,
      };

      await submitReview(companyId, payload, user?.id ?? null);
    },
    onSuccess: async () => {
      setShowReviewForm(false);
      setReviewForm({
        rating: 5,
        body: "",
        program: "",
        cohort: "",
        pay: "",
        culture: 5,
        prestige: 5,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["companyReviews", companyId] }),
        queryClient.invalidateQueries({ queryKey: ["company", companyId] }),
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] }),
      ]);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to submit review.";
      alert(message);
    },
  });

  const toggleReactionMutation = useMutation({
    mutationFn: async (review: CompanyReview) => {
      if (!user) {
        throw new Error("You must be signed in to like a review.");
      }
      await toggleReviewReaction(review.id, user.id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["companyReviews", companyId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to update reaction.";
      alert(message);
    },
  });

  const historyData = useMemo(
    () =>
      history.map((entry, index) => ({
        x: index + 1,
        y: entry.rating,
        label: index === 0 ? "Start" : index === history.length - 1 ? "Now" : `Update ${index + 1}`,
      })),
    [history]
  );

  const peakRank = useMemo(() => {
    const ranks = history
      .map(entry => entry.rank)
      .filter((rank): rank is number => rank !== null && rank !== undefined);
    if (ranks.length === 0) {
      return company?.rank ?? null;
    }
    return Math.min(...ranks);
  }, [company?.rank, history]);

  const eloDelta = useMemo(() => {
    if (history.length < 2) {
      return 0;
    }
    return history[history.length - 1].rating - history[0].rating;
  }, [history]);

  if (companyLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (companyError || !company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Company not found</h1>
          <Link to="/leaderboard">
            <Button variant="outline">Back to Leaderboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const rank = company.rank;
  const logo = company.logoUrl ?? defaultLogo;
  const averageRating = company.averageReviewScore;

  const handleSubmitReview = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      alert("Please sign in to leave a review.");
      return;
    }
    if (!reviewForm.body.trim()) {
      alert("Review content cannot be empty.");
      return;
    }
    submitReviewMutation.mutate();
  };

  const handleToggleReaction = (review: CompanyReview) => {
    if (!user) {
      alert("Please sign in to like reviews.");
      return;
    }
    toggleReactionMutation.mutate(review);
  };

  const renderStars = (rating: number, interactive = false, onChange?: (value: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={cn(
              "h-5 w-5",
              star <= rating ? "fill-primary text-primary" : "text-muted-foreground",
              interactive && "cursor-pointer hover:text-primary"
            )}
            onClick={interactive && onChange ? () => onChange(star) : undefined}
          />
        ))}
      </div>
    );
  };

  const renderSlider = (
    value: number,
    onChange: (value: number) => void,
    label: string,
    max: number = 10
  ) => (
    <div className="space-y-2">
      <Label>
        {label}: {value}/10
      </Label>
      <input
        type="range"
        min="1"
        max={max}
        value={value}
        onChange={event => onChange(parseInt(event.target.value, 10))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>1</span>
        <span>{max}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Link
          to="/leaderboard"
          className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Leaderboard</span>
        </Link>

        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-start md:space-x-6 space-y-6 md:space-y-0">
              <img
                src={logo}
                alt={company.name}
                className="h-24 w-24 object-contain flex-shrink-0"
              />
              <div className="flex-grow space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold text-foreground">{company.name}</h1>
                  <Badge variant="outline" className="text-primary border-primary">
                    #{rank}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{company.description || "No description yet."}</p>
                <div className="flex flex-wrap gap-2">
                  {company.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center space-x-1">
                      <Trophy className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold text-foreground">{company.elo}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">ELO Rating</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center space-x-1">
                      <Star className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold text-foreground">
                        {averageRating !== null ? averageRating.toFixed(1) : "N/A"}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">Overall Rating</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center space-x-1">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold text-foreground">
                        {eloDelta >= 0 ? `+${eloDelta}` : eloDelta}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">ELO Trend</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center space-x-1">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold text-foreground">
                        {peakRank ?? "-"}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">Best Rank</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-center space-x-2">
                    <PayStats pay={company.payDisplay} className="text-lg" />
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                    <span>Matches: {company.matchesPlayed}</span>
                    <span>W {company.wins}</span>
                    <span>L {company.losses}</span>
                    <span>D {company.draws}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">ELO History</h2>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                Loading chart...
              </div>
            ) : (
              <LineChart data={historyData} width={600} height={280} className="mx-auto" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Reviews</h2>
                <p className="text-sm text-muted-foreground">
                  {company.reviewCount} review{company.reviewCount === 1 ? "" : "s"} total
                </p>
              </div>
              <Button onClick={() => setShowReviewForm(prev => !prev)} variant="secondary">
                {showReviewForm ? "Cancel" : "Write a review"}
              </Button>
            </div>

            {showReviewForm && (
              <form className="grid gap-4" onSubmit={handleSubmitReview}>
                {!user && (
                  <p className="text-sm text-muted-foreground">
                    You need to sign in before submitting a review.
                  </p>
                )}
                <div className="space-y-2">
                  <Label>Rating</Label>
                  {renderStars(reviewForm.rating, true, rating => setReviewForm(prev => ({ ...prev, rating })))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="program">Program</Label>
                    <Input
                      id="program"
                      value={reviewForm.program}
                      onChange={event => setReviewForm(prev => ({ ...prev, program: event.target.value }))}
                      placeholder="e.g. Software Engineering"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cohort">Cohort</Label>
                    <Input
                      id="cohort"
                      value={reviewForm.cohort}
                      onChange={event => setReviewForm(prev => ({ ...prev, cohort: event.target.value }))}
                      placeholder="e.g. Summer 2024"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pay">Hourly pay (optional)</Label>
                    <Input
                      id="pay"
                      type="number"
                      min="0"
                      value={reviewForm.pay}
                      onChange={event => setReviewForm(prev => ({ ...prev, pay: event.target.value }))}
                      placeholder="e.g. 45"
                    />
                  </div>
                  {renderSlider(reviewForm.culture, value => setReviewForm(prev => ({ ...prev, culture: value })), "Culture")}
                  {renderSlider(reviewForm.prestige, value => setReviewForm(prev => ({ ...prev, prestige: value })), "Prestige")}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review">Your review</Label>
                  <Textarea
                    id="review"
                    minLength={20}
                    value={reviewForm.body}
                    onChange={event => setReviewForm(prev => ({ ...prev, body: event.target.value }))}
                    placeholder="Share details about your experience..."
                    rows={6}
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={!user || submitReviewMutation.isLoading}>
                    {submitReviewMutation.isLoading ? "Submitting..." : "Submit review"}
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {reviewsLoading ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  Loading reviews...
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-3" />
                  <p>No reviews yet. Be the first to share your experience!</p>
                </div>
              ) : (
                reviews.map(review => {
                  const likedByUser = user ? review.likedBy.includes(user.id) : false;
                  return (
                    <Card key={review.id} className="border border-border">
                      <CardContent className="p-6 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              {renderStars(review.rating)}
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {review.authorName || "Anonymous"}
                              {review.program ? ` • ${review.program}` : ""}
                              {review.cohort ? ` • ${review.cohort}` : ""}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn("flex items-center space-x-1", likedByUser && "text-red-500")}
                            onClick={() => handleToggleReaction(review)}
                            disabled={toggleReactionMutation.isLoading}
                          >
                            <Heart className={cn("h-4 w-4", likedByUser && "fill-current")} />
                            <span>{review.likes}</span>
                          </Button>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{review.body}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {review.pay && <span>Pay: ${Math.round(review.pay)}/hr</span>}
                          {review.culture && <span>Culture: {review.culture}/10</span>}
                          {review.prestige && <span>Prestige: {review.prestige}/10</span>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyDetails;
