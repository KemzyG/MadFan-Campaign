import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';

export function AdminPageHeader({ title, description, actions }) {
    return (
        <Card className="border-0 bg-transparent shadow-none ring-0">
            <CardHeader className="px-0">
                <CardTitle>{title}</CardTitle>
                {description ? <CardDescription>{description}</CardDescription> : null}
                {actions ? <CardAction>{actions}</CardAction> : null}
            </CardHeader>
        </Card>
    );
}
