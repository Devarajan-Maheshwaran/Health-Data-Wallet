const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Test API endpoint for patient data
app.get('/api/patients/:id', (req, res) => {
  const patientId = req.params.id;
  
  console.log(`Fetching data for patient ${patientId}`);
  
  const patient = {
    id: patientId,
    name: 'John Doe',
    age: 45,
    gender: 'Male',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678'
  };
  
  res.status(200).json({
    success: true,
    patient
  });
});

// Test API endpoint for patient records
app.get('/api/patients/:id/records', (req, res) => {
  const patientId = req.params.id;
  
  console.log(`Fetching records for patient ${patientId}`);
  
  const records = [
    { 
      id: '1', 
      title: 'Annual Physical', 
      recordType: 'medical_history',
      ipfsHash: 'QmExample1',
      blockchainTxHash: '0xexample1',
      uploadedAt: new Date()
    },
    {
      id: '2', 
      title: 'Blood Test Results', 
      recordType: 'lab_results',
      ipfsHash: 'QmExample2',
      blockchainTxHash: '0xexample2',
      uploadedAt: new Date()
    },
    { 
      id: '3', 
      title: 'Vaccination Record', 
      recordType: 'immunizations',
      ipfsHash: 'QmExample3',
      blockchainTxHash: '0xexample3',
      uploadedAt: new Date()
    }
  ];
  
  res.status(200).json({
    success: true,
    count: records.length,
    records
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Access patient data at: http://localhost:${PORT}/api/patients/123`);
  console.log(`Access patient records at: http://localhost:${PORT}/api/patients/123/records`);
});