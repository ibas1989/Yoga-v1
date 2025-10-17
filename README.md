# Yoga Class Tracker

A modern web application for yoga instructors to track classes, manage students, and monitor session balances.

## Features

### Current Implementation (v0.2)
- ✅ **Calendar View**: Interactive monthly calendar to view and manage sessions
- ✅ **Session Creation**: Add sessions with time slots (Google Calendar-style)
  - Select start and end times
  - Add multiple students per session
  - Multiple sessions per day
  - Assign session goals/tags
  - Custom pricing per session
- ✅ **Student Management**: Complete student management system
  - Add/view students
  - Track student balances
  - Assign goals to students
  - View student contact information
- ✅ **Settings**: Configure application settings
  - Set default session price
  - Manage available goals/tags
- ✅ **Balance Tracking**: Monitor student balances based on sessions
- ✅ **Local Storage**: All data persists in browser localStorage

### Coming Soon
- 📝 Session details view and editing
- 💰 Payment tracking within sessions
- ✅ Close sessions and auto-deduct balances
- 📊 Analytics and insights
- 📱 Android app version (Capacitor/React Native)

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Date Handling**: date-fns
- **Icons**: Lucide React
- **Storage**: Browser localStorage (will migrate to database later)

## Project Structure

```
├── app/                  # Next.js app directory
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── Calendar.tsx    # Calendar component
├── lib/                # Utility functions
│   ├── types.ts        # TypeScript types
│   ├── storage.ts      # LocalStorage utilities
│   └── utils.ts        # General utilities
└── public/             # Static assets
```

## Design Principles

Following the development rules specified:
- **Modular Components**: Every component is reusable and focused
- **Consistent Design**: Using a unified color system (green primary, zinc neutral)
- **Typography**: Limited to 4-5 font sizes for visual hierarchy
- **Spacing**: All padding/margins in multiples of 4
- **Accessibility**: Semantic HTML and ARIA roles via Radix UI
- **Visual Quality**: Proper hover states and transitions

## License

Private project for personal use.
