require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const mongoose = require("mongoose");
const contractABI = require("./abi.json");

const app = express();
app.use(cors());
app.use(express.json());

// --- Multer Configuration for file uploads ---
// We store files in memory to be processed
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- CONFIGURATION (from Replit Secrets) ---
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const SERVER_WALLET_PRIVATE_KEY = process.env.SERVER_WALLET_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const DB_CONNECTION_STRING = process.env.DB_CONNECTION_STRING;
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

// --- BLOCKCHAIN CONNECTION ---
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
const serverWallet = new ethers.Wallet(SERVER_WALLET_PRIVATE_KEY, provider);
const contract = new ethers.Contract(
  CONTRACT_ADDRESS,
  contractABI,
  serverWallet,
);

// --- DATABASE CONNECTION ---
// We will use a MOCK database (an array) for simplicity for now.
// To use your real MongoDB Atlas, uncomment the lines below
/*
mongoose.connect(DB_CONNECTION_STRING)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB Connection Error:', err));

const ApplicationSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  pan: String,
  aadhaar: String,
  age: String,
  occupation: String,
  loanType: String,
  loanAmount: String,
  loanTerm: String,
  status: { type: String, default: 'Pending' },
  // In a real app, you'd store file paths from a file server (like S3)
  // For this prototype, we don't save the files in the DB
});
const Application = mongoose.model('Application', ApplicationSchema);
*/

// --- MOCK DATABASE (for prototype) ---
let pendingApplications = [];

// --- HELPER: Upload to IPFS via Pinata ---
async function uploadToIPFS(fileBuffer, fileName) {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
  let data = new FormData();
  data.append("file", fileBuffer, fileName);

  const response = await axios.post(url, data, {
    maxBodyLength: "Infinity",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_API_SECRET,
    },
  });
  return response.data.IpfsHash;
}

// --- API ENDPOINTS ---

// 1. User submits loan application
app.post(
  "/api/apply",
  upload.fields([
    { name: "document", maxCount: 1 },
    { name: "profilePicture", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        age,
        occupation,
        loanType,
        loanAmount,
        loanTerm,
        pan,
        aadhaar,
      } = req.body;

      if (!req.files || !req.files.document || !req.files.profilePicture) {
        return res.status(400).json({ error: "Missing required files." });
      }

      const newApplication = {
        _id: Date.now().toString(), // Simple unique ID
        firstName,
        lastName,
        age,
        occupation,
        loanType,
        loanAmount,
        loanTerm,
        pan,
        aadhaar,
        status: "Pending",
        // We don't save the files in this prototype, just log them
      };

      pendingApplications.push(newApplication);
      console.log(`New application received from ${firstName} ${lastName}`);

      res
        .status(200)
        .json({
          message: "Application submitted successfully! Pending review.",
        });
    } catch (error) {
      console.error("Error in /api/apply:", error);
      res.status(500).json({ error: "Failed to submit application." });
    }
  },
);

// 2. Employee gets pending applications
app.get("/api/employee/pending-applications", (req, res) => {
  const pending = pendingApplications.filter((app) => app.status === "Pending");
  res.json(pending);
});

// 3. Employee forwards application to admin
app.post("/api/employee/forward-for-review", (req, res) => {
  const { applicationId } = req.body;
  const app = pendingApplications.find((a) => a._id === applicationId);
  if (app) {
    app.status = "Forwarded";
    res.json({ message: "Application forwarded to Admin." });
  } else {
    res.status(440).json({ error: "Application not found." });
  }
});

// 4. Admin gets applications for review
app.get("/api/admin/review-applications", (req, res) => {
  const forwarded = pendingApplications.filter(
    (app) => app.status === "Forwarded",
  );
  res.json(forwarded);
});

// 5. Admin checks NPL status from Blockchain
app.post("/api/admin/check-npl", async (req, res) => {
  const { pan } = req.body;
  try {
    const userId = ethers.keccak256(ethers.toUtf8Bytes(pan));
    const userLoans = await contract.getLoans(userId);
    const hasNPL = userLoans.some((loan) => loan.status === "NPL");
    res.json({ hasNPL, userId });
  } catch (error) {
    console.error("Blockchain error:", error);
    res.status(500).json({ error: "Failed to check NPL status." });
  }
});

// 6. Admin approves loan (uploads files and writes to blockchain)
app.post(
  "/api/admin/approve-loan",
  upload.fields([
    { name: "document", maxCount: 1 },
    { name: "profilePicture", maxCount: 1 },
  ]),
  async (req, res) => {
    const { applicationId, pan, loanAmount, loanType } = req.body;

    try {
      if (!req.files || !req.files.document || !req.files.profilePicture) {
        return res.status(400).json({ error: "Missing files for approval." });
      }

      // 1. Upload files to IPFS
      const docHash = await uploadToIPFS(
        req.files.document[0].buffer,
        "Loan_Doc.pdf",
      );
      const picHash = await uploadToIPFS(
        req.files.profilePicture[0].buffer,
        "Profile_Pic.jpg",
      );

      // 2. Generate User ID from PAN
      const userId = ethers.keccak256(ethers.toUtf8Bytes(pan));

      // 3. Send Transaction to Blockchain
      const tx = await contract.addApprovedLoan(
        userId,
        loanAmount,
        loanType,
        docHash,
        picHash,
      );
      await tx.wait();

      // 4. Update Local Database Status
      const appIndex = pendingApplications.findIndex(
        (a) => a._id === applicationId,
      );
      if (appIndex !== -1) {
        pendingApplications[appIndex].status = "Approved";
      }

      res.json({
        message: "Loan Approved & Recorded on Blockchain!",
        txHash: tx.hash,
      });
    } catch (error) {
      console.error("Approval Error:", error);
      res.status(500).json({ error: "Failed to approve loan." });
    }
  },
);

// 7. Public history page gets on-chain loans
app.post("/api/get-chain-loans", async (req, res) => {
  const { pan } = req.body;
  try {
    const userId = ethers.keccak256(ethers.toUtf8Bytes(pan));
    const loans = await contract.getLoans(userId);

    const formattedLoans = loans.map((loan) => ({
      loanAmount: loan.loanAmount.toString(),
      loanType: loan.loanType,
      dateApproved: new Date(
        Number(loan.dateApproved) * 1000,
      ).toLocaleDateString(),
      status: loan.status,
      documentHash: loan.documentHash,
      profilePicHash: loan.profilePicHash,
    }));

    res.json(formattedLoans);
  } catch (error) {
    console.error("Error fetching chain data:", error);
    res.status(500).json({ error: "Failed to fetch history." });
  }
});

// --- START THE SERVER ---
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend server is running on port ${PORT}`);
});
