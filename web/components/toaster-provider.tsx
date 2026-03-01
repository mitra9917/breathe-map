'use client'

import { Toaster } from 'react-hot-toast'

export function ToasterProvider() {
    return (
        <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={12}
            toastOptions={{
                // Defaults for fallback (custom toasts override these)
                duration: 3500,
                style: { background: 'transparent', padding: 0, boxShadow: 'none' },
            }}
        />
    )
}
