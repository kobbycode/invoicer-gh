const EXPORT_COUNT_KEY = 'kvoice_guest_export_count';
const MAX_FREE_EXPORTS = 7;

export const getExportCount = (): number => {
    const count = localStorage.getItem(EXPORT_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
};

export const incrementExportCount = (): void => {
    const current = getExportCount();
    localStorage.setItem(EXPORT_COUNT_KEY, (current + 1).toString());
};

export const canExport = (isLoggedIn: boolean): boolean => {
    if (isLoggedIn) return true;
    return getExportCount() < MAX_FREE_EXPORTS;
};

export const getRemainingExports = (): number => {
    return Math.max(0, MAX_FREE_EXPORTS - getExportCount());
};

export const resetExportCount = (): void => {
    localStorage.removeItem(EXPORT_COUNT_KEY);
};

export const hasReachedLimit = (isLoggedIn: boolean): boolean => {
    if (isLoggedIn) return false;
    return getExportCount() >= MAX_FREE_EXPORTS;
};