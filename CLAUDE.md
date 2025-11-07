# RateMyCompany - Technical Documentation

## Project Overview

**RateMyCompany** is a full-stack web application that ranks technology companies through a head-to-head voting system using the chess Elo rating algorithm. Users can vote on companies in "Hot or Not" style matchups, submit reviews, and view comprehensive company rankings.

**Live URL**: https://ratemycompany.ca
**Deployment**: Vercel (Frontend) + Supabase (Backend)
**Repository**: /Users/lance/Documents/ratemycompany

---

## Tech Stack Summary

### Frontend
- **Framework**: React 18.3.1 with TypeScript 5.8.3
- **Build Tool**: Vite 6.4.1
- **Routing**: React Router DOM 6.30.1
- **State Management**: TanStack Query (React Query) 5.83.0
- **UI Library**: Radix UI + shadcn/ui components
- **Styling**: Tailwind CSS 3.4.17
- **Form Handling**: React Hook Form 7.61.1 + Zod 3.25.76 validation
- **Charts**: Recharts 2.15.4
- **Bot Protection**: hCaptcha (@hcaptcha/react-hcaptcha 1.13.0)
- **Analytics**: Vercel Analytics 1.5.0

### Backend
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (email/password)
- **Edge Functions**: Deno-based Supabase Edge Functions
- **API Style**: RESTful via Supabase client + Edge Function endpoints
- **Real-time**: Supabase Realtime capabilities

### Development
- **Linting**: ESLint 9.32.0
- **Package Manager**: npm (bun.lockb also present)
- **Compiler**: SWC (via @vitejs/plugin-react-swc)

---

## Project Structure

```
/Users/lance/Documents/ratemycompany/
├── src/                          # Frontend source code
│   ├── components/
│   │   ├── ui/                   # shadcn/ui reusable components
│   │   ├── Navigation.tsx        # Main navigation bar
│   │   ├── AuthDialog.tsx        # Login/signup modal
│   │   └── SiteFooter.tsx        # Footer component
│   ├── pages/
│   │   ├── Vote.tsx              # Main voting interface (/)
│   │   ├── Leaderboard.tsx       # Company rankings (/leaderboard)
│   │   ├── Reviews.tsx           # Reviews listing (/reviews)
│   │   ├── CompanyDetails.tsx    # Individual company page (/company/:id)
│   │   └── NotFound.tsx          # 404 page
│   ├── lib/
│   │   ├── supabaseClient.ts     # Supabase configuration
│   │   ├── elo.ts                # Elo tier calculations
│   │   ├── profanity.ts          # Profanity filtering
│   │   └── utils.ts              # Utility functions (cn helper)
│   ├── providers/
│   │   └── SupabaseAuthProvider.tsx # Auth context provider
│   ├── hooks/
│   │   ├── use-toast.ts          # Toast notifications
│   │   └── use-mobile.tsx        # Mobile detection hook
│   ├── data/
│   │   └── companies.ts          # API/data layer functions
│   ├── App.tsx                   # Main app component
│   └── main.tsx                  # Application entry point
├── supabase/                     # Backend configuration
│   ├── functions/
│   │   └── vote/
│   │       └── index.ts          # Vote submission Edge Function
│   ├── migrations/               # Database migrations (7 files)
│   │   ├── 20250221000100_reapply_schema.sql
│   │   ├── 20251019202037_remote_schema.sql
│   │   ├── 20251021090000_secure_vote_permissions.sql
│   │   ├── 20251106000100_optimize_rls_policies.sql
│   │   ├── 20251107090000_vote_rate_limits.sql
│   │   └── 20251107093000_fix_record_matchup_alias.sql
│   └── schema.sql                # Complete database schema
├── public/                       # Static assets
├── .env.local                    # Environment variables
├── package.json                  # Dependencies
├── vite.config.ts                # Vite configuration
├── tailwind.config.ts            # Tailwind CSS config
├── tsconfig.json                 # TypeScript config
└── vercel.json                   # Vercel deployment config
```

---

## Backend Architecture

### Database Schema

The PostgreSQL database consists of 7 core tables, 2 views, and several stored procedures.

#### Core Tables

**1. `companies`**
- Stores company information
- **Columns**: `id` (UUID), `name`, `slug`, `description`, `logo_url`, `tags[]`, `headquarters`, `founded_year`, timestamps
- **Constraints**: Unique on `name` and `slug`
- **Purpose**: Master company data

**2. `company_elo`**
- Tracks Elo ratings for each company
- **Columns**: `company_id` (FK), `rating` (default 1500), `matches_played`, `wins`, `losses`, `draws`, timestamps
- **Purpose**: Current competitive ranking
- **Updated by**: `record_matchup()` function

