export interface IdleSessionOptions {
    /** Idle time in ms before `onLogout` is triggered. Default: `900000` (15 min) */
    timeout?: number;
    /** How often in ms to ping the server when the user is active. Default: `300000` (5 min) */
    heartbeatInterval?: number;
    /** How many ms before `timeout` to show the warning modal. Default: `60000` (1 min) */
    warningBefore?: number;
    /** BroadcastChannel name for cross-tab sync. Default: `'session_sync'` */
    channelName?: string;
    /** Called on each heartbeat interval when the user has been active. Throwing triggers logout. */
    onHeartbeat?: () => Promise<void>;
    /** Called when the session expires or a heartbeat signals hard auth failure. */
    onLogout?: () => void;
}

export declare class IdleSession {
    timeout: number;
    heartbeatInterval: number;
    warningBefore: number;
    needsHeartbeat: boolean;
    channel: BroadcastChannel;
    timer: ReturnType<typeof setTimeout> | null;
    warningTimer: ReturnType<typeof setTimeout> | null;
    logout: () => void;
    onHeartbeat: () => Promise<void>;

    constructor(options?: IdleSessionOptions);

    /** Reset all timers. Called automatically on user activity and cross-tab sync. */
    resetTimers(): void;
    /** Fires the heartbeat if activity has occurred since the last interval. */
    triggerHeartbeat(): Promise<void>;
    /** Remove all event listeners, clear timers, close the BroadcastChannel, and remove any open warning dialog. */
    destroy(): void;
    /** Inject and open the warning modal. No-op if already visible. */
    renderWarningModal(): void;
}
