import { PRIORITY_OPTIONS, STATUS, STATUS_TRANSITIONS } from '../constants/workOrders';

export const customers = [
  { id: 'cust-1', name: 'Acme Manufacturing' },
  { id: 'cust-2', name: 'Northwind Logistics' },
  { id: 'cust-3', name: 'Globex Retail' },
];

export const facilities = [
  { id: 'fac-1', customerId: 'cust-1', name: 'Acme Plant 1', location: 'Detroit, MI' },
  { id: 'fac-2', customerId: 'cust-1', name: 'Acme Plant 2', location: 'Columbus, OH' },
  { id: 'fac-3', customerId: 'cust-2', name: 'Northwind Warehouse A', location: 'Memphis, TN' },
  { id: 'fac-4', customerId: 'cust-2', name: 'Northwind Warehouse B', location: 'Dallas, TX' },
  { id: 'fac-5', customerId: 'cust-3', name: 'Globex Distribution Center', location: 'Reno, NV' },
];

export const assets = [
  { id: 'asset-1', facilityId: 'fac-1', assetCode: 'AC-1001', name: 'Conveyor Belt A', assetType: 'Conveyor', status: 'Operational' },
  { id: 'asset-2', facilityId: 'fac-1', assetCode: 'AC-1002', name: 'Hydraulic Press 3', assetType: 'Press', status: 'Operational' },
  { id: 'asset-3', facilityId: 'fac-1', assetCode: 'AC-1003', name: 'CNC Machine 7', assetType: 'CNC', status: 'Under Maintenance' },
  { id: 'asset-4', facilityId: 'fac-2', assetCode: 'AC-2001', name: 'Packaging Line 1', assetType: 'Packaging', status: 'Operational' },
  { id: 'asset-5', facilityId: 'fac-2', assetCode: 'AC-2002', name: 'Forklift 12', assetType: 'Vehicle', status: 'Operational' },
  { id: 'asset-6', facilityId: 'fac-2', assetCode: 'AC-2003', name: 'Air Compressor 2', assetType: 'Compressor', status: 'Operational' },
  { id: 'asset-7', facilityId: 'fac-3', assetCode: 'AC-3001', name: 'Loading Dock Door 4', assetType: 'Dock Door', status: 'Operational' },
  { id: 'asset-8', facilityId: 'fac-3', assetCode: 'AC-3002', name: 'Pallet Jack 6', assetType: 'Vehicle', status: 'Operational' },
  { id: 'asset-9', facilityId: 'fac-3', assetCode: 'AC-3003', name: 'HVAC Unit 1', assetType: 'HVAC', status: 'Down' },
  { id: 'asset-10', facilityId: 'fac-4', assetCode: 'AC-4001', name: 'Sorting Conveyor B', assetType: 'Conveyor', status: 'Operational' },
  { id: 'asset-11', facilityId: 'fac-4', assetCode: 'AC-4002', name: 'Forklift 5', assetType: 'Vehicle', status: 'Operational' },
  { id: 'asset-12', facilityId: 'fac-5', assetCode: 'AC-5001', name: 'Backup Generator', assetType: 'Generator', status: 'Operational' },
  { id: 'asset-13', facilityId: 'fac-5', assetCode: 'AC-5002', name: 'Refrigeration Unit 3', assetType: 'Refrigeration', status: 'Under Maintenance' },
];

export const technicians = [
  { id: 'tech-1', name: 'John Carter' },
  { id: 'tech-2', name: 'Priya Sharma' },
  { id: 'tech-3', name: 'Miguel Torres' },
  { id: 'tech-4', name: 'Aisha Bello' },
  { id: 'tech-5', name: 'Wei Zhang' },
  { id: 'tech-6', name: 'Laura Kim' },
];

const titlesByType = [
  'Unexpected noise during operation',
  'Scheduled preventive maintenance',
  'Not powering on',
  'Leaking fluid near base',
  'Belt misalignment causing jams',
  'Overheating after extended use',
  'Replace worn parts',
  'Calibration drift detected',
  'Safety guard damaged',
  'Intermittent fault code',
];

function pick(arr, i) {
  return arr[i % arr.length];
}

function buildHistoryChain(workOrderId, targetStatus, baseDate) {
  const chain = [STATUS.NEW];
  let current = STATUS.NEW;
  while (current !== targetStatus) {
    const next = STATUS_TRANSITIONS[current][0];
    if (!next) break;
    chain.push(next);
    current = next;
  }

  const history = [];
  for (let i = 1; i < chain.length; i += 1) {
    const changedAt = new Date(baseDate.getTime() + i * 1000 * 60 * 60 * 6);
    history.push({
      id: `${workOrderId}-hist-${i}`,
      workOrderId,
      oldStatus: chain[i - 1],
      newStatus: chain[i],
      changedBy: pick(technicians, i).name,
      changedAt: changedAt.toISOString(),
      comments:
        chain[i] === STATUS.ASSIGNED
          ? 'Technician assigned and work scheduled.'
          : chain[i] === STATUS.IN_PROGRESS
          ? 'Work started on site.'
          : chain[i] === STATUS.COMPLETED
          ? 'Work completed and verified.'
          : '',
    });
  }
  return history;
}

function generateWorkOrders(count) {
  const statusCycle = [STATUS.NEW, STATUS.ASSIGNED, STATUS.IN_PROGRESS, STATUS.COMPLETED];
  const workOrders = [];
  const history = [];

  for (let i = 0; i < count; i += 1) {
    const asset = pick(assets, i);
    const status = pick(statusCycle, i);
    const priority = pick(PRIORITY_OPTIONS, i * 2 + 1);
    const createdAt = new Date(Date.now() - (count - i) * 1000 * 60 * 60 * 18);
    const updatedAt = createdAt;
    const id = `wo-${1000 + i}`;
    const assignedTechnicianId = status === STATUS.NEW ? null : pick(technicians, i).id;
    const scheduledStart = status === STATUS.NEW ? null : new Date(createdAt.getTime() + 1000 * 60 * 60 * 24);
    const scheduledEnd = status === STATUS.NEW ? null : new Date(createdAt.getTime() + 1000 * 60 * 60 * 24 * 3);

    workOrders.push({
      id,
      assetId: asset.id,
      title: `${asset.name}: ${pick(titlesByType, i)}`,
      description: `Reported issue on ${asset.name} (${asset.assetCode}) at facility level. Requires inspection and appropriate corrective action.`,
      priority,
      status,
      assignedTechnicianId,
      scheduledStart: scheduledStart ? scheduledStart.toISOString() : null,
      scheduledEnd: scheduledEnd ? scheduledEnd.toISOString() : null,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      rowVersion: 1,
    });

    history.push(...buildHistoryChain(id, status, createdAt));
  }

  return { workOrders, history };
}

const generated = generateWorkOrders(46);

export const initialWorkOrders = generated.workOrders;
export const initialWorkOrderHistory = generated.history;