**3. `matchups`**
- Records all voting history
- **Columns**: `id`, `company_a`, `company_b`, `winner` (a/b/draw), `submitted_by` (user ID), `voter_ip`, `before_rating_a`, `before_rating_b`, `after_rating_a`, `after_rating_b`, timestamps
- **Purpose**: Audit trail and analytics
- **Access**: Insert via `record_matchup()` function only

**4. `reviews`**
- User-generated company reviews
- **Columns**: `id`, `company_id`, `user_id`, `title`, `body`, `rating` (1-5), `program`, `cohort`, `pay`, `culture`, `prestige`, `status` (draft/published/archived), timestamps
- **Constraints**: Profanity checking on `title` and `body`
- **Purpose**: Detailed company feedback

**5. `profiles`**
- User profiles (1:1 with auth.users)
- **Columns**: `id` (FK to auth.users), `display_name`, `username` (unique), `avatar_url`, `role`, timestamps
- **Auto-created**: On user signup via `handle_new_user()` trigger
- **Purpose**: User metadata

**6. `review_reactions`**
- Like system for reviews
- **Columns**: `review_id`, `user_id`, `created_at`
- **Primary Key**: Composite (`review_id`, `user_id`)
- **Purpose**: User engagement tracking

**7. `elo_history`**
- Historical Elo ratings for charting
- **Columns**: `id`, `company_id`, `rating`, `rank`, `matchup_id`, timestamps
- **Purpose**: Time-series data for visualizations
- **Populated by**: `record_matchup()` function

#### Supplementary Tables

**8. `draw_violation_logs`**
- Tracks draw abuse patterns
- **Columns**: `id`, `voter_ip`, `user_id`, `company_a`, `company_b`, `violation_count`, timestamps
- **Purpose**: Anti-spam enforcement

#### Database Views

**1. `company_leaderboard`**
- Comprehensive company rankings view
- **Combines**:
  - Company data (name, slug, logo, tags, etc.)
  - Elo stats (rating, rank, wins/losses/draws, matches played)
  - Review metrics (avg rating, pay, culture, prestige, total reviews)
  - Latest review preview
- **Ordering**: Dense rank by Elo rating (descending)
- **Usage**: Primary data source for leaderboard and voting

**2. `company_reviews_with_meta`**
- Reviews with author info and reaction counts
- **Includes**:
  - Review content and metadata
  - Author display name
  - Like counts
  - Array of user IDs who liked (for UI state)
- **Filter**: Published reviews only
- **Usage**: Review display on company pages

### Core Database Function: `record_matchup()`

**Purpose**: Atomically records a vote and updates Elo ratings with comprehensive rate limiting.

**Signature**:
```sql
record_matchup(
  company_a UUID,
  company_b UUID,
  result TEXT,           -- 'a', 'b', or 'draw'
  submitted_by UUID,     -- optional user ID
  k_factor INT DEFAULT 32,
  voter_ip TEXT
) RETURNS TABLE(...)
```

**Security Features**:

1. **Rate Limiting**:
   - **12 votes per IP per 10 minutes** (burst protection)
   - **6 votes per IP per company per 24 hours** (prevents targeting)
   - **15 votes per account per 6 hours** (authenticated limit)
   - **40 votes per matchup per 90 seconds** (prevents coordinated attacks)
   - **2 consecutive draws max** (prevents draw spam)

2. **Elo Calculation Algorithm**:
   - Standard Elo formula: `new_rating = old_rating + K * (actual - expected)`
   - Expected score: `1 / (1 + 10^((opponent_rating - player_rating) / 400))`
   - **Dynamic K-factor** (aligned with chess ratings):
     - Default: 32
     - 2400+: K=16
     - 2600+: K=12
     - 2800+: K=10
     - **Minimum: K=10** (never drops below chess minimum)
   - **Rating caps**:
     - Global: 800 min, 3100 max
     - All companies follow the same rules (no company-specific caps)

3. **Data Integrity**:
   - Row-level locking (`FOR UPDATE`)
   - Transactional updates
   - Automatic `elo_history` recording
   - Draw violation tracking

**Returns**: Array of updated company ratings and ranks

### Authentication System

**Provider**: Supabase Auth

**Supported Methods**:
- Email/password authentication
- Session persistence in browser
- Auto-refresh tokens

**User Signup Flow**:
1. User submits email, password, username
2. Supabase creates auth.users entry
3. `handle_new_user()` trigger fires
4. Username sanitized (alphanumeric + underscore)
5. Profanity check via `contains_prohibited_language()`
6. Profile created with unique username
7. Email confirmation sent

### Row Level Security (RLS)

**Security Model**:

