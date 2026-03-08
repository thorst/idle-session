/**
 * IdleSession: Seamless, multi-tab session orchestration for the modern web.
 */
export class IdleSession {
    constructor({
        timeout = 900000,
        heartbeatInterval = 300000,
        warningBefore = 60000,
        channelName = 'session_sync',
        onHeartbeat = async () => {
            try {
                const res = await fetch('/api/keep-alive', { method: 'POST' });
                if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
            } catch (err) {
                // Only hard auth failures propagate — transient network errors are
                // swallowed so connectivity blips don't end the session.
                if (err.message === 'Unauthorized') throw err;
            }
        },
        onLogout = () => window.location.href = '/logout',
        onWarning = undefined,
    } = {}) {
        this.timeout = timeout;
        this.heartbeatInterval = heartbeatInterval;
        this.warningBefore = warningBefore;
        this.onHeartbeat = onHeartbeat;
        this.logout = onLogout;
        this.onWarning = onWarning;

        this.channelName = channelName;
        this.channel = new BroadcastChannel(channelName);
        this.timer = null;
        this.warningTimer = null;
        this.needsHeartbeat = false;
        this._lastHandled = 0;
        this._lastActiveAt = Date.now();

        this.init();
    }

    init() {
        this.channel.onmessage = (e) => { if (e.data === 'USER_ACTIVE') this.resetTimers(); };

        this._activityHandler = () => this.handleActivity();
        this._trackedEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'focus', 'input'];
        this._trackedEvents.forEach(evt => window.addEventListener(evt, this._activityHandler, { passive: true }));

        this._visibilityHandler = () => {
            if (document.visibilityState !== 'visible') return;
            const elapsed = Date.now() - this._lastActiveAt;
            if (elapsed >= this.timeout) {
                this._doLogout();
            } else {
                // Re-sync timers against wall-clock time in case JS was frozen
                clearTimeout(this.timer);
                this.timer = setTimeout(() => this._doLogout(), this.timeout - elapsed);
                const warnAt = this.timeout - this.warningBefore - elapsed;
                clearTimeout(this.warningTimer);
                if (warnAt > 0) {
                    this.warningTimer = this.onWarning
                        ? setTimeout(() => this.onWarning({ extend: () => this.handleActivity(), logout: () => this._doLogout() }), warnAt)
                        : setTimeout(() => this.renderWarningModal(), warnAt);
                } else {
                    // Warning window has already passed — show it immediately
                    this.onWarning
                        ? this.onWarning({ extend: () => this.handleActivity(), logout: () => this._doLogout() })
                        : this.renderWarningModal();
                }
            }
        };
        document.addEventListener('visibilitychange', this._visibilityHandler);

        this.resetTimers();
        this._heartbeatInterval = setInterval(() => this.triggerHeartbeat(), this.heartbeatInterval);
    }

    handleActivity() {
        const now = Date.now();
        if (now - this._lastHandled < 500) return;
        this._lastHandled = now;
        this.needsHeartbeat = true;
        this.channel.postMessage('USER_ACTIVE');
        this.resetTimers();
    }

    resetTimers() {
        this._lastActiveAt = Date.now();
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this._doLogout(), this.timeout);

        const warnAt = this.timeout - this.warningBefore;
        if (warnAt > 0) {
            clearTimeout(this.warningTimer);
            this.warningTimer = this.onWarning
                ? setTimeout(() => this.onWarning({ extend: () => this.handleActivity(), logout: () => this._doLogout() }), warnAt)
                : setTimeout(() => this.renderWarningModal(), warnAt);
        }
    }

    async triggerHeartbeat() {
        if (!this.needsHeartbeat) return;
        try {
            await this.onHeartbeat();
            this.needsHeartbeat = false;
        } catch (err) {
            console.error('Heartbeat failed, logging out.', err);
            this._doLogout();
        }
    }

    _doLogout() {
        const modal = document.getElementById('idle-warning-modal');
        if (modal) { modal.close(); modal.remove(); }
        this.logout();
    }

    destroy() {
        clearTimeout(this.timer);
        clearTimeout(this.warningTimer);
        clearInterval(this._heartbeatInterval);
        this._trackedEvents.forEach(evt => window.removeEventListener(evt, this._activityHandler));
        document.removeEventListener('visibilitychange', this._visibilityHandler);
        this.channel.close();
        const modal = document.getElementById('idle-warning-modal');
        if (modal) { modal.close(); modal.remove(); }
    }

    renderWarningModal() {
        if (document.getElementById('idle-warning-modal')) return;

        if (!document.getElementById('idle-warning-styles')) {
            document.head.insertAdjacentHTML('beforeend', `<style id="idle-warning-styles">
#idle-warning-modal {
    padding: 2rem;
    border-radius: 10px;
    border: 1px solid var(--idle-border, #e5e7eb);
    background: var(--idle-bg, #ffffff);
    color: var(--idle-color, #111827);
    max-width: 380px;
    width: 90vw;
    box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    font-family: system-ui, -apple-system, sans-serif;
    margin: auto;
}
#idle-warning-modal::backdrop {
    background: rgba(0,0,0,0.45);
}
#idle-warning-modal h2 {
    margin: 0 0 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--idle-heading, var(--idle-color, #111827));
}
#idle-warning-modal p {
    margin: 0 0 1.5rem;
    font-size: 0.875rem;
    line-height: 1.55;
    color: var(--idle-muted, #6b7280);
}
#idle-warning-modal footer {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}
#idle-warning-modal button {
    padding: 0.45rem 1.1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-family: inherit;
    cursor: pointer;
    border: 1px solid transparent;
    font-weight: 500;
    transition: opacity 0.15s;
}
#idle-warning-modal button:hover { opacity: 0.8; }
#stay-logged-in {
    background: var(--idle-accent, #2563eb);
    color: var(--idle-accent-text, #ffffff);
    border-color: var(--idle-accent, #2563eb);
    font-weight: 600;
}
#logout-now {
    background: transparent;
    color: var(--idle-muted, #6b7280);
    border-color: var(--idle-border, #e5e7eb);
}
            </style>`);
        }

        document.body.insertAdjacentHTML('beforeend', `
            <dialog id="idle-warning-modal">
                <h2>Session Expiring</h2>
                <p>Your session will end soon due to inactivity.</p>
                <footer>
                    <button id="stay-logged-in">Stay Logged In</button>
                    <button id="logout-now">Log Out</button>
                </footer>
            </dialog>
        `);
        const dialog = document.getElementById('idle-warning-modal');
        dialog.showModal();
        document.getElementById('stay-logged-in').onclick = () => { dialog.close(); dialog.remove(); this.handleActivity(); };
        document.getElementById('logout-now').onclick = () => this._doLogout();
    }
}
