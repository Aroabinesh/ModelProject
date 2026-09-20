import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  Avatar,
  CircularProgress,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import LoginIllustration from '../assets/LoginIllustration';
import { login } from '../api/authApi';

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const result = await login(username.trim(), password);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('username', result.username);
      navigate('/dashboard', {
        state: { message: `${result.username} logged in successfully!` },
      });
    } catch (err) {
      setError(err.status === 401 ? 'Invalid username or password.' : err.message || 'Failed to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: 'linear-gradient(135deg, #0d1440 0%, #1a237e 45%, #00acc1 100%)',
      }}
    >
      <Paper
        elevation={12}
        sx={{
          width: '100%',
          maxWidth: 900,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <Grid container>
          <Grid
            size={{ sm: 5 }}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'linear-gradient(160deg, #1a237e 0%, #283593 55%, #00acc1 100%)',
              color: '#fff',
              p: 4,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)' }}>
                <AssignmentTurnedInIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Work Order Project
              </Typography>
            </Box>

            <Box sx={{ my: 3 }}>
              <LoginIllustration style={{ width: '100%', height: 'auto' }} />
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Manage every work order in one place
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                Track jobs, assign teams, and monitor progress with a single,
                unified dashboard.
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 7 }}>
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ p: { xs: 4, sm: 6 } }}
            >
              <Typography variant="h4" gutterBottom>
                Welcome back
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Sign in to continue to your dashboard
              </Typography>

              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                margin="normal"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword((show) => !show)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                size="large"
                variant="contained"
                disabled={submitting}
                sx={{
                  mt: 3,
                  py: 1.3,
                  background: 'linear-gradient(90deg, #1a237e, #00acc1)',
                }}
              >
                {submitting ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Login'}
              </Button>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 2, textAlign: 'center' }}
              >
                Demo credentials: admin / admin123
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default Login;
