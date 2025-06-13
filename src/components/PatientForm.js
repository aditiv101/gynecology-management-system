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

function PatientForm() {
  const [formData, setFormData] = useState({
    PatientName: '',
    Age: '',
    Gender: '',
    Diagnosis: '',
    MedicalDescription: '',
    Complications: '',
    DateOfAdmission: null,
    PredictedDischarge: null,
    ActualDischarge: null,
    ReasonForExtension: '',
    Ward: '',
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
      const requiredFields = ['PatientName', 'Age', 'Gender', 'Diagnosis', 'DateOfAdmission', 'Ward'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      console.log('Submitting data:', formData);
      
      const response = await fetch(`${getApiUrl()}?sheet=patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          DateOfAdmission: formData.DateOfAdmission?.toISOString(),
          PredictedDischarge: formData.PredictedDischarge?.toISOString(),
          ActualDischarge: formData.ActualDischarge?.toISOString(),
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
          message: 'Patient record saved successfully!',
          severity: 'success'
        });
        // Reset form
        setFormData({
          PatientName: '',
          Age: '',
          Gender: '',
          Diagnosis: '',
          MedicalDescription: '',
          Complications: '',
          DateOfAdmission: null,
          PredictedDischarge: null,
          ActualDischarge: null,
          ReasonForExtension: '',
          Ward: '',
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
          Patient Case Sheet
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Patient Name"
                name="PatientName"
                value={formData.PatientName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Age"
                name="Age"
                type="number"
                value={formData.Age}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="Gender"
                name="Gender"
                value={formData.Gender}
                onChange={handleChange}
              >
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
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
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Diagnosis / Case Summary"
                name="Diagnosis"
                multiline
                rows={2}
                value={formData.Diagnosis}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medical Description"
                name="MedicalDescription"
                multiline
                rows={3}
                value={formData.MedicalDescription}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Complications"
                name="Complications"
                multiline
                rows={2}
                value={formData.Complications}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Date of Admission"
                value={formData.DateOfAdmission}
                onChange={handleDateChange('DateOfAdmission')}
                slots={{ textField: (params) => <TextField {...params} fullWidth required /> }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Predicted Discharge"
                value={formData.PredictedDischarge}
                onChange={handleDateChange('PredictedDischarge')}
                slots={{ textField: (params) => <TextField {...params} fullWidth /> }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Actual Discharge"
                value={formData.ActualDischarge}
                onChange={handleDateChange('ActualDischarge')}
                slots={{ textField: (params) => <TextField {...params} fullWidth /> }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason for Extension"
                name="ReasonForExtension"
                multiline
                rows={2}
                value={formData.ReasonForExtension}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
              >
                Save Patient Record
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

export default PatientForm; 