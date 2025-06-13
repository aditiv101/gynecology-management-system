// Google Apps Script for Gynecology Management System

// Sheet Names
const SHEETS = {
    PATIENTS: 'Patients',
    EQUIPMENT: 'Equipment',
    DUTY_CHART: 'DutyChart'
  };
  
  // Column Headers for each sheet
  const HEADERS = {
    [SHEETS.PATIENTS]: [
      'Timestamp',
      'PatientName',
      'Age',
      'Gender',
      'Diagnosis',
      'MedicalDescription',
      'Complications',
      'DateOfAdmission',
      'PredictedDischarge',
      'ActualDischarge',
      'ReasonForExtension',
      'Ward'
    ],
    [SHEETS.EQUIPMENT]: [
      'Timestamp',
      'EquipmentName',
      'Ward',
      'BreakdownDate',
      'ProblemDescription',
      'RepairDate',
      'ActionTaken',
      'Status'
    ],
    [SHEETS.DUTY_CHART]: [
      'Timestamp',
      'DoctorName',
      'StartDate',
      'EndDate',
      'Ward',
      'Shift'
    ]
  };
  
  // Initialize sheets if they don't exist
  function initializeSheets() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    Object.entries(SHEETS).forEach(([key, sheetName]) => {
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow(HEADERS[sheetName]);
        // Format header row
        sheet.getRange(1, 1, 1, HEADERS[sheetName].length)
          .setBackground('#4285f4')
          .setFontColor('red')
          .setFontWeight('bold');
      }
    });
  }
  
  // GET endpoint to fetch data
  function doGet(e) {
    const sheetName = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : 'Patients';
    let result;
    if (!SHEETS[sheetName.toUpperCase()]) {
      result = { error: "Invalid sheet name. Use: Patients, Equipment, or DutyChart" };
    } else {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS[sheetName.toUpperCase()]);
      if (!sheet) {
        result = { error: "Sheet not found" };
      } else {
        const data = sheet.getDataRange().getValues();
        const headers = data.shift();
        result = data.map(row => {
          let entry = {};
          headers.forEach((header, index) => {
            entry[header] = row[index];
          });
          return entry;
        });
      }
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }
  
  // POST endpoint to save data
  function doPost(e) {
    const sheetName = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : null;
    let result;
    if (!sheetName || !SHEETS[sheetName.toUpperCase()]) {
      result = { error: "Invalid sheet name. Use: patients, equipment, or dutychart" };
    } else {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS[sheetName.toUpperCase()]);
      if (!sheet) {
        result = { error: "Sheet not found" };
      } else {
        try {
          const data = JSON.parse(e.postData.contents);
          const headers = HEADERS[SHEETS[sheetName.toUpperCase()]];
          data.Timestamp = new Date().toISOString();
          const row = headers.map(header => data[header] || '');
          sheet.appendRow(row);
          result = {
            success: true,
            message: "Data saved successfully",
            savedData: data
          };
        } catch (error) {
          result = {
            error: "Error processing data: " + error.toString(),
            details: error.stack
          };
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }
  
  // OPTIONS endpoint for CORS preflight
  function doOptions(e) {
    return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
  }
  
  // Run this function once to initialize sheets
  function setup() {
    initializeSheets();
  } 