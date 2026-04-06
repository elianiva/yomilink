---
title: "Frontend Web Development Basics"
description: "Introduction to HTML, CSS, and JavaScript"
nodes:
    - id: "web"
      type: "text"
      position: { x: 500, y: 40 }
      data: { label: "Web Page", color: "green" }
    - id: "html"
      type: "text"
      position: { x: 200, y: 280 }
      data: { label: "HTML", color: "blue" }
    - id: "css"
      type: "text"
      position: { x: 500, y: 280 }
      data: { label: "CSS", color: "blue" }
    - id: "js"
      type: "text"
      position: { x: 800, y: 280 }
      data: { label: "JavaScript", color: "blue" }
    - id: "structure"
      type: "text"
      position: { x: 80, y: 520 }
      data: { label: "Structure", color: "amber" }
    - id: "tags"
      type: "text"
      position: { x: 260, y: 520 }
      data: { label: "Tags", color: "amber" }
    - id: "style"
      type: "text"
      position: { x: 380, y: 520 }
      data: { label: "Style", color: "amber" }
    - id: "layout"
      type: "text"
      position: { x: 560, y: 520 }
      data: { label: "Layout", color: "amber" }
    - id: "color"
      type: "text"
      position: { x: 380, y: 760 }
      data: { label: "Color", color: "amber" }
    - id: "size"
      type: "text"
      position: { x: 560, y: 760 }
      data: { label: "Size", color: "amber" }
    - id: "events"
      type: "text"
      position: { x: 740, y: 520 }
      data: { label: "Events", color: "amber" }
    - id: "click"
      type: "text"
      position: { x: 920, y: 520 }
      data: { label: "Clicks", color: "amber" }
    - id: "alert"
      type: "text"
      position: { x: 740, y: 760 }
      data: { label: "Alerts", color: "amber" }
    - id: "change"
      type: "text"
      position: { x: 920, y: 760 }
      data: { label: "Changes", color: "amber" }
    - id: "conn-web"
      type: "connector"
      position: { x: 500, y: 160 }
      data: { label: "uses" }
    - id: "conn-structure"
      type: "connector"
      position: { x: 140, y: 400 }
      data: { label: "creates" }
    - id: "conn-tags"
      type: "connector"
      position: { x: 230, y: 400 }
      data: { label: "has" }
    - id: "conn-style"
      type: "connector"
      position: { x: 470, y: 640 }
      data: { label: "sets" }
    - id: "conn-css-style"
      type: "connector"
      position: { x: 440, y: 400 }
      data: { label: "applies" }
    - id: "conn-layout"
      type: "connector"
      position: { x: 530, y: 400 }
      data: { label: "arranges" }
    - id: "conn-events"
      type: "connector"
      position: { x: 770, y: 400 }
      data: { label: "handles" }
    - id: "conn-clicks"
      type: "connector"
      position: { x: 830, y: 640 }
      data: { label: "is" }
    - id: "conn-alerts"
      type: "connector"
      position: { x: 740, y: 640 }
      data: { label: "shows" }
    - id: "conn-changes"
      type: "connector"
      position: { x: 830, y: 640 }
      data: { label: "tracks" }
edges:
    - id: "e1"
      source: "web"
      target: "conn-web"
    - id: "e2"
      source: "conn-web"
      target: "html"
    - id: "e3"
      source: "conn-web"
      target: "css"
    - id: "e4"
      source: "conn-web"
      target: "js"
    - id: "e5"
      source: "html"
      target: "conn-structure"
    - id: "e6"
      source: "conn-structure"
      target: "structure"
    - id: "e7"
      source: "html"
      target: "conn-tags"
    - id: "e8"
      source: "conn-tags"
      target: "tags"
    - id: "e9"
      source: "css"
      target: "conn-css-style"
    - id: "e10"
      source: "conn-css-style"
      target: "style"
    - id: "e11"
      source: "css"
      target: "conn-layout"
    - id: "e12"
      source: "conn-layout"
      target: "layout"
    - id: "e13"
      source: "style"
      target: "conn-style"
    - id: "e14"
      source: "conn-style"
      target: "color"
    - id: "e15"
      source: "conn-style"
      target: "size"
    - id: "e16"
      source: "js"
      target: "conn-events"
    - id: "e17"
      source: "conn-events"
      target: "events"
    - id: "e18"
      source: "events"
      target: "conn-clicks"
    - id: "e19"
      source: "conn-clicks"
      target: "click"
    - id: "e20"
      source: "events"
      target: "conn-alerts"
    - id: "e21"
      source: "conn-alerts"
      target: "alert"
    - id: "e22"
      source: "events"
      target: "conn-changes"
    - id: "e23"
      source: "conn-changes"
      target: "change"
---

# Frontend Web Development Basics

Every web page you visit is built using three fundamental technologies. HTML provides the structural foundation, CSS handles the visual presentation, and JavaScript enables interactive behavior. These technologies work together to create the complete web experience.

## HTML: The Structural Foundation

HTML, or HyperText Markup Language, serves as the backbone of every webpage. Its primary responsibility is creating the document structure—the hierarchy of headings, the organization of sections, and the overall skeleton that holds content together.

The language accomplishes this through a system of tags. Each piece of content is wrapped in tags that define its purpose and meaning. Headings use tags like `<h1>` through `<h6>`, paragraphs use `<p>`, links use `<a>`, and containers use `<div>`. These tags tell the browser what each element represents and how it relates to other content on the page.

## CSS: Visual Presentation and Layout

Once HTML establishes the structure, CSS takes over the visual design. Cascading Style Sheets define how elements appear—their colors, fonts, spacing, borders, and overall aesthetic qualities.

The core concept in CSS is styling. Through selectors that target specific elements, CSS applies visual rules that transform raw structure into polished interfaces. Styling encompasses fundamental properties like color, which controls text and background hues, and size, which manages dimensions, font sizing, and proportional relationships.

Beyond appearance, CSS also handles layout. Using modern systems like Flexbox and Grid, CSS arranges elements in rows, columns, and responsive patterns. This arrangement creates readable, balanced designs that adapt to different screen sizes.

## JavaScript: Interactive Behavior

JavaScript brings web pages to life by enabling dynamic responses to user actions. Where HTML and CSS create static documents, JavaScript introduces interactivity.

At its core, JavaScript handles events. Every user interaction generates an event—mouse movements, key presses, form submissions—and JavaScript responds to these events with programmed behavior.

Clicks represent the most common event type. When users interact with buttons or links, JavaScript detects these clicks and triggers corresponding actions. The language can also show alerts, popup messages that communicate directly with users when important situations occur. Additionally, JavaScript tracks changes in form inputs, data values, and page states, reacting immediately when modifications happen.

## How the Technologies Work Together

In practice, these three technologies form a pipeline. HTML creates the structural foundation using its tag system. CSS applies visual styling and arranges the layout of those structured elements. JavaScript then adds interactive behavior by handling events like clicks and changes.

When building any web feature, all three technologies contribute. A button requires HTML for its structure, CSS for its visual appearance, and JavaScript for its click behavior. Understanding how they complement each other is essential for frontend development.