| Table | Read | Write |
|-------|------|-------|
| `companies` | Public | Admin only |
| `company_elo` | Public | Via functions only |
| `matchups` | Public | Via functions only |
| `profiles` | Public | Users can update their own |
| `reviews` | Public (published only) | Users can manage their own |
| `review_reactions` | Public | Users can manage their own |

**Key Policies**:
- Users can only read/update their own profile
- Reviews must be published to be publicly visible
- Vote recording requires service role (Edge Function)

### Profanity Filtering

**Database Function**: `contains_prohibited_language()`

**Implementation**:
- Normalizes input (lowercase, remove special chars/spaces)
- Checks against hardcoded blacklist
- Applied to:
  - Review titles and bodies (CHECK constraint)
  - Usernames (signup trigger)
  - Display names

---

## Edge Function: `/vote`

**Location**: `supabase/functions/vote/index.ts`

**Purpose**: Secure vote submission endpoint with bot protection and session management.

### Request Flow

```
1. CORS validation
   ↓
2. Request payload validation
   ↓
3. IP extraction (x-forwarded-for / cf-connecting-ip)
   ↓
4. Session token check
   ├─ Valid token → Skip captcha
   └─ Invalid/missing → Require hCaptcha
   ↓
5. hCaptcha verification (if needed)
   ↓
6. Call record_matchup() RPC (service role)
   ↓
7. Generate new session token (HMAC-SHA256)
   ↓
8. Return: updated Elo data + session token
```

### Security Features

**1. Session Token System**:
- **Algorithm**: HMAC-SHA256
- **Payload**: JSON with `ip`, `userId`, `timestamp`
- **TTL**: 3600 seconds (1 hour) default
- **Purpose**: Skip captcha after first verified vote
- **Storage**: Browser localStorage
- **Validation**: IP and user must match

**2. hCaptcha Integration**:
- **Type**: Invisible captcha
- **Trigger**: First vote or invalid session
- **Verification**: Server-side API call
- **Secret**: Stored in Supabase secrets

**3. Rate Limiting**:
- Delegated to database `record_matchup()` function
- Multi-layer limits (see Database section)
- Enforced atomically

**4. CORS Protection**:
- Origin validation
- Whitelist: `ALLOWED_VOTE_ORIGINS` env var
- Default: https://ratemycompany.ca

### Environment Variables

**Required**:
- `HCAPTCHA_SECRET_KEY` - hCaptcha secret
- `SUPABASE_URL` - Database URL
- `SUPABASE_SERVICE_ROLE_KEY` - Elevated permissions
- `ALLOWED_VOTE_ORIGINS` - Comma-separated origins
- `VOTE_SESSION_SECRET` - HMAC secret (32+ random chars)
- `VOTE_SESSION_TTL` - Session lifetime in seconds

### Response Format

```typescript
{
  success: true,
  data: [
    {
      company_id: string,
      rating: number,
      rank: number,
      matches_played: number,
      wins: number,
      losses: number,
      draws: number
    },
    // ... company B data
  ],
  sessionToken: string  // HMAC-signed token
}
```

### Error Handling

- **Rate limit exceeded**: 429 Too Many Requests
- **Invalid captcha**: 401 Unauthorized
- **Database error**: 500 Internal Server Error
- **Invalid request**: 400 Bad Request

---

## Frontend Architecture

### Application Entry Points

**`src/main.tsx`**:
- Mounts React app to DOM (`#root`)
- Includes Vercel Analytics
- Error boundary for render failures

**`src/App.tsx`**:
- Wraps app in providers:
  - `SupabaseAuthProvider` (auth context)
  - `QueryClientProvider` (React Query)
  - `TooltipProvider` (Radix UI)
  - `Toaster` (toast notifications)
- Defines React Router routes
- Handles auth callback redirect

### Routing Structure

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `Vote.tsx` | Main voting interface |
| `/leaderboard` | `Leaderboard.tsx` | Company rankings |
| `/reviews` | `Reviews.tsx` | Browse all reviews |
| `/company/:id` | `CompanyDetails.tsx` | Individual company page |
| `/auth/callback` | Redirect | Post-auth redirect |
| `*` | `NotFound.tsx` | 404 page |

### State Management

**React Query (TanStack Query)**:
- Server state caching and synchronization
- Automatic refetching on window focus
- Optimistic updates for mutations
- 30s stale time for leaderboard queries

**Query Keys**:
- `["vote-matchup"]` - Current voting matchup
- `["leaderboard"]` - All companies with stats
- `["company", companyId]` - Individual company
- `["companyEloHistory", companyId]` - Historical Elo data
- `["companyReviews", companyId]` - Company reviews

**Context API**:
- `SupabaseAuthProvider` provides:
  - `session` - Current auth session
  - `user` - Current user object
  - `loading` - Auth loading state
  - `signIn()`, `signUp()`, `signOut()` methods

