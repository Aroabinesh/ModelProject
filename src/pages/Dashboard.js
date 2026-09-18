import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Container,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupsIcon from '@mui/icons-material/Groups';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardBanner from '../assets/DashboardBanner';

const stats = [
  {
    label: 'Total Work Orders',
    value: 128,
    icon: <AssignmentTurnedInIcon />,
    color: '#1a237e',
  },
  {
    label: 'Pending',
    value: 24,
    icon: <PendingActionsIcon />,
    color: '#ffca28',
  },
  {
    label: 'Completed',
    value: 96,
    icon: <CheckCircleIcon />,
    color: '#00c853',
  },
  {
    label: 'Active Teams',
    value: 8,
    icon: <GroupsIcon />,
    color: '#00acc1',
  },
];

function Dashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'User';
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#1a237e' }}>
        <Toolbar>
          <AssignmentTurnedInIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Work Order Project
          </Typography>

          <IconButton onClick={handleMenuOpen} size="small" sx={{ ml: 2 }}>
            <Avatar sx={{ bgcolor: '#00acc1', width: 34, height: 34 }}>
              {username.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem disabled>Signed in as {username}</MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box sx={{ position: 'relative', height: { xs: 160, sm: 220 }, overflow: 'hidden' }}>
        <DashboardBanner
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
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
        <Grid container spacing={3}>
          {stats.map((stat) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
              <Card elevation={2} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: stat.color, width: 48, height: 48 }}>
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {stat.value}
                    </Typography>
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
            <Typography variant="h6" gutterBottom>
              Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You have successfully logged in. This is your work order
              management dashboard — hook up real data here to replace these
              sample stats.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default Dashboard;
