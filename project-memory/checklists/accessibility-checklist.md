# Accessibility Checklist

> Target: WCAG 2.1 Level AA compliance

---

## Perceivable (Information and user interface components must be presentable to users in ways they can perceive)

### Text Alternatives (1.1)
- [ ] **1.1.1 Non-text Content (A)**: All non-text content has a text alternative
  - [ ] All `<img>` elements have meaningful `alt` attributes
  - [ ] Decorative images have `alt=""` (empty alt)
  - [ ] Icon-only buttons have `aria-label` describing the action
  - [ ] Complex images (charts, graphs) have detailed text descriptions nearby
  - [ ] Avatar images have alt text describing the person/avatar
  - [ ] Garment images have alt text describing the garment (e.g., "Blue cotton t-shirt")
  - [ ] Outfit images have alt text describing the outfit
  - [ ] 3D canvas has a text fallback or description
  - [ ] CAPTCHA alternatives are available (audio CAPTCHA)

### Time-based Media (1.2)
- [ ] **1.2.1 Audio-only and Video-only (A)**: Tutorial videos have transcripts or text alternatives
- [ ] **1.2.2 Captions (A)**: Pre-recorded videos have captions
- [ ] **1.2.3 Audio Description (A)**: Videos have audio description if needed
- [ ] **1.2.4 Captions (Live) (AA)**: Live streams have captions
- [ ] **1.2.5 Audio Description (AA)**: Audio description provided for all video content

### Adaptable (1.3)
- [ ] **1.3.1 Info and Relationships (A)**: Information and structure is programmatically determinable
  - [ ] Semantic HTML used (header, nav, main, section, article, aside, footer)
  - [ ] Heading hierarchy is logical (h1 -> h6, no levels skipped)
  - [ ] Lists use `<ul>` / `<ol>` / `<li>` elements
  - [ ] Tables use `<th>` with `scope` attributes for headers
  - [ ] Form inputs are associated with `<label>` elements
  - [ ] ARIA roles match semantic meaning
  - [ ] CSS-generated content is not used for meaningful information
- [ ] **1.3.2 Meaningful Sequence (A)**: Content sequence is meaningful when CSS is disabled
- [ ] **1.3.3 Sensory Characteristics (A)**: Instructions don't rely solely on shape, size, visual location, or sound
- [ ] **1.3.4 Orientation (AA)**: App works in both portrait and landscape on mobile
- [ ] **1.3.5 Identify Input Purpose (AA)**: Input fields have autocomplete attributes
  - [ ] Name fields: `autocomplete="name"`
  - [ ] Email fields: `autocomplete="email"`
  - [ ] Password fields: `autocomplete="new-password"` or `autocomplete="current-password"`

### Distinguishable (1.4)
- [ ] **1.4.1 Use of Color (A)**: Color is not the only means of conveying information
  - [ ] Error states have icon + text, not just red color
  - [ ] Links are underlined or have icon in addition to color
  - [ ] Chart segments have labels/patterns in addition to color
  - [ ] Status indicators have text or icon in addition to color dot
  - [ ] Favorite toggle has filled/outlined icon in addition to color change
- [ ] **1.4.2 Audio Control (A)**: Auto-playing audio has pause/stop mechanism
- [ ] **1.4.3 Contrast (Minimum) (AA)**: Text has sufficient contrast
  - [ ] Normal text (<18px or <14px bold): contrast ratio >= 4.5:1
  - [ ] Large text (>=18px or >=14px bold): contrast ratio >= 3:1
  - [ ] Placeholder text meets contrast requirements
  - [ ] Disabled text meets reduced contrast requirements
  - [ ] Tested with tools: axe DevTools, WAVE, Contrast Checker
  - [ ] Dark mode colors also meet contrast requirements
- [ ] **1.4.4 Resize Text (AA)**: Text can be resized up to 200% without loss of content
- [ ] **1.4.5 Images of Text (AA)**: Images of text are not used (use real text)
- [ ] **1.4.10 Reflow (AA)**: Content works at 320px viewport width without two-dimensional scrolling
  - [ ] No horizontal scroll at 320px
  - [ ] Tables collapse or have horizontal scroll wrapper
  - [ ] Grid layouts stack vertically on small screens
- [ ] **1.4.11 Non-text Contrast (AA)**: UI components have contrast ratio >= 3:1
  - [ ] Focus indicators have sufficient contrast
  - [ ] Button borders/states have sufficient contrast
  - [ ] Input field borders have sufficient contrast
  - [ ] Icons have sufficient contrast
  - [ ] Chart/graph elements have sufficient contrast
- [ ] **1.4.12 Text Spacing (AA)**: No loss of content when text spacing is overridden
  - [ ] Line height: 1.5x font size
  - [ ] Paragraph spacing: 2x font size
  - [ ] Letter spacing: 0.12x font size
  - [ ] Word spacing: 0.16x font size
