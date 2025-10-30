# Reuters Branding Implementation

## Overview
ShiftSmart has been updated to match Reuters internal branding standards as an editorial scheduling tool.

## Design Changes

### Colors
- **Primary Action**: Reuters Orange (`#FF6600`)
- **Hover State**: Dark Orange (`#E65C00`)
- **Background**: White
- **Secondary Background**: Gray shades (50-200)
- **Text**: Gray shades (600-900)
- **Removed**: All indigo/blue branding colors

### Typography
- **Font Family**: Knowledge2017 (Regular, Medium, Bold)
- **Fallback**: system-ui, -apple-system, sans-serif
- Font files location: `public/fonts/` (see README in that directory)

### Visual Elements
- **Removed**: All emojis
- **Kept**: Professional Lucide React icons only
- **Border Radius**: Reduced from `rounded-2xl` to `rounded-lg` or `rounded-md`
- **Shadows**: Subtle borders instead of heavy shadows

### Messaging
- **Changed**: From consumer/commercial to professional/internal
- **Tagline**: "Reuters Editorial Scheduling"
- **Removed**: Consumer language like "Free forever for small teams"
- **Added**: "For Reuters editors and scheduling managers only"

## Updated Files

### Core Styling
- `app/globals.css` - Added Knowledge2017 font faces and Reuters color variables
- `tailwind.config.ts` - Added Reuters orange colors and font family

### Authentication Pages
- `app/(auth)/welcome/page.tsx` - Professional welcome screen
- `app/(auth)/login/page.tsx` - Clean login form
- `app/(auth)/signup/page.tsx` - Simplified signup

### Dashboard
- `app/(dashboard)/dashboard/page.tsx` - Main dashboard with Reuters branding
- `app/(dashboard)/select-bureau/page.tsx` - Bureau selection
- `app/(dashboard)/import/page.tsx` - CSV import tool

### UI Components
- `components/ui/ViewSelector.tsx` - Period view toggle
- `components/ui/BureauToggle.tsx` - Bureau switcher dropdown
- `components/ui/ConflictPanel.tsx` - Conflict warnings display

### Calendar Components
- `components/calendar/DroppableShift.tsx` - Shift drop zones
- `components/calendar/DraggableUser.tsx` - User cards

## Color Mapping

| Old Color | New Color | Usage |
|-----------|-----------|-------|
| `indigo-600` | `#FF6600` | Primary buttons, links |
| `indigo-700` | `#E65C00` | Hover states |
| `indigo-50` | `orange-50` | Selected state backgrounds |
| `blue-*` | `gray-*` | Secondary UI elements |

## Button Styles

**Primary Button:**
```tsx
className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-medium py-3 rounded-md transition"
```

**Secondary Button:**
```tsx
className="bg-white hover:bg-gray-50 text-gray-800 font-medium py-3 rounded-md border border-gray-300 transition"
```

**Link/Text Button:**
```tsx
className="text-[#FF6600] hover:text-[#E65C00] font-medium transition"
```

## Icon Colors
- Primary icons: `text-[#FF6600]`
- Secondary icons: `text-gray-600`
- Inactive icons: `text-gray-400`

## Font Setup

To use the Knowledge2017 font:

1. Obtain font files from Reuters brand assets:
   - Knowledge2017-Regular.woff2
   - Knowledge2017-Medium.woff2
   - Knowledge2017-Bold.woff2

2. Place in `public/fonts/` directory

3. Font is already configured in `app/globals.css`

If fonts are not available, the app gracefully falls back to system fonts.

## Testing Checklist

- [ ] Welcome page shows Reuters branding
- [ ] Login/Signup forms use orange buttons
- [ ] Dashboard header shows "Reuters Editorial Scheduling"
- [ ] Save button is orange
- [ ] Bureau toggle uses orange for selected state
- [ ] View selector (Week/Month/Quarter) shows orange when active
- [ ] Drag-and-drop shows orange highlight on hover
- [ ] All links are orange
- [ ] No emojis visible anywhere
- [ ] Font renders correctly (or falls back gracefully)

## Notes

- This is designed as an internal Reuters tool, not a public SaaS product
- All consumer/marketing language has been removed
- Professional, clean interface suitable for newsroom environment
- Orange accent color matches Reuters brand guidelines

