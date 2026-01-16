import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = 'data';
const PROJECT_FILE = 'project.nlw.json';

function getProjectPath(): string {
	return join(process.cwd(), DATA_DIR, PROJECT_FILE);
}

// GET - Load project
export const GET: RequestHandler = async () => {
	try {
		const projectPath = getProjectPath();

		if (!existsSync(projectPath)) {
			return json({ exists: false });
		}

		const content = await readFile(projectPath, 'utf-8');
		const project = JSON.parse(content);

		return json({ exists: true, project });
	} catch (err) {
		console.error('Failed to load project:', err);
		return json({ error: 'Failed to load project' }, { status: 500 });
	}
};

// POST - Save project
export const POST: RequestHandler = async ({ request }) => {
	try {
		const project = await request.json();
		const projectPath = getProjectPath();

		// Ensure data directory exists
		const dataDir = join(process.cwd(), DATA_DIR);
		if (!existsSync(dataDir)) {
			await mkdir(dataDir, { recursive: true });
		}

		await writeFile(projectPath, JSON.stringify(project, null, 2), 'utf-8');

		return json({ success: true });
	} catch (err) {
		console.error('Failed to save project:', err);
		return json({ error: 'Failed to save project' }, { status: 500 });
	}
};
