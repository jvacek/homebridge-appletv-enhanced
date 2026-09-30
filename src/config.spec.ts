import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getAccessoryMode, getExposeAs, isLegacySetTopBox, resolveDeviceConfig } from './config';
import type { AppleTVEnhancedPlatformConfig } from './interfaces';

const MAC: string = 'AA:BB:CC:DD:EE:FF';
const OTHER_MAC: string = '11:22:33:44:55:66';

const baseConfig = (): AppleTVEnhancedPlatformConfig => {
    return {
        name: 'Apple TV Enhanced',
        platform: 'AppleTVEnhanced',
    };
};

describe('config', (): void => {
    describe('getExposeAs', (): void => {
        it('defaults to appleTV', (): void => {
            assert.equal(getExposeAs(baseConfig()), 'appleTV');
        });

        it('maps the deprecated setTopBox flag', (): void => {
            assert.equal(getExposeAs({ ...baseConfig(), setTopBox: true }), 'setTopBox');
            assert.equal(getExposeAs({ ...baseConfig(), setTopBox: false }), 'appleTV');
        });

        it('prefers exposeAs over the deprecated setTopBox flag', (): void => {
            assert.equal(getExposeAs({ ...baseConfig(), exposeAs: 'sensorsOnly', setTopBox: true }), 'sensorsOnly');
        });
    });

    describe('getAccessoryMode', (): void => {
        it('treats appleTV and setTopBox as television', (): void => {
            assert.equal(getAccessoryMode({ ...baseConfig(), exposeAs: 'appleTV' }), 'television');
            assert.equal(getAccessoryMode({ ...baseConfig(), exposeAs: 'setTopBox' }), 'television');
        });

        it('maps the sensorsOnly exposeAs value to the sensorsOnly mode', (): void => {
            assert.equal(getAccessoryMode({ ...baseConfig(), exposeAs: 'sensorsOnly' }), 'sensorsOnly');
        });
    });

    describe('isLegacySetTopBox', (): void => {
        it('is true when only setTopBox is set', (): void => {
            assert.equal(isLegacySetTopBox({ ...baseConfig(), setTopBox: true }), true);
            assert.equal(isLegacySetTopBox({ ...baseConfig(), setTopBox: false }), true);
        });

        it('is false when exposeAs is set', (): void => {
            assert.equal(isLegacySetTopBox({ ...baseConfig(), exposeAs: 'appleTV', setTopBox: true }), false);
        });

        it('is false when neither is set', (): void => {
            assert.equal(isLegacySetTopBox(baseConfig()), false);
        });
    });

    describe('resolveDeviceConfig', (): void => {
        it('resolves exposeAs from the global config', (): void => {
            assert.equal(getExposeAs(resolveDeviceConfig(baseConfig(), MAC)), 'appleTV');
            assert.equal(getExposeAs(resolveDeviceConfig({ ...baseConfig(), setTopBox: true }, MAC)), 'setTopBox');
            assert.equal(getExposeAs(resolveDeviceConfig({ ...baseConfig(), exposeAs: 'sensorsOnly' }, MAC)), 'sensorsOnly');
        });

        it('does not mutate the platform config', (): void => {
            const config: AppleTVEnhancedPlatformConfig = { ...baseConfig(), setTopBox: true };
            resolveDeviceConfig(config, MAC);
            assert.equal(config.exposeAs, undefined);
        });

        it('applies per-device exposeAs overrides case-insensitively', (): void => {
            const config: AppleTVEnhancedPlatformConfig = {
                ...baseConfig(),
                deviceSpecificOverrides: [{ mac: MAC.toLowerCase(), overrideExposeAs: true, exposeAs: 'sensorsOnly' }],
            };
            assert.equal(getExposeAs(resolveDeviceConfig(config, MAC)), 'sensorsOnly');
            assert.equal(getExposeAs(resolveDeviceConfig(config, OTHER_MAC)), 'appleTV');
        });

        it('lets a per-device override win over the deprecated setTopBox flag', (): void => {
            const config: AppleTVEnhancedPlatformConfig = {
                ...baseConfig(),
                setTopBox: true,
                deviceSpecificOverrides: [{ mac: MAC, overrideExposeAs: true, exposeAs: 'appleTV' }],
            };
            assert.equal(getExposeAs(resolveDeviceConfig(config, MAC)), 'appleTV');
        });

        it('keeps a per-device legacy setTopBox override detectable', (): void => {
            const config: AppleTVEnhancedPlatformConfig = {
                ...baseConfig(),
                deviceSpecificOverrides: [{ mac: MAC, overrideSetTopBox: true, setTopBox: true }],
            };
            const resolved: AppleTVEnhancedPlatformConfig = resolveDeviceConfig(config, MAC);
            assert.equal(isLegacySetTopBox(resolved), true);
            assert.equal(getExposeAs(resolved), 'setTopBox');
        });

        it('still applies the other per-device overrides', (): void => {
            const config: AppleTVEnhancedPlatformConfig = {
                ...baseConfig(),
                disableInputs: false,
                deviceSpecificOverrides: [{ mac: MAC, overrideDisableInputs: true, disableInputs: true }],
            };
            assert.equal(resolveDeviceConfig(config, MAC).disableInputs, true);
            assert.equal(resolveDeviceConfig(config, OTHER_MAC).disableInputs, false);
        });
    });
});
