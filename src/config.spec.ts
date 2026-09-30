import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getAccessoryMode, getExposeAs, resolveDeviceConfig } from './config';
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

    describe('resolveDeviceConfig', (): void => {
        it('normalizes exposeAs from the global config', (): void => {
            assert.equal(resolveDeviceConfig(baseConfig(), MAC).exposeAs, 'appleTV');
            assert.equal(resolveDeviceConfig({ ...baseConfig(), setTopBox: true }, MAC).exposeAs, 'setTopBox');
            assert.equal(resolveDeviceConfig({ ...baseConfig(), exposeAs: 'sensorsOnly' }, MAC).exposeAs, 'sensorsOnly');
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
            assert.equal(resolveDeviceConfig(config, MAC).exposeAs, 'sensorsOnly');
            assert.equal(resolveDeviceConfig(config, OTHER_MAC).exposeAs, 'appleTV');
        });

        it('lets a per-device override win over the deprecated setTopBox flag', (): void => {
            const config: AppleTVEnhancedPlatformConfig = {
                ...baseConfig(),
                setTopBox: true,
                deviceSpecificOverrides: [{ mac: MAC, overrideExposeAs: true, exposeAs: 'appleTV' }],
            };
            assert.equal(resolveDeviceConfig(config, MAC).exposeAs, 'appleTV');
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
