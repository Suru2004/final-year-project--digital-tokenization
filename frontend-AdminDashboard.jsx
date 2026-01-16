import { useState, useEffect } from "react";
import {
  Paper,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Input,
  Alert,
} from "@mui/material";
import axios from "axios";

// --- PASTE YOUR REPLIT BACKEND URL HERE ---
const backendUrl = "https://your-replit-url.replit.co";

export default function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [nplStatus, setNplStatus] = useState({});
  const [docFile, setDocFile] = useState(null);
  const [picFile, setPicFile] = useState(null);
  const [selectedAppId, setSelectedAppId] = useState(null);

  async function fetchReviewApplications() {
    try {
      const response = await axios.get(
        `${backendUrl}/api/admin/review-applications`
      );
      setApplications(response.data);
    } catch (e) {
      alert("Failed to fetch applications.");
    }
  }

  useEffect(() => {
    fetchReviewApplications();
  }, []);

  const checkNPL = async (pan, applicationId) => {
    try {
      const response = await axios.post(`${backendUrl}/api/admin/check-npl`, {
        pan,
      });
      const hasNPL = response.data.hasNPL;
      setNplStatus({
        ...nplStatus,
        [applicationId]: hasNPL ? "User Has NPL" : "User Clear",
      });
      alert(
        hasNPL
          ? "WARNING: User has existing NPLs!"
          : "NPL Check: User is clear."
      );
    } catch (e) {
      alert("Failed to check NPL status.");
    }
  };

  const approveLoan = async (app) => {
    // This flow is a prototype: it re-uploads files from the admin.
    // A full production app would pull files from S3/storage.
    if (selectedAppId !== app._id || !docFile || !picFile) {
      alert(
        "To approve: Please select the final documents (PDF & Picture) for this user first."
      );
      return;
    }

    const data = new FormData();
    data.append("applicationId", app._id);
    data.append("pan", app.pan);
    data.append("loanAmount", app.loanAmount);
    data.append("loanType", app.loanType);
    data.append("document", docFile);
    data.append("profilePicture", picFile);

    try {
      alert(
        "Approving loan and uploading files to IPFS... this may take a moment."
      );
      const response = await axios.post(
        `${backendUrl}/api/admin/approve-loan`,
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      alert(response.data.message);
      // Clear files and refresh list
      setDocFile(null);
      setPicFile(null);
      setSelectedAppId(null);
      fetchReviewApplications();
    } catch (e) {
      console.error("Error approving loan:", e);
      alert("Failed to approve loan.");
    }
  };

  // When admin selects files for a specific application
  const handleFileSelect = (appId) => {
    setSelectedAppId(appId);
    // Reset files
    setDocFile(null);
    setPicFile(null);
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Bank Administrator Dashboard
      </Typography>
      <Typography gutterBottom>
        Check NPL status and give final approval to record on blockchain.
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Applicant</TableCell>
              <TableCell>PAN</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>NPL Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app._id}>
                <TableCell>
                  {app.firstName} {app.lastName}
                </TableCell>
                <TableCell>{app.pan}</TableCell>
                <TableCell>{app.loanAmount}</TableCell>
                <TableCell>
                  <Typography
                    color={
                      nplStatus[app._id] === "User Has NPL"
                        ? "error"
                        : "success"
                    }
                  >
                    {nplStatus[app._id] || "Not Checked"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => checkNPL(app.pan, app._id)}
                  >
                    Check NPL
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    sx={{ ml: 1 }}
                    onClick={() => approveLoan(app)}
                  >
                    Approve
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{ mt: 4, p: 2, border: "1px solid #0288d1", borderRadius: "4px" }}
      >
        <Typography variant="h6">Final Approval File Upload</Typography>
        <Typography variant="body2" gutterBottom>
          To approve a loan, re-upload the applicant's verified documents below.
        </Typography>
        <Alert severity="warning" sx={{ mb: 2 }}>
          You must re-upload the applicant's verified Profile Picture and final
          PDF document to approve the loan.
        </Alert>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              1. Upload Profile Picture (.jpg, .png)
            </Typography>
            <Input
              type="file"
              name="profilePicture"
              onChange={(e) => setPicFile(e.target.files[0])}
              inputProps={{ accept: "image/png, image/jpeg" }}
              fullWidth
            />
          </Box>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              2. Upload Final Document (.pdf)
            </Typography>
            <Input
              type="file"
              name="document"
              onChange={(e) => setDocFile(e.target.files[0])}
              inputProps={{ accept: ".pdf" }}
              fullWidth
            />
          </Box>
        </Box>
        <Typography sx={{ mt: 2, fontStyle: "italic" }}>
          Select the application you wish to approve by clicking its "Approve"
          button.
        </Typography>
      </Box>
    </Paper>
  );
}

