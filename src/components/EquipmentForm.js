import React, { useState } from 'react';
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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getApiUrl } from '../config';

const wards = ['ICU', 'Labour Ward', 'Casualty', 'Accident & Emergency'];
const statuses = ['Reported', 'Under Repair', 'Fixed', 'Replaced', 'Pending'];

function EquipmentForm() {
  const [formData, setFormData] = useState({
    EquipmentName: '',
    Ward: '',
    BreakdownDate: null,
    ProblemDescription: '',
    RepairDate: null,
    ActionTaken: '',
    Status: '',
  });

  const [status, setStatus] = useState({ open: false, message: '', severity: 'success' });

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
      const requiredFields = ['EquipmentName', 'Ward', 'BreakdownDate', 'ProblemDescription', 'Status'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      console.log('Submitting data:', formData);
      
      const response = await fetch(`${getApiUrl()}?sheet=equipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          BreakdownDate: formData.BreakdownDate?.toISOString(),
          RepairDate: formData.RepairDate?.toISOString(),
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
          message: 'Equipment log saved successfully!',
          severity: 'success'
        });
        // Reset form
        setFormData({
          EquipmentName: '',
          Ward: '',
          BreakdownDate: null,
          ProblemDescription: '',
          RepairDate: null,
          ActionTaken: '',
          Status: '',
        });
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
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Equipment Log
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Equipment Name"
                name="EquipmentName"
                value={formData.EquipmentName}
                onChange={handleChange}
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
              <DatePicker
                label="Breakdown Date"
                value={formData.BreakdownDate}
                onChange={handleDateChange('BreakdownDate')}
                renderInput={(params) => <TextField {...params} fullWidth required />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Repair Date"
                value={formData.RepairDate}
                onChange={handleDateChange('RepairDate')}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Problem Description"
                name="ProblemDescription"
                multiline
                rows={3}
                value={formData.ProblemDescription}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Action Taken / Remarks"
                name="ActionTaken"
                multiline
                rows={2}
                value={formData.ActionTaken}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                select
                label="Status"
                name="Status"
                value={formData.Status}
                onChange={handleChange}
              >
                {statuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
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
                Save Equipment Log
              </Button>
            </Grid>
          </Grid>
        </Box>
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
      </Paper>
    </LocalizationProvider>
  );
}

export default EquipmentForm; 