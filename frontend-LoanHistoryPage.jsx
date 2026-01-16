import { useState } from "react";
import {
  Paper,
  TextField,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link,
} from "@mui/material";
import axios from "axios";

// --- PASTE YOUR REPLIT BACKEND URL HERE ---
const backendUrl = "https://your-replit-url.replit.co";

export default function LoanHistoryPage() {
  const [pan, setPan] = useState("");
  const [loans, setLoans] = useState([]);

  const handleFetch = async () => {
    if (!pan) return alert("Please enter a PAN number to search.");
    try {
      // This calls the backend, which in turn calls the smart contract
      const response = await axios.post(`${backendUrl}/api/get-chain-loans`, {
        pan,
      });
      setLoans(response.data);
    } catch (e) {
      alert("Failed to fetch loan history.");
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}
    >
      <Typography variant="h5">Search On-Chain Loan History</Typography>
      <Typography>
        This page searches the public blockchain for a user's *final, approved*
        loan records. Enter a PAN number to generate the User ID and search.
      </Typography>
      <TextField
        label="Enter PAN Number"
        value={pan}
        onChange={(e) => setPan(e.target.value)}
        fullWidth
      />
      <Button variant="contained" onClick={handleFetch}>
        Fetch History
      </Button>

      <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date Approved</TableCell>
              <TableCell>Documents (IPFS)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No on-chain records found for this PAN.
                </TableCell>
              </TableRow>
            ) : (
              loans.map((loan, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Typography
                      color={loan.status === "NPL" ? "error" : "success"}
                    >
                      {loan.status}
                    </Typography>
                  </TableCell>
                  <TableCell>{loan.loanAmount}</TableCell>
                  <TableCell>{loan.loanType}</TableCell>
                  <TableCell>{loan.dateApproved}</TableCell>
                  <TableCell>
                    {/* This creates a clickable link to the document on IPFS */}
                    <Link
                      href={`https://gateway.pinata.cloud/ipfs/${loan.documentHash}`}
                      target="_blank"
                      rel="noopener"
                    >
                      Doc
                    </Link>{" "}
                    |
                    <Link
                      href={`https://gateway.pinata.cloud/ipfs/${loan.profilePicHash}`}
                      target="_blank"
                      rel="noopener"
                    >
                      Pic
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
