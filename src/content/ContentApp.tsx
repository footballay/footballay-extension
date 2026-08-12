import { useEffect } from 'react';
import { FixturePicker } from '@/content/components/FixturePicker';
import { LeaguePicker } from '@/content/components/LeaguePicker';
import { useMatchPickerStore } from '@/content/stores/matchPickerStore';
import './content-app.css';

export function ContentApp() {
    const loadAvailableLeagues = useMatchPickerStore((state) => state.loadAvailableLeagues);

    useEffect(() => {
        void loadAvailableLeagues();
    }, [loadAvailableLeagues]);

    return (
        <aside className="footballay-content-panel" data-footballay-content-app="" aria-label="Footballay">
            <strong className="footballay-content-title">Footballay</strong>
            <LeaguePicker />
            <FixturePicker />
        </aside>
    );
}