### Data Layer: `src/data/companies.ts`

Central API layer with TypeScript interfaces and functions.

**Key Functions**:
- `fetchLeaderboardCompanies()` - Get all companies sorted by rank
- `fetchCompanyLeaderboardEntry(id)` - Get single company data
- `fetchCompanyEloHistory(id)` - Get historical ratings
- `fetchCompanyReviews(id)` - Get company reviews
- `submitReview(...)` - Create new review
- `toggleReviewReaction(reviewId, userId)` - Like/unlike
- `recordMatchup(...)` - Submit vote (calls Edge Function)
- `fetchVoteMatchup()` - Get random matchup for voting

**Smart Matchmaking Algorithm**:
```typescript
1. Fetch all companies from leaderboard
2. Select random company A
3. Filter opponents within 300 Elo points of A
4. Select random company B from filtered list
5. If no opponents within range, select any random company B
6. Return matchup pair
```

### Key Pages

#### 1. Vote.tsx (Main Page)

**Features**:
- Head-to-head company voting interface
- Real-time Elo updates with animations
- hCaptcha integration (invisible)
- Session token management (localStorage)
- Responsive layout with mobile optimization
- Matrix-style hidden stats animation
- Vote count display
- Rate limit error handling

**UX Flow**:
```
1. Load random matchup
   ↓
2. Display two companies with hidden stats
   ↓
3. User selects winner or draw
   ↓
4. Verify captcha (first time only)
   ↓
5. Animate stats reveal with delta changes
   ↓
6. Auto-load next matchup after 900ms
   ↓
7. Update leaderboard cache
```

**Key State Variables**:
- `matchup` - Current company pair
- `selectedWinner` - User's choice
- `isSubmitting` - Loading state
- `showHCaptcha` - Captcha visibility
- `voteCount` - Number of votes cast this session

**Advanced Features**:
- Viewport size detection for responsive design
- Animated stat changes (counting animation)
- Winner/loser visual feedback
- Skip functionality (loads new matchup)
- Error recovery with toast notifications

#### 2. Leaderboard.tsx

**Features**:
- Podium display for top 3 companies
- Scrollable list for remaining companies
- Search/filter functionality
- Company card highlights on search selection
- Tier badges (S+, S, A+, A, B+, B, C+, C, D+, D, F)
- Medal icons for top 3 (gold, silver, bronze)
- Review stats integration
- Pay/culture/prestige stats display

**Visual Design**:
- Gold/silver/bronze gradient effects
- Shine animations for podium
- Responsive grid layout
- Hover effects on cards

**Tier Calculation** (`src/lib/elo.ts`):
- S+: 2200+
- S: 2000-2199
- A+: 1850-1999
- A: 1700-1849
- B+: 1600-1699
- B: 1500-1599
- C+: 1400-1499
- C: 1300-1399
- D+: 1200-1299
- D: 1100-1199
- F: <1100

#### 3. Reviews.tsx

**Features**:
- Grid layout of company cards
- Search by name or tags
- Latest review preview
- Star rating display
- Direct links to company pages
- Empty state handling

#### 4. CompanyDetails.tsx

**Features** (based on routing):
- Detailed company information
- All reviews for company
- Elo history chart (via recharts)
- Review submission form
- Like/unlike reviews
- Historical rating trend visualization

### Component Architecture

**UI Components** (`src/components/ui/`):
- Built with Radix UI primitives
- Styled with Tailwind CSS
- Consistent design system via shadcn/ui
- Components include:
  - `Button`, `Card`, `Dialog`, `Input`, `Label`
  - `Select`, `Tabs`, `Tooltip`, `Avatar`
  - `TierBadge` (custom) - Elo tier display
  - `Chart` components - Data visualization

**Key Custom Components**:
- `Navigation` - Responsive nav bar with mobile menu
- `AuthDialog` - Login/signup modal
- `SiteFooter` - Footer with social links

### Styling System

**Tailwind Configuration**:
- **Custom Colors**:
  - Gold, silver, bronze (podium)
  - Vote-win, vote-lose (voting feedback)
  - Sidebar color variants
- **Custom Animations**:
  - `accordion-down`, `accordion-up`
  - `vote-left`, `vote-right`
  - `slide-up`, `pulse-gold`
- **Responsive Breakpoints**: Default Tailwind
- **Dark Mode**: Class-based strategy (ready for dark theme)

**CSS Variables** (`src/index.css`):
- HSL-based color system
- Easy theming via CSS custom properties
- Defined for background, foreground, primary, secondary, etc.

---

## Data Flow Examples

### Complete Voting Flow

