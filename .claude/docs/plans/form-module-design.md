# Form Module Design Plan

## Problem Statement

Create a comprehensive form module for the Kit-Build application that supports:
- Assignment-linked forms (pre-test, post-test, delayed-test)
- Standalone forms (TAM questionnaire, general questionnaire)
- Special restrictive forms that block dashboard access until completed
- Admin form builder with question management
- Automatic and manual form unlocking
- Control group text submission alongside concept maps

## Initial Requirements

### Form Types
1. **Standalone Forms** - Independent questionnaires (TAM, general info)
2. **Assignment-Linked Forms** - Tied to specific assignments (pre/post/delayed tests)
3. **Restrictive Forms** - Block dashboard until completed (registration questionnaire)

### Key Features
- Form creation/editing UI for admins
- Question types: MCQ (shuffled options), Likert scale, text input
- Form response tracking with timestamps
- Unlock conditions: time-based, prerequisite completion, manual override
- Scoring calculated on-the-fly
- Forms immutable once they have responses
- Control group: text submission stored alongside concept map results

### Integration Points
- Registration flow with restrictive form
- Assignment flow with linked forms
- Analytics dashboard for results
- Learner map submission triggers post-test unlock

## Clarified Requirements

### Control Group Text Submission
- Rich text editor similar to concept map canvas layout
- Text area with formatting tools (bold, italic, lists)
- Minimum word count display/validation
- Confirmation screen before final submission (like concept map)
- Submit button to mark assignment as complete
- Stored alongside concept map results in analytics

### Form Results Display
- Individual responses with student identification
- Aggregated statistics and charts
- Both views available to teachers in analytics dashboard

### Registration Form Flow
- Auto-save drafts to localStorage or backend
- Resume from where left off on return
- Dashboard access blocked until form submitted
- Completion status cached in session storage (check on page load, verify periodically)

### Question Branching
- Keep linear - no conditional logic
- Simple sequential question flow

### Form Versioning
- Allow cloning of forms to create new versions
- Original form remains immutable once responses exist
- Clone gets new ID, copies all questions

### Delayed Test UX
- Show countdown timer (e.g., "Unlocks in 5 days 3 hours")
- Update periodically or on page load
- Admin can manually unlock early

## Completed Design Sections

### Data Architecture
- Forms table with metadata and type classification
- Questions table with JSON schema for different types
- Responses table tracking user answers
- Progress tracking for unlock conditions

### Component Architecture
- FormBuilder (admin): Drag-drop question editor
- FormTaker (student): Question renderer with progress
- FormList: Available forms with status indicators
- ControlSubmission: Rich text editor for control group

### Unlock System
- Assignment-linked forms unlock based on:
  * Pre-test: always available
  * Post-test: after assignment completion (concept map submitted OR control text submitted)
  * Delayed: 1 week after post-test + manual override

### Integration Points
- Registration: Middleware redirects to form if incomplete
- Assignments: Form gateway before accessing content
- Analytics: Results feed into charts and tables

## Ready for Implementation Planning

All design decisions finalized.
