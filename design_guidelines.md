# Unanza ERP System - Design Guidelines

## Design Approach: Carbon Design System

**Rationale:** Carbon Design System (IBM) is purpose-built for enterprise applications with complex data workflows, multiple user roles, and information-dense interfaces - perfectly aligned with Unanza's requirements.

**Core Principles:**
- Data clarity and scanability over visual decoration
- Consistent, predictable interactions across all modules
- Efficient task completion through familiar patterns
- Professional, trustworthy aesthetic for business users

---

## Typography System

**Font Stack:** IBM Plex Sans (via Google Fonts CDN)
- **Display/Headers:** 600 weight, 2xl-4xl sizes for module titles
- **Section Headers:** 600 weight, xl-2xl for card/table headers
- **Body Text:** 400 weight, base-lg for forms, descriptions
- **Data Tables:** 400 weight, sm-base for dense information
- **Labels/Metadata:** 500 weight, xs-sm for field labels, badges

**Hierarchy:**
- Module page titles: text-3xl font-semibold
- Section headers: text-xl font-semibold
- Table headers: text-sm font-medium uppercase tracking-wide
- Form labels: text-sm font-medium
- Body content: text-base
- Helper text/metadata: text-sm

---

## Layout System

**Spacing Primitives:** Tailwind units of **2, 4, 6, 8, 12, 16**
- Component padding: p-4, p-6
- Card spacing: p-6, p-8
- Section margins: mb-6, mb-8
- Table cell padding: px-4 py-3
- Form field spacing: space-y-4
- Grid gaps: gap-4, gap-6

**Grid Structure:**
- Main container: max-w-7xl mx-auto px-4
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Two-column forms: grid-cols-1 md:grid-cols-2 gap-6
- Data tables: full-width within containers

**Layout Patterns:**
- **Sidebar Navigation:** Fixed left sidebar (240px) with collapsible module sections
- **Top Bar:** Fixed header (64px) with breadcrumbs, search, notifications, user menu
- **Content Area:** Scrollable main content with consistent padding (p-6 lg:p-8)
- **Module Pages:** Header with title/actions, then content cards/tables below

---

## Component Library

### Navigation & Structure

**Sidebar:**
- Fixed left navigation with module groups (Sales, Warehouse, Financials, HR, System)
- Icon + label for each menu item
- Active state: subtle background with border-left accent
- Collapsible sub-menus for module sections
- Company logo at top, user profile at bottom

**Top Bar:**
- Breadcrumb navigation (Home / Sales / Orders / SO-001)
- Global search bar (right side)
- Notification bell icon
- User avatar with dropdown menu

**Page Header:**
- Module/page title (left)
- Action buttons (right) - primary actions like "New Order", "Export"
- Optional tabs for multi-view pages

### Data Display

**Tables:**
- Striped rows with hover state for scanability
- Sortable column headers with sort indicators
- Fixed header on scroll for long tables
- Action column (right-aligned) with icon buttons or dropdown
- Pagination footer with rows per page selector
- Checkbox column (left) for bulk actions
- Status badges in dedicated columns

**Cards:**
- White background with subtle border
- Consistent padding (p-6)
- Header with title and optional actions
- Section dividers for grouped content
- Stat cards: Large number, label below, optional trend indicator

**Status Badges:**
- Rounded pill shape with subtle background
- Draft: gray, Confirmed: blue, Delivered: purple, Invoiced: green, Paid: green
- Unpaid: red, Partial: yellow/orange
- Small size (px-3 py-1), medium weight text

**Data Lists:**
- Label-value pairs in grid layout (grid-cols-2 gap-4)
- Clear visual hierarchy between label and value
- Dividers between major sections

### Forms & Input

**Form Layout:**
- Two-column grid on desktop, single column on mobile
- Consistent field spacing (space-y-4)
- Field groups with subtle borders/backgrounds
- Required field indicators (asterisk)

**Input Fields:**
- Standard text inputs with border, focus ring
- Select dropdowns with search capability for long lists (customers, products)
- Date pickers for order dates, delivery dates
- Number inputs with steppers for quantities
- Textarea for notes/descriptions

**Form Actions:**
- Right-aligned button group at form bottom
- Primary action button + secondary/cancel
- Disabled state for invalid forms
- Loading state on submission

**Search & Filters:**
- Search bar with magnifying glass icon
- Filter sidebar or dropdown with checkboxes, date ranges
- Clear all filters option
- Active filter chips showing current selections

### Modals & Overlays

**Modals:**
- Centered overlay with dark backdrop
- Max-width constraints (max-w-2xl, max-w-4xl for complex forms)
- Header with title and close button
- Scrollable body content
- Footer with action buttons

**Slide-out Panels:**
- Right-side panel for detail views (order details, customer info)
- Full height, 400-600px width
- Close button and navigation within panel

**Toasts/Notifications:**
- Top-right corner position
- Success (green), Error (red), Warning (yellow), Info (blue)
- Auto-dismiss after 5 seconds with manual close option

### Workflow Components

**Status Workflow Indicators:**
- Horizontal stepper showing Draft → Confirmed → Delivered → Invoiced
- Completed steps: filled circles, current: outlined, pending: gray
- Connecting lines between steps

**Approval Flows:**
- Card showing request details
- Approve/Reject buttons with optional comment field
- History timeline of approval actions

### Dashboard Components

**KPI Cards:**
- Large number with label
- Trend indicator (arrow + percentage)
- Mini chart or sparkline optional
- Click to drill-down

**Charts:**
- Use Chart.js or similar library
- Bar charts for sales/inventory comparisons
- Line charts for trends over time
- Pie charts for category breakdowns
- Consistent color palette from design system

---

## Portal-Specific Design

### Vendor Portal
- Simplified navigation (only vendor-relevant sections)
- Purchase orders view with status filtering
- Document download functionality
- Restricted access indicators

### Customer Portal
- Customer-branded header area
- Order history table with search
- Invoice viewing/download
- Support contact information
- Simple, consumer-friendly interface (less dense than internal ERP)

---

## Responsive Behavior

**Breakpoints:**
- Mobile: < 768px - Single column layouts, hamburger menu, stacked tables
- Tablet: 768px - 1024px - Two-column where appropriate, simplified sidebar
- Desktop: > 1024px - Full layout with sidebar, multi-column grids

**Mobile Adaptations:**
- Tables convert to card-based lists
- Sidebar becomes slide-out drawer
- Form fields stack vertically
- Reduced padding/spacing

---

## Animations & Micro-interactions

**Minimal, Purposeful Only:**
- Smooth transitions on hover states (150ms)
- Loading spinners for data fetching
- Slide-in animations for modals/panels (200ms)
- Fade-in for toasts/notifications
- No decorative animations - focus on feedback and state changes

---

## Images

**Product Images:**
- Square thumbnails (80px) in product lists
- Larger preview (300px) on product detail pages
- Placeholder image for products without photos

**Employee Photos:**
- Circular avatars (40px small, 80px medium, 120px large)
- Fallback to initials in colored circle

**No Hero Images:** This is an enterprise application, not a marketing site - no decorative hero sections needed. Focus on efficient data presentation.

---

## Implementation Notes

- Use Heroicons for all interface icons (via CDN)
- Maintain strict consistency across all 5 modules
- Prioritize keyboard navigation and accessibility
- Design for multi-role usage (admin, vendor, customer views)
- Every table should be sortable, filterable, and paginated
- All forms should have clear validation states and error messages