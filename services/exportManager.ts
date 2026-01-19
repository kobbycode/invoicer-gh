import { User } from 'firebase/auth';

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

export const canExport = (user: User | null): boolean => {
    if (!user) return false;
    if (!user.isAnonymous) return true; // Full users have no limit
    return getExportCount() < MAX_FREE_EXPORTS;
};

export const getRemainingExports = (): number => {
    return Math.max(0, MAX_FREE_EXPORTS - getExportCount());
};

export const resetExportCount = (): void => {
    localStorage.removeItem(EXPORT_COUNT_KEY);
};

export const hasReachedLimit = (user: User | null): boolean => {
    if (!user) return true;
    if (!user.isAnonymous) return false;
    return getExportCount() >= MAX_FREE_EXPORTS;
};