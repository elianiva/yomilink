# Progress

## 2026-02-19

### Completed Tasks
1. **Implement drag-drop question reordering** - Added drag-drop functionality using @dnd-kit
   - Installed @dnd-kit/core, @dnd-kit/sortable, and @dnd-kit/utilities packages
   - Updated QuestionList component with DndContext and SortableContext
   - Created SortableQuestionItem component with useSortable hook
   - Implemented handleDragEnd to calculate new order and call onReorder callback
   - Updated orderIndex values when reordering (0, 1, 2, ...)
   - Drag handles only shown when onReorder prop is provided
   - Added 2 new tests for drag-drop reordering functionality
   - All 28 QuestionList tests pass

2. **Add reorderQuestions service function** - Added backend support for reordering questions
   - Created ReorderQuestionsInput schema with formId and questionIds array
   - Implemented reorderQuestions function in form-service.ts
   - Validates form exists before reordering
   - Blocks reordering when form has responses (immutability guard)
   - Validates all provided question IDs exist and match existing questions
   - Updates orderIndex for each question in database
   - Added reorderQuestionsRpc to server/rpc/form.ts
   - Added reorderQuestions mutation to FormRpc object

3. **Create QuestionList component** - Built component displaying questions with type badges and order numbers
   - Created `QuestionList` component with support for MCQ, Likert, and Text question types
   - Displays questions sorted by orderIndex with sequential numbering (1, 2, 3, ...)
   - Type badges with color coding (blue for MCQ, purple for Likert, green for Text)
   - Required indicator (*) and "Optional" badge support
   - Edit and delete action buttons with hover visibility
   - Drag handle placeholders for future drag-drop reordering
   - Accessible with proper ARIA labels and semantic list structure (ul/li)
   - Empty state when no questions exist
   - Added 26 comprehensive unit tests covering rendering, sorting, actions, accessibility, and styling
   - All 434 tests pass (408 + 26 new)

2. **Create FormMetadataEditor component** - Built form editor component for editing form metadata
   - Created `FormMetadataEditor` component with inputs for title, description, type selector, and status
   - Supports all form types: pre_test, post_test, registration, control
   - Visual status indicators with colored badges (yellow for draft, green for published)
   - Fully controlled component with onChange callbacks
   - Disabled state support for read-only mode
   - Added 6 comprehensive unit tests covering rendering, state updates, and disabled state
   - Installed @testing-library/user-event and @testing-library/jest-dom for component testing
   - Updated test setup to include jest-dom matchers
   - All 408 tests pass

2. **Create FormBuilder page shell** - Created admin route `/dashboard/forms/builder` with basic layout
   - Route accessible at `/dashboard/forms/builder` for teachers and admins
   - Created `FormRpc` with server functions for form operations (create, get, list, delete, publish, unpublish, getResponses, submitResponse)
   - Fixed type issues in form-service.ts by properly typing JSON fields (unlockConditions, answers)
   - Added Forms menu item to sidebar for teachers/admins
   - Page includes basic layout with form content and settings sections
   - All 402 tests pass

2. **Create getFormResponses endpoint** - Added getFormResponses function to FormService for querying form responses with pagination
   - Returns paginated list of responses with user info (name, email)
   - Supports configurable page and limit parameters (default: page 1, limit 20)
   - Validates form exists before querying responses
   - Includes pagination metadata (total, totalPages, hasNextPage, hasPrevPage)
   - Joins with user table to include submitter information
   - Added 4 comprehensive tests for pagination, error handling, and empty results
   - All 26 form-service tests pass

2. **Create submitFormResponse endpoint** - Added submitFormResponse function to FormService that handles form submissions
   - Validates form exists and is published before accepting submission
   - Prevents duplicate submissions from same user with FormAlreadySubmittedError
   - Stores response with answers JSON, timestamp, and time spent
   - Updates form_progress to completed status on successful submission
   - Added 6 comprehensive tests for all scenarios
   - All 398 tests pass

2. **Implement cloneForm for versioning** - Added cloneForm method to FormService that copies form metadata and all questions to a new form ID
   - New form created with "(Copy)" suffix, draft status, and all questions cloned with preserved order
   - Added 2 tests for cloneForm functionality

3. **Create FormService with createForm method** - Created form-service.ts with createForm, getFormById, listForms, updateForm, deleteForm, publishForm, unpublishForm methods
   - Added createTestForm fixture to service-fixtures
   - Created comprehensive test suite with 12 tests
   - All 388 tests pass

2. **Generate TypeScript types from database schema** - Ran drizzle-kit generate, types available for forms, questions, formResponses, and formProgress tables
   - Types exported from `@/server/db/schema` via drizzle-orm schema definitions
   - All 376 tests pass with new schema types

### Previous Progress

## 2026-02-18

### Completed Tasks
1. **Create forms table migration** - Added forms, questions, form_responses, form_progress tables to schema
   - Added `forms` table with id, title, description, type enum (pre_test, post_test, registration, control), status (draft, published), unlock_conditions JSON, createdBy, timestamps
   - Added `questions` table with id, form_id FK, type enum (mcq, likert, text), question_text, options JSON, order_index, required, timestamps
   - Added `form_responses` table with id, form_id FK, user_id FK, answers JSON, submitted_at, time_spent_seconds, timestamps
   - Added `form_progress` table with id, form_id FK, user_id FK, status enum (locked, available, completed), unlocked_at, completed_at, timestamps
   - Generated drizzle migration 0001_violet_layla_miller.sql

All tests pass (376 tests).
