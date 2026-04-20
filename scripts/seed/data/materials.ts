import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import YAML from "yaml";

export interface MaterialData {
	title: string;
	description: string;
	nodes: Array<{
		id: string;
		type: "text" | "connector";
		position: { x: number; y: number };
		data: { label: string; color?: string };
	}>;
	edges: Array<{
		id: string;
		source: string;
		target: string;
	}>;
	content: string;
}

interface ParsedMaterial {
	frontmatter: Partial<MaterialData>;
	content: string;
}

function parseFrontmatter(content: string): ParsedMaterial {
	const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
	const match = content.match(frontmatterRegex);

	if (!match) {
		return { frontmatter: {}, content };
	}

	const [, rawFrontmatter, markdownContent] = match;
	const frontmatter = YAML.parse(rawFrontmatter) as Partial<MaterialData>;

	return { frontmatter, content: markdownContent || content };
}

function loadMaterials(): MaterialData[] {
	const materialsDir = new URL(".", import.meta.url).pathname;
	const files = readdirSync(materialsDir)
		.filter((f) => f.startsWith("material-") && f.endsWith(".md"))
		.sort();

	return files.map((file) => {
		const filePath = join(materialsDir, file);
		const content = readFileSync(filePath, "utf-8");
		const { frontmatter, content: markdownContent } = parseFrontmatter(content);

		return {
			title: frontmatter.title || "",
			description: frontmatter.description || "",
			nodes: frontmatter.nodes || [],
			edges: frontmatter.edges || [],
			content: markdownContent,
		};
	});
}

export const MATERIALS: MaterialData[] = loadMaterials();

export const GOAL_MAP_TO_MATERIAL: Record<string, MaterialData> = {};
for (const material of MATERIALS) {
	GOAL_MAP_TO_MATERIAL[material.title] = material;
}

export const TOPICS = [
	{
		title: "Daily Life & Culture",
		description: "Single N5 demo reading about Japan's three main islands and their major cities",
		goalMapTitles: ["Japan: Main Islands and Cities"],
	},
];