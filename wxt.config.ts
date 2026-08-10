import { defineConfig } from 'wxt';

export default defineConfig({
    srcDir: 'src',
    manifestVersion: 3,
    manifest: {
        default_locale: 'en',
        name: '__MSG_extension_name__',
        description: '__MSG_extension_description__',
        icons: {
            16: 'footballay_icon.png',
            32: 'footballay_icon.png',
            48: 'footballay_icon.png',
            128: 'footballay_icon.png',
        },
        action: {
            default_icon: {
                16: 'footballay_icon.png',
                32: 'footballay_icon.png',
                48: 'footballay_icon.png',
                128: 'footballay_icon.png',
            },
        },
        permissions: [],
    },
});
