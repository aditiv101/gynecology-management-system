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
import PersonIcon from '@mui/icons-material/Person';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventIcon from '@mui/icons-material/Event';
import './PatientForm.css';

const wards = ['ICU', 'Labour Ward', 'Casualty', 'Accident & Emergency'];
const GENDER_OPTIONS = ['Female', 'Male', 'Other'];
const MIN_AGE = 0;
const MAX_AGE = 120;

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

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ open: false, message: '', severity: 'success' });

  const validateField = (name, value) => {
    switch (name) {
      case 'Age':
        const age = parseInt(value);
        if (isNaN(age) || age < MIN_AGE || age > MAX_AGE) {
          return `Age must be between ${MIN_AGE} and ${MAX_AGE}`;
        }
        return '';
      
      case 'Gender':
        if (!GENDER_OPTIONS.includes(value)) {
          return 'Please select a valid gender';
        }
        return '';

      case 'PatientName':
        if (!value.trim()) {
          return 'Patient name is required';
        }
        if (value.length < 2) {
          return 'Name must be at least 2 characters long';
        }
        return '';

      case 'Diagnosis':
        if (!value.trim()) {
          return 'Diagnosis is required';
        }
        return '';

      case 'Ward':
        if (!wards.includes(value)) {
          return 'Please select a valid ward';
        }
        return '';

      case 'DateOfAdmission':
        if (!value) {
          return 'Admission date is required';
        }
        if (value > new Date()) {
          return 'Admission date cannot be in the future';
        }
        return '';

      case 'PredictedDischarge':
        if (value && formData.DateOfAdmission && value < formData.DateOfAdmission) {
          return 'Predicted discharge must be after admission date';
        }
        return '';

      case 'ActualDischarge':
        if (value) {
          if (formData.DateOfAdmission && value < formData.DateOfAdmission) {
            return 'Actual discharge must be on or after admission date';
          }
          if (formData.PredictedDischarge && value < formData.PredictedDischarge) {
            return 'Actual discharge must be on or after predicted discharge date';
          }
        }
        return '';

      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (name) => (date) => {
    const error = validateField(name, date);
    
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Validate all fields
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setStatus({
        open: true,
        message: 'Please correct the errors in the form before submitting.',
        severity: 'error'
      });
      return;
    }

    setStatus({ open: true, message: 'Saving...', severity: 'info' });

    try {
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
      <div className="patient-form-container">
        <Paper elevation={0}>
          <div className="form-header">
            <Typography variant="h5">
              Patient Case Sheet
            </Typography>
          </div>
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* Personal Information Section */}
            <div className="form-section">
              <div className="section-title">
                <PersonIcon color="primary" />
                <Typography>Personal Information</Typography>
              </div>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} className="form-field">
                  <TextField
                    required
                    fullWidth
                    label="Patient Name"
                    name="PatientName"
                    value={formData.PatientName}
                    onChange={handleChange}
                    error={!!errors.PatientName}
                    helperText={errors.PatientName}
                    className="required-field"
                  />
                </Grid>
                <Grid item xs={12} sm={6} className="form-field">
                  <TextField
                    required
                    fullWidth
                    label="Age"
                    name="Age"
                    type="number"
                    value={formData.Age}
                    onChange={handleChange}
                    error={!!errors.Age}
                    helperText={errors.Age || `Age must be between ${MIN_AGE} and ${MAX_AGE}`}
                    inputProps={{ min: MIN_AGE, max: MAX_AGE }}
                    className="required-field"
                  />
                </Grid>
                <Grid item xs={12} sm={6} className="form-field">
                  <TextField
                    required
                    fullWidth
                    select
                    label="Gender"
                    name="Gender"
                    value={formData.Gender}
                    onChange={handleChange}
                    error={!!errors.Gender}
                    helperText={errors.Gender}
                    className="required-field"
                  >
                    {GENDER_OPTIONS.map((gender) => (
                      <MenuItem key={gender} value={gender}>
                        {gender}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </div>

            {/* Medical Information Section */}
            <div className="form-section">
              <div className="section-title">
                <LocalHospitalIcon color="primary" />
                <Typography>Medical Information</Typography>
              </div>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} className="form-field">
                  <TextField
                    required
                    fullWidth
                    select
                    label="Ward"
                    name="Ward"
                    value={formData.Ward}
                    onChange={handleChange}
                    error={!!errors.Ward}
                    helperText={errors.Ward}
                    className="required-field"
                  >
                    {wards.map((ward) => (
                      <MenuItem key={ward} value={ward}>
                        {ward}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} className="form-field">
                  <TextField
                    required
                    fullWidth
                    label="Diagnosis / Case Summary"
                    name="Diagnosis"
                    multiline
                    rows={2}
                    value={formData.Diagnosis}
                    onChange={handleChange}
                    error={!!errors.Diagnosis}
                    helperText={errors.Diagnosis}
                    className="required-field"
                  />
                </Grid>
                <Grid item xs={12} className="form-field">
                  <TextField
                    fullWidth
                    label="Medical Description"
                    name="MedicalDescription"
                    multiline
                    rows={3}
                    value={formData.MedicalDescription}
                    onChange={handleChange}
                    error={!!errors.MedicalDescription}
                    helperText={errors.MedicalDescription}
                  />
                </Grid>
                <Grid item xs={12} className="form-field">
                  <TextField
                    fullWidth
                    label="Complications"
                    name="Complications"
                    multiline
                    rows={2}
                    value={formData.Complications}
                    onChange={handleChange}
                    error={!!errors.Complications}
                    helperText={errors.Complications}
                  />
                </Grid>
              </Grid>
            </div>

            {/* Admission & Discharge Section */}
            <div className="form-section">
              <div className="section-title">
                <EventIcon color="primary" />
                <Typography>Admission & Discharge Information</Typography>
              </div>
              <div className="date-fields-container">
                <div className="date-field form-field">
                  <DatePicker
                    label="Date of Admission"
                    value={formData.DateOfAdmission}
                    onChange={handleDateChange('DateOfAdmission')}
                    slots={{
                      textField: (params) => (
                        <TextField
                          {...params}
                          fullWidth
                          required
                          error={!!errors.DateOfAdmission}
                          helperText={errors.DateOfAdmission}
                          className="required-field"
                        />
                      )
                    }}
                  />
                </div>
                <div className="date-field form-field">
                  <DatePicker
                    label="Predicted Discharge"
                    value={formData.PredictedDischarge}
                    onChange={handleDateChange('PredictedDischarge')}
                    slots={{
                      textField: (params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!errors.PredictedDischarge}
                          helperText={errors.PredictedDischarge}
                        />
                      )
                    }}
                  />
                </div>
                <div className="date-field form-field">
                  <DatePicker
                    label="Actual Discharge"
                    value={formData.ActualDischarge}
                    onChange={handleDateChange('ActualDischarge')}
                    slots={{
                      textField: (params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!errors.ActualDischarge}
                          helperText={errors.ActualDischarge}
                        />
                      )
                    }}
                  />
                </div>
              </div>
              <Grid item xs={12} className="form-field">
                <TextField
                  fullWidth
                  label="Reason for Extension"
                  name="ReasonForExtension"
                  multiline
                  rows={2}
                  value={formData.ReasonForExtension}
                  onChange={handleChange}
                  error={!!errors.ReasonForExtension}
                  helperText={errors.ReasonForExtension}
                />
              </Grid>
            </div>

            <div className="submit-button-container">
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                className="submit-button"
              >
                Save Patient Record
              </Button>
            </div>
          </Box>
        </Paper>

        <Snackbar
          open={status.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={status.severity}
            sx={{ width: '100%' }}
            className={`${status.severity}-snackbar`}
          >
            {status.message}
          </Alert>
        </Snackbar>
      </div>
    </LocalizationProvider>
  );
}

export default PatientForm; 