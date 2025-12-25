export interface TourStep {
	target: string;
	title: string;
	content: string;
	placement?: "top" | "bottom" | "left" | "right" | "center";
	disableBeacon?: boolean;
}

export interface TourConfig {
	id: string;
	steps: TourStep[];
}

export const DASHBOARD_TOUR: TourConfig = {
	id: "dashboard",
	steps: [
		{
			target: "[data-tour-step='topics-sidebar']",
			title: "Topics Sidebar",
			content:
				"Organize your goal maps by topic here. Click to filter goal maps by topic.",
			placement: "right",
		},
		{
			target: "[data-tour-step='new-goal-map-btn']",
			title: "New Goal Map",
			content: "Click here to create a new concept map for your students.",
			placement: "bottom",
		},
		{
			target: "[data-tour-step='goal-map-cards']",
			title: "Goal Maps",
			content:
				"View all your concept maps here. Check kit status and last updated time.",
			placement: "left",
		},
		{
			target: "[data-tour-step='goal-map-actions']",
			title: "Quick Actions",
			content: "Hover over any goal map to see edit and delete options.",
			placement: "bottom",
		},
	],
};

export const GOAL_MAP_EDITOR_TOUR: TourConfig = {
	id: "goal-map-editor",
	steps: [
		{
			target: "[data-tour-step='add-concept-btn']",
			title: "Add Concept Nodes",
			content:
				"Create concept nodes with custom text and colors. These represent key ideas in your map.",
			placement: "top",
		},
		{
			target: "[data-tour-step='add-link-btn']",
			title: "Add Link Nodes",
			content:
				"Add connector nodes with preset labels: is, has, causes, belongs to, contains, leads to, requires, produces.",
			placement: "top",
		},
		{
			target: "[data-tour-step='import-btn']",
			title: "Import Learning Material",
			content:
				"Upload or paste reading material for students to reference while building their maps.",
			placement: "top",
		},
		{
			target: "[data-tour-step='undo-redo']",
			title: "Undo / Redo",
			content: "Made a mistake? Use undo to step back, or redo to go forward.",
			placement: "top",
		},
		{
			target: "[data-tour-step='view-controls']",
			title: "View Controls",
			content:
				"Zoom in/out, fit to screen, or center map. Search for specific nodes.",
			placement: "top",
		},
		{
			target: "[data-tour-step='direction-toggle']",
			title: "Edge Direction",
			content:
				"Toggle arrow markers on connections to show relationships direction.",
			placement: "top",
		},
		{
			target: "[data-tour-step='auto-layout']",
			title: "Auto Layout",
			content:
				"Automatically arrange nodes in a clean layout. Great for organizing complex maps.",
			placement: "top",
		},
		{
			target: "[data-tour-step='save-actions']",
			title: "Save & Create Kit",
			content:
				"Save your work, and create a kit to use this map in student assignments.",
			placement: "top",
		},
	],
};

export const ASSIGNMENT_CREATE_TOUR: TourConfig = {
	id: "assignment-create",
	steps: [
		{
			target: "[data-tour-step='goal-map-select']",
			title: "Select Goal Map",
			content: "Choose which concept map to use for this assignment.",
			placement: "bottom",
		},
		{
			target: "[data-tour-step='target-students']",
			title: "Target Students",
			content: "Assign to an entire cohort or select individual students.",
			placement: "bottom",
		},
		{
			target: "[data-tour-step='time-limit']",
			title: "Time Limit",
			content:
				"Optionally set a timer (1-180 minutes) for students to complete their map.",
			placement: "bottom",
		},
		{
			target: "[data-tour-step='kit-layout']",
			title: "Kit Layout",
			content:
				"Preset: All students see the same initial layout. Random: Each student gets a unique layout.",
			placement: "bottom",
		},
		{
			target: "[data-tour-step='create-assignment-btn']",
			title: "Create Assignment",
			content: "Click to publish the assignment to your selected students.",
			placement: "bottom",
		},
	],
};

export const ANALYTICS_TOUR: TourConfig = {
	id: "analytics",
	steps: [
		{
			target: "[data-tour-step='timeline-slider']",
			title: "Timeline Filter",
			content: "Filter student submissions by time period to track progress.",
			placement: "bottom",
		},
		{
			target: "[data-tour-step='analysis-modes']",
			title: "Analysis Modes",
			content:
				"Switch between Group Analysis, Flow Analysis, and Comparison views.",
			placement: "bottom",
		},
		{
			target: "[data-tour-step='session-list']",
			title: "Student Sessions",
			content:
				"View individual student submissions and click to see their maps.",
			placement: "left",
		},
	],
};

export const ADMIN_ROOMS_TOUR: TourConfig = {
	id: "admin-rooms",
	steps: [
		{
			target: "[data-tour-step='manage-users']",
			title: "Manage Users",
			content: "View all user accounts, roles, and manage access.",
			placement: "bottom",
		},
		{
			target: "[data-tour-step='manage-groups']",
			title: "Manage Groups",
			content: "Create and manage student cohorts/groups here.",
			placement: "bottom",
		},
		{
			target: "[data-tour-step='experiment-rooms']",
			title: "Experiment Rooms",
			content:
				"Set up controlled experiment sessions with specific groups and conditions.",
			placement: "bottom",
		},
	],
};

export const LEARNER_MAP_TOUR: TourConfig = {
	id: "learner-map",
	steps: [
		{
			target: "[data-tour-step='assignment-info']",
			title: "Assignment Info",
			content:
				"View the assignment title, description, and your current attempt count.",
			placement: "bottom",
		},
		{
			target: "[data-tour-step='connector-nodes']",
			title: "Connector Nodes",
			content:
				"Right-click a connector node, then choose 'Connect To' or 'Connect From' to link concepts.",
			placement: "bottom",
		},
		{
			target: "[data-tour-step='concept-nodes']",
			title: "Concept Nodes",
			content:
				"These are the main concepts from your reading material. Connect them using the connector nodes.",
			placement: "bottom",
		},
		{
			target: "[data-tour-step='undo-redo']",
			title: "Undo / Redo",
			content: "Made a mistake? Use undo to step back, or redo to go forward.",
			placement: "top",
		},
		{
			target: "[data-tour-step='reading-material']",
			title: "Reading Material",
			content:
				"Click here to view the reading material while building your concept map.",
			placement: "left",
		},
		{
			target: "[data-tour-step='submit-btn']",
			title: "Submit Assignment",
			content:
				"When you're done building your map, click here to submit for grading.",
			placement: "bottom",
		},
	],
};
