const GUEST_INVOICE_COUNT_KEY = 'kvoice_guest_invoice_count';
const MAX_GUEST_INVOICES = 7;

export const getGuestInvoiceCount = (): number => {
    const count = localStorage.getItem(GUEST_INVOICE_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
};

export const incrementGuestInvoiceCount = (): void => {
    const current = getGuestInvoiceCount();
    localStorage.setItem(GUEST_INVOICE_COUNT_KEY, (current + 1).toString());
};

export const canCreateInvoice = (isGuest: boolean): boolean => {
    if (!isGuest) return true; // Registered users have no limit
    return getGuestInvoiceCount() < MAX_GUEST_INVOICES;
};

export const getRemainingInvoices = (): number => {
    return Math.max(0, MAX_GUEST_INVOICES - getGuestInvoiceCount());
};

export const hasReachedInvoiceLimit = (isGuest: boolean): boolean => {
    if (!isGuest) return false;
    return getGuestInvoiceCount() >= MAX_GUEST_INVOICES;
};

export const resetGuestInvoiceCount = (): void => {
    localStorage.removeItem(GUEST_INVOICE_COUNT_KEY);
};
