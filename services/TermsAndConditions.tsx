import React from 'react';

interface TermsAndConditionsProps {
    accountName: string;
    momoNumber: string;
    network: string;
}

export const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({
    accountName,
    momoNumber,
    network
}) => {
    return (
        <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-500">
            <h4 className="font-bold uppercase tracking-widest mb-2 text-gray-400">Payment Terms & Instructions</h4>
            <p className="mb-2">
                Please make payment to the Mobile Money account details below.
                Use the Invoice Number as your reference.
            </p>
            <div className="bg-gray-50 p-3 rounded-lg inline-block">
                <p><span className="font-bold">Network:</span> {network}</p>
                <p><span className="font-bold">Account Name:</span> {accountName}</p>
                <p><span className="font-bold">Number:</span> {momoNumber}</p>
            </div>
            <p className="mt-2 italic">
                * Payments are automatically verified. If you experience any issues,
                please contact us immediately.
            </p>
        </div>
    );
};