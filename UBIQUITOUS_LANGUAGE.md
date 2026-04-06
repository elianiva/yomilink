# Ubiquitous Language

Domain terms used throughout Yomilink (Kit-Build Concept Map platform). Use these terms consistently in code, UI, and documentation.

---

## Core Kit-Build Concepts

| Term                    | Definition                                                                                              | Aliases (Don't Use)                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Goal Map**            | The teacher's "correct" concept map representing the intended understanding of a topic                  | reference map, answer key, solution map, teacher map |
| **Kit**                 | Components extracted from a Goal Map (concepts + linking words) given to students as building blocks    | activity, exercise, template, components             |
| **Learner Map**         | A student's reconstructed concept map built from the Kit components                                     | student map, submission, answer, response, attempt   |
| **Diagnosis**           | The automatic comparison between a Goal Map and Learner Map identifying gaps                            | analysis, evaluation, assessment, scoring, grading   |
| **Proposition**         | A single unit of meaning: two concepts connected by a linking word (e.g., "Water → evaporates → Vapor") | link, edge, connection, triple                       |
| **Concept**             | A node representing an idea or term in a concept map (visual: colored box)                              | node, term, idea, item, element                      |
| **Link / Linking Word** | A connector node expressing the relationship between two concepts (visual: rounded box)                 | relation, connector, edge label, predicate           |

---

## Maps & Structure

| Term               | Definition                                                                                                    | Aliases (Don't Use)                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **Concept Node**   | A node representing a concept (type: "text") with color and label                                             | text node, idea node, concept box        |
| **Connector Node** | A node representing a linking word/relationship (type: "connector")                                           | link node, relation node, predicate node |
| **Edge**           | The directed connection between nodes in the graph                                                            | link, arrow, connection, line            |
| **Nodes**          | All visual elements in a map (concepts + connectors combined)                                                 | elements, items, vertices, points        |
| **Map Direction**  | The flow direction of relationships: `bi` (bidirectional), `uni` (unidirectional), `multi` (multidirectional) | flow, orientation, layout direction      |
| **Layout**         | How Kit components are arranged for students: `preset` (fixed positions) or `random` (scattered)              | arrangement, positioning, format, style  |

**Important**: In the Kit-Build methodology, the **Kit** is NOT the Goal Map itself—it's the _components extracted from_ the Goal Map. The student receives these components and must reconstruct the relationships (edges) themselves.

---

## Learning Activities

| Term                  | Definition                                                                     | Aliases (Don't Use)                      |
| --------------------- | ------------------------------------------------------------------------------ | ---------------------------------------- |
| **Assignment**        | A published learning task linking a Kit to a cohort or individual students     | task, homework, lesson, quiz, exam       |
| **Reading Material**  | Text content provided with an assignment for context                           | material, passage, text, content, source |
| **Attempt**           | A single try at completing a Learner Map (students may have multiple attempts) | try, round, submission, trial            |
| **Cohort**            | A group of students (class, section, batch)                                    | class, group, team, batch, section       |
| **Assignment Target** | The recipient(s) of an assignment: either a Cohort or individual User          | recipient, assignee, student group       |

---

## Diagnosis & Analytics

| Term                                 | Definition                                                                              | Aliases (Don't Use)                            |
| ------------------------------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Proposition-Level Exact Matching** | The Kit-Build assessment algorithm comparing propositions between Goal and Learner maps | matching, comparison, evaluation               |
| **Correct Link**                     | A proposition in the Learner Map that exactly matches the Goal Map                      | correct, right, valid, matching                |
| **Missing Link**                     | A proposition in the Goal Map not found in the Learner Map (gap in understanding)       | lacking, absent, omitted, gap, error           |
| **Excessive Link**                   | A proposition in the Learner Map not found in the Goal Map (misunderstanding)           | extra, wrong, incorrect, surplus, error        |
| **Score**                            | The similarity ratio between Goal Map and Learner Map (correct / total goal edges)      | grade, percentage, accuracy, similarity index  |
| **Per-Link Diagnosis**               | Detailed breakdown of which specific links are correct/missing/excessive                | link analysis, edge breakdown, detailed report |
| **Group Map**                        | Aggregated view of common understanding across all learners in an assignment            | class map, aggregate map, summary map          |

---

## User Roles

| Term                  | Definition                                                                          | Aliases (Don't Use)                  |
| --------------------- | ----------------------------------------------------------------------------------- | ------------------------------------ |
| **Teacher**           | User role that creates Goal Maps, generates Kits, and reviews student understanding | instructor, educator, admin, faculty |
| **Learner / Student** | User role that receives Kits and constructs Learner Maps                            | pupil, user, participant, respondent |
| **Cohort**            | A group of learners managed by a teacher                                            | class, section, group, batch         |

---

## Formative Assessment System

| Term                  | Definition                                                       | Aliases (Don't Use)                       |
| --------------------- | ---------------------------------------------------------------- | ----------------------------------------- |
| **Form**              | A structured questionnaire for pre/post/delayed testing          | survey, questionnaire, quiz, test         |
| **Pre-Test**          | Assessment given BEFORE the learning activity (baseline)         | pre-survey, initial test, entry quiz      |
| **Post-Test**         | Assessment given immediately AFTER the learning activity         | post-survey, exit quiz, final test        |
| **Delayed Post-Test** | Assessment given days/weeks later to measure retention           | follow-up, retention test, delayed survey |
| **TAM**               | Technology Acceptance Model survey for measuring user experience | usability survey, feedback form           |
| **Control Text**      | Alternative learning material for control group comparison       | alternative material, baseline text       |
| **Form Progress**     | Tracking unlock/completion status of forms for a user            | status, state, form status                |
| **Unlock Conditions** | Rules determining when a form becomes available to a user        | prerequisites, requirements, gates        |

---

## Content Organization

| Term        | Definition                                                  | Aliases (Don't Use)                     |
| ----------- | ----------------------------------------------------------- | --------------------------------------- |
| **Topic**   | A subject/category for organizing Goal Maps and Texts       | subject, category, theme, domain        |
| **Text**    | A reading passage with title, content, and optional images  | passage, article, reading, material     |
| **Kit Set** | A sequence of Kits grouped together for structured practice | kit group, kit sequence, kit collection |

---

## UI/Interaction Patterns

| Term                | Definition                                                        | Aliases (Don't Use)                          |
| ------------------- | ----------------------------------------------------------------- | -------------------------------------------- |
| **Canvas**          | The interactive area where maps are visualized and edited         | graph area, viewport, workspace, stage       |
| **Auto-Layout**     | Automatic arrangement of nodes using graph layout algorithms      | arrange, organize, tidy, layout              |
| **Concept Dialog**  | Modal for adding/editing concept nodes                            | node dialog, add node modal                  |
| **Link Dialog**     | Modal for adding/editing connector (linking word) nodes           | relation dialog, connector modal             |
| **Material Dialog** | Modal for attaching reading materials to a Goal Map               | text dialog, reading modal                   |
| **Save Dialog**     | Modal for setting title, topic, and description when saving       | metadata dialog, save as dialog              |
| **Diagnosis View**  | Interface showing the comparison between Goal Map and Learner Map | analysis view, comparison view, results view |

---

## Data Flow Summary

```
Teacher creates:          Goal Map (concepts + links + structure)
                         ↓
System extracts:          Kit (concepts + linking words as components, NO links)
                         ↓
Teacher assigns:          Assignment (Kit + Reading Material + Cohort)
                         ↓
Student builds:           Learner Map (Kit components + student-created links)
                         ↓
System generates:         Diagnosis (correct/missing/excessive proposition analysis)
```

---

## Naming Conventions in Code

### Database Tables

- `goalMaps` — Teacher's reference maps
- `kits` — Extracted components for students
- `learnerMaps` — Student submissions
- `assignments` — Published learning activities
- `diagnoses` — Automated assessment results
- `texts` — Reading materials

### Service Functions

- `generateKit` — Create a Kit from a Goal Map
- `compareMaps` — Proposition-level exact matching algorithm
- `classifyEdges` — Categorize links as correct/missing/excessive
- `submitLearnerMap` — Finalize a student's map for diagnosis

### UI Components

- `ConceptMapCanvas` — The graph visualization component
- `GoalMapEditor` — Teacher's map creation interface
- `LearnerMapBuilder` — Student's reconstruction interface
- `DiagnosisPanel` — Results visualization component