```
┌──────────────┐
│ User loads   │
│ Vote page    │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│ fetchVoteMatchup()           │
│ → Query company_leaderboard  │
│ → Smart matchmaking          │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Display two companies        │
│ (stats hidden)               │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ User selects winner          │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Check localStorage for       │
│ valid session token          │
└──────┬───────────────────────┘
       │
       ├─── Valid? ───┐
       │              │
   No  │              │ Yes
       │              │
       ▼              │
┌────────────┐        │
│ Show       │        │
│ hCaptcha   │        │
└─────┬──────┘        │
      │               │
      ▼               │
┌────────────┐        │
│ Wait for   │        │
│ user solve │        │
└─────┬──────┘        │
      │               │
      └───────┬───────┘
              │
              ▼
┌──────────────────────────────┐
│ POST /vote Edge Function     │
│ Body: {                      │
│   companyA, companyB,        │
│   result, sessionToken,      │
│   hCaptchaToken              │
│ }                            │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Edge Function validates:     │
│ - CORS origin                │
│ - Request payload            │
│ - Session token OR captcha   │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Call record_matchup() RPC    │
│ (using service role)         │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Database function:           │
│ 1. Rate limiting checks      │
│ 2. Row-level locking         │
│ 3. Elo calculation           │
│ 4. Update company_elo        │
│ 5. Insert matchup record     │
│ 6. Insert elo_history        │
│ 7. Return new ratings        │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Edge Function response:      │
│ - New Elo data               │
│ - Fresh session token        │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Frontend updates:            │
│ 1. Store session token       │
│ 2. Animate stat changes      │
│ 3. Invalidate React Query    │
│    caches                    │
│ 4. Auto-load next matchup    │
│    (900ms delay)             │
└──────────────────────────────┘
```

### Review Submission Flow

```
┌──────────────────────┐
│ User fills form      │
│ on CompanyDetails    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Client validation    │
│ (Zod schema)         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ submitReview()       │
│ → Supabase insert    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Database checks:             │
│ - Profanity filter           │
│ - User authenticated         │
│ - Required fields present    │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────┐
│ Insert review        │
│ (status: published)  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Trigger: moddatetime │
│ (updates updated_at) │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────┐
│ React Query invalidates:     │
│ - ["companyReviews", id]     │
│ - ["company", id]            │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────┐
│ UI updates with      │
│ new review           │
└──────────────────────┘
```

### Authentication Flow

```
┌──────────────────────┐
│ User clicks          │
│ login/signup         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ AuthDialog modal     │
│ opens                │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────┐
│ User enters credentials      │
│ (email, password, username)  │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ supabase.auth.signUp() or    │
│ signInWithPassword()         │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────┐
│ Supabase Auth        │
│ validates            │
└──────┬───────────────┘
       │
       ├─── Signup? ───┐
       │               │
       │ Yes           │ No (login)
       │               │
       ▼               │
┌────────────────────┐ │
│ handle_new_user()  │ │
│ trigger fires      │ │
└─────┬──────────────┘ │
      │                │
      ▼                │
┌────────────────────┐ │
│ Generate unique    │ │
│ username           │ │
└─────┬──────────────┘ │
      │                │
      ▼                │
┌────────────────────┐ │
│ Profanity check    │ │
└─────┬──────────────┘ │
      │                │
      ▼                │
┌────────────────────┐ │
│ Create profile     │ │
└─────┬──────────────┘ │
      │                │
      └────────┬───────┘
               │
               ▼
┌──────────────────────────────┐
│ Session stored in            │
│ localStorage                 │
│ (Supabase client auto)       │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────┐
│ SupabaseAuthProvider │
│ updates context      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ UI re-renders with   │
│ user info            │
└──────────────────────┘
```

---

## Security Architecture

### Multi-Layer Security

**1. Database Level**:
- **Row Level Security (RLS)** policies
- **Profanity checking** (database constraints)
- **Input validation** (CHECK constraints)
- **Username uniqueness** enforcement
- **Rate limiting** in `record_matchup()`
- **Atomic transactions** with row-level locking

**2. Edge Function Level**:
- **hCaptcha bot protection**
- **CORS origin validation**
- **Request payload validation**
- **Session token verification** (HMAC-SHA256)
- **Service role isolation** (elevated permissions)
- **IP extraction** and rate limit delegation

**3. Frontend Level**:
- **Environment variable validation**
- **Error boundary** handling
- **Client-side form validation** (Zod schemas)
- **XSS prevention** (React auto-escaping)
- **Session token** persistence and validation
- **HTTPS only** (enforced by Vercel)

### Rate Limiting Strategy

**Comprehensive Multi-Vector Limits**:

