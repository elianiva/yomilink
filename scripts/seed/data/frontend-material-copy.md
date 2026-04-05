# Frontend Web Development Basics

Frontend web development is the practice of building what users see and interact with on websites. There are three main technologies: **HTML**, **CSS**, and **JavaScript**.

## HTML: The Structure

HTML stands for **HyperText Markup Language**. It provides the structure and content of web pages. Think of HTML as the skeleton of a webpage.

### Basic HTML Tags

Every HTML document starts with this structure:

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

### Common HTML Elements

**Headings** create titles and subtitles on your page:

```html
<h1>Main Title</h1>
<h2>Section Heading</h2>
<h3>Smaller Heading</h3>
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
<img src="photo.jpg" alt="Description of the image" />
```

**Lists** organize items:

```html
<ul>
	<li>First item</li>
	<li>Second item</li>
	<li>Third item</li>
</ul>
```

### The Difference Between div and span

HTML elements are either **block-level** or **inline**:

- **Block elements** like `<div>` and `<p>` take up the full width and start on a new line
- **Inline elements** like `<span>` and `<a>` only take up as much space as needed

```html
<div>This is a block element</div>
<span>This is inline</span>
```

## CSS: The Style

CSS stands for **Cascading Style Sheets**. It controls how HTML elements look - colors, fonts, sizes, spacing, and positioning.

### Basic CSS Properties

CSS uses **selectors** to target elements and **properties** to style them:

```css
/* Make all h1 elements blue */
h1 {
	color: blue;
}

/* Make paragraphs centered */
p {
	text-align: center;
}

/* Set background color */
body {
	background-color: lightgray;
}
```

### Three Ways to Select Elements

**By element name**: Select all elements of a type

```css
p {
	color: red;
}
```

**By class**: Use a dot (.) to select elements with a specific class

```css
.highlight {
	background-color: yellow;
}
```

**By ID**: Use a hash (#) to select a specific element

```css
#header {
	width: 100%;
}
```

### The Box Model

Every HTML element is like a box with layers:

1. **Content** - The actual content inside
2. **Padding** - Space inside the border around content
3. **Border** - The visible edge
4. **Margin** - Space outside the border between elements

```css
.box {
	padding: 20px;
	border: 2px solid black;
	margin: 10px;
}
```

### Centering Content

To center a block element horizontally:

```css
.container {
	width: 500px;
	margin: 0 auto;
}
```

This sets equal automatic margins on left and right, centering the element.

## JavaScript: The Behavior

JavaScript makes webpages interactive. It responds to user actions and updates content dynamically.

### What JavaScript Can Do

JavaScript can:

- Respond to button clicks
- Show alerts and messages
- Change HTML content
- Change CSS styles
- Get user input

### Simple JavaScript Examples

**Change text when clicking a button:**

```javascript
function changeText() {
	document.getElementById("title").textContent = "New Title!";
}
```

**Show an alert message:**

```javascript
function showMessage() {
	alert("Hello! This is a message.");
}
```

**Change element color:**

```javascript
function makeRed() {
	document.getElementById("box").style.backgroundColor = "red";
}
```

### The DOM

The **Document Object Model (DOM)** represents the HTML document as objects that JavaScript can access and modify.

```javascript
// Get an element by its ID
const title = document.getElementById("title");

// Change what it says
title.textContent = "New Title";

// Change its color
title.style.color = "green";
```

### Handling Events

Events are actions that happen on the webpage, like a button click:

```html
<button onclick="sayHello()">Click Me</button>
```

```javascript
function sayHello() {
	alert("Hello!");
}
```

## How They Work Together

The three technologies work as a team:

1. **HTML** creates the content and structure
2. **CSS** makes it look good with colors, fonts, and layout
3. **JavaScript** adds interactivity and responds to user actions

**Example - A Simple Button:**

```html
<!-- HTML creates the button -->
<button id="myButton" onclick="changeColor()">Click Me</button>
```

```css
/* CSS styles the button */
button {
	background-color: blue;
	color: white;
	padding: 10px 20px;
	border: none;
}
```

```javascript
// JavaScript adds the behavior
function changeColor() {
	document.getElementById("myButton").style.backgroundColor = "green";
}
```

When you learn these three technologies, you can build complete webpages!
