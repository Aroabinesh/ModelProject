import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import { PRIORITY_COLORS, STATUS_COLORS, STATUS_LABELS } from '../../constants/workOrders';
import { getWorkOrder, getWorkOrderHistory } from '../../api/workOrdersApi';

const STEPS = [
  { label: '1. Work Order Details' },
  { label: '2. Assign Technician' },
  { label: '3. Complete Work Order' },
  { label: 'History' },
];

function ReadOnlyField({ label, children }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body1" component="div">
        {children || '—'}
      </Typography>
    </Box>
  );
}

function WorkOrderViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(0);
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    setLoading(true);
    getWorkOrder(id)
      .then(setWorkOrder)
      .catch((err) => setLoadError(err.message || 'Failed to load work order.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (activeTab !== 3 || !workOrder) return;
    setHistoryLoading(true);
    setHistoryError('');
    getWorkOrderHistory(workOrder.id)
      .then(setHistory)
      .catch((err) => setHistoryError(err.message || 'Failed to load history.'))
      .finally(() => setHistoryLoading(false));
  }, [activeTab, workOrder]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/work-orders')}>
          Back to Work Orders
        </Button>
        {workOrder && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/work-orders/${id}/wizard`)}
          >
            Edit
          </Button>
        )}
      </Box>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
        View Work Order
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Review the work order details, technician assignment, completion status, and history.
      </Typography>

      {loadError && <Alert severity="error">{loadError}</Alert>}

      {workOrder && (
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
            <Tab label={STEPS[0].label} />
            <Tab label={STEPS[1].label} />
            <Tab label={STEPS[2].label} />
            <Tab label={STEPS[3].label} />
          </Tabs>

          <Box sx={{ p: { xs: 2, sm: 4, md: 6 } }}>
            {activeTab === 0 && (
              <Box>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <ReadOnlyField label="Facility Name">{workOrder.facility?.name}</ReadOnlyField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <ReadOnlyField label="AssetCode">
                      {workOrder.asset ? `${workOrder.asset.name} (${workOrder.asset.assetCode})` : ''}
                    </ReadOnlyField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                    <ReadOnlyField label="Priority">
                      <Chip size="small" label={workOrder.priority} color={PRIORITY_COLORS[workOrder.priority]} variant="outlined" />
                    </ReadOnlyField>
                  </Grid>
                  <Grid size={12}>
                    <ReadOnlyField label="Title">{workOrder.title}</ReadOnlyField>
                  </Grid>
                  <Grid size={12}>
                    <ReadOnlyField label="Description">{workOrder.description}</ReadOnlyField>
                  </Grid>
                </Grid>
              </Box>
            )}

            {activeTab === 1 && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {workOrder.id} &middot; {workOrder.title}
                </Typography>

                {!workOrder.assignedTechnicianId ? (
                  <Alert severity="info">No technician has been assigned to this work order yet.</Alert>
                ) : (
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <ReadOnlyField label="Technician">{workOrder.technician?.name}</ReadOnlyField>
                    </Grid>
                  </Grid>
                )}
              </Box>
            )}

            {activeTab === 2 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Typography variant="body2">Current status:</Typography>
                  <Chip size="small" label={STATUS_LABELS[workOrder.status] || workOrder.status} color={STATUS_COLORS[workOrder.status]} />
                </Box>

                <Grid container spacing={3} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <ReadOnlyField label="Title">{workOrder.title}</ReadOnlyField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <ReadOnlyField label="Facility / Asset">
                      {workOrder.facility?.name} &middot; {workOrder.asset?.name}
                    </ReadOnlyField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <ReadOnlyField label="Assigned Technician">{workOrder.technician?.name || 'Unassigned'}</ReadOnlyField>
                  </Grid>
                </Grid>

                <Divider sx={{ mb: 2 }} />

                {workOrder.status === 'Completed' ? (
                  <Alert severity="success">This work order has been completed.</Alert>
                ) : (
                  <Alert severity="info">This work order has not been completed yet.</Alert>
                )}
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
      )}
    </Box>
  );
}

export default WorkOrderViewPage;
