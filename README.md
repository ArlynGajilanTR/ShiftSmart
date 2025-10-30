# ShiftSmart v1

A modern shift scheduling application with intelligent role balancing and conflict detection.

## Features

- 📅 **Multi-View Scheduling**: Week, month, quarter, and special event views
- 👥 **Role-Based Balancing**: Ensures proper skill mix coverage (no all-junior shifts)
- 🖱️ **Drag & Drop Interface**: Intuitive shift assignment
- ⚠️ **Smart Warnings**: Soft and hard conflict detection
- 🏢 **Bureau Management**: Multi-bureau support with easy toggling
- 💾 **CSV Import**: Easy data seeding from existing schedules
- 🔐 **Secure Authentication**: Powered by Supabase

## Tech Stack

- **Frontend**: Next.js 15 with React & TypeScript
- **Styling**: Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL)
- **Drag & Drop**: @dnd-kit
- **State Management**: Zustand
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Then fill in your Supabase credentials.

4. Run database migrations (see `supabase/` directory)

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
shiftsmart-v1/
├── app/                    # Next.js app router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Main app routes
│   └── api/               # API routes
├── components/            # React components
│   ├── calendar/          # Calendar & scheduling UI
│   ├── auth/              # Authentication components
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities & helpers
│   ├── supabase/          # Supabase client & helpers
│   ├── scheduling/        # Scheduling logic
│   └── validation/        # Validation & conflict detection
├── types/                 # TypeScript definitions
├── supabase/              # Database schema & migrations
└── data/                  # CSV seed data

```

## Database Schema

See `supabase/schema.sql` for the complete database schema including:
- Users & roles
- Bureaus & teams
- Shifts & assignments
- Preferences & constraints
- Audit logs

## CSV Import

Place your CSV files in the `data/` directory and run:
```bash
npm run seed
```

## Contributing

This is a private project. For questions, contact the development team.

## License

Proprietary - All rights reserved
