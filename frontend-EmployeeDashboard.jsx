import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
} from "@mui/material";

// --- PASTE YOUR CONTRACT ADDRESS AND ABI HERE ---
const contractAddress = "0xEC1b49c7D724971E7a8a984147F1348DD4A00318";
const contractABI = [];

export default function BankDashboardPage() {
  const [allLoans, setAllLoans] = useState([]);
  const [connectedAccount, setConnectedAccount] = useState("");
  const [isBanker, setIsBanker] = useState(false);

  async function connectWallet() {
    if (typeof window.ethereum === "undefined")
      return alert("MetaMask is not installed!");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setConnectedAccount(accounts[0]);
    checkRole(accounts[0]);
  }

  async function checkRole(account) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );
    try {
      const bankRole = await contract.BANK_ROLE();
      const hasRole = await contract.hasRole(bankRole, account);
      setIsBanker(hasRole);
      if (hasRole) {
        fetchLoans();
      }
    } catch (e) {
      console.error("Could not check role", e);
    }
  }

  async function fetchLoans() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );
    try {
      const loans = await contract.getAllLoans();
      setAllLoans(loans);
    } catch (e) {
      console.error(e);
    }
  }

  async function updateStatus(loanId, newStatus) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    try {
      const tx = await contract.updateLoanStatus(loanId, newStatus);
      alert("Updating status...");
      await tx.wait();
      alert("Status updated successfully!");
      fetchLoans();
    } catch (e) {
      console.error(e);
      alert("Status update failed.");
    }
  }

  return (
    <Paper
      elevation={3}
      sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}
    >
      <Typography variant="h5">Bank Review Dashboard</Typography>
      <Button variant="contained" onClick={connectWallet}>
        {connectedAccount
          ? `Connected: ${connectedAccount.slice(0, 6)}...`
          : "Connect Bank Wallet"}
      </Button>

      {!isBanker && connectedAccount && (
        <Typography color="error">
          Access Denied. The connected wallet does not have the BANK_ROLE.
        </Typography>
      )}

      {isBanker && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Applicant</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allLoans.map((loan) => (
                <TableRow key={Number(loan.loanId)}>
                  <TableCell>{Number(loan.loanId)}</TableCell>
                  <TableCell sx={{ wordBreak: "break-all" }}>
                    {loan.applicant}
                  </TableCell>
                  <TableCell>
                    {ethers.formatUnits(loan.loanAmount, 0)}
                  </TableCell>
                  <TableCell>{loan.status}</TableCell>
                  <TableCell>
                    {loan.status === "Pending" && (
                      <Box>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => updateStatus(loan.loanId, "Approved")}
                        >
                          Approve
                        </Button>{" "}
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={() => updateStatus(loan.loanId, "Rejected")}
                        >
                          Reject
                        </Button>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
