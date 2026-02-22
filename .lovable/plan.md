

# Enhanced Platform Dashboard -- Business Intelligence

## Overview

Build a comprehensive business command center for the platform admin dashboard with financial tracking, engagement metrics, and platform health monitoring. Includes a 14-day inactivity threshold for church churn risk (instead of 30 days).

## Database Changes

### New table: `platform_expenses`
Stores manually entered cost line items. Only platform admins can CRUD.

| Column | Type | Default |
|--------|------|---------|
| id | uuid PK | gen_random_uuid() |
| name | text | -- |
| amount_cents | integer | -- |
| frequency | text | 'monthly' |
| category | text | 'other' |
| notes | text (nullable) | NULL |
| created_at | timestamptz | now() |
| updated_at | timestamptz | now() |

RLS: All operations restricted to `is_platform_admin(auth.uid())`.

### New table: `platform_cost_config`
Stores unit-cost assumptions for auto-calculation.

| Column | Type | Default |
|--------|------|---------|
| id | uuid PK | gen_random_uuid() |
| key | text (unique) | -- |
| value_cents | integer | 0 |
| label | text | -- |
| updated_at | timestamptz | now() |

RLS: All operations restricted to `is_platform_admin(auth.uid())`.

Seed defaults: `base_hosting_monthly` = 2500 ($25), `cost_per_sermon` = 50 ($0.50), `cost_per_member` = 0.

### New RLS policy on `sermon_jobs`
Add a SELECT policy for platform admins so the dashboard can show pipeline status.

## Dashboard Sections

### 1. Enhanced Stats Row
Keep existing 5 cards, add:
- **Active Users (7d)** -- distinct users with events in last 7 days
- **Active Users (30d)** -- same for 30 days
- **Avg Members / Church** -- quick health ratio

### 2. Financial Overview
- **Auto-calculated estimates**: base hosting + (sermons x cost-per-sermon) + (members x cost-per-member)
- **Manual expenses**: add/edit/delete line items (name, amount, frequency, category)
- **Summary**: total monthly burn, revenue placeholder ($0 -- "No pricing plan yet"), net burn
- **Cost config button**: dialog to adjust unit-cost assumptions

### 3. Growth Charts (enhanced)
- Keep 30-day signup chart
- Add toggle to switch between Signups, App Opens, Give Taps
- Trend indicator (percentage vs prior period)

### 4. Engagement Metrics
- DAU/MAU ratio
- Average app opens per user per week
- **Churches with zero activity in last 14 days** (churn risk -- flagged prominently)

### 5. Platform Health Card
This shows operational status of all backend workflows:
- **Sermon pipeline**: count of jobs by status (queued, processing, completed, failed)
- **Recent failures**: list of last 5 failed jobs with error messages and timestamps
- **Processing success rate**: percentage of completed vs total jobs
- **Storage usage estimate** based on sermon count
- Visual status indicator (green/yellow/red) based on failure rate

## File Changes

### Modified
- **`src/hooks/usePlatformAnalytics.ts`** -- add queries for: sermon_jobs (grouped by status + recent failures), platform_expenses, platform_cost_config, active user counts (7d/30d via analytics_events), churches with no events in 14 days
- **`src/pages/platform/PlatformDashboard.tsx`** -- restructure layout into sections using new components; enhanced stats row at top, then financial + health side by side, then charts + engagement

### New Components
- **`src/components/platform/FinancialOverview.tsx`** -- auto costs + manual expense table with add/edit/delete buttons + cost config access
- **`src/components/platform/ExpenseDialog.tsx`** -- form dialog for creating/editing a manual expense (name, amount, frequency, category, notes)
- **`src/components/platform/CostConfigDialog.tsx`** -- form to adjust unit-cost assumptions
- **`src/components/platform/EngagementMetrics.tsx`** -- DAU/MAU ratio, avg opens/user/week, 14-day inactive churches list
- **`src/components/platform/PlatformHealthCard.tsx`** -- sermon pipeline status bars, failure list with error details, success rate gauge, overall health indicator

## Build Order
1. Database migration: create tables, seed cost config, add sermon_jobs RLS policy
2. Update `usePlatformAnalytics` hook with all new queries
3. Build dialog components (ExpenseDialog, CostConfigDialog)
4. Build dashboard section components (FinancialOverview, EngagementMetrics, PlatformHealthCard)
5. Restructure PlatformDashboard to compose all sections

