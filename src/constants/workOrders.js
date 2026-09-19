export const STATUS = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

export const STATUS_OPTIONS = [
  STATUS.NEW,
  STATUS.ASSIGNED,
  STATUS.IN_PROGRESS,
  STATUS.COMPLETED,
];

export const PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const PRIORITY_OPTIONS = [
  PRIORITY.LOW,
  PRIORITY.MEDIUM,
  PRIORITY.HIGH,
  PRIORITY.CRITICAL,
];

// Allowed forward transitions per the work-order status workflow.
export const STATUS_TRANSITIONS = {
  [STATUS.NEW]: [STATUS.ASSIGNED],
  [STATUS.ASSIGNED]: [STATUS.IN_PROGRESS],
  [STATUS.IN_PROGRESS]: [STATUS.COMPLETED],
  [STATUS.COMPLETED]: [],
};

export const STATUS_COLORS = {
  [STATUS.NEW]: 'default',
  [STATUS.ASSIGNED]: 'info',
  [STATUS.IN_PROGRESS]: 'warning',
  [STATUS.COMPLETED]: 'success',
};

export const PRIORITY_COLORS = {
  [PRIORITY.LOW]: 'default',
  [PRIORITY.MEDIUM]: 'info',
  [PRIORITY.HIGH]: 'warning',
  [PRIORITY.CRITICAL]: 'error',
};

export function getAllowedNextStatuses(currentStatus) {
  return STATUS_TRANSITIONS[currentStatus] || [];
}

export function isTransitionAllowed(fromStatus, toStatus) {
  return getAllowedNextStatuses(fromStatus).includes(toStatus);
}