| Limit Type | Threshold | Window | Purpose |
|------------|-----------|--------|---------|
| IP burst | 12 votes | 10 min | Prevent rapid-fire abuse |
| IP per company | 6 votes | 24 hours | Prevent targeting |
| Authenticated user | 15 votes | 6 hours | Account-based limit |
| Matchup coordination | 40 votes | 90 seconds | Prevent coordinated attacks |
| Consecutive draws | 2 draws | N/A | Prevent draw spam |

**Enforcement**: All limits enforced atomically in `record_matchup()` database function. Cannot be bypassed via API manipulation.

**Error Responses**:
- Rate limit exceeded: Returns JSON error with retry time
- Frontend displays toast notification
- User can retry after cooldown period

### Session Token System

**Purpose**: Reduce captcha friction after first verified vote

**Algorithm**:
- HMAC-SHA256 signature
- Payload: `{ ip, userId, timestamp }`
- Secret: 32+ character random string (env var)
- TTL: 1 hour default (configurable)

**Validation**:
- IP must match originating request
- User ID must match (if authenticated)
- Timestamp must be within TTL
- Signature must verify

**Security Properties**:
- Cannot be forged without secret
- Bound to specific IP and user
- Time-limited
- Stateless (no database lookups)

---

## Configuration & Environment

### Environment Variables

**Frontend** (`.env.local`):
```env
VITE_SUPABASE_URL=https://krojodtkkayrjlsdgmcn.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
VITE_SUPABASE_FUNCTION_URL=https://krojodtkkayrjlsdgmcn.functions.supabase.co
VITE_HCAPTCHA_SITE_KEY=<site_key>
```

**Backend** (Supabase Secrets - set via CLI):
```env
HCAPTCHA_SECRET_KEY=<secret>
ALLOWED_VOTE_ORIGINS=https://ratemycompany.ca
VOTE_SESSION_SECRET=<random_32+_chars>
VOTE_SESSION_TTL=3600
SUPABASE_URL=<auto_provided>
SUPABASE_SERVICE_ROLE_KEY=<auto_provided>
```

### Configuration Files

**`vite.config.ts`**:
- React SWC plugin (fast refresh)
- Path alias: `@` → `./src`
- Dev server port: 8080
- Component tagger for development

**`tailwind.config.ts`**:
- Custom color system (gold, silver, bronze, etc.)
- Animation keyframes
- Responsive container
- Plugin: tailwindcss-animate

**`vercel.json`**:
- SPA routing: all routes → `index.html`
- Ensures client-side routing works

**`tsconfig.json`**:
- Strict TypeScript settings
- Path resolution for `@/` alias
- ES2020 target
- React JSX transform

**`package.json`**:
- Scripts: `dev`, `build`, `build:dev`, `lint`, `preview`
- Type: module (ESM)
- Private: true (not published to npm)

---

## Database Migrations

**Migration History** (chronological):

1. **20250221000100_reapply_schema.sql**
   - Initial schema setup (likely full schema)

2. **20251019202037_remote_schema.sql**
   - Remote schema synchronization

3. **20251021090000_secure_vote_permissions.sql**
   - Enhanced RLS policies for voting
   - Service role permissions

4. **20251106000100_optimize_rls_policies.sql**
   - Performance improvements to RLS
   - Index optimizations

5. **20251107090000_vote_rate_limits.sql**
   - Comprehensive rate limiting system
   - Draw violation tracking

6. **20251107093000_fix_record_matchup_alias.sql**
   - Bug fix for function alias
   - Ensures RPC calls work correctly

7. **20251107094500_remove_company_elo_caps.sql**
   - Removed company-specific Elo caps for Tesla, Tata, and Walmart
   - All companies now follow the same rating rules (800-3100 range)
   - Simplified record_matchup function by removing cap logic

8. **20251107100000_adjust_k_factors.sql**
   - Adjusted K-factors to align with chess rating system
   - Removed overly aggressive K-factor reduction at high ratings
   - Changed from K=4 minimum to K=10 minimum (chess standard)
   - New thresholds: 2400+ (K=16), 2600+ (K=12), 2800+ (K=10)
   - Makes rating changes more meaningful and responsive

**Current Schema**: `supabase/schema.sql` (complete schema export)

**Migration Strategy**:
- Sequential numbered migrations
- Timestamped for ordering
- Can be replayed on fresh database
- Includes both DDL and DML

---

## Performance Optimizations

### Frontend Optimizations
- **Vite** for fast HMR and builds
- **React SWC** for fast compilation
- **React Query** caching (30s stale time for leaderboard)
- **Lazy loading** potential (code splitting not yet implemented)
- **Responsive images** (optimized logo URLs)
- **Vercel CDN** for global edge delivery

