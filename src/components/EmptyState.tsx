import React from 'react';
import { InboxIcon } from 'lucide-react';

interface Props {
    message?: string;
    description?: string;
    action?: React.ReactNode;
    icon?: React.ReactNode;
}

export const EmptyState: React.FC<Props> = ({
    message = 'Henüz kayıt yok.',
    description,
    action,
    icon,
}) => (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-100">
        <div className="text-gray-300 mb-4">
            {icon ?? <InboxIcon className="h-12 w-12" />}
        </div>
        <p className="text-gray-700 font-medium">{message}</p>
        {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
    </div>
);
