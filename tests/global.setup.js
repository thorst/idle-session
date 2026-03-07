import fs from 'fs';
import path from 'path';

export default function globalSetup() {
    const dir = path.join(process.cwd(), '.nyc_output');
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
    fs.mkdirSync(dir, { recursive: true });
}
