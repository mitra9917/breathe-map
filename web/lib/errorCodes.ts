/**
 * Structured error codes for toast notifications.
 * Format: DOMAIN_ACTION_STATUS
 */
export const ErrorCodes = {
    ZONE_CREATE_FAILED: {
        code: 'ZONE_CREATE_FAILED',
        message: 'Unable to create zone',
    },
    ZONE_FETCH_ERROR: {
        code: 'ZONE_FETCH_ERROR',
        message: 'Failed to load zones',
    },
    ZONE_DELETE_FAILED: {
        code: 'ZONE_DELETE_FAILED',
        message: 'Failed to delete zone',
    },
    ZONE_UPDATE_FAILED: {
        code: 'ZONE_UPDATE_FAILED',
        message: 'Failed to update zone',
    },
    SIMULATION_RUN_FAILED: {
        code: 'SIMULATION_RUN_FAILED',
        message: 'Failed to run simulation',
    },
    DASHBOARD_LOAD_FAILED: {
        code: 'DASHBOARD_LOAD_FAILED',
        message: 'Failed to load dashboard data',
    },
    CITY_CREATE_MOCK: {
        code: 'CITY_CREATE_MOCK',
        message: 'City creation is not available in demo mode',
    },
    OFFLINE_MODE_ACTIVE: {
        code: 'OFFLINE_MODE_ACTIVE',
        message: 'Running in Offline Demo Mode',
    },
} as const

export type ErrorCode = keyof typeof ErrorCodes