### Backend Optimizations
- **Database indexes** on frequently queried columns
- **Views** for complex queries (precomputed joins)
- **Edge Functions** minimize cold starts (Deno runtime)
- **Connection pooling** (Supabase managed)
- **Row-level locking** (prevents race conditions)
- **Atomic transactions** (consistency without overhead)

### Caching Strategy
- **React Query** cache with selective invalidation
- **Session tokens** (1 hour TTL) reduce captcha API calls
- **View materialization** (potential future optimization)
- **Browser localStorage** for session persistence

---

## Deployment Architecture

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────────┐
│   Vercel CDN (Global)       │
│   - Static assets           │
│   - SPA routing             │
│   - SSL/TLS termination     │
└────────┬────────────────────┘
         │
         ├────────────────┬────────────────┐
         │                │                │
         ▼                ▼                ▼
┌────────────────┐  ┌────────────┐  ┌──────────────────┐
│  Supabase Edge │  │  Supabase  │  │  Supabase        │
│  Functions     │  │  Auth      │  │  PostgreSQL      │
│  (Deno)        │  │            │  │                  │
│                │  │            │  │  - Tables        │
│  - /vote       │  │  - JWT     │  │  - Functions     │
│                │  │  - Email   │  │  - Views         │
└────────────────┘  └────────────┘  └──────────────────┘
         │                │                │
         └────────────────┴────────────────┘
                         │
                         ▼
                ┌────────────────┐
                │   hCaptcha API │
                │   (Captcha     │
                │   Verification)│
                └────────────────┘
```

**Components**:
- **Vercel**: Frontend hosting, CDN, SSL
- **Supabase**: Backend, database, auth, functions
- **hCaptcha**: Bot protection
- **Vercel Analytics**: Usage tracking

---

## Development Workflow

### Local Development

**Start dev server**:
```bash
npm run dev
# or
bun dev
```
Runs on http://localhost:8080

**Build for production**:
```bash
npm run build
```

**Preview production build**:
```bash
npm run preview
```

**Lint code**:
```bash
npm run lint
```

### Supabase Local Development

**Note**: Currently, Supabase is NOT running locally. All development uses the remote Supabase instance.

**To start local Supabase** (if needed):
```bash
supabase start
```

**Apply migrations**:
```bash
supabase db reset  # Reset and apply all migrations
# or
supabase db push   # Push migrations to remote
```

**Generate TypeScript types**:
```bash
supabase gen types typescript --project-id krojodtkkayrjlsdgmcn > src/types/supabase.ts
```

### Git Workflow

**Recent Commits**:
- `940ce52` - Fixed spacing on all devices
- `693c621` - Frontend fix
- `6678c59` - New
- `bd11181` - Error message
- `b42adaf` - Frontend error fix

**Current Branch**: `main`

**Status**: Clean working directory

### Deployment

**Frontend**:
- **Platform**: Vercel
- **Trigger**: Push to `main` branch
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**: Set in Vercel dashboard

**Backend**:
- **Platform**: Supabase
- **Edge Functions**: Deploy via Supabase CLI
  ```bash
  supabase functions deploy vote
  ```
- **Database**: Migrations applied via CLI or dashboard

---

## API Reference

### Supabase Client Functions

**Voting**:
```typescript
recordMatchup(
  companyA: string,
  companyB: string,
  result: 'a' | 'b' | 'draw',
  sessionToken?: string,
  hCaptchaToken?: string
): Promise<VoteResponse>
```

**Leaderboard**:
```typescript
fetchLeaderboardCompanies(): Promise<LeaderboardCompany[]>
```

**Company Details**:
```typescript
fetchCompanyLeaderboardEntry(id: string): Promise<LeaderboardCompany>
fetchCompanyEloHistory(id: string): Promise<EloHistoryEntry[]>
```

**Reviews**:
```typescript
fetchCompanyReviews(id: string): Promise<Review[]>
submitReview(review: ReviewSubmission): Promise<Review>
toggleReviewReaction(reviewId: string, userId: string): Promise<void>
```

**Authentication**:
```typescript
supabase.auth.signUp({ email, password, options: { data: { username } } })
supabase.auth.signInWithPassword({ email, password })
supabase.auth.signOut()
```

### Edge Function Endpoint

**POST** `https://krojodtkkayrjlsdgmcn.functions.supabase.co/vote`

**Headers**:
```
Content-Type: application/json
Origin: https://ratemycompany.ca
```

**Request Body**:
```json
{
  "companyA": "uuid",
  "companyB": "uuid",
  "result": "a" | "b" | "draw",
  "sessionToken": "hmac-signed-token",
  "hCaptchaToken": "token-from-captcha",
  "userId": "uuid (optional)"
}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "company_id": "uuid",
      "rating": 1532,
      "rank": 15,
      "matches_played": 123,
      "wins": 67,
      "losses": 54,
      "draws": 2
    },
    { /* company B data */ }
  ],
  "sessionToken": "new-hmac-signed-token"
}
```