- [ ] **1.4.13 Content on Hover or Focus (AA)**: Tooltips and hover content are dismissible, hoverable, and persistent

---

## Operable (User interface components and navigation must be operable)

### Keyboard Accessible (2.1)
- [ ] **2.1.1 Keyboard (A)**: All functionality is operable through keyboard interface
  - [ ] All interactive elements are reachable via Tab key
  - [ ] All interactive elements are activatable via Enter or Space
  - [ ] Custom components (sliders, date pickers, color pickers) have keyboard support
  - [ ] Drag-and-drop functionality has keyboard alternative
  - [ ] No keyboard traps (focus can move away from any component)
- [ ] **2.1.2 No Keyboard Trap (A)**: Focus can be moved away from any component using keyboard
- [ ] **2.1.4 Character Key Shortcuts (A)**: Single-character shortcuts can be remapped or turned off

### Enough Time (2.2)
- [ ] **2.2.1 Timing Adjustable (A)**: Time limits can be turned off, adjusted, or extended
  - [ ] Session timeout has warning with option to extend
  - [ ] No time limits on completing forms
- [ ] **2.2.2 Pause, Stop, Hide (A)**: Moving, blinking, scrolling content can be paused
- [ ] **2.2.6 Timeouts (AAA)**: Users warned about session timeouts (20+ seconds warning)

### Seizures and Physical Reactions (2.3)
- [ ] **2.3.1 Three Flashes or Below Threshold (A)**: No content flashes more than 3 times per second

### Navigable (2.4)
- [ ] **2.4.1 Bypass Blocks (A)**: Skip-to-content link is provided
- [ ] **2.4.2 Page Titled (A)**: Each page has a descriptive and unique `<title>`
- [ ] **2.4.3 Focus Order (A)**: Focus order follows logical reading order
- [ ] **2.4.4 Link Purpose (In Context) (A)**: Link text describes the link destination
  - [ ] No "Click here" links
  - [ ] Icon links have aria-label or visible text
  - [ ] Same links have consistent text across pages
- [ ] **2.4.5 Multiple Ways (AA)**: Multiple ways to find content (search, navigation, sitemap)
- [ ] **2.4.6 Headings and Labels (AA)**: Headings and labels describe topic or purpose
- [ ] **2.4.7 Focus Visible (AA)**: Visible focus indicator on all interactive elements
  - [ ] Focus ring is at least 2px wide
  - [ ] Focus ring has sufficient contrast
  - [ ] Focus ring is not removed (unless replaced by custom style)
- [ ] **2.4.11 Focus Not Obscured (AA)**: Focused element is not hidden by other content

### Input Modalities (2.5)
- [ ] **2.5.1 Pointer Gestures (A)**: All functionality uses single-pointer gestures (no path-based gestures)
- [ ] **2.5.2 Pointer Cancellation (A)**: Down-event is not used to execute action (use up-event)
- [ ] **2.5.3 Label in Name (A)**: Accessible name contains visible label text
- [ ] **2.5.4 Motion Actuation (A)**: Motion-activated functionality can be operated via UI
- [ ] **2.5.7 Dragging Movements (AA)**: Drag operations have single-pointer alternative
- [ ] **2.5.8 Target Size (AA)**: Touch targets are at least 24x24 CSS pixels

---

## Understandable (Information and the operation of user interface must be understandable)

### Readable (3.1)
- [ ] **3.1.1 Language of Page (A)**: Page language is specified (`<html lang="en">`)
- [ ] **3.1.2 Language of Parts (AA)**: Language changes within content are marked

### Predictable (3.2)
- [ ] **3.2.1 On Focus (A)**: Focusing an element does not initiate a change of context
- [ ] **3.2.2 On Input (A)**: Changing input setting does not auto-submit (unless user warned)
- [ ] **3.2.3 Consistent Navigation (AA)**: Navigation is in same order across pages
- [ ] **3.2.4 Consistent Identification (AA)**: Same components are identified consistently
- [ ] **3.2.6 Consistent Help (AA)**: Help mechanisms are in same location across pages

### Input Assistance (3.3)
- [ ] **3.3.1 Error Identification (A)**: Errors are described in text
- [ ] **3.3.2 Labels or Instructions (A)**: Labels or instructions are provided when input requires specific format
- [ ] **3.3.3 Error Suggestion (AA)**: Suggestions for fixing errors are provided
- [ ] **3.3.4 Error Prevention (Legal, Financial, Data) (AA)**: Submissions are reversible, checked, or confirmed
  - [ ] Delete actions have confirmation dialog
  - [ ] Form submissions show success/error state
  - [ ] Destructive actions (delete account) are reversible or confirmed
- [ ] **3.3.7 Redundant Entry (AA)**: Information previously entered is auto-filled or selectable
- [ ] **3.3.8 Accessible Authentication (AA)**: Authentication does not rely on cognitive function tests

