import { Link } from '@inertiajs/react';
import FandomCard from './FandomCard';

/**
 * The top horizontal shelf — most-followed fandoms in the active group,
 * sliding left/right the same way the trending row and category chips do.
 */
export default function PopularFandoms({ fandoms }) {
    if (fandoms.length === 0) {
        return null;
    }

    return (
        <section className="mf-fd-section">
            <div className="mf-fd-section__head">
                <h2 className="mf-fd-section__title">Popular Fandoms</h2>
                <Link href="/social/fandom?group=all" className="mf-fd-section__more">
                    View all
                </Link>
            </div>
            <div className="mf-fd-row">
                {fandoms.map((fandom) => (
                    <FandomCard key={fandom.id} fandom={fandom} />
                ))}
            </div>
        </section>
    );
}
