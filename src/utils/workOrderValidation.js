export function validateWorkOrderDetails(form) {
  const errors = {};

  if (!form.title.trim()) errors.title = 'Title is required.';
  else if (form.title.length > 200) errors.title = 'Title must be 200 characters or fewer.';

  if (!form.description.trim()) errors.description = 'Description is required.';
  else if (form.description.length > 2000) errors.description = 'Description must be 2000 characters or fewer.';

  if (!form.priority) errors.priority = 'Priority is required.';
  if (!form.facilityId) errors.facilityId = 'Facility is required.';
  if (!form.assetId) errors.assetId = 'Asset is required.';

  return errors;
}

export function validateAssignment(form) {
  const errors = {};

  if (!form.technicianId) errors.technicianId = 'Please select a technician.';
  if (!form.startDate) errors.startDate = 'Start date is required.';
  if (!form.endDate) errors.endDate = 'End date is required.';

  if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
    errors.endDate = 'End date must be after the start date.';
  }

  return errors;
}
