## 🧩 Product Requirements Document (PRD)

### Module: **Teacher – Multimodal Goal Map Editor**

*(Part of Multimodal Kit-Build System)*

---

### 1. Purpose

The **Teacher Module** is the **authoring environment** where educators build the canonical “goal map” for a learning activity.
It serves as the **entry point of the entire Kit-Build ecosystem** because:

* It defines the **ground truth** graph structure used to generate the **kit** that students reconstruct.
* The goal map’s data (nodes, edges, and metadata) must be stored in a **format compatible with the Student Builder**, so learners can rebuild identical parts and allow **automatic diagnosis** via the Analyzer.

If the goal map’s structure or node types are inconsistent, the learner module cannot reconstruct it — hence the Teacher Module must **enforce consistent node and link models** across the system.

---

### 2. Conceptual Model

#### Node Types

| Type                | Description                                                                   | Example                               |
| ------------------- | ----------------------------------------------------------------------------- | ------------------------------------- |
| **Text Node**       | Represents a concept or term extracted from text                              | “Solid”, “Evaporation”, “Parliament”  |
| **Connecting Node** | Represents the relation **between** concepts; replaces textual link labels    | “causes”, “consists of”, “is part of” |
| **Image Node**      | Represents a visual concept (cropped figure, diagram component, object photo) | An image of ice, diagram label, etc.  |

#### Map Structure

Each proposition is represented as a **triple**:

```
[Text/Image Node] → [Connecting Node] → [Text/Image Node]
```

Connections are **directed edges** between nodes.
There are **no link labels**; all semantics are encapsulated within connecting nodes.

---

### 3. Core Features & Functional Requirements

#### **A. Learning Material Importer**

Purpose: provide source text or images for teachers to extract nodes from.

* [ ] Input types: `.txt`, `.pdf`, or image uploads (≤10 MB, PNG/JPEG).
* [ ] Display in a left-side viewer for easy reference.
* [ ] Teachers can highlight or crop to select candidate content for nodes.

---

#### **B. Node Creation Tools**

Purpose: enable construction of multimodal nodes.

* **Text Node Creation**

  * Manual text entry or auto-extract from highlighted text.
  * Fields: `{ id, type: "text", label }`.

* **Image Node Creation**

  * Upload or crop from material.
  * Fields: `{ id, type: "image", label?, image_url }`.

* **Connecting Node Creation**

  * Acts as a relation bridge.
  * Teachers can choose from presets (“is”, “causes”, “belongs to”) or enter custom text.
  * Fields: `{ id, type: "connector", label }`.

* **UI**

  * Palette or toolbar with buttons:
    `+ Text Node`, `+ Image Node`, `+ Connector Node`.

---

#### **C. Map Editor Canvas**

Purpose: visually construct the goal map.

* Interactive graph canvas (React Flow or similar).

* Drag-and-drop placement of nodes.

* Edge creation: click-and-drag from one node to another.

* Auto-snap arrows only between **valid node types**, e.g.:

  ✅ Text → Connector
  ✅ Image → Connector
  ✅ Connector → Text/Image
  🚫 Connector → Connector (disallowed)

* Visual hints (colour or icon per node type):

  * 🟩 Text
  * 🟦 Connector
  * 🟨 Image

* Delete / move / group nodes.

* Undo / redo.

---

#### **D. Kit Generation**

Purpose: produce the exact set of reusable parts for students.

* Auto-decompose the goal map into:

  ```json
  {
    "goal_map_id": "uuid",
    "nodes": [
      { "id": "n1", "type": "text", "label": "Solid" },
      { "id": "n2", "type": "connector", "label": "melts into" },
      { "id": "n3", "type": "image", "label": "Liquid", "image_url": "/liquid.png" }
    ],
    "edges": [
      { "source": "n1", "target": "n2" },
      { "source": "n2", "target": "n3" }
    ]
  }
  ```
* Validate:

  * All edges connect existing nodes.
  * Every connector node is linked both inbound and outbound.
  * No duplicate IDs or orphan nodes.
* Save both the `goal_map` and the `kit` to DB.

---

#### **E. Goal Map Management**

Purpose: store and manage goal maps for assignments.

* Create, edit, duplicate, and delete goal maps.
* Metadata stored:

  ```json
  {
    "teacher_id": "uuid",
    "title": "Change of State",
    "description": "Science module - solid/liquid/gas",
    "created_at": "timestamp"
  }
  ```
* Versioning support:
  Each edit creates a new `goal_map_version` record.

---

#### **F. Publishing & Integration with Student Module**

Purpose: connect teacher-created kits with the student learning workflow.

1. **Publish Goal Map**

   * Teachers assign a unique `room_id` or `assignment_id`.
   * Students join this assignment from their dashboard.

2. **Data Contract (shared with Student Module)**

   * Exported JSON defines identical structure used by student canvas:

     ```json
     {
       "kit_id": "uuid",
       "nodes": [...],
       "edges": [...],
       "goal_map_id": "uuid"
     }
     ```
   * The Student Module fetches this via API:

     ```
     GET /api/kit/:goal_map_id
     ```

3. **Why Integration Matters**

   * The Student Builder reconstructs **exact node instances** (including image URLs and connector nodes) provided here.
   * Ensures Analyzer can compare learner maps directly by node ID and edge structure.
   * If Teacher and Student models mismatch, automatic diagnosis becomes impossible.

---

#### **G. Validation & Upload Guard**

Purpose: prevent invalid or oversized data that would break the learner workflow.

* Validate image format (PNG/JPEG only, ≤ 10 MB).
* Ensure every goal map contains:

  * ≥ 2 concept nodes (text/image)
  * ≥ 1 connector node
  * ≥ 2 edges
* Auto-compress uploaded images.
* Log events via **Sentry** (`VITE_SENTRY_DSN`).

---

### 4. Database Schema (Drizzle/Convex Example)

```ts
goal_maps = {
  id: string;
  teacherId: string;
  title: string;
  description?: string;
  nodes: Json<Node[]>;
  edges: Json<Edge[]>;
  createdAt: string;
}

nodes = {
  id: string;
  type: "text" | "connector" | "image";
  label?: string;
  imageUrl?: string;
}

edges = {
  source: string;
  target: string;
}
```

---

### 5. Implementation To-Do (for GPT-5 / Codex)

* [ ] **Frontend**

  * [ ] Build editor UI (left: material viewer, center: canvas, right: node list).
  * [ ] Implement node creation modal (text/image/connector).
  * [ ] Canvas interactions (drag, connect, delete, validate).
  * [ ] Preview images in-canvas.
* [ ] **Backend**

  * [ ] API routes:

    * `POST /api/goal-map` → save map
    * `GET /api/kit/:id` → fetch kit for learners
  * [ ] Drizzle schema as above.
* [ ] **Validation**

  * [ ] File upload guard (type/size).
  * [ ] Edge integrity check.
* [ ] **Integration**

  * [ ] Link published goal map → `assignment_id` for student joining.
  * [ ] Ensure `kit_id` consistency for Analyzer comparison.
* [ ] **Sentry Integration**

  * [ ] Capture editor errors, upload issues, DB write failures.

---

### 6. Summary of Role in System

The **Teacher Module** defines the **canonical multimodal goal map** and generates the **kit**.
This kit is the only data source the **Student Builder** and **Analyzer** can rely on — hence this module ensures:

* Structural integrity of node types and IDs.
* Availability of media resources (image nodes).
* Compatibility of the saved graph schema with the learner workspace.

Without it, students would lack a coherent set of nodes and the Analyzer couldn’t automatically compute recall, precision, or F1.
