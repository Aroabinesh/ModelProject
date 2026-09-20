// Live client for the Work Order Management API (see {BASE_URL}/swagger/index.html).
// Adapts the API's flat DTOs into the nested shape (facility/asset/technician
// objects) the WorkOrders screens are written against, so page components
// don't need to know about the wire format.

import { request, getCurrentUser } from './httpClient';
import { getAllowedNextStatuses, STATUS } from '../constants/workOrders';
import { validateWorkOrderDetails } from '../utils/workOrderValidation';

function toListItem(dto) {
  return {
    id: dto.id,
    title: dto.title,
    priority: dto.priority,
    status: dto.status,
    assetId: dto.assetId,
    facility: { id: dto.facilityId, name: dto.facilityName },
    asset: { id: dto.assetId, assetCode: dto.assetCode },
    technician: dto.assignedTechnicianId
      ? { id: dto.assignedTechnicianId, name: dto.assignedTechnicianName }
      : null,
    assignedTechnicianId: dto.assignedTechnicianId,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function toDetail(dto) {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    priority: dto.priority,
    status: dto.status,
    assetId: dto.assetId,
    facilityId: dto.facilityId,
    facility: { id: dto.facilityId, name: dto.facilityName },
    asset: { id: dto.assetId, name: dto.assetName, assetCode: dto.assetCode },
    customer: { name: dto.customerName },
    assignedTechnicianId: dto.assignedTechnicianId,
    technician: dto.assignedTechnicianId
      ? { id: dto.assignedTechnicianId, name: dto.assignedTechnicianName }
      : null,
    scheduledStartDate: dto.scheduledStartDate,
    scheduledEndDate: dto.scheduledEndDate,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    rowVersion: dto.rowVersion,
  };
}

function validateWorkOrderPayload(payload) {
  const errors = validateWorkOrderDetails(payload);
  if (Object.keys(errors).length > 0) {
    const err = new Error('Validation failed.');
    err.fieldErrors = errors;
    throw err;
  }
}

export async function listWorkOrders({
  search = '',
  status = '',
  priority = '',
  facilityId = '',
  technicianId = '',
  sortBy = 'createdAt',
  sortDir = 'desc',
  page = 0,
  pageSize = 10,
} = {}) {
  const result = await request('/api/workorders', {
    query: {
      Search: search,
      Status: status,
      Priority: priority,
      FacilityId: facilityId,
      TechnicianId: technicianId,
      SortBy: sortBy,
      SortDescending: sortDir === 'desc',
      Page: page + 1,
      PageSize: pageSize,
    },
  });

  return {
    items: (result.items || []).map(toListItem),
    total: result.totalCount,
  };
}

export async function getWorkOrder(id) {
  const dto = await request(`/api/workorders/${id}`);
  return toDetail(dto);
}

export async function getWorkOrderHistory(id) {
  const items = await request(`/api/workorders/${id}/history`);
  return (items || []).sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
}

export async function createWorkOrder(payload) {
  validateWorkOrderPayload(payload);

  const dto = await request('/api/workorders', {
    method: 'POST',
    body: {
      assetId: Number(payload.assetId),
      title: payload.title.trim(),
      description: payload.description.trim(),
      priority: payload.priority,
      assignedTechnicianId: null,
      createdBy: getCurrentUser(),
    },
  });

  return toDetail(dto);
}

// workOrder is the full detail object (from getWorkOrder/createWorkOrder/etc.) -
// its rowVersion is required by the API as an optimistic-concurrency token.
export async function updateWorkOrder(workOrder, payload) {
  validateWorkOrderPayload(payload);

  const dto = await request(`/api/workorders/${workOrder.id}`, {
    method: 'PUT',
    body: {
      title: payload.title.trim(),
      description: payload.description.trim(),
      priority: payload.priority,
      rowVersion: workOrder.rowVersion,
    },
  });

  return toDetail(dto);
}

export async function deleteWorkOrder(id) {
  await request(`/api/workorders/${id}`, { method: 'DELETE' });
}

// startDate/endDate are plain 'YYYY-MM-DD' strings from a date input, or empty/null to clear
// the schedule.
export async function assignTechnician(workOrder, technicianId, { startDate, endDate } = {}) {
  const dto = await request(`/api/workorders/${workOrder.id}/assign`, {
    method: 'PUT',
    body: {
      technicianId: Number(technicianId),
      scheduledStartDate: startDate || null,
      scheduledEndDate: endDate || null,
      changedBy: getCurrentUser(),
      rowVersion: workOrder.rowVersion,
    },
  });

  return toDetail(dto);
}

export async function changeStatus(workOrder, newStatus, { comments = '' } = {}) {
  const dto = await request(`/api/workorders/${workOrder.id}/status`, {
    method: 'PUT',
    body: {
      newStatus,
      changedBy: getCurrentUser(),
      comments,
      rowVersion: workOrder.rowVersion,
    },
  });

  return toDetail(dto);
}

// Guided fast-forward used by the "Complete Work Order" wizard step: advances
// a work order through every remaining allowed transition until it reaches
// Completed, one status-change call per hop (the API only allows one hop at
// a time), threading the returned rowVersion through each call.
export async function completeWorkOrder(workOrder, { comments = '' } = {}) {
  if (workOrder.status === STATUS.COMPLETED) {
    throw new Error('This work order is already completed.');
  }
  if (!workOrder.assignedTechnicianId) {
    throw new Error('Assign a technician before completing this work order.');
  }

  let current = workOrder;
  while (current.status !== STATUS.COMPLETED) {
    const [nextStatus] = getAllowedNextStatuses(current.status);
    if (!nextStatus) throw new Error(`Cannot complete a work order from status "${current.status}".`);

    const isFinalHop = nextStatus === STATUS.COMPLETED;
    current = await changeStatus(current, nextStatus, { comments: isFinalHop ? comments : '' });
  }

  return current;
}

export async function listFacilities() {
  const items = await request('/api/facilities');
  return (items || []).map((f) => ({
    id: f.id,
    name: f.name,
    location: f.location,
    customer: { id: f.customerId, name: f.customerName },
  }));
}

export async function listAssetsByFacility(facilityId, { page = 1, pageSize = 5 } = {}) {
  const result = await request('/api/assets', {
    query: { FacilityId: facilityId, Page: page, PageSize: pageSize },
  });

  if (Array.isArray(result)) {
    return { items: result, page: 1, totalPages: 1, totalCount: result.length };
  }
  return {
    items: result?.items || [],
    page: result?.page || page,
    totalPages: result?.totalPages || 1,
    totalCount: result?.totalCount || 0,
  };
}

export async function listTechnicians() {
  const items = await request('/api/technicians', { query: { activeOnly: true } });
  return items || [];
}

// There's no dedicated stats endpoint. Rather than pulling a page of work
// orders and aggregating client-side (which undercounts once there are more
// work orders than fit on that page), this asks the API for just the counts:
// PageSize: 1 on the (already paginated) list endpoint still returns an
// accurate totalCount, and active technicians come straight from the
// technician roster instead of being inferred from a work order sample.
export async function getWorkOrderStats() {
  const [totalResult, completedResult, activeTechnicians] = await Promise.all([
    request('/api/workorders', { query: { Page: 1, PageSize: 1 } }),
    request('/api/workorders', { query: { Page: 1, PageSize: 1, Status: STATUS.COMPLETED } }),
    listTechnicians(),
  ]);

  const total = totalResult.totalCount || 0;
  const completed = completedResult.totalCount || 0;
  const pending = total - completed;

  return { total, pending, completed, activeTechnicians: activeTechnicians.length };
}
