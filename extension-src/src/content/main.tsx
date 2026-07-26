// Reddit Power Toolkit — v2.0.0 content-script bridge.
// Legacy modules (shared, reddit-api, content, features-v2*) are loaded
// ahead of this file by the manifest and own the on-page UI (QuickBar,
// side panel, 36 Power features). This entry stays intentionally empty
// so future React-based enhancements can mount into a Shadow-DOM host
// without colliding with the legacy runtime.
export {};