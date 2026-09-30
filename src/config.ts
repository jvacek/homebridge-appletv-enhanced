import type { AccessoryMode, AppleTVEnhancedPlatformConfig, DeviceConfigOverride, ExposeAs } from './interfaces';

/**
 * The structural accessory mode. `appleTV` and `setTopBox` both expose a
 * Television service and only differ in the accessory category, while
 * `sensorsOnly` exposes the configured sensors and switches as a bridged
 * accessory without a Television service.
 */
export function getAccessoryMode(config: AppleTVEnhancedPlatformConfig): AccessoryMode {
    return getExposeAs(config) === 'sensorsOnly' ? 'sensorsOnly' : 'television';
}

/**
 * Resolve the effective `exposeAs` value. The deprecated `setTopBox` flag is
 * honored when the newer `exposeAs` option is not set.
 */
export function getExposeAs(config: AppleTVEnhancedPlatformConfig): ExposeAs {
    if (config.exposeAs !== undefined) {
        return config.exposeAs;
    }
    return config.setTopBox === true ? 'setTopBox' : 'appleTV';
}

/**
 * Whether the configuration relies on the deprecated `setTopBox` flag instead
 * of the `exposeAs` option. Used to nudge users towards an explicit migration.
 */
export function isLegacySetTopBox(config: AppleTVEnhancedPlatformConfig): boolean {
    return config.exposeAs === undefined && config.setTopBox !== undefined;
}

/**
 * Apply the matching entry of `deviceSpecificOverrides` to the platform config.
 * The `exposeAs` mode is intentionally resolved lazily by `getExposeAs()` so the
 * deprecated `setTopBox` flag keeps working.
 */
export function resolveDeviceConfig(config: AppleTVEnhancedPlatformConfig, mac: string): AppleTVEnhancedPlatformConfig {
    const override: DeviceConfigOverride | undefined =
        config.deviceSpecificOverrides?.find((e) => e.mac?.toUpperCase() === mac.toUpperCase());

    const resolved: AppleTVEnhancedPlatformConfig = override === undefined
        ? { ...config }
        : structuredClone(config);

    if (override !== undefined) {
        if (override.overrideMediaTypes === true) {
            resolved.mediaTypes = override.mediaTypes;
        }
        if (override.overrideDeviceStates === true) {
            resolved.deviceStates = override.deviceStates;
        }
        if (override.overrideRemoteKeysAsSwitch === true) {
            resolved.remoteKeysAsSwitch = override.remoteKeysAsSwitch;
        }
        if (override.overrideAvadaKedavraAppAmount === true) {
            resolved.avadaKedavraAppAmount = override.avadaKedavraAppAmount;
        }
        if (override.overrideCustomInputURIs === true) {
            resolved.customInputURIs = override.customInputURIs;
        }
        if (override.overrideCustomPyatvCommands === true) {
            resolved.customPyatvCommands = override.customPyatvCommands;
        }
        if (override.overrideDisableCharacteristics === true) {
            resolved.disableCharacteristics = override.disableCharacteristics;
        }
        if (override.overrideDisableInputs === true) {
            resolved.disableInputs = override.disableInputs;
        }
        if (override.overrideDisableVolumeControlRemote === true) {
            resolved.disableVolumeControlRemote = override.disableVolumeControlRemote;
        }
        if (override.overrideAbsoluteVolumeControl === true) {
            resolved.absoluteVolumeControl = override.absoluteVolumeControl;
        }
        if (override.overrideSetTopBox === true) {
            resolved.setTopBox = override.setTopBox;
        }
        if (override.overrideExposeAs === true) {
            resolved.exposeAs = override.exposeAs;
        }
    }

    return resolved;
}
