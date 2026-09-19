import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Toolbar,
  TextField,
  MenuItem,
  Button,
  InputAdornment,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TableSortLabel,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem as MenuItemAction,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Grid,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ClearIcon from '@mui/icons-material/Clear';
import InboxIcon from '@mui/icons-material/Inbox';

import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  STATUS_COLORS,
  PRIORITY_COLORS,
} from '../../constants/workOrders';
import {
  listWorkOrders,
  listFacilities,
  deleteWorkOrder,
} from '../../api/workOrdersApi';

import WorkOrderHistoryDialog from './WorkOrderHistoryDialog';
import ConfirmDialog from '../../components/ConfirmDialog';

const HEAD_CELLS = [
  { id: 'title', label: 'Title', sortable: true },
  { id: 'facility', label: 'Facility Name', sortable: true },
  { id: 'priority', label: 'Priority', sortable: true },
  { id: 'status', label: 'Status', sortable: true },
  { id: 'technician', label: 'Assigned Technician', sortable: true },
  { id: 'createdAt', label: 'Created At', sortable: true },
  { id: 'actions', label: 'Actions', sortable: false },
];

function WorkOrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('');
  const [facilities, setFacilities] = useState([]);

  const [orderBy, setOrderBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [refreshKey, setRefreshKey] = useState(0);
  const requestIdRef = useRef(0);

  const [activeWorkOrder, setActiveWorkOrder] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRow, setMenuRow] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    listFacilities().then(setFacilities);
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      showSnackbar(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchData = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError('');

    listWorkOrders({
      search,
      status: statusFilter,
      priority: priorityFilter,
      facilityId: facilityFilter,
      sortBy: orderBy,
      sortDir: order,
      page,
      pageSize: rowsPerPage,
    })
      .then(({ items, total: count }) => {
        if (requestId !== requestIdRef.current) return;
        setRows(items);
        setTotal(count);
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return;
        setError(err.message || 'Failed to load work orders.');
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
      });
  }, [search, statusFilter, priorityFilter, facilityFilter, orderBy, order, page, rowsPerPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleSort = (field) => {
    if (orderBy === field) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(field);
      setOrder('asc');
    }
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setFacilityFilter('');
    setPage(0);
  };

  const hasActiveFilters = useMemo(
    () => Boolean(search || statusFilter || priorityFilter || facilityFilter),
    [search, statusFilter, priorityFilter, facilityFilter]
  );

  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  const openMenu = (e, row) => {
    setMenuAnchor(e.currentTarget);
    setMenuRow(row);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuRow(null);
  };

  const openEdit = (row) => {
    navigate(`/work-orders/${row.id}/wizard`);
    closeMenu();
  };

  const openHistory = (row) => {
    setActiveWorkOrder(row);
    setHistoryOpen(true);
    closeMenu();
  };

  const openDetails = (row) => {
    navigate(`/work-orders/${row.id}/view`);
    closeMenu();
  };

  const openDelete = (row) => {
    setActiveWorkOrder(row);
    setDeleteOpen(true);
    closeMenu();
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteWorkOrder(activeWorkOrder.id);
      showSnackbar('Work order deleted.');
      setDeleteOpen(false);
      if (rows.length === 1 && page > 0) {
        setPage((p) => p - 1);
      } else {
        refresh();
      }
    } catch (err) {
      showSnackbar(err.message || 'Failed to delete work order.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Work Order Management System
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create, assign, track, and audit work orders across all facilities.
      </Typography>

      <Paper elevation={2} sx={{ borderRadius: 3, mb: 2, p: 2 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by title, ID, or asset"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 6, sm: 6, md: 2.5 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 6, sm: 6, md: 2.5 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Priority"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All Priorities</MenuItem>
              {PRIORITY_OPTIONS.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Facility"
              value={facilityFilter}
              onChange={(e) => {
                setFacilityFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All Facilities</MenuItem>
              {facilities.map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 12, md: 1.5 }}>
            <Button
              fullWidth
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={2} sx={{ borderRadius: 3 }}>
        <Toolbar sx={{ justifyContent: 'flex-end', px: 2, py: 1.5 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/work-orders/new')}>
            Create Work Order
          </Button>
        </Toolbar>

        {error && (
          <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {HEAD_CELLS.map((cell) => (
                  <TableCell key={cell.id}>
                    {cell.sortable ? (
                      <TableSortLabel
                        active={orderBy === cell.id}
                        direction={orderBy === cell.id ? order : 'asc'}
                        onClick={() => handleSort(cell.id)}
                      >
                        {cell.label}
                      </TableSortLabel>
                    ) : (
                      cell.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={HEAD_CELLS.length} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              )}

              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={HEAD_CELLS.length} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <InboxIcon fontSize="large" color="disabled" />
                      <Typography color="text.secondary">
                        {hasActiveFilters
                          ? 'No work orders match the current filters.'
                          : 'No work orders yet. Create your first one to get started.'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.id}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.facility?.name || '—'}</TableCell>
                    <TableCell>
                      <Chip size="small" label={row.priority} color={PRIORITY_COLORS[row.priority]} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={row.status} color={STATUS_COLORS[row.status]} />
                    </TableCell>
                    <TableCell>{row.technician?.name || 'Unassigned'}</TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={(e) => openMenu(e, row)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItemAction onClick={() => openDetails(menuRow)}>View Details</MenuItemAction>
        <MenuItemAction onClick={() => openEdit(menuRow)}>Edit</MenuItemAction>
        <MenuItemAction onClick={() => openHistory(menuRow)}>View History</MenuItemAction>
        <MenuItemAction onClick={() => openDelete(menuRow)} sx={{ color: 'error.main' }}>
          Delete
        </MenuItemAction>
      </Menu>

      <WorkOrderHistoryDialog
        open={historyOpen}
        workOrder={activeWorkOrder}
        onClose={() => setHistoryOpen(false)}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Work Order"
        message={`Are you sure you want to delete "${activeWorkOrder?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteOpen(false)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default WorkOrdersPage;
