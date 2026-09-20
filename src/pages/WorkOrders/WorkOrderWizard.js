import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  TextField,
  MenuItem,
  Button,
  Grid,
  Alert,
  Autocomplete,
  CircularProgress,
  Chip,
  Divider,
  Snackbar,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import {
  PRIORITY_OPTIONS,
  STATUS,
  STATUS_COLORS,
  STATUS_LABELS,
} from '../../constants/workOrders';
import {
  createWorkOrder,
  updateWorkOrder,
  getWorkOrder,
  getWorkOrderHistory,
  listAssetsByFacility,
  listFacilities,
  listTechnicians,
  assignTechnician,
  completeWorkOrder,
} from '../../api/workOrdersApi';
import { validateAssignment, validateWorkOrderDetails } from '../../utils/workOrderValidation';

const EMPTY_DETAILS = { facilityId: '', assetId: '', title: '', description: '', priority: '' };
const EMPTY_ASSIGNMENT = { technicianId: '', startDate: '', endDate: '' };

// Dates come back from the API as ISO datetime strings (e.g. "2026-09-19T00:00:00");
// <input type="date"> needs the plain "YYYY-MM-DD" portion.
function toDateInputValue(isoString) {
  return isoString ? isoString.slice(0, 10) : '';
}

const STEPS = [
  { label: '1. Work Order Details' },
  { label: '2. Assign Technician' },
  { label: '3. Complete Work Order' },
  { label: 'History' },
];

function WorkOrderWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [activeTab, setActiveTab] = useState(0);
  const [workOrder, setWorkOrder] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(isEditMode);
  const [loadError, setLoadError] = useState('');

  const ASSET_PAGE_SIZE = 5;

  const [facilities, setFacilities] = useState([]);
  const [facilitiesError, setFacilitiesError] = useState('');
  const [assets, setAssets] = useState([]);
  const [assetsPage, setAssetsPage] = useState(1);
  const [assetsTotalPages, setAssetsTotalPages] = useState(1);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsLoadingMore, setAssetsLoadingMore] = useState(false);
  const [assetsError, setAssetsError] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [techniciansError, setTechniciansError] = useState('');

  const [detailsForm, setDetailsForm] = useState(EMPTY_DETAILS);
  const [detailsTouched, setDetailsTouched] = useState({});
  const [detailsSubmitting, setDetailsSubmitting] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const [assignForm, setAssignForm] = useState(EMPTY_ASSIGNMENT);
  const [assignTouched, setAssignTouched] = useState({});
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState('');

  const [completeComments, setCompleteComments] = useState('');
  const [completeSubmitting, setCompleteSubmitting] = useState(false);
  const [completeError, setCompleteError] = useState('');

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    listFacilities()
      .then(setFacilities)
      .catch((err) => setFacilitiesError(err.message || 'Failed to load facilities.'));
    listTechnicians()
      .then(setTechnicians)
      .catch((err) => setTechniciansError(err.message || 'Failed to load technicians.'));
  }, []);

  useEffect(() => {
    if (!id) return;

    setLoadingInitial(true);
    getWorkOrder(id)
      .then((wo) => {
        setWorkOrder(wo);
        setDetailsForm({
          facilityId: wo.facility?.id || '',
          assetId: wo.assetId || '',
          title: wo.title,
          description: wo.description,
          priority: wo.priority,
        });
        setAssignForm({
          technicianId: wo.assignedTechnicianId || '',
          startDate: toDateInputValue(wo.scheduledStartDate),
          endDate: toDateInputValue(wo.scheduledEndDate),
        });
      })
      .catch((err) => setLoadError(err.message || 'Failed to load work order.'))
      .finally(() => setLoadingInitial(false));
  }, [id]);

  useEffect(() => {
    if (!detailsForm.facilityId) {
      setAssets([]);
      setAssetsPage(1);
      setAssetsTotalPages(1);
      setAssetsError('');
      return;
    }
    setAssetsLoading(true);
    setAssetsError('');
    listAssetsByFacility(detailsForm.facilityId, { page: 1, pageSize: ASSET_PAGE_SIZE })
      .then((result) => {
        setAssets(result.items);
        setAssetsPage(result.page);
        setAssetsTotalPages(result.totalPages);
      })
      .catch((err) => {
        setAssets([]);
        setAssetsError(err.message || 'Failed to load asset codes for this facility.');
      })
      .finally(() => setAssetsLoading(false));
  }, [detailsForm.facilityId]);

  const handleLoadMoreAssets = useCallback(async () => {
    setAssetsLoadingMore(true);
    setAssetsError('');
    try {
      const nextPage = assetsPage + 1;
      const result = await listAssetsByFacility(detailsForm.facilityId, {
        page: nextPage,
        pageSize: ASSET_PAGE_SIZE,
      });
      setAssets((prev) => [...prev, ...result.items]);
      setAssetsPage(result.page);
      setAssetsTotalPages(result.totalPages);
    } catch (err) {
      setAssetsError(err.message || 'Failed to load more asset codes.');
    } finally {
      setAssetsLoadingMore(false);
    }
  }, [assetsPage, detailsForm.facilityId]);

  useEffect(() => {
    if (activeTab !== 3 || !workOrder) return;
    setHistoryLoading(true);
    setHistoryError('');
    getWorkOrderHistory(workOrder.id)
      .then(setHistory)
      .catch((err) => setHistoryError(err.message || 'Failed to load history.'))
      .finally(() => setHistoryLoading(false));
  }, [activeTab, workOrder]);

  const detailsErrors = useMemo(() => validateWorkOrderDetails(detailsForm), [detailsForm]);
  const assignErrors = useMemo(() => validateAssignment(assignForm), [assignForm]);

  // Ensures the already-assigned asset still renders correctly even if it isn't
  // on the currently loaded page(s) of the paginated asset list.
  const assetOptions = useMemo(() => {
    if (workOrder?.asset?.id != null && !assets.some((a) => a.id === workOrder.asset.id)) {
      return [{ id: workOrder.asset.id, name: workOrder.asset.name, assetCode: workOrder.asset.assetCode }, ...assets];
    }
    return assets;
  }, [assets, workOrder]);

  const AssetListPaper = useCallback(
    ({ children, ...paperProps }) => (
      <Paper {...paperProps}>
        {children}
        {assetsPage < assetsTotalPages && (
          <Button
            fullWidth
            size="small"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleLoadMoreAssets}
            disabled={assetsLoadingMore}
            sx={{ justifyContent: 'flex-start', px: 2, py: 1 }}
          >
            {assetsLoadingMore ? <CircularProgress size={16} /> : 'Load 5 more asset codes'}
          </Button>
        )}
      </Paper>
    ),
    [assetsPage, assetsTotalPages, assetsLoadingMore, handleLoadMoreAssets]
  );

  const step1Done = Boolean(workOrder);
  const step2Done = Boolean(workOrder?.assignedTechnicianId);
  const step3Done = workOrder?.status === STATUS.COMPLETED;

  const handleDetailsChange = (field) => (e) => {
    const value = e.target.value;
    setDetailsForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'facilityId' ? { assetId: '' } : {}),
    }));
  };
  const handleDetailsBlur = (field) => () => setDetailsTouched((prev) => ({ ...prev, [field]: true }));
  const detailsFieldError = (field) => detailsTouched[field] && Boolean(detailsErrors[field]);
  const detailsFieldHelper = (field) => (detailsTouched[field] && detailsErrors[field]) || ' ';

  const handleSaveDetails = async () => {
    setDetailsTouched({ title: true, description: true, priority: true, facilityId: true, assetId: true });
    if (Object.keys(detailsErrors).length > 0) return;

    setDetailsSubmitting(true);
    setDetailsError('');
    try {
      if (workOrder) {
        const updated = await updateWorkOrder(workOrder, detailsForm);
        setWorkOrder(updated);
        setSnackbar({ open: true, message: 'Work order details updated.' });
      } else {
        const created = await createWorkOrder(detailsForm);
        setWorkOrder(created);
        setSnackbar({ open: true, message: 'Work order created. Now assign a technician.' });
        setActiveTab(1);
        navigate(`/work-orders/${created.id}/wizard`, { replace: true });
      }
    } catch (err) {
      setDetailsError(err.message || 'Failed to save work order details.');
    } finally {
      setDetailsSubmitting(false);
    }
  };

  const handleAssignChange = (field) => (e) => {
    setAssignForm((prev) => ({ ...prev, [field]: e.target.value }));
  };
  const handleAssignBlur = (field) => () => setAssignTouched((prev) => ({ ...prev, [field]: true }));
  const assignFieldError = (field) => assignTouched[field] && Boolean(assignErrors[field]);
  const assignFieldHelper = (field) => (assignTouched[field] && assignErrors[field]) || ' ';

  const handleSaveAssignment = async () => {
    setAssignTouched({ technicianId: true });
    if (Object.keys(assignErrors).length > 0) return;

    setAssignSubmitting(true);
    setAssignError('');
    try {
      const updated = await assignTechnician(workOrder, assignForm.technicianId, {
        startDate: assignForm.startDate,
        endDate: assignForm.endDate,
      });
      setWorkOrder(updated);
      setSnackbar({ open: true, message: 'Technician assigned. Ready to complete the work order.' });
      setActiveTab(2);
    } catch (err) {
      setAssignError(err.message || 'Failed to assign technician.');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setCompleteSubmitting(true);
    setCompleteError('');
    try {
      const updated = await completeWorkOrder(workOrder, { comments: completeComments });
      setWorkOrder(updated);
      setSnackbar({ open: true, message: 'Work order completed successfully.' });
    } catch (err) {
      setCompleteError(err.message || 'Failed to complete work order.');
    } finally {
      setCompleteSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/work-orders')}
        sx={{ mb: 1 }}
      >
        Back to Work Orders
      </Button>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
        {isEditMode ? 'Edit Work Order' : 'Create Work Order'}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {isEditMode
          ? 'Update the work order details, manage the technician assignment and schedule, complete it, or review its status history.'
          : 'Complete each step in order: create the work order, assign a technician and schedule, then mark it complete.'}
      </Typography>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      )}

      <Paper elevation={2} sx={{ borderRadius: 3, width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(e, value) => setActiveTab(value)}
          variant="fullWidth"
          sx={{
            borderBottom: '1px solid #e0e0e0',
            '& .MuiTab-root': { fontSize: '0.95rem', py: 2.5 },
          }}
        >
          <Tab label={STEPS[0].label} icon={step1Done ? <CheckCircleIcon color="success" fontSize="small" /> : undefined} iconPosition="end" />
          <Tab
            label={STEPS[1].label}
            icon={step2Done ? <CheckCircleIcon color="success" fontSize="small" /> : undefined}
            iconPosition="end"
            disabled={!step1Done}
          />
          <Tab
            label={STEPS[2].label}
            icon={step3Done ? <CheckCircleIcon color="success" fontSize="small" /> : undefined}
            iconPosition="end"
            disabled={!step2Done}
          />
          <Tab label={STEPS[3].label} disabled={!step1Done} />
        </Tabs>

        <Box sx={{ p: { xs: 2, sm: 4, md: 6 } }}>
          {activeTab === 0 && (
            <Box>
              {detailsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {detailsError}
                </Alert>
              )}

              {facilitiesError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {facilitiesError}
                </Alert>
              )}

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Autocomplete
                    fullWidth
                    options={facilities}
                    getOptionLabel={(f) => f.name || ''}
                    isOptionEqualToValue={(f, v) => f.id === v.id}
                    value={facilities.find((f) => f.id === detailsForm.facilityId) || null}
                    onChange={(e, newValue) =>
                      handleDetailsChange('facilityId')({ target: { value: newValue?.id || '' } })
                    }
                    onBlur={handleDetailsBlur('facilityId')}
                    disabled={isEditMode}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="medium"
                        label="Facility Name"
                        error={detailsFieldError('facilityId')}
                        helperText={isEditMode ? 'Facility cannot be changed after creation.' : detailsFieldHelper('facilityId')}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Autocomplete
                    fullWidth
                    loading={assetsLoading}
                    options={assetOptions}
                    getOptionLabel={(a) => (a ? `${a.name} (${a.assetCode})` : '')}
                    isOptionEqualToValue={(a, v) => a.id === v.id}
                    value={assetOptions.find((a) => a.id === detailsForm.assetId) || null}
                    onChange={(e, newValue) =>
                      handleDetailsChange('assetId')({ target: { value: newValue?.id || '' } })
                    }
                    onBlur={handleDetailsBlur('assetId')}
                    disabled={isEditMode || !detailsForm.facilityId}
                    slots={{ paper: AssetListPaper }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="medium"
                        label="AssetCode"
                        error={Boolean(assetsError) || detailsFieldError('assetId')}
                        helperText={
                          assetsError ||
                          (isEditMode
                            ? 'Asset cannot be changed after creation.'
                            : !detailsForm.facilityId
                            ? 'Select a facility first.'
                            : detailsFieldHelper('assetId'))
                        }
                        slotProps={{
                          ...params.slotProps,
                          input: {
                            ...params.slotProps?.input,
                            endAdornment: (
                              <>
                                {assetsLoading ? <CircularProgress color="inherit" size={16} /> : null}
                                {params.slotProps?.input?.endAdornment}
                              </>
                            ),
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    size="medium"
                    label="Priority"
                    value={detailsForm.priority}
                    onChange={handleDetailsChange('priority')}
                    onBlur={handleDetailsBlur('priority')}
                    error={detailsFieldError('priority')}
                    helperText={detailsFieldHelper('priority')}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={12}>
                  <TextField
                    fullWidth
                    size="medium"
                    label="Title"
                    value={detailsForm.title}
                    onChange={handleDetailsChange('title')}
                    onBlur={handleDetailsBlur('title')}
                    error={detailsFieldError('title')}
                    helperText={detailsFieldHelper('title')}
                    slotProps={{ htmlInput: { maxLength: 200 } }}
                  />
                </Grid>

                <Grid size={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={6}
                    label="Description"
                    value={detailsForm.description}
                    onChange={handleDetailsChange('description')}
                    onBlur={handleDetailsBlur('description')}
                    error={detailsFieldError('description')}
                    helperText={detailsFieldHelper('description')}
                    slotProps={{ htmlInput: { maxLength: 2000 } }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                {step1Done ? (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" onClick={handleSaveDetails} disabled={detailsSubmitting}>
                      {detailsSubmitting ? <CircularProgress size={22} /> : 'Save Changes'}
                    </Button>
                    <Button variant="contained" onClick={() => setActiveTab(1)}>
                      Next: Assign Technician
                    </Button>
                  </Box>
                ) : (
                  <Button variant="contained" onClick={handleSaveDetails} disabled={detailsSubmitting}>
                    {detailsSubmitting ? <CircularProgress size={22} /> : 'Save & Continue'}
                  </Button>
                )}
              </Box>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              {workOrder && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {workOrder.id} &middot; {workOrder.title}
                </Typography>
              )}

              {assignError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {assignError}
                </Alert>
              )}

              {techniciansError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {techniciansError}
                </Alert>
              )}

              {step2Done && !assignSubmitting && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  A technician has been assigned. You can reassign below if needed.
                </Alert>
              )}

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Autocomplete
                    fullWidth
                    options={technicians}
                    getOptionLabel={(t) => t.name || ''}
                    isOptionEqualToValue={(t, v) => t.id === v.id}
                    value={technicians.find((t) => t.id === assignForm.technicianId) || null}
                    onChange={(e, newValue) =>
                      handleAssignChange('technicianId')({ target: { value: newValue?.id || '' } })
                    }
                    onBlur={handleAssignBlur('technicianId')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="medium"
                        label="Technician"
                        error={assignFieldError('technicianId')}
                        helperText={assignFieldHelper('technicianId')}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    fullWidth
                    size="medium"
                    type="date"
                    label="Start Date"
                    value={assignForm.startDate}
                    onChange={handleAssignChange('startDate')}
                    onBlur={handleAssignBlur('startDate')}
                    error={assignFieldError('startDate')}
                    helperText={assignFieldHelper('startDate')}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    fullWidth
                    size="medium"
                    type="date"
                    label="End Date"
                    value={assignForm.endDate}
                    onChange={handleAssignChange('endDate')}
                    onBlur={handleAssignBlur('endDate')}
                    error={assignFieldError('endDate')}
                    helperText={assignFieldHelper('endDate')}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: assignForm.startDate || undefined } }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button onClick={() => setActiveTab(0)}>Back</Button>
                {step2Done ? (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" onClick={handleSaveAssignment} disabled={assignSubmitting}>
                      {assignSubmitting ? <CircularProgress size={22} /> : 'Update Assignment'}
                    </Button>
                    <Button variant="contained" onClick={() => setActiveTab(2)}>
                      Next: Complete Work Order
                    </Button>
                  </Box>
                ) : (
                  <Button variant="contained" onClick={handleSaveAssignment} disabled={assignSubmitting}>
                    {assignSubmitting ? <CircularProgress size={22} /> : 'Save & Continue'}
                  </Button>
                )}
              </Box>
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              {completeError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {completeError}
                </Alert>
              )}

              {workOrder && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="body2">Current status:</Typography>
                    <Chip size="small" label={STATUS_LABELS[workOrder.status] || workOrder.status} color={STATUS_COLORS[workOrder.status]} />
                  </Box>

                  <Grid container spacing={3} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Title
                      </Typography>
                      <Typography variant="body1">{workOrder.title}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Facility / Asset
                      </Typography>
                      <Typography variant="body1">
                        {workOrder.facility?.name} &middot; {workOrder.asset?.name}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Assigned Technician
                      </Typography>
                      <Typography variant="body1">{workOrder.technician?.name || 'Unassigned'}</Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ mb: 2 }} />
                </>
              )}

              {step3Done ? (
                <Alert severity="success">This work order has been completed.</Alert>
              ) : (
                <>
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    label="Completion Comments (optional)"
                    value={completeComments}
                    onChange={(e) => setCompleteComments(e.target.value)}
                    slotProps={{ htmlInput: { maxLength: 500 } }}
                    sx={{ mb: 2 }}
                  />
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Completing this work order will move it through any remaining workflow steps (e.g. "In Progress") to "Completed", recording each change in its status history.
                  </Alert>
                </>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button onClick={() => setActiveTab(1)}>Back</Button>
                {step3Done ? (
                  <Button variant="contained" onClick={() => navigate('/work-orders')}>
                    Back to Work Orders
                  </Button>
                ) : (
                  <Button variant="contained" color="success" onClick={handleComplete} disabled={completeSubmitting}>
                    {completeSubmitting ? <CircularProgress size={22} /> : 'Complete Work Order'}
                  </Button>
                )}
              </Box>
            </Box>
          )}

          {activeTab === 3 && (
            <Box>
              {historyLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              )}

              {!historyLoading && historyError && <Alert severity="error">{historyError}</Alert>}

              {!historyLoading && !historyError && history.length === 0 && (
                <Alert severity="info">No status changes have been recorded yet.</Alert>
              )}

              {!historyLoading && !historyError && history.length > 0 && (
                <Box>
                  {history.map((h, i) => (
                    <Box key={h.id}>
                      <Box sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Chip size="small" label={STATUS_LABELS[h.oldStatus] || h.oldStatus} color={STATUS_COLORS[h.oldStatus]} />
                          <ArrowRightAltIcon fontSize="small" color="action" />
                          <Chip size="small" label={STATUS_LABELS[h.newStatus] || h.newStatus} color={STATUS_COLORS[h.newStatus]} />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {new Date(h.changedAt).toLocaleString()} &middot; Changed by {h.changedBy}
                        </Typography>
                        {h.comments && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {h.comments}
                          </Typography>
                        )}
                      </Box>
                      {i < history.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnackbar((s) => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default WorkOrderWizard;