---

## Key Design Patterns

### 1. Serverless Architecture
- **Edge Functions** for compute
- **Database functions** for business logic
- **Static frontend** on CDN (Vercel)
- **No traditional backend** server

### 2. Optimistic UI Updates
- React Query mutations
- Immediate UI feedback
- Rollback on error
- Cache invalidation

### 3. Separation of Concerns
- **Data layer**: `src/data/companies.ts`
- **Business logic**: Database functions
- **Presentation**: React components
- **State management**: React Query + Context

### 4. Progressive Enhancement
- Session tokens reduce captcha friction
- Fallback for missing data (N/A, placeholders)
- Graceful error handling
- Works without JavaScript for basic content

### 5. Type Safety
- TypeScript throughout frontend
- Zod schemas for runtime validation
- Supabase type inference
- Database constraints for integrity

### 6. Security in Depth
- Database-level RLS
- Edge Function validation
- Frontend input sanitization
- Multi-layer rate limiting

---

## Future Enhancement Ideas

**Performance**:
- Implement code splitting (React.lazy)
- Add service worker for offline support
- Materialize views for faster queries
- Add Redis caching layer

**Features**:
- User profiles and public stats
- Company comparison tool
- Advanced filtering (by tags, location, etc.)
- Review voting (helpful/not helpful)
- Email notifications
- Social sharing

**Analytics**:
- Vote trends over time
- Company momentum tracking
- User engagement metrics
- A/B testing framework

**UX**:
- Dark mode implementation
- Accessibility improvements (ARIA labels)
- Keyboard navigation
- Mobile app (React Native)

**Infrastructure**:
- Database query performance monitoring
- Error tracking (Sentry)
- Product analytics (PostHog)
- Automated testing (Jest, Playwright)

---

## Troubleshooting

### Common Issues

**1. "Rate limit exceeded" when voting**:
- **Cause**: Too many votes from same IP
- **Solution**: Wait for cooldown period (check error message)
- **Prevention**: Distribute votes over time

**2. hCaptcha keeps appearing**:
- **Cause**: Session token expired or invalid
- **Solution**: Clear localStorage and vote again
- **Check**: Session token in localStorage (`vote_session_token`)

**3. Elo ratings not updating**:
- **Cause**: Database function error or rate limit
- **Check**: Browser console for errors
- **Solution**: Report issue if persistent

**4. Reviews not showing**:
- **Cause**: Status is "draft" or profanity filter triggered
- **Check**: Database for review status
- **Solution**: Ensure review is "published" and profanity-free

**5. Local Supabase not working**:
- **Cause**: Containers not running
- **Solution**: `supabase start`
- **Check**: `supabase status`

### Debug Tools

**React Query Devtools**:
```typescript
// Add to App.tsx (development only)
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<ReactQueryDevtools initialIsOpen={false} />
```

**Supabase Logs**:
```bash
supabase functions logs vote
```

**Database Query Performance**:
```sql
EXPLAIN ANALYZE SELECT * FROM company_leaderboard;
```

---

## Contact & Resources

**Documentation**:
- Supabase Docs: https://supabase.com/docs
- React Query Docs: https://tanstack.com/query/latest
- Radix UI Docs: https://www.radix-ui.com/primitives
- Tailwind CSS Docs: https://tailwindcss.com/docs

**Project Links**:
- Live Site: https://ratemycompany.ca
- Supabase Dashboard: https://supabase.com/dashboard/project/krojodtkkayrjlsdgmcn

---

## Summary

RateMyCompany is a sophisticated full-stack application demonstrating modern web development best practices:

**Strengths**:
- ✅ Robust backend with comprehensive rate limiting
- ✅ Secure API with bot protection and session management
- ✅ Modern frontend with elegant UI and animations
- ✅ Type-safe end-to-end (TypeScript + Zod)
- ✅ Performance-optimized (Vite, React Query, database indexes)
- ✅ Multi-layer security (RLS, Edge Functions, client validation)
- ✅ Smooth UX with progressive enhancement

**Architecture Highlights**:
- Serverless Edge Functions (Deno runtime)
- PostgreSQL with advanced stored procedures
- Chess Elo algorithm for dynamic rankings
- HMAC-signed session tokens for reduced friction
- React Query for sophisticated caching
- Radix UI + Tailwind for accessible, responsive design

**Codebase Quality**:
- Well-organized file structure
- Clear separation of concerns
- Comprehensive error handling
- Atomic database operations
- Minimal external dependencies

This documentation provides a complete reference for understanding, maintaining, and extending the RateMyCompany application.
