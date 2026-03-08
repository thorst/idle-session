export interface WarningCallbackArgs {
    /** Reset the idle timer and dismiss the warning — equivalent to user activity. */
    extend: () => void;
    /** Immediately end the session — calls `onLogout`. */
    logout: () => void;
}

export interface IdleSessionOptions {
    /** Idle time in ms before `onLogout` is triggered. Default: `900000` (15 min) */
    timeout?: number;
    /** How often in ms to ping the server when the user is active. Default: `300000` (5 min) */
    heartbeatInterval?: number;
    /** How many ms before `timeout` to show the warning. Default: `60000` (1 min). Set to `0` to disable. */
    warningBefore?: number;
    /** BroadcastChannel name for cross-tab sync. Default: `'session_sync'` */
    channelName?: string;
    /** Called on each heartbeat interval when the user has been active. Throwing triggers logout. */
    onHeartbeat?: () => Promise<void>;
    /** Called when the session expires or a heartbeat signals hard auth failure. */
    onLogout?: () => void;
    /**
     * Called instead of the built-in warning modal when the session is about to expire.
     * Receives `{ extend, logout }` — call `extend()` to reset the session, `logout()` to force-end it.
     * If omitted, the default `<dialog>` modal is shown (styleable via CSS custom properties).
     */
    onWarning?: (args: WarningCallbackArgs) => void;
}

export declare class IdleSession {
    // ── Public API ────────────────────────────────────────────────────────────

    /** Idle timeout in ms. Can be updated at runtime. */
    timeout: number;
    /** Heartbeat ping interval in ms. */
    heartbeatInterval: number;
    /** How many ms before `timeout` the warning fires. */
    warningBefore: number;
    /** True when user activity has occurred since the last heartbeat. Can be set to force/suppress the next ping. */
    needsHeartbeat: boolean;
    /** The BroadcastChannel name used for cross-tab sync. */
    readonly channelName: string;
    /** Called on each heartbeat interval when the user has been active. */
    onHeartbeat: () => Promise<void>;
    /** Called when the session expires. Reassign to override the default `/logout` redirect. */
    logout: () => void;
    /** Called instead of the built-in modal when the session is about to expire. */
    onWarning: ((args: WarningCallbackArgs) => void) | undefined;

    // ── Private internals ─────────────────────────────────────────────────────
    private channel: BroadcastChannel;
    private timer: ReturnType<typeof setTimeout> | null;
    private warningTimer: ReturnType<typeof setTimeout> | null;
    private _lastHandled: number;
    private _heartbeatInterval: ReturnType<typeof setInterval>;
    private _activityHandler: () => void;
    private _trackedEvents: string[];

    constructor(options?: IdleSessionOptions);

    // ── Public methods ────────────────────────────────────────────────────────

    /** Register activity, throttled to once per 500ms. Resets all timers and broadcasts across tabs. */
    handleActivity(): void;
    /** Reset all timers. Called automatically on user activity and cross-tab sync. */
    resetTimers(): void;
    /** Fires the heartbeat if activity has occurred since the last interval. */
    triggerHeartbeat(): Promise<void>;
    /** Remove all event listeners, clear timers, close the BroadcastChannel, and remove any open warning dialog. */
    destroy(): void;
    /**
     * Inject and open the built-in warning `<dialog>`. No-op if already visible.
     * Styled via CSS custom properties — override any of the following on a parent element or `:root`:
     * `--idle-bg`, `--idle-color`, `--idle-heading`, `--idle-muted`, `--idle-border`,
     * `--idle-accent`, `--idle-accent-text`
     */
    renderWarningModal(): void;

    // ── Private methods ───────────────────────────────────────────────────────
    private init(): void;
    private _doLogout(): void;
}

export default IdleSession;
