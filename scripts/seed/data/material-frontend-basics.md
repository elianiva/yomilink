---
title: "Frontend Web Development Basics"
description: "Introduction to HTML, CSS, and JavaScript"
nodes:
    - id: "frontend"
      type: "text"
      position: { x: 340, y: 40 }
      data: { label: "Frontend", color: "green" }
    - id: "html"
      type: "text"
      position: { x: 140, y: 170 }
      data: { label: "HTML", color: "blue" }
    - id: "css"
      type: "text"
      position: { x: 340, y: 170 }
      data: { label: "CSS", color: "blue" }
    - id: "js"
      type: "text"
      position: { x: 540, y: 170 }
      data: { label: "JavaScript", color: "blue" }
    - id: "structure"
      type: "text"
      position: { x: 60, y: 320 }
      data: { label: "Structure", color: "amber" }
    - id: "tags"
      type: "text"
      position: { x: 180, y: 320 }
      data: { label: "Tags", color: "amber" }
    - id: "dom"
      type: "text"
      position: { x: 60, y: 460 }
      data: { label: "DOM", color: "amber" }
    - id: "styling"
      type: "text"
      position: { x: 260, y: 320 }
      data: { label: "Styling", color: "amber" }
    - id: "layout"
      type: "text"
      position: { x: 380, y: 320 }
      data: { label: "Layout", color: "amber" }
    - id: "responsive"
      type: "text"
      position: { x: 260, y: 460 }
      data: { label: "Responsive", color: "amber" }
    - id: "logic"
      type: "text"
      position: { x: 500, y: 320 }
      data: { label: "Logic", color: "amber" }
    - id: "events"
      type: "text"
      position: { x: 620, y: 320 }
      data: { label: "Events", color: "amber" }
    - id: "async"
      type: "text"
      position: { x: 500, y: 460 }
      data: { label: "Async", color: "amber" }
    - id: "conn-web"
      type: "connector"
      position: { x: 340, y: 110 }
      data: { label: "builds" }
    - id: "conn-structure"
      type: "connector"
      position: { x: 140, y: 250 }
      data: { label: "defines" }
    - id: "conn-tags"
      type: "connector"
      position: { x: 200, y: 250 }
      data: { label: "uses" }
    - id: "conn-dom"
      type: "connector"
      position: { x: 100, y: 390 }
      data: { label: "creates" }
    - id: "conn-style"
      type: "connector"
      position: { x: 340, y: 250 }
      data: { label: "styles" }
    - id: "conn-layout"
      type: "connector"
      position: { x: 400, y: 250 }
      data: { label: "arranges" }
    - id: "conn-responsive"
      type: "connector"
      position: { x: 300, y: 390 }
      data: { label: "adapts" }
    - id: "conn-behavior"
      type: "connector"
      position: { x: 540, y: 250 }
      data: { label: "adds" }
    - id: "conn-events"
      type: "connector"
      position: { x: 600, y: 250 }
      data: { label: "handles" }
    - id: "conn-async"
      type: "connector"
      position: { x: 480, y: 390 }
      data: { label: "manages" }
edges:
    - id: "e1"
      source: "frontend"
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
      source: "html"
      target: "conn-dom"
    - id: "e10"
      source: "conn-dom"
      target: "dom"
    - id: "e11"
      source: "css"
      target: "conn-style"
    - id: "e12"
      source: "conn-style"
      target: "styling"
    - id: "e13"
      source: "css"
      target: "conn-layout"
    - id: "e14"
      source: "conn-layout"
      target: "layout"
    - id: "e15"
      source: "css"
      target: "conn-responsive"
    - id: "e16"
      source: "conn-responsive"
      target: "responsive"
    - id: "e17"
      source: "js"
      target: "conn-behavior"
    - id: "e18"
      source: "conn-behavior"
      target: "logic"
    - id: "e19"
      source: "js"
      target: "conn-events"
    - id: "e20"
      source: "conn-events"
      target: "events"
    - id: "e21"
      source: "js"
      target: "conn-async"
    - id: "e22"
      source: "conn-async"
      target: "async"
