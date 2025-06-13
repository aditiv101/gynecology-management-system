import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Box,
  Button,
  TextField,
  CircularProgress,
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
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import * as XLSX from 'xlsx';
import { getApiUrl } from '../config';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    patients: [],
    equipment: [],
    dutyChart: [],
  });
  const [stats, setStats] = useState({
    wardDistribution: {},
    doctorWorkload: {},
    equipmentStatus: {},
  });
  const [status, setStatus] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = startOfMonth(selectedMonth).toISOString();
      const endDate = endOfMonth(selectedMonth).toISOString();

      // Fetch all data
      const [patientsResponse, equipmentResponse, dutyChartResponse] = await Promise.all([
        fetch(`${getApiUrl()}?sheet=patients`),
        fetch(`${getApiUrl()}?sheet=equipment`),
        fetch(`${getApiUrl()}?sheet=dutychart`),
      ]);

      // Check for errors in responses
      if (!patientsResponse.ok) {
        const errorData = await patientsResponse.json();
        throw new Error(`Error fetching patients: ${errorData.error || patientsResponse.status}`);
      }
      if (!equipmentResponse.ok) {
        const errorData = await equipmentResponse.json();
        throw new Error(`Error fetching equipment: ${errorData.error || equipmentResponse.status}`);
      }
      if (!dutyChartResponse.ok) {
        const errorData = await dutyChartResponse.json();
        throw new Error(`Error fetching duty chart: ${errorData.error || dutyChartResponse.status}`);
      }

      // Parse responses
      const [patients, equipment, dutyChart] = await Promise.all([
        patientsResponse.json(),
        equipmentResponse.json(),
        dutyChartResponse.json(),
      ]);

      // Filter data for selected month
      const filteredPatients = patients.filter(p => {
        const admissionDate = parseISO(p.DateOfAdmission);
        return admissionDate >= parseISO(startDate) && admissionDate <= parseISO(endDate);
      });

      const filteredEquipment = equipment.filter(e => {
        const breakdownDate = parseISO(e.BreakdownDate);
        return breakdownDate >= parseISO(startDate) && breakdownDate <= parseISO(endDate);
      });

      setReportData({
        patients: filteredPatients,
        equipment: filteredEquipment,
        dutyChart,
      });

      // Calculate statistics
      calculateStats(filteredPatients, filteredEquipment, dutyChart);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setStatus({
        open: true,
        message: `Error: ${error.message}. Please check console (F12) for details.`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const calculateStats = (patients, equipment, dutyChart) => {
    // Ward distribution
    const wardDistribution = patients.reduce((acc, patient) => {
      acc[patient.Ward] = (acc[patient.Ward] || 0) + 1;
      return acc;
    }, {});

    // Doctor workload
    const doctorWorkload = dutyChart.reduce((acc, duty) => {
      acc[duty.DoctorName] = (acc[duty.DoctorName] || 0) + 1;
      return acc;
    }, {});

    // Equipment status
    const equipmentStatus = equipment.reduce((acc, item) => {
      acc[item.Status] = (acc[item.Status] || 0) + 1;
      return acc;
    }, {});

    setStats({
      wardDistribution,
      doctorWorkload,
      equipmentStatus,
    });
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Patient data
    const patientWS = XLSX.utils.json_to_sheet(reportData.patients);
    XLSX.utils.book_append_sheet(workbook, patientWS, 'Patients');

    // Equipment data
    const equipmentWS = XLSX.utils.json_to_sheet(reportData.equipment);
    XLSX.utils.book_append_sheet(workbook, equipmentWS, 'Equipment');

    // Duty chart
    const dutyWS = XLSX.utils.json_to_sheet(reportData.dutyChart);
    XLSX.utils.book_append_sheet(workbook, dutyWS, 'Duty Chart');

    // Save file
    XLSX.writeFile(workbook, `Monthly_Report_${format(selectedMonth, 'MMMM_yyyy')}.xlsx`);
  };

  const wardChartData = {
    labels: Object.keys(stats.wardDistribution),
    datasets: [{
      data: Object.values(stats.wardDistribution),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
      ],
    }],
  };

  const doctorWorkloadData = {
    labels: Object.keys(stats.doctorWorkload),
    datasets: [{
      label: 'Number of Duties',
      data: Object.values(stats.doctorWorkload),
      backgroundColor: '#36A2EB',
    }],
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5">
                Monthly Report - {format(selectedMonth, 'MMMM yyyy')}
              </Typography>
              <Box>
                <DatePicker
                  views={['month', 'year']}
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                  renderInput={(params) => <TextField {...params} />}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={exportToExcel}
                  sx={{ ml: 2 }}
                >
                  Export to Excel
                </Button>
              </Box>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Grid container spacing={3}>
                  {/* Ward Distribution Chart */}
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Patient Distribution by Ward
                      </Typography>
                      <Box height={300}>
                        <Pie data={wardChartData} />
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Doctor Workload Chart */}
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Doctor Workload
                      </Typography>
                      <Box height={300}>
                        <Bar
                          data={doctorWorkloadData}
                          options={{
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  stepSize: 1,
                                },
                              },
                            },
                          }}
                        />
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Summary Tables */}
                  <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Monthly Summary
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Metric</TableCell>
                              <TableCell>Count</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>Total Patients</TableCell>
                              <TableCell>{reportData.patients.length}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Equipment Issues</TableCell>
                              <TableCell>{reportData.equipment.length}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Total Duty Assignments</TableCell>
                              <TableCell>{reportData.dutyChart.length}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>
                </Grid>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
}

export default Reports; 