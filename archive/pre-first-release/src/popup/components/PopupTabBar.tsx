import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { t } from '@/shared/i18n/locale';
import type { PopupTab } from '../types';
import footballayIconUrl from '../../../assets/footballay_icon.png';

type PopupTabBarProps = {
    activeTab: PopupTab;
    canControlPageOverlay: boolean;
    pageOverlayPending: boolean;
    pageOverlayVisible: boolean;
    onChangeTab: (activeTab: PopupTab) => void;
    onTogglePageOverlay: (visible: boolean) => void;
};

export function PopupTabBar({
    activeTab,
    canControlPageOverlay,
    pageOverlayPending,
    pageOverlayVisible,
    onChangeTab,
    onTogglePageOverlay,
}: PopupTabBarProps) {
    const settingsActive = activeTab === 'settings';
    const [powerInteracted, setPowerInteracted] = useState(false);

    return (
        <header className="footballay-popup-header">
            <div className="footballay-brand">
                <img src={footballayIconUrl} alt="" />
                <strong>{settingsActive ? t('popup.settings.title') : t('popup.title')}</strong>
            </div>

            <label
                className={[
                    'footballay-power',
                    pageOverlayPending ? 'footballay-power--pending' : '',
                    powerInteracted ? 'footballay-power--animated' : '',
                ]
                    .filter(Boolean)
                    .join(' ')}
                aria-label={t('popup.pageOverlay.toggle')}
            >
                <input
                    checked={pageOverlayVisible}
                    disabled={pageOverlayPending || !canControlPageOverlay}
                    type="checkbox"
                    onChange={(event) => {
                        setPowerInteracted(true);
                        onTogglePageOverlay(event.currentTarget.checked);
                    }}
                />
                <span></span>
            </label>

            <button
                className={`footballay-settings-toggle${settingsActive ? ' footballay-settings-toggle--active' : ''}`}
                type="button"
                aria-label={settingsActive ? t('popup.settings.close') : t('popup.settings.open')}
                aria-pressed={settingsActive}
                onClick={() => onChangeTab(settingsActive ? 'fixtures' : 'settings')}
            >
                <Settings className="footballay-settings-toggle__gear" aria-hidden size={18} strokeWidth={2.4} />
                <X className="footballay-settings-toggle__close" aria-hidden size={18} strokeWidth={2.6} />
            </button>
        </header>
    );
}
