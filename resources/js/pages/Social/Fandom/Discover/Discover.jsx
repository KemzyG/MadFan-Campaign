import { Head, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import SocialShell from '../../../../Layouts/SocialShell';
import CategoryGrid from './CategoryGrid';
import DiscoverHeader from './DiscoverHeader';
import FandomSearchSheet from './FandomSearchSheet';
import GroupPills from './GroupPills';
import PopularFandoms from './PopularFandoms';
import TrendingNow from './TrendingNow';

/**
 * The Fandom tab's landing screen: browse every category before opening one.
 * Picking a fandom (a card, a category tile, a search result) hands off to
 * its hub at /social/fandom/{slug} — this page only ever browses.
 */
export default function FandomDiscover({ groups, active_group: activeGroup, popular, categories, trending }) {
    const [searchOpen, setSearchOpen] = useState(false);
    const pillsRef = useRef(null);

    function selectGroup(key) {
        if (key === activeGroup) {
            return;
        }

        router.get('/social/fandom', key === 'all' ? {} : { group: key }, {
            preserveScroll: true,
            preserveState: true,
        });
    }

    return (
        <SocialShell hideHeader wide>
            <Head title="Fandom" />

            <div className="mf-page mf-fd">
                <DiscoverHeader
                    onOpenSearch={() => setSearchOpen(true)}
                    onOpenFilter={() => pillsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    pills={<GroupPills ref={pillsRef} groups={groups} onSelect={selectGroup} />}
                />

                {/*
                 * Mobile/tablet: one column, DOM order top-to-bottom. Desktop
                 * (see fandom-discover.css, 1024px+): a real 2-way split —
                 * main | trending rail, the same shape as .mf-split. The
                 * group pills live in the header above (same band on both
                 * breakpoints), not as a third column here.
                 */}
                <div className="mf-fd-shell">
                    <div className="mf-fd-main">
                        <PopularFandoms fandoms={popular} />
                        <CategoryGrid categories={categories} />
                    </div>

                    <TrendingNow subsets={trending} />
                </div>
            </div>

            <FandomSearchSheet open={searchOpen} onClose={() => setSearchOpen(false)} />
        </SocialShell>
    );
}
