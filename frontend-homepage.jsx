import React from "react";
import { Link } from "react-router-dom";
import { Paper, Button, Box, Typography } from "@mui/material";

export default function HomePage() {
  return (
    <Paper
      elevation={3}
      sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2, mt: 4 }}
    >
      <Typography variant="h5" align="center">
        Welcome
      </Typography>
      <Button component={Link} to="/apply" variant="contained" fullWidth>
        Apply for a Loan 📝
      </Button>
      <Button
        component={Link}
        to="/bank"
        variant="contained"
        color="success"
        fullWidth
      >
        Bank Employee Dashboard 🏦
      </Button>
      <Button
        component={Link}
        to="/admin"
        variant="contained"
        color="secondary"
        fullWidth
      >
        System Admin Page 👑
      </Button>
    </Paper>
  );
}
