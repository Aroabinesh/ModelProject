// In-memory mock API for the Work Order Management module.
//
// This module stands in for the future ASP.NET Core backend. Every function
// returns a Promise shaped the way a real fetch() call would (resolve with
// data, reject with an Error), and internally simulates latency, so the
// screens in src/pages/WorkOrders can be swapped over to real HTTP calls
// later without changing their call sites.

import {
  assets,
  customers,
  facilities,
  initialWorkOrderHistory,
  initialWorkOrders,
  technicians,
} from '../data/mockData';
import { getAllowedNextStatuses, isTransitionAllowed, STATUS } from '../constants/workOrders';
import { validateAssignment, validateWorkOrderDetails } from '../utils/workOrderValidation';

const LATENCY_MS = 350;

let workOrders = initialWorkOrders.map((wo) => ({ ...wo }));
let workOrderHistory = initialWorkOrderHistory.map((h) => ({ ...h }));
let nextIdCounter = workOrders.length + 1000;

function delay(fn) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (err) {
        reject(err);
      }
    }, LATENCY_MS);
  });
}

function findAsset(assetId) {
  return assets.find((a) => a.id === assetId) || null;
}

function findFacility(facilityId) {
  return facilities.find((f) => f.id === facilityId) || null;
}

function findCustomer(customerId) {
  return customers.find((c) => c.id === customerId) || null;
}

function findTechnician(technicianId) {
  return technicians.find((t) => t.id === technicianId) || null;
}

function attachRelations(wo) {
  const asset = findAsset(wo.assetId);
  const facility = asset ? findFacility(asset.facilityId) : null;
  const customer = facility ? findCustomer(facility.customerId) : null;
  const technician = wo.assignedTechnicianId ? findTechnician(wo.assignedTechnicianId) : null;

  return {
    ...wo,
    asset,
    facility,
    customer,
    technician,
  };
}

function compareValues(a, b) {
  if (a === b) return 0;
  return a > b ? 1 : -1;
}

function sortWorkOrders(items, sortBy, sortDir) {
  const dir = sortDir === 'desc' ? -1 : 1;
  const sorted = [...items].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return compareValues(a.title.toLowerCase(), b.title.toLowerCase()) * dir;
      case 'priority':
        return compareValues(a.priority, b.priority) * dir;
      case 'status':
        return compareValues(a.status, b.status) * dir;
      case 'facility':
        return compareValues(a.facility?.name || '', b.facility?.name || '') * dir;
      case 'technician':
        return compareValues(a.technician?.name || '', b.technician?.name || '') * dir;
      case 'createdAt':
      default:
        return compareValues(new Date(a.createdAt).getTime(), new Date(b.createdAt).getTime()) * dir;
    }
  });
  return sorted;
}

export function listWorkOrders({
  search = '',
  status = '',
  priority = '',
  facilityId = '',
  sortBy = 'createdAt',
  sortDir = 'desc',
  page = 0,
  pageSize = 10,
} = {}) {
  return delay(() => {
    let items = workOrders.map(attachRelations);

    const term = search.trim().toLowerCase();
    if (term) {
      items = items.filter(
        (wo) =>
          wo.title.toLowerCase().includes(term) ||
          wo.id.toLowerCase().includes(term) ||
          wo.asset?.name?.toLowerCase().includes(term)
      );
    }

    if (status) {
      items = items.filter((wo) => wo.status === status);
    }

    if (priority) {
      items = items.filter((wo) => wo.priority === priority);
    }

    if (facilityId) {
      items = items.filter((wo) => wo.facility?.id === facilityId);
    }

    items = sortWorkOrders(items, sortBy, sortDir);

    const total = items.length;
    const start = page * pageSize;
    const pageItems = items.slice(start, start + pageSize);

    return { items: pageItems, total };
  });
}

export function getWorkOrder(id) {
  return delay(() => {
    const wo = workOrders.find((w) => w.id === id);
    if (!wo) throw new Error('Work order not found.');
    return attachRelations(wo);
  });
}

export function getWorkOrderHistory(id) {
  return delay(() => {
    return workOrderHistory
      .filter((h) => h.workOrderId === id)
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  });
}

function validateWorkOrderPayload(payload) {
  const errors = validateWorkOrderDetails(payload);
  if (Object.keys(errors).length > 0) {
    const err = new Error('Validation failed.');
    err.fieldErrors = errors;
    throw err;
  }
}

export function createWorkOrder(payload) {
  return delay(() => {
    validateWorkOrderPayload(payload);

    const now = new Date().toISOString();
    const id = `wo-${nextIdCounter}`;
    nextIdCounter += 1;

    const newWorkOrder = {
      id,
      assetId: payload.assetId,
      title: payload.title.trim(),
      description: payload.description.trim(),
      priority: payload.priority,
      status: STATUS.NEW,
      assignedTechnicianId: null,
      createdAt: now,
      updatedAt: now,
      rowVersion: 1,
    };

    workOrders = [newWorkOrder, ...workOrders];
    return attachRelations(newWorkOrder);
  });
}

export function updateWorkOrder(id, payload) {
  return delay(() => {
    validateWorkOrderPayload(payload);

    const index = workOrders.findIndex((w) => w.id === id);
    if (index === -1) throw new Error('Work order not found.');

    const existing = workOrders[index];
    const updated = {
      ...existing,
      assetId: payload.assetId,
      title: payload.title.trim(),
      description: payload.description.trim(),
      priority: payload.priority,
      updatedAt: new Date().toISOString(),
      rowVersion: existing.rowVersion + 1,
    };

    workOrders = [...workOrders.slice(0, index), updated, ...workOrders.slice(index + 1)];
    return attachRelations(updated);
  });
}

