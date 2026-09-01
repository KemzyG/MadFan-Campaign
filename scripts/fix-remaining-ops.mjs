import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const adminDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../resources/js/pages/Admin');

function fixOpsDialog(content) {
    return content.replace(/<OpsDialog\s+([\s\S]*?)>/g, (match, attrs) => {
        const wide = /\bwide\b/.test(attrs);
        const titleExpr = attrs.match(/title=\{([\s\S]*?)\}/)?.[1]
            ?? attrs.match(/title="([^"]*)"/)?.[1]
            ?? "''";
        const openExpr = attrs.match(/open=\{([\s\S]*?)\}/)?.[1]
            ?? (/\bopen\b/.test(attrs) && !attrs.includes('open=') ? 'true' : 'false');
        const onChangeExpr = attrs.match(/onOpenChange=\{([\s\S]*?)\}/)?.[1] ?? '() => {}';
        const maxWidth = wide ? 'sm:max-w-3xl' : 'sm:max-w-lg';

        return `<Dialog open={${openExpr}} onOpenChange={${onChangeExpr}}><DialogContent className="max-h-[90vh] overflow-y-auto ${maxWidth}"><DialogHeader><DialogTitle>{${titleExpr}}</DialogTitle></DialogHeader>`;
    });
}

function fixFile(content) {
    let next = content;

    next = next.replace(/<OpsDataTable/g, '<AdminTable');
    next = fixOpsDialog(next);
    next = next.replace(/<OpsBadge([^>]*)>/g, '<Badge$1>');
    next = next.replace(/<OpsBadge>/g, '<Badge>');

    return next;
}

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full);
        } else if (entry.name.endsWith('.jsx')) {
            const original = fs.readFileSync(full, 'utf8');
            if (!original.includes('Ops')) {
                continue;
            }
            const fixed = fixFile(original);
            fs.writeFileSync(full, fixed);
            console.log('fixed', path.relative(adminDir, full));
        }
    }
}

walk(adminDir);
