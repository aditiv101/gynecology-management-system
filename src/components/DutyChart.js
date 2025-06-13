import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Snackbar,
  Alert,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { getApiUrl } from '../config';

const wards = ['ICU', 'Labour Ward', 'Casualty', 'Accident & Emergency'];
const shifts = ['Morning', 'Afternoon', 'Night'];

function DutyChart() {
  const [formData, setFormData] = useState({
    DoctorName: '',
    StartDate: null,
    EndDate: null,
    Ward: '',
    Shift: '',
  });

  const [dutyChart, setDutyChart] = useState([]);
  const [status, setStatus] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchDutyChart();
  }, []);

  const fetchDutyChart = async () => {
    try {
      const response = await fetch(`${getApiUrl()}?sheet=dutychart`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }
      const data = await response.json();
      setDutyChart(data);
    } catch (error) {
      console.error('Error fetching duty chart:', error);
      setStatus({
        open: true,
        message: `Error fetching duty chart: ${error.message}. Please check console (F12) for details.`,
        severity: 'error'
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (name) => (date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ open: true, message: 'Saving...', severity: 'info' });

    try {
      // Validate required fields
      const requiredFields = ['DoctorName', 'StartDate', 'EndDate', 'Ward', 'Shift'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      console.log('Submitting data:', formData);
      
      const response = await fetch(`${getApiUrl()}?sheet=dutychart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          StartDate: formData.StartDate?.toISOString(),
          EndDate: formData.EndDate?.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const result = await response.json();
      console.log('Server result:', result);

      if (result.success) {
        setStatus({
          open: true,
          message: 'Duty chart entry saved successfully!',
          severity: 'success'
        });
        // Reset form
        setFormData({
          DoctorName: '',
          StartDate: null,
          EndDate: null,
          Ward: '',
          Shift: '',
        });
        // Refresh duty chart
        fetchDutyChart();
      } else {
        throw new Error(result.error || 'Failed to save data');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus({
        open: true,
        message: `Error: ${error.message}. Please check console (F12) for details.`,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setStatus(prev => ({ ...prev, open: false }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Add Duty Schedule
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Doctor Name"
                    name="DoctorName"
                    value={formData.DoctorName}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Start Date"
                    value={formData.StartDate}
                    onChange={handleDateChange('StartDate')}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="End Date"
                    value={formData.EndDate}
                    onChange={handleDateChange('EndDate')}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    select
                    label="Ward"
                    name="Ward"
                    value={formData.Ward}
                    onChange={handleChange}
                  >
                    {wards.map((ward) => (
                      <MenuItem key={ward} value={ward}>
                        {ward}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    select
                    label="Shift"
                    name="Shift"
                    value={formData.Shift}
                    onChange={handleChange}
                  >
                    {shifts.map((shift) => (
                      <MenuItem key={shift} value={shift}>
                        {shift}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                  >
                    Add Duty Schedule
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Current Duty Chart
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Ward</TableCell>
                    <TableCell>Shift</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dutyChart.map((duty, index) => (
                    <TableRow key={index}>
                      <TableCell>{duty.DoctorName}</TableCell>
                      <TableCell>{duty.Ward}</TableCell>
                      <TableCell>{duty.Shift}</TableCell>
                      <TableCell>
                        {duty.StartDate ? format(new Date(duty.StartDate), 'dd/MM/yyyy') : ''}
                      </TableCell>
                      <TableCell>
                        {duty.EndDate ? format(new Date(duty.EndDate), 'dd/MM/yyyy') : ''}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
      <Snackbar
        open={status.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={status.severity}
          sx={{ width: '100%' }}
        >
          {status.message}
        </Alert>
      </Snackbar>
    </LocalizationProvider>
  );
}

export default DutyChart; 