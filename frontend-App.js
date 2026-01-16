import { HashRouter, Routes, Route, Link } from "react-router-dom";
import {
  Container,
  CssBaseline,
  Typography,
  Box,
  AppBar,
  Toolbar,
  Button,
} from "@mui/material";
import LoanApplicationPage from "./pages/LoanApplicationPage.jsx";
import EmployeeDashboard from "./pages/EmployeeDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import LoanHistoryPage from "./pages/LoanHistoryPage.jsx";
import "./styles.css";

export default function App() {
  return (
    <HashRouter>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            NPL Tracker
          </Typography>
          <Button component={Link} to="/" color="inherit">
            Apply for Loan
          </Button>
          <Button component={Link} to="/employee" color="inherit">
            Employee
          </Button>
          <Button component={Link} to="/admin" color="inherit">
            Admin
          </Button>
          <Button component={Link} to="/history" color="inherit">
            Loan History
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          component="h1"
          align="center"
          gutterBottom
          sx={{ mt: 4 }}
        >
          Digital Tokenization & NPL Tracking
        </Typography>
        <Routes>
          <Route path="/" element={<LoanApplicationPage />} />
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/history" element={<LoanHistoryPage />} />
        </Routes>
      </Container>
    </HashRouter>
  );
}
