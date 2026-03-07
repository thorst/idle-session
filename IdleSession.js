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
        onLogout = () => window.location.href = '/logout'
    } = {}) {
        this.timeout = timeout;
        this.heartbeatInterval = heartbeatInterval;
        this.warningBefore = warningBefore;
        this.onHeartbeat = onHeartbeat;
        this.logout = onLogout;

        this.channel = new BroadcastChannel(channelName);
        this.timer = null;
        this.warningTimer = null;
        this.needsHeartbeat = false;
        this._lastHandled = 0;

        this.init();
    }

    init() {
        this.channel.onmessage = (e) => { if (e.data === 'USER_ACTIVE') this.resetTimers(); };

        this._activityHandler = () => this.handleActivity();
        this._trackedEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'focus', 'input'];
        this._trackedEvents.forEach(evt => window.addEventListener(evt, this._activityHandler, { passive: true }));

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
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this._doLogout(), this.timeout);

        const warnAt = this.timeout - this.warningBefore;
        if (warnAt > 0) {
            clearTimeout(this.warningTimer);
            this.warningTimer = setTimeout(() => this.renderWarningModal(), warnAt);
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
        this.channel.close();
        const modal = document.getElementById('idle-warning-modal');
        if (modal) { modal.close(); modal.remove(); }
    }

    renderWarningModal() {
        if (document.getElementById('idle-warning-modal')) return;
        document.body.insertAdjacentHTML('beforeend', `
            <dialog id="idle-warning-modal" style="padding:2rem; border-radius:8px; border:1px solid #ccc;">
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
