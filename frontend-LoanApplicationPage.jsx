import { useState } from "react";
import {
  Paper,
  TextField,
  Button,
  Typography,
  Input,
  Alert,
  Tooltip,
  Box,
} from "@mui/material";
import axios from "axios";

// --- PASTE YOUR REPLIT BACKEND URL HERE ---
const backendUrl = "https://your-replit-url.replit.co";

export default function LoanApplicationPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    occupation: "",
    loanType: "Home",
    loanAmount: "",
    loanTerm: "",
    pan: "",
    aadhaar: "",
  });
  const [docFile, setDocFile] = useState(null);
  const [picFile, setPicFile] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDocChange = (e) => {
    setDocFile(e.target.files[0]);
  };

  const handlePicChange = (e) => {
    setPicFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!docFile || !picFile) {
      alert(
        "Please upload both your profile picture and the supporting document."
      );
      return;
    }

    const data = new FormData();
    // Add all text fields
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });
    // Add the two files
    data.append("document", docFile);
    data.append("profilePicture", picFile);

    try {
      alert("Submitting application... this may take a moment.");
      const response = await axios.post(`${backendUrl}/api/apply`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      alert(response.data.message);
    } catch (e) {
      console.error("Error submitting form:", e);
      alert("Error submitting application.");
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}
    >
      <Typography variant="h5">Loan Application</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Please fill out all fields accurately. All information will be verified.
        This application is the first step in our secure loan process.
      </Alert>

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            name="firstName"
            label="First Name"
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            name="lastName"
            label="Last Name"
            onChange={handleChange}
            fullWidth
            required
          />
        </Box>

        <Tooltip title="Your PAN will be used to create a secure ID for NPL checks.">
          <TextField
            name="pan"
            label="PAN Number"
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
        </Tooltip>

        <Tooltip title="12-digit unique identification number.">
          <TextField
            name="aadhaar"
            label="Aadhaar Number"
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
        </Tooltip>

        <TextField
          name="age"
          label="Age"
          type="number"
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          name="occupation"
          label="Occupation"
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />

        <Typography variant="h6" sx={{ mt: 2 }}>
          Loan Details
        </Typography>
        <TextField
          name="loanType"
          label="Loan Type (e.g., Home, Car)"
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          name="loanAmount"
          label="Loan Amount"
          type="number"
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          name="loanTerm"
          label="Loan Term (in months)"
          type="number"
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />

        <Box
          sx={{ my: 3, p: 2, border: "1px dashed grey", borderRadius: "4px" }}
        >
          <Typography variant="subtitle1" gutterBottom>
            1. Upload Profile Picture
          </Typography>
          <Input
            type="file"
            name="profilePicture"
            onChange={handlePicChange}
            required
            inputProps={{ accept: "image/png, image/jpeg" }} // Accept images
            fullWidth
          />
          <Typography variant="caption" display="block" gutterBottom>
            File types: .jpg, .png. Max size: 2MB.
          </Typography>
        </Box>

        <Box
          sx={{ my: 3, p: 2, border: "1px dashed grey", borderRadius: "4px" }}
        >
          <Typography variant="subtitle1" gutterBottom>
            2. Upload Supporting Documents
          </Typography>
          <Input
            type="file"
            name="document"
            onChange={handleDocChange}
            required
            inputProps={{ accept: ".pdf" }} // Restrict to PDF
            fullWidth
          />
          <Typography variant="caption" display="block" gutterBottom>
            Please combine your PAN card, Aadhaar card, and any other relevant
            files into a **single PDF document**. Max size: 10MB.
          </Typography>
        </Box>

        <Button variant="contained" type="submit" sx={{ mt: 3 }} fullWidth>
          Submit Application
        </Button>
      </form>
    </Paper>
  );
}
