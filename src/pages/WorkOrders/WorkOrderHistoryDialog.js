import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import { STATUS_COLORS } from '../../constants/workOrders';
import { getWorkOrderHistory } from '../../api/workOrdersApi';

function WorkOrderHistoryDialog({ open, workOrder, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !workOrder) return;
    setLoading(true);
    setError('');
    getWorkOrderHistory(workOrder.id)
      .then(setHistory)
      .catch((err) => setError(err.message || 'Failed to load history.'))
      .finally(() => setLoading(false));
  }, [open, workOrder]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Status History</DialogTitle>
      <DialogContent>
        {workOrder && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {workOrder.id} &middot; {workOrder.title}
          </Typography>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && history.length === 0 && (
          <Alert severity="info">No status changes have been recorded yet.</Alert>
        )}

        {!loading && !error && history.length > 0 && (
          <Box>
            {history.map((h, i) => (
              <Box key={h.id}>
                <Box sx={{ py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Chip size="small" label={h.oldStatus} color={STATUS_COLORS[h.oldStatus]} />
                    <ArrowRightAltIcon fontSize="small" color="action" />
                    <Chip size="small" label={h.newStatus} color={STATUS_COLORS[h.newStatus]} />
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
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default WorkOrderHistoryDialog;
