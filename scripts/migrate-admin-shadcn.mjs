import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adminDir = path.join(__dirname, '../resources/js/pages/Admin');

const shadcnBlock = `import { adminBadgeClass, adminBadgeVariant } from '@/lib/admin-badge';
import { AdminFilterBar } from '@/lib/admin-filter-bar';
import { AdminPageHeader } from '@/lib/admin-page-header';
import { AdminPagination } from '@/lib/admin-pagination';
import { AdminTable } from '@/lib/admin-table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
`;

function migrate(content) {
    if (!content.includes('ops-')) {
        return content;
    }

    const nl = content.includes('\r\n') ? '\r\n' : '\n';
    let next = content;

    next = next.replace(new RegExp(`import \\{ OpsPageHeader \\} from '@\\/components\\/admin\\/ops-page-header';${nl}`, 'g'), '');
    next = next.replace(new RegExp(`import \\{ OpsDataTable \\} from '@\\/components\\/admin\\/ops-data-table';${nl}`, 'g'), '');
    next = next.replace(new RegExp(`import \\{ OpsDialog \\} from '@\\/components\\/admin\\/ops-dialog';${nl}`, 'g'), '');
    next = next.replace(
        new RegExp(`import \\{ OpsFormField, OpsInput, OpsSelect, OpsTextarea \\} from '@\\/components\\/admin\\/ops-form';${nl}`, 'g'),
        '',
    );
    next = next.replace(
        new RegExp(`import \\{ OpsFormField, OpsInput, OpsSelect \\} from '@\\/components\\/admin\\/ops-form';${nl}`, 'g'),
        '',
    );
    next = next.replace(new RegExp(`import \\{ OpsFormField, OpsInput \\} from '@\\/components\\/admin\\/ops-form';${nl}`, 'g'), '');
    next = next.replace(new RegExp(`import \\{ OpsFormField, OpsSelect \\} from '@\\/components\\/admin\\/ops-form';${nl}`, 'g'), '');
    next = next.replace(
        new RegExp(`import \\{ OpsFormField, OpsSelect, OpsTextarea \\} from '@\\/components\\/admin\\/ops-form';${nl}`, 'g'),
        '',
    );
    next = next.replace(new RegExp(`import \\{ OpsPagination \\} from '@\\/components\\/admin\\/ops-pagination';${nl}`, 'g'), '');
    next = next.replace(new RegExp(`import \\{ OpsBadge \\} from '@\\/components\\/admin\\/ops-badge';${nl}`, 'g'), '');
    next = next.replace(new RegExp(`import \\{ OpsFilterBar \\} from '@\\/components\\/admin\\/ops-filter-bar';${nl}`, 'g'), '');
    next = next.replace(new RegExp(`import \\{ OpsTextarea \\} from '@\\/components\\/admin\\/ops-form';${nl}`, 'g'), '');
    next = next.replace(new RegExp(`import \\{ OpsSelect \\} from '@\\/components\\/admin\\/ops-form';${nl}`, 'g'), '');

    if (!next.includes('@/lib/admin-page-header')) {
        next = next.replace(/^(import .+\r?\n)/m, `${shadcnBlock}$1`);
    }

    next = next.replace(/<OpsPageHeader/g, '<AdminPageHeader');
    next = next.replace(/<\/OpsPageHeader>/g, '</AdminPageHeader>');
    next = next.replace(/<OpsFilterBar/g, '<AdminFilterBar');
    next = next.replace(/<\/OpsFilterBar>/g, '</AdminFilterBar>');

    next = next.replace(/<OpsInput/g, '<Input');
    next = next.replace(/<\/OpsInput>/g, '</Input>');
    next = next.replace(/<OpsTextarea/g, '<Textarea');
    next = next.replace(/<\/OpsTextarea>/g, '</Textarea>');
    next = next.replace(/<OpsSelect/g, '<NativeSelect className="w-full"');
    next = next.replace(/<\/OpsSelect>/g, '</NativeSelect>');
    next = next.replace(/<option/g, '<NativeSelectOption');
    next = next.replace(/<\/option>/g, '</NativeSelectOption>');

    next = next.replace(
        /<OpsFormField([^>]*)label="([^"]*)"([^>]*)>/g,
        '<Field$1$3><FieldLabel>$2</FieldLabel>',
    );
    next = next.replace(
        /<OpsFormField([^>]*)label=\{([^}]+)\}([^>]*)>/g,
        '<Field$1$3><FieldLabel>$2</FieldLabel>',
    );
    next = next.replace(/<\/OpsFormField>/g, '</Field>');

    next = next.replace(
        /<OpsBadge variant="success">/g,
        '<Badge variant="secondary" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">',
    );
    next = next.replace(
        /<OpsBadge variant="warning">/g,
        '<Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">',
    );
    next = next.replace(/<OpsBadge variant="danger">/g, '<Badge variant="destructive">');
    next = next.replace(/<OpsBadge variant="brand">/g, '<Badge>');
    next = next.replace(/<OpsBadge variant="default">/g, '<Badge variant="secondary">');
    next = next.replace(
        /<OpsBadge variant=\{([^}]+)\}>/g,
        '<Badge variant={adminBadgeVariant($1)} className={adminBadgeClass($1)}>',
    );
    next = next.replace(/<\/OpsBadge>/g, '</Badge>');

    next = next.replace(/<OpsPagination /g, '<AdminPagination ');
    next = next.replace(/<OpsDataTable /g, '<AdminTable ');

    next = next.replace(
        /<OpsDialog open=\{([^}]+)\} onOpenChange=\{([^}]+)\} title=\{([^}]+)\} wide>/g,
        '<Dialog open={$1} onOpenChange={$2}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>{$3}</DialogTitle></DialogHeader>',
    );
    next = next.replace(
        /<OpsDialog open=\{([^}]+)\} onOpenChange=\{([^}]+)\} title="([^"]*)" wide>/g,
        '<Dialog open={$1} onOpenChange={$2}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>$3</DialogTitle></DialogHeader>',
    );
    next = next.replace(
        /<OpsDialog open=\{([^}]+)\} onOpenChange=\{([^}]+)\} title=\{([^}]+)\}>/g,
        '<Dialog open={$1} onOpenChange={$2}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{$3}</DialogTitle></DialogHeader>',
    );
    next = next.replace(
        /<OpsDialog open=\{([^}]+)\} onOpenChange=\{([^}]+)\} title="([^"]*)">/g,
        '<Dialog open={$1} onOpenChange={$2}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>$3</DialogTitle></DialogHeader>',
    );
    next = next.replace(/<\/OpsDialog>/g, '</DialogContent></Dialog>');

    return next;
}

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full);
        } else if (entry.name.endsWith('.jsx')) {
            const original = fs.readFileSync(full, 'utf8');
            const migrated = migrate(original);
            if (migrated !== original) {
                fs.writeFileSync(full, migrated);
                console.log('migrated', path.relative(adminDir, full));
            }
        }
    }
}

walk(adminDir);
