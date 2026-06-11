# Tracium - Slack AI Risk Intelligence Agent

Tracium is an AI-powered risk intelligence agent that monitors Slack team conversations and identifies potential risks in product, engineering, marketing, operational, launch, and security domains.

> Tracium is NOT a chatbot. It's a passive monitoring agent that analyzes team messages and proactively alerts teams to potential risks.

## Features

### Risk Detection
- **Risk Scoring (1-10):** Quantifies risk severity objectively
- **Category Classification:** Identifies risk type (product, engineering, marketing, operational, launch, security)
- **Consequence Analysis:** Explains what could go wrong
- **Safer Alternatives:** Suggests better approaches
- **Action Items:** Recommends specific next steps

### Intelligence Extraction
- **Decision Detection:** Extracts and stores team decisions
- **Action Item Extraction:** Identifies tasks and owners
- **Unresolved Discussion Detection:** Flags discussions needing follow-up

### Data Persistence
All extracted insights are stored in Supabase for future reporting:
- Risk events with full analysis
- Team decisions with owners
- Action items with status tracking

### Future Integrations (Prepared)
Architecture ready for:
- Jira
- GitHub Issues
- GitLab Issues
- Linear

## Example

**Team Message:**
> "Let's disable payment validation temporarily."

**Tracium Response:**
```
🚨 Tracium Risk Detected ⚠️

Risk Score: 8.7/10
Category: Security

Potential Consequences:
Invalid transactions could process without proper verification,
leading to revenue leakage and compliance violations.

Suggested Alternative:
Use feature flags to gradually roll out changes while maintaining
validation checks, with proper monitoring in place.

Recommended Action:
Create a rollout plan with approval review from security and finance teams.

This is an automated risk analysis. Please review carefully before proceeding.
```

## Architecture

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Slack Workspace    │────▶│  Next.js API     │────▶│  Qwen API       │
│  (Events API)       │     │  (Vercel)        │     │  (Reasoning)    │
└─────────────────────┘     └──────────────────┘     └─────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │  Supabase        │
                            │  (Data Storage)  │
                            └──────────────────┘
```

## Setup Instructions

### 1. Slack App Setup

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and create a new app
2. Choose "From scratch" and name it "Tracium"
3. Under **OAuth & Permissions**, add these Bot Token Scopes:
   - `chat:write` - Post risk alerts in threads
   - `channels:history` - Read channel messages
   - `channels:read` - Access channel info
   - `groups:history` - Read private channel messages
   - `groups:read` - Access private channels
   - `mpim:history` - Read multi-party DM messages
   - `mpim:read` - Access multi-party DMs
   - `im:history` - Read direct messages
   - `im:read` - Access DMs

4. Install the app to your workspace and note the **Bot User OAuth Token** (starts with `xoxb-`)

5. Under **Basic Information**, find your **Signing Secret**

6. Under **Event Subscriptions**:
   - Enable events
   - Set Request URL to your deployed endpoint: `https://your-app.vercel.app/api/slack/events`
   - Subscribe to bot events: `message.channels`, `message.groups`, `message.im`, `message.mpim`

7. Invite Tracium to channels where you want risk monitoring

### 2. Qwen API Setup

1. Go to [Alibaba Cloud DashScope](https://dashscope.console.aliyun.com/)
2. Create an account and obtain an API key
3. Note the base URL for international access:
   - International: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

### 3. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Get your project URL and service role key from Settings > API
3. The database tables (decisions, action_items, risk_events) are created automatically via migrations

### 4. Vercel Deployment

1. Fork or clone this repository
2. Connect to [Vercel](https://vercel.com)
3. Add environment variables (see below)
4. Deploy

### Environment Variables

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret

# Qwen API Configuration
QWEN_API_KEY=your-qwen-api-key
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-plus

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Risk Categories

Tracium monitors for risks across six domains:

| Category | Description | Example Keywords |
|----------|-------------|------------------|
| **Product** | User experience, market fit, research | "skip user research", "no user testing" |
| **Engineering** | Technical quality, architecture | "disable", "bypass", "skip tests", "hack" |
| **Marketing** | Messaging integrity, claims | "oversell", "exaggerate" |
| **Operational** | Process, coordination | "ignore alert", "skip process" |
| **Launch** | Release risks, deployment | "launch anyway", "no rollback" |
| **Security** | Vulnerabilities, access | "disable auth", "skip security" |

## API Endpoints

### POST /api/slack/events

Handles Slack Events API requests:
- URL verification (during app setup)
- Message event processing for risk analysis

## Database Schema

### decisions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| channel | TEXT | Slack channel ID |
| decision | TEXT | Extracted decision |
| owner | TEXT | Decision owner (if identified) |
| slack_ts | TEXT | Message timestamp |
| created_at | TIMESTAMPTZ | Record creation time |

### action_items
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| channel | TEXT | Slack channel ID |
| task | TEXT | Action item description |
| owner | TEXT | Task owner (if identified) |
| status | TEXT | Current status (default: pending) |
| created_at | TIMESTAMPTZ | Record creation time |
| updated_at | TIMESTAMPTZ | Last update time |

### risk_events
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| channel | TEXT | Slack channel ID |
| message | TEXT | Original message |
| risk_score | DECIMAL(3,1) | Risk score (1-10) |
| category | TEXT | Risk category |
| consequences | TEXT | Potential consequences |
| alternative | TEXT | Suggested alternative |
| action_item | TEXT | Recommended action |
| created_at | TIMESTAMPTZ | Record creation time |

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck
```

## Tech Stack

- **Framework:** Next.js 13 (App Router)
- **Runtime:** Node.js
- **LLM:** Qwen (via DashScope API)
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **Integration:** Slack Web API

## License

MIT
