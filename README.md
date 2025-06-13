# Gynecology Management System

A web-based patient and audit management system for gynecologists, built with React and Google Sheets as the backend.

## Features

- Patient Case Sheet Management
- Equipment Logging and Tracking
- Duty Chart Management
- Monthly Reports with Analytics
- Export to Excel
- Mobile Responsive Design

## Setup Instructions

### 1. Google Sheets Setup

1. Create a new Google Sheet
2. Create three sheets named:
   - `Patients`
   - `Equipment`
   - `DutyChart`
3. Copy the Google Apps Script code from `google-apps-script.js` into your Google Sheet's Apps Script editor
4. Deploy the Apps Script as a web app:
   - Click "Deploy" > "New deployment"
   - Choose "Web app"
   - Set "Execute as" to "Me"
   - Set "Who has access" to "Anyone"
   - Click "Deploy"
5. Copy the deployment URL

### 2. React Application Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Update the Google Apps Script URL:

   - Open `src/components/PatientForm.js`
   - Replace `YOUR_DEPLOYED_SCRIPT_URL` with your actual deployment URL
   - Do the same for `EquipmentForm.js`, `DutyChart.js`, and `Reports.js`

3. Start the development server:

   ```bash
   npm start
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Deployment

The application can be deployed to any static hosting service:

1. Build the application:

   ```bash
   npm run build
   ```

2. Deploy the contents of the `build` folder to your hosting service (e.g., GitHub Pages, Netlify, Vercel)

## Usage

1. **Patient Records**

   - Fill out the patient case sheet form
   - All data is automatically saved to Google Sheets
   - View patient history in the monthly reports

2. **Equipment Log**

   - Log equipment issues and maintenance
   - Track repair status
   - View equipment history in reports

3. **Duty Chart**

   - Manage doctor duty schedules
   - View current duty assignments
   - Track workload distribution

4. **Reports**
   - Generate monthly reports
   - View ward-wise patient distribution
   - Track doctor workload
   - Export data to Excel

## Security Notes

- The Google Apps Script URL should be kept private
- Consider implementing user authentication for production use
- Regularly backup your Google Sheet data

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License.