---

# Frontend Web Development Basics

Frontend web development is the practice of building the user interface of websites and web applications. It involves three core technologies: HTML for structure, CSS for styling, and JavaScript for interactivity.

## HTML: The Structure

HTML, which stands for HyperText Markup Language, provides the structure and content of web pages. Think of it as the skeleton of a webpage that holds everything together.

### Basic HTML Tags

Every HTML document follows a standard structure. It begins with a document type declaration, followed by HTML tags that contain a head section and a body section. The head holds metadata like the page title, while the body contains the visible content.

Common HTML elements include headings, paragraphs, links, images, and lists. Headings use the h1 through h6 tags to define content hierarchy, with h1 being the most important. Paragraphs use the p tag to wrap blocks of text. Links use the anchor tag with a reference attribute to connect to other pages. Images use the img tag with source and alternative text attributes. Lists can be unordered using the ul tag with list items, or ordered using the ol tag.

### Block vs Inline Elements

HTML elements fall into two categories. Block elements like div, paragraph, and headings take up the full available width and start on new lines. Inline elements like span, anchor links, and strong text only take up as much space as needed and remain within the text flow.

## CSS: The Presentation

CSS, or Cascading Style Sheets, controls how HTML elements look. It handles colors, fonts, sizes, spacing, and the arrangement of elements on the page.

### Selectors and Properties

CSS uses selectors to pick which elements to style and properties to define the styling. You can select elements by their tag name like targeting all h1 elements, by class using a dot before the class name, or by ID using a hash before the identifier. Common properties include color for text color, font size for text sizing, and background color for element backgrounds.

### The Box Model

Every HTML element behaves like a rectangular box with four layers. The content layer holds the actual text or elements. Padding creates space around the content inside the border. The border forms the visible edge. Margin creates space outside the border, separating this element from others. Understanding these layers is essential for precise layout control.

### Layout Systems

Modern CSS offers flexible layout systems. Flexbox arranges elements in a row or column with properties to control spacing, alignment, and distribution of space. Grid creates two-dimensional layouts with rows and columns. These systems replace older approaches like floating elements and enable responsive designs.

### Responsive Design

Websites should adapt to different screen sizes. Media queries let you apply different styles based on conditions like screen width. This means a layout can be single-column on mobile phones and expand to multiple columns on tablets and desktop computers. The viewport meta tag in HTML ensures proper scaling on mobile devices.

## JavaScript: The Behavior

JavaScript adds interactivity and dynamic behavior to web pages. It responds to user actions, manipulates content, and communicates with servers.

### Variables and Data Types

JavaScript stores data in variables. The language supports several data types. Strings hold text content. Numbers include integers and decimals. Booleans represent true or false values. Arrays store ordered lists of items. Objects hold collections of labeled data with keys and values.

### Functions

Functions are reusable blocks of code that perform specific tasks. They can accept input values called parameters and return output values. Modern JavaScript introduces arrow functions that provide a more concise syntax for writing function expressions.

### The DOM

The Document Object Model represents the HTML structure as a tree of objects that JavaScript can access and modify. You can select elements using their ID, class name, or tag type. Once selected, you can change the text content, modify CSS styles, add or remove classes, or even create and insert new elements into the document.

### Event Handling

Events represent user interactions like mouse clicks, key presses, or form submissions. JavaScript can listen for these events and execute code in response. This enables interactive features like showing menus when buttons are clicked, validating form input as users type, or loading new content when scrolling.

### Asynchronous Operations

Some operations take time to complete, such as fetching data from a server or reading files. JavaScript handles these without blocking the rest of the code using promises and async functions. The await keyword pauses execution until an operation completes, making asynchronous code easier to read and write.

## How They Work Together

The three technologies form a complete frontend stack. HTML defines what content appears on the page. CSS controls how that content looks and is positioned. JavaScript determines how the page responds to user actions and updates dynamically. When building any feature, all three work together to create a complete experience for users.
