# Yoga Class Tracker

A modern web application for yoga instructors to track classes, manage students, and monitor session balances.

## Features

### Current Implementation (v0.3)
- ✅ **Calendar View**: Interactive monthly calendar to view and manage sessions
- ✅ **Calendar Day View**: Detailed timeline view for specific dates (Google Calendar-style)
  - 30-minute time slots from 06:00 to 22:00
  - Session creation by clicking time slots
  - Day summary statistics
  - Session status color coding
- ✅ **Session Management**: Complete session lifecycle management
  - Create sessions with time slots and multiple students
  - Session editing and status updates
  - Complete sessions (auto-deduct balances)
  - Cancel sessions (preserve balances)
  - Session type tracking (Private/Team)
  - Custom pricing per session
- ✅ **Student Management**: Advanced student management system
  - Add/view/edit students with comprehensive details
  - Track student balances (integer display, no currency symbols)
  - Student notes with automatic naming system
  - Session history with type tracking
  - Duplicate note name validation
  - Sticky headers and modal confirmation dialogs
- ✅ **Global Navigation**: Consistent back navigation across all pages
  - Smart fallback routing
  - Browser history detection
  - Reusable BackButton component
- ✅ **Settings**: Configure application settings
  - Set default session price
  - Manage available goals/tags
- ✅ **Balance Tracking**: Monitor student balances based on sessions
- ✅ **Local Storage**: All data persists in browser localStorage

### Recent Enhancements
- ✅ **Calendar Day View**: Timeline view for detailed session management
- ✅ **Session Cancellation**: Cancel sessions without affecting balances
- ✅ **Simplified Note Creation**: Automatic note naming system
- ✅ **Enhanced Student Management**: Improved UI with sticky headers
- ✅ **Global Back Navigation**: Consistent navigation across all pages
- ✅ **Session Type Tracking**: Private vs Team session differentiation
- ✅ **Balance Display**: Clean integer-only balance formatting

### Coming Soon
- 📊 Analytics and insights
- 📱 Mobile app version (Capacitor/React Native)
- 🔄 Recurring sessions
- 📄 Export/Print functionality

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

### Development Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Deploy to production
npm run deploy

# Verify deployment
npm run verify

# Clean build artifacts
npm run clean
```

### Deployment

The application includes automated deployment scripts:

- **Deploy Script**: `npm run deploy` - Automated deployment to production
- **Verification**: `npm run verify` - Verify deployment success
- **Clean**: `npm run clean` - Clean build artifacts

See `DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

## Tech Stack

- **Framework**: Next.js 15.5.6 with TypeScript 5.4.0
- **React**: React 19.2.0 with React DOM 19.2.0
- **Styling**: Tailwind CSS 3.4.0
- **UI Components**: shadcn/ui (Radix UI primitives)
  - @radix-ui/react-dialog, @radix-ui/react-select, @radix-ui/react-checkbox
  - @radix-ui/react-label, @radix-ui/react-slot
- **Date Handling**: date-fns 3.6.0
- **Icons**: Lucide React 0.379.0
- **Storage**: Browser localStorage (will migrate to database later)
- **Build Tools**: ESLint 8.57.0, PostCSS 8.4.0, Autoprefixer 10.4.0
- **Utilities**: clsx 2.1.0, tailwind-merge 2.2.0, class-variance-authority 0.7.0

## Project Structure

```
├── app/                          # Next.js app directory
│   ├── calendar/
│   │   └── day/[date]/          # Calendar Day View pages
│   ├── sessions/
│   │   ├── [id]/                # Session details and edit pages
│   │   └── new/                 # New session creation
│   ├── students/
│   │   ├── [id]/                # Student details and edit pages
│   │   └── new/                 # New student creation
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page (Calendar)
│   └── not-found.tsx            # 404 page
├── components/                  # React components
│   ├── ui/                      # Reusable UI components
│   │   ├── back-button.tsx      # Global back navigation
│   │   ├── bottom-navigation.tsx # Mobile navigation
│   │   ├── button.tsx           # Button component
│   │   ├── card.tsx             # Card component
│   │   ├── dialog.tsx           # Dialog components
│   │   └── ...                  # Other UI components
│   ├── Calendar.tsx             # Calendar component
│   ├── StudentsView.tsx         # Students list view
│   ├── SessionDialog.tsx        # Session management dialogs
│   └── ...                      # Other feature components
├── lib/                         # Utility functions and hooks
│   ├── hooks/                   # Custom React hooks
│   │   ├── useMobileSwipe.ts    # Mobile swipe gestures
│   │   ├── useSafeNavigation.ts # Safe navigation utilities
│   │   ├── useStudent.ts        # Student data hooks
│   │   └── useStudents.ts       # Students list hooks
│   ├── utils/                   # Utility functions
│   │   ├── dateUtils.ts         # Date manipulation
│   │   └── testUtils.ts         # Testing utilities
│   ├── types.ts                 # TypeScript type definitions
│   ├── storage.ts               # LocalStorage utilities
│   ├── hydrationUtils.ts       # SSR hydration utilities
│   └── utils.ts                # General utilities
├── scripts/                     # Build and deployment scripts
│   ├── deploy.sh               # Deployment script
│   ├── restart-dev.sh          # Development restart script
│   └── verify-deployment.js    # Deployment verification
├── public/                      # Static assets
└── docs/                        # Documentation files
    ├── DEPLOYMENT_GUIDE.md     # Deployment instructions
    ├── IMPLEMENTATION_SUMMARY_V2.md # Feature implementation docs
    └── ...                      # Other documentation
```

## Recent Implementations

### Calendar Day View (v0.3)
- **Timeline Interface**: 30-minute time slots from 06:00 to 22:00
- **Session Management**: Click time slots to create sessions
- **Day Statistics**: Summary cards showing session counts and student metrics
- **Navigation**: Seamless integration with existing calendar and session pages

### Session Management Enhancements
- **Session Cancellation**: Cancel sessions without affecting student balances
- **Session Types**: Private vs Team session differentiation with balance impact
- **Status Tracking**: Visual status indicators (scheduled, completed, cancelled)

### Student Management Improvements
- **Simplified Note Creation**: Automatic note naming system
- **Enhanced UI**: Sticky headers and modal confirmation dialogs
- **Balance Display**: Clean integer-only formatting (no currency symbols)
- **Duplicate Prevention**: Validation for note name uniqueness

### Global Navigation System
- **Consistent Back Navigation**: [← Back] button on all entity pages
- **Smart Fallbacks**: Intelligent routing when no browser history exists
- **Reusable Component**: Single BackButton component for maintainability

## Design Principles

Following the development rules specified:
- **Modular Components**: Every component is reusable and focused
- **Consistent Design**: Using a unified color system (green primary, zinc neutral)
- **Typography**: Limited to 4-5 font sizes for visual hierarchy
- **Spacing**: All padding/margins in multiples of 4
- **Accessibility**: Semantic HTML and ARIA roles via Radix UI
- **Visual Quality**: Proper hover states and transitions
- **Mobile-First**: Responsive design with touch-friendly interactions
- **Performance**: Optimized rendering and state management

## Documentation

- **Implementation Summaries**: Detailed documentation of recent features
- **Deployment Guide**: Complete deployment instructions
- **Business Requirements**: Comprehensive feature specifications
- **Technical Changelogs**: Version-specific implementation details

## License

Private project for personal use.
