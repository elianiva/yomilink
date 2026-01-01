// Mock for cloudflare:workers module in tests
// This allows tests to mock the env object

export const env = {
	MATERIAL_IMAGES: {
		put: async () => undefined,
		get: async () => null,
		delete: async () => undefined,
		list: async () => ({ objects: [], truncated: false }),
	},
};
