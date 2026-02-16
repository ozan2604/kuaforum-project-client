import React from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Sil',
    cancelText = 'İptal',
    isLoading = false
}) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4 transition-opacity animate-fadeIn">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all scale-100 animate-scaleIn relative z-[10000]">
                <div className="p-6 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        {message}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="w-full"
                        >
                            {cancelText}
                        </Button>
                        <Button
                            variant="primary"
                            className="w-full bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-500"
                            onClick={onConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? 'İşleniyor...' : confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
