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
    - id: "conn-style"
      type: "connector"
      position: { x: 340, y: 250 }
      data: { label: "styles" }
    - id: "conn-behavior"
      type: "connector"
      position: { x: 540, y: 250 }
      data: { label: "adds" }
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
      target: "tags"
    - id: "e8"
      source: "html"
      target: "dom"
    - id: "e9"
      source: "css"
      target: "conn-style"
    - id: "e10"
      source: "conn-style"
      target: "styling"
    - id: "e11"
      source: "css"
      target: "layout"
    - id: "e12"
      source: "css"
      target: "responsive"
    - id: "e13"
      source: "js"
      target: "conn-behavior"
    - id: "e14"
      source: "conn-behavior"
      target: "logic"
    - id: "e15"
      source: "js"
      target: "events"
    - id: "e16"
      source: "js"
      target: "async"
---

# Frontend Web Development Basics

Frontend web development is the practice of building the user interface of websites and web applications. It involves three core technologies: **HTML**, **CSS**, and **JavaScript**.

## HTML: The Structure

HTML (HyperText Markup Language) provides the structure and content of web pages. Think of it as the skeleton of a webpage.

### Basic HTML Tags

Every HTML document has a standard structure:

```html
<!DOCTYPE html>
<html>
	<head>
		<title>My Page</title>
	</head>
	<body>
		<h1>Hello World</h1>
		<p>This is a paragraph.</p>
	</body>
</html>
```

Common HTML elements:

**Headings** define the hierarchy of content. `<h1>` is the most important heading, while `<h6>` is the least important:

```html
<h1>Main Title</h1>
<h2>Section Heading</h2>
<h3>Subsection</h3>
```

**Paragraphs** contain blocks of text:

```html
<p>This is a paragraph of text.</p>
```

**Links** connect to other pages:

```html
<a href="https://example.com">Click here</a>
```

**Images** display pictures:

```html
<img src="photo.jpg" alt="Description" />
```

**Lists** organize items:

```html
<ul>
	<li>First item</li>
	<li>Second item</li>
</ul>
```

### Block vs Inline Elements

HTML elements are either **block-level** or **inline**:

- **Block elements** (like `<div>`, `<p>`, `<h1>`) take up the full width available and start on new lines
- **Inline elements** (like `<span>`, `<a>`, `<strong>`) only take up as much width as needed and stay in the flow

## CSS: The Presentation

CSS (Cascading Style Sheets) controls the visual appearance of HTML elements. It handles colors, fonts, sizes, spacing, and layout.

### Selectors and Properties

CSS uses **selectors** to target elements and **properties** to style them:

```css
/* Select by element name */
h1 {
	color: blue;
	font-size: 24px;
}

/* Select by class */
.highlight {
	background-color: yellow;
}

/* Select by ID */
#header {
	width: 100%;
}
```

### The Box Model

Every HTML element is a rectangular box with four layers:

1. **Content** - The actual content inside the element
2. **Padding** - Space around the content inside the border
3. **Border** - The visible edge around padding
4. **Margin** - Space outside the border, separating elements

```css
.box {
	width: 300px;
	padding: 20px;
	border: 2px solid black;
	margin: 10px;
}
```

### Layout with Flexbox

Flexbox is a modern layout system that makes it easy to arrange elements:

```css
.container {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
```

This creates a flexible container where child elements are arranged with space between them, vertically centered.

### Responsive Design

Websites should look good on all devices. Media queries allow different styles for different screen sizes:

```css
.container {
	width: 100%;
}

/* For screens wider than 768px */
@media (min-width: 768px) {
	.container {
		width: 750px;
		margin: 0 auto;
	}
}
```

## JavaScript: The Behavior

JavaScript adds interactivity and dynamic behavior to web pages. It responds to user actions, manipulates content, and communicates with servers.

### Variables and Types

JavaScript has three ways to declare variables:

```javascript
// Old way - function scoped
var name = "Alice";

// New ways - block scoped
let age = 25;
const PI = 3.14;
```

Data types include:

- **String**: text like `'hello'` or `"world"`
- **Number**: integers and decimals like `42` or `3.14`
- **Boolean**: `true` or `false`
- **Array**: ordered lists like `['a', 'b', 'c']`
- **Object**: collections of key-value pairs like `{ name: 'Alice', age: 25 }`

### Functions

Functions are reusable blocks of code:

```javascript
// Traditional function
function greet(name) {
	return "Hello, " + name;
}

// Arrow function (modern syntax)
const greet = (name) => {
	return `Hello, ${name}`;
};
```

### The DOM

The Document Object Model (DOM) is a programming interface for HTML. JavaScript uses it to access and modify page content:

```javascript
// Select an element
const title = document.getElementById("title");

// Change its content
title.textContent = "New Title";

// Change its style
title.style.color = "red";
```

### Event Handling

The user interacts with pages through events like clicks, mouse movements, and key presses:

```javascript
const button = document.querySelector("button");

button.addEventListener("click", () => {
	console.log("Button was clicked!");
});
```

### Asynchronous Operations

Some operations take time, like fetching data from a server. JavaScript handles these asynchronously with **Promises** and **async/await**:

```javascript
// Using async/await
async function fetchUserData(userId) {
	try {
		const response = await fetch(`/api/users/${userId}`);
		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error:", error);
	}
}
```

## How They Work Together

The three technologies form a complete frontend stack:

1. **HTML** defines what content appears on the page
2. **CSS** controls how that content looks and is positioned
3. **JavaScript** determines how the page responds to user actions and updates dynamically

For example, when building a button:

- HTML creates the button element: `<button id="save">Save</button>`
- CSS styles it with color, size, and hover effects
- JavaScript adds the click handler to actually save data

Understanding these three technologies is the foundation for all web development.
