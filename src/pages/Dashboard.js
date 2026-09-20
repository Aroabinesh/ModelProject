import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Alert,
  Skeleton,
  Snackbar,
} from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupsIcon from '@mui/icons-material/Groups';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DashboardBanner from '../assets/DashboardBanner';
import { getWorkOrderStats } from '../api/workOrdersApi';

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem('username') || 'User';
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, activeTechnicians: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    setStatsLoading(true);
    setStatsError('');
    getWorkOrderStats()
      .then(setStats)
      .catch((err) => setStatsError(err.message || 'Failed to load work order stats.'))
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      setSnackbar({ open: true, message: location.state.message });
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statCards = [
    {
      label: 'Total Work Orders',
      value: stats.total,
      icon: <AssignmentTurnedInIcon />,
      color: '#1a237e',
    },
    {
      label: 'Open (Not Completed)',
      value: stats.pending,
      icon: <PendingActionsIcon />,
      color: '#ffca28',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: <CheckCircleIcon />,
      color: '#00c853',
    },
    {
      label: 'Active Technicians',
      value: stats.activeTechnicians,
      icon: <GroupsIcon />,
      color: '#00acc1',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ position: 'relative', height: { xs: 160, sm: 220 }, overflow: 'hidden' }}>
        <DashboardBanner style={{ width: '100%', height: '100%', display: 'block' }} />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            px: { xs: 3, sm: 6 },
            color: '#fff',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Welcome back, {username}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.85, mt: 0.5 }}>
            Here&apos;s what&apos;s happening with your work orders today.
          </Typography>
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {statsError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {statsError}
          </Alert>
        )}

        <Grid container spacing={3}>
          {statCards.map((stat) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
              <Card elevation={2} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: stat.color, width: 48, height: 48 }}>{stat.icon}</Avatar>
                  <Box>
                    {statsLoading ? (
                      <Skeleton variant="text" width={48} height={32} />
                    ) : (
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {statsError ? '—' : stat.value}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card elevation={2} sx={{ borderRadius: 3, mt: 4 }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h6" gutterBottom>
                  Work Order Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create work orders, assign technicians, track status, and review history.
                </Typography>
              </Box>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/work-orders')}
              >
                Go to Work Orders
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>

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

export default Dashboard;
