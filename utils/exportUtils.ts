export const exportToCSV = (data: any[], filename: string) => {
    if (!data || !data.length) {
        alert("No data to export");
        return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(fieldName => {
            const val = row[fieldName];
            // Handle strings with commas or newlines, and objects/dates
            if (typeof val === 'string') {
                return `"${val.replace(/"/g, '""')}"`;
            }
            if (val instanceof Date) {
                return `"${val.toLocaleDateString()}"`;
            }
            if (typeof val === 'object' && val !== null) {
                // simple handling for nested objects (like client in invoice)
                // Assuming we might want to flatten or just JSON stringify
                // For this app, specific flattening might be better done by the caller
                // but for a generic util, JSON.stringify is safer or just [Object]
                return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
            }
            return val;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