---

## Robust (Content must be robust enough to be interpreted by a wide variety of user agents, including assistive technologies)

### Compatible (4.1)
- [ ] **4.1.1 Parsing (A)**: Content has complete start/end tags, unique IDs
  - [ ] No duplicate ID attributes
  - [ ] Elements have complete start and end tags
  - [ ] Attributes are properly quoted
- [ ] **4.1.2 Name, Role, Value (A)**: All UI components have programmatically determinable name, role, and value
  - [ ] Custom components have appropriate ARIA roles
  - [ ] Custom components have correct `aria-*` attributes
  - [ ] State changes are communicated (aria-expanded, aria-pressed, aria-selected)
  - [ ] Custom form controls have accessible name and value
- [ ] **4.1.3 Status Messages (AA)**: Status messages have role="status" or aria-live

---

## Automated Testing Tools
- [ ] Run axe DevTools on every page (Chrome extension)
- [ ] Run WAVE evaluation tool on every page
- [ ] Run Lighthouse accessibility audit (target: 90+)
- [ ] Run jest-axe in component tests
- [ ] Run pa11y CI in pipeline
- [ ] Check color contrast with WebAIM Contrast Checker
- [ ] Validate HTML with W3C Markup Validator
- [ ] Run Accessibility Insights for Web (FastPass)
- [ ] Check ARIA usage with ARIA DevTools
- [ ] Validate against WCAG 2.1 AA checklist
- [ ] Fix all critical and serious violations before deployment
- [ ] Fix all moderate violations before next release
- [ ] Review all minor violations and prioritize fixes

## Manual Testing Checklist
- [ ] Tab through every page (verify focus order)
- [ ] Verify skip-to-content link works
- [ ] Zoom to 200% - verify no content loss
- [ ] Zoom to 400% - verify readability
- [ ] Test with browser zoom + text zoom combined
- [ ] Test with custom styles (override colors, fonts)
- [ ] Test with images disabled
- [ ] Test with CSS disabled
- [ ] Test with JavaScript disabled (basic functionality)
- [ ] Test with reduced motion enabled
- [ ] Test with high contrast mode enabled (Windows)
- [ ] Test with forced colors mode (Windows)
- [ ] Resize viewport to 320px width
- [ ] Test all error messages (submit invalid forms)
- [ ] Verify all focus indicators are visible
- [ ] Test all keyboard shortcuts
- [ ] Verify all ARIA labels are correct

## Screen Reader Testing

### NVDA (Windows + Firefox/Chrome)
- [ ] Navigate entire app using only NVDA
- [ ] Verify all content is announced correctly
- [ ] Verify form inputs are announced with label, role, state
- [ ] Verify dynamic content updates are announced (aria-live)
- [ ] Verify error messages are announced
- [ ] Verify navigation landmarks are announced
- [ ] Verify heading navigation works (H key)
- [ ] Verify table navigation works (T key, arrow keys)
- [ ] Verify dialog/modal is announced with correct role
- [ ] Verify focus management in modals (focus trap, return focus)

### VoiceOver (macOS + Safari)
- [ ] Navigate entire app using only VoiceOver
- [ ] Verify rotor navigation works (headings, links, landmarks)
- [ ] Verify all interactive elements have correct roles
- [ ] Verify image alt text is announced
- [ ] Verify form validation errors are announced
- [ ] Verify notification toasts are announced
- [ ] Verify auto-updating content is announced

### TalkBack (Android + Chrome)
- [ ] Navigate entire app using only TalkBack
- [ ] Verify touch exploration works correctly
- [ ] Verify swipe gestures navigate properly
- [ ] Verify all elements are announced

### Voice Access / Switch Access
- [ ] Verify speech recognition can activate all controls
- [ ] Verify switch device can navigate all content

## Keyboard Navigation Testing
- [ ] Tab key moves forward through all interactive elements
- [ ] Shift+Tab moves backward through all interactive elements
- [ ] Enter activates links and buttons
- [ ] Space activates buttons and checkboxes
- [ ] Arrow keys navigate radio groups, tab panels, lists
- [ ] Escape closes modals, dialogs, dropdowns, menus
- [ ] Escape closes date pickers, color pickers, popovers
- [ ] Home/End navigate to first/last item in lists
- [ ] Page Up/Page Down scroll content
- [ ] Tab order is logical (top-to-bottom, left-to-right)
- [ ] No invisible focusable elements (tabIndex >= 0 on hidden elements)
- [ ] No positive tabIndex values (use DOM order)
- [ ] Focus is not trapped in any component (except modals)
- [ ] Focus returns to trigger element after modal closes
- [ ] Focus moves to new content after navigation
- [ ] Skip-to-content link is first focusable element
- [ ] Focused element is never obscured or off-screen
