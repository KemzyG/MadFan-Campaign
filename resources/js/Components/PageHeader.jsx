export default function PageHeader({ title, description, actions }) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
    );
}