export function deleteWorkOrder(id) {
  return delay(() => {
    const exists = workOrders.some((w) => w.id === id);
    if (!exists) throw new Error('Work order not found.');
    workOrders = workOrders.filter((w) => w.id !== id);
    workOrderHistory = workOrderHistory.filter((h) => h.workOrderId !== id);
  });
}

export function assignTechnician(id, technicianId, schedule = {}) {
  return delay(() => {
    const { startDate, endDate } = schedule;
    const errors = validateAssignment({ technicianId, startDate, endDate });
    if (Object.keys(errors).length > 0) {
      const err = new Error('Validation failed.');
      err.fieldErrors = errors;
      throw err;
    }

    const index = workOrders.findIndex((w) => w.id === id);
    if (index === -1) throw new Error('Work order not found.');

    const existing = workOrders[index];
    const withAssignment = {
      ...existing,
      assignedTechnicianId: technicianId,
      scheduledStart: new Date(startDate).toISOString(),
      scheduledEnd: new Date(endDate).toISOString(),
      updatedAt: new Date().toISOString(),
      rowVersion: existing.rowVersion + 1,
    };
    workOrders = [...workOrders.slice(0, index), withAssignment, ...workOrders.slice(index + 1)];

    // Assigning a technician is what moves a brand-new work order into the
    // "Assigned" step of the workflow; re-assigning later doesn't re-trigger it.
    const updated =
      withAssignment.status === STATUS.NEW
        ? advanceStatus(index, STATUS.ASSIGNED, { comments: 'Technician assigned and work scheduled.' })
        : withAssignment;

    return attachRelations(updated);
  });
}

// Moves a work order exactly one step forward and records the transition in
// history. Shared by changeStatus (single, user-picked hop) and
// completeWorkOrder (an automatic multi-hop fast-forward to Completed).
function advanceStatus(index, newStatus, { comments = '', changedBy = 'Current User' } = {}) {
  const existing = workOrders[index];

  const updated = {
    ...existing,
    status: newStatus,
    updatedAt: new Date().toISOString(),
    rowVersion: existing.rowVersion + 1,
  };

  workOrders = [...workOrders.slice(0, index), updated, ...workOrders.slice(index + 1)];

  workOrderHistory = [
    ...workOrderHistory,
    {
      id: `${existing.id}-hist-${workOrderHistory.length + 1}`,
      workOrderId: existing.id,
      oldStatus: existing.status,
      newStatus,
      changedBy,
      changedAt: updated.updatedAt,
      comments: comments.trim(),
    },
  ];

  return updated;
}

export function changeStatus(id, newStatus, { comments = '', changedBy = 'Current User' } = {}) {
  return delay(() => {
    const index = workOrders.findIndex((w) => w.id === id);
    if (index === -1) throw new Error('Work order not found.');

    const existing = workOrders[index];

    if (!isTransitionAllowed(existing.status, newStatus)) {
      throw new Error(`Cannot change status from "${existing.status}" to "${newStatus}".`);
    }

    if (newStatus === STATUS.ASSIGNED && !existing.assignedTechnicianId) {
      throw new Error('Assign a technician before moving this work order to "Assigned".');
    }

    const updated = advanceStatus(index, newStatus, { comments, changedBy });
    return attachRelations(updated);
  });
}

// Guided fast-forward used by the "Complete Work Order" wizard step: advances
// a work order through every remaining allowed transition until it reaches
// Completed, writing one history record per hop for a full audit trail.
export function completeWorkOrder(id, { comments = '', changedBy = 'Current User' } = {}) {
  return delay(() => {
    let index = workOrders.findIndex((w) => w.id === id);
    if (index === -1) throw new Error('Work order not found.');

    if (workOrders[index].status === STATUS.COMPLETED) {
      throw new Error('This work order is already completed.');
    }
    if (!workOrders[index].assignedTechnicianId) {
      throw new Error('Assign a technician before completing this work order.');
    }

    let updated = workOrders[index];
    while (updated.status !== STATUS.COMPLETED) {
      const [nextStatus] = getAllowedNextStatuses(updated.status);

      if (!nextStatus) throw new Error(`Cannot complete a work order from status "${updated.status}".`);

      const isFinalHop = nextStatus === STATUS.COMPLETED;
      updated = advanceStatus(index, nextStatus, {
        comments: isFinalHop ? comments : '',
        changedBy,
      });
      index = workOrders.findIndex((w) => w.id === id);
    }

    return attachRelations(updated);
  });
}

export function listFacilities() {
  return delay(() => facilities.map((f) => ({ ...f, customer: findCustomer(f.customerId) })));
}

export function listAssetsByFacility(facilityId) {
  return delay(() => assets.filter((a) => a.facilityId === facilityId));
}

export function listTechnicians() {
  return delay(() => technicians.map((t) => ({ ...t })));
}

export function getWorkOrderStats() {
  return delay(() => {
    const total = workOrders.length;
    const pending = workOrders.filter((w) => w.status !== STATUS.COMPLETED).length;
    const completed = workOrders.filter((w) => w.status === STATUS.COMPLETED).length;
    const activeTechnicians = new Set(
      workOrders.filter((w) => w.assignedTechnicianId).map((w) => w.assignedTechnicianId)
    ).size;

    return { total, pending, completed, activeTechnicians };
  });
}
