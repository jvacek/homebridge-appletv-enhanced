import fs from 'fs';
import os from 'os';
import path from 'path';
import * as hap from '@homebridge/hap-nodejs';
import type { API, Logger, PlatformAccessory } from 'homebridge';
import type { AppleTVEnhancedPlatform } from '../appleTVEnhancedPlatform';
import type { AppleTVEnhancedPlatformConfig } from '../interfaces';
import LogLevelLogger, { LogLevel } from '../LogLevelLogger';

export interface FakePlatform {
    api: API;
    config: AppleTVEnhancedPlatformConfig;
    logLevelLogger: LogLevelLogger;
    platform: AppleTVEnhancedPlatform;
    published: PlatformAccessory[][];
    registered: PlatformAccessory[][];
    storagePath: string;
    unregistered: PlatformAccessory[][];
}

export function createFakePlatform(config: AppleTVEnhancedPlatformConfig, storagePath: string): FakePlatform {
    const log: Logger = {
        debug: (): void => { },
        error: (): void => { },
        info: (): void => { },
        log: (): void => { },
        success: (): void => { },
        warn: (): void => { },
    } as unknown as Logger;
    const logLevelLogger: LogLevelLogger = new LogLevelLogger(log, LogLevel.NONE);

    const published: PlatformAccessory[][] = [];
    const registered: PlatformAccessory[][] = [];
    const unregistered: PlatformAccessory[][] = [];

    const api: API = {
        hap,
        platformAccessory: (name: string, uuid: string): hap.Accessory => new hap.Accessory(name, uuid),
        publishExternalAccessories: (_plugin, accessories): void => {
            published.push(accessories);
        },
        registerPlatformAccessories: (_plugin, _platform, accessories): void => {
            registered.push(accessories);
        },
        unregisterPlatformAccessories: (_plugin, _platform, accessories): void => {
            unregistered.push(accessories);
        },
        user: {
            storagePath: (): string => storagePath,
        },
    } as unknown as API;

    const platform: AppleTVEnhancedPlatform = {
        api,
        characteristic: hap.Characteristic,
        config,
        logLevelLogger,
        service: hap.Service,
    } as unknown as AppleTVEnhancedPlatform;

    return { api, config, logLevelLogger, platform, published, registered, storagePath, unregistered };
}

/**
 * Builds a real HAP accessory (as `PlatformAccessory` wraps) with a `context`
 * carrying the MAC, mirroring what the platform sets in production.
 */
export function createTestAccessory(name: string, mac: string): hap.Accessory {
    const accessory: hap.Accessory = new hap.Accessory(name, hap.uuid.generate(mac));
    Object.assign(accessory, { context: { mac } });
    return accessory;
}

export function createTempStorage(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'appletv-enhanced-test-'));
}

export function removeTempStorage(storagePath: string): void {
    fs.rmSync(storagePath, { force: true, recursive: true });
}

export function writeCredentials(storagePath: string, mac: string, value: string = 'test-credentials'): void {
    const dir: string = path.join(storagePath, 'appletv-enhanced', mac.replaceAll(':', ''));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'credentials.txt'), value, 'utf8');
}
