import { useState } from "react";
import { ethers } from "ethers";
import { Button, Paper, TextField, Typography } from "@mui/material";

// --- PASTE YOUR CONTRACT ADDRESS AND ABI HERE ---
const contractAddress = "YOUR_CONTRACT_ADDRESS";
const contractABI = [
  /* YOUR ABI */
];

export default function AdminPage() {
  const [bankAddress, setBankAddress] = useState("");
  const [connectedAccount, setConnectedAccount] = useState("");

  async function connectWallet() {
    if (typeof window.ethereum === "undefined")
      return alert("MetaMask is not installed!");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setConnectedAccount(accounts[0]);
  }

  async function grantRole() {
    if (!connectedAccount) return alert("Please connect your wallet first.");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    try {
      const tx = await contract.grantBankRole(bankAddress);
      alert("Submitting transaction...");
      await tx.wait();
      alert(`Bank role granted to ${bankAddress} successfully!`);
    } catch (e) {
      console.error("Error granting role:", e);
      alert("Failed to grant role. Make sure you are the admin.");
    }
  }

  return (
    <Paper
      elevation={3}
      sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}
    >
      <Typography variant="h5">System Admin Panel</Typography>
      <Button variant="contained" onClick={connectWallet}>
        {connectedAccount
          ? `Connected: ${connectedAccount.slice(0, 6)}...`
          : "Connect Admin Wallet"}
      </Button>
      <Typography>
        Use this panel to grant the BANK_ROLE to a bank employee's wallet
        address.
      </Typography>
      <TextField
        fullWidth
        label="Bank Employee Wallet Address"
        variant="outlined"
        value={bankAddress}
        onChange={(e) => setBankAddress(e.target.value)}
      />
      <Button
        variant="contained"
        color="secondary"
        onClick={grantRole}
        disabled={!connectedAccount}
      >
        Grant Bank Role
      </Button>
    </Paper>
  );
}
