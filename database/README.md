# Database Setup Guide

This directory contains all database-related scripts organized by type.

## Directory Structure

- `migrations/` - Schema creation scripts (18 tables)
- `functions/` - PostgreSQL functions (RPC) - 15+ functions
- `triggers/` - Database triggers - 8 triggers
- `policies/` - Row Level Security policies - ~40 policies
- `views/` - Database views - 4 views
- `seeds/` - Sample data for testing

## Setup Order

Execute scripts in this order:

1. **Migrations** (create tables) - Phase 1
2. **Functions** (create RPC functions) - Phase 2
3. **Triggers** (create triggers) - Phase 3
4. **Views** (create views) - Phase 4
5. **Policies** (enable RLS and create policies) - Phase 5
6. **Seeds** (optional - sample data)

## Execution

Run scripts via Supabase Dashboard SQL Editor or Supabase CLI.

### Via Dashboard:
1. Go to SQL Editor in Supabase Dashboard
2. Copy script content
3. Execute

### Via CLI:
```bash
supabase db push
```

## Type Generation

After schema changes, regenerate TypeScript types:

```bash
supabase gen types typescript --linked > src/types/database.types.ts
```

## Current Status

- [ ] Phase 1: Tables created (0/18)
- [ ] Phase 2: Functions created (0/15+)
- [ ] Phase 3: Triggers created (0/8)
- [ ] Phase 4: Views created (0/4)
- [ ] Phase 5: RLS Policies created (0/~40)
