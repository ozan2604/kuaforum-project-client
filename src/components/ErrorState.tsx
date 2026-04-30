import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
    message?: string;
    onRetry?: () => void;
}

export const ErrorState: React.FC<Props> = ({
    message = 'Bir hata oluştu.',
    onRetry,
}) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-gray-600 text-sm mb-4">{message}</p>
        {onRetry && (
            <button
                onClick={onRetry}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
                Tekrar Dene
            </button>
        )}
    </div>
);
