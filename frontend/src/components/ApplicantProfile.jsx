import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import RegistrarExamPermit from "../registrar/RegistrarExamPermit";
import {
  TextField,
  Button,
  Box,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import QRScanner from "./QRScanner";
import API_BASE_URL from "../apiConfig";

const ApplicantProfile = () => {
  const { applicantNumber } = useParams();
  const navigate = useNavigate();

  const [personId, setPersonId] = useState(null);
  const [searchQuery, setSearchQuery] = useState(applicantNumber || "");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "info",
  });

  const showSnackbar = (message, type = "info") => {
    setSnackbar({ open: true, message, type });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // 🔁 Auto-load when URL has applicant number
  useEffect(() => {
    if (applicantNumber) {
      setHasSearched(true);
      setSearchQuery(applicantNumber);
      fetchApplicantData(applicantNumber);
    }
  }, [applicantNumber]);

  const fetchApplicantData = async (query) => {
    if (!query) return;

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/person-by-applicant/${query}`
      );

      if (!res.data?.person_id) {
        showSnackbar("❌ Applicant not found.", "error");
        setPersonId(null);
        return;
      }

      setPersonId(res.data.person_id);
    } catch (err) {
      console.error(err);
      showSnackbar("⚠️ Error fetching applicant data.", "error");
      setPersonId(null);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setHasSearched(true);

    // ✅ stays on VITE (5173)
    navigate(`/applicant_profile/${searchQuery.trim()}`);
    fetchApplicantData(searchQuery.trim());
  };

  return (
    <Box
      sx={{
        height: "calc(100vh - 150px)",
        overflowY: "auto",
        backgroundColor: "transparent",
        p: 2,
        mt: 2
      }}
    >
      <Typography
        variant="h4"
        sx={{ fontWeight: "bold", color: "maroon", mb: 2 }}
      >
        APPLICANT PROFILE
      </Typography>
      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <br />

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          label="Enter Applicant Number"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
        />

        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<CameraAltIcon />}
          onClick={() => setScannerOpen(true)}
        >
          Scan QR
        </Button>
      </Box>

      {/* QR Scanner */}
      <QRScanner
        open={scannerOpen}
        onScan={(text) => {
          let scanned = String(text || "").trim();
          if (scanned.includes("/")) scanned = scanned.split("/").pop();

          setScannerOpen(false);
          setSearchQuery(scanned);
          setHasSearched(true);
          navigate(`/applicant_profile/${scanned}`);
          fetchApplicantData(scanned);
        }}
        onClose={() => setScannerOpen(false)}
      />

      {/* RESULT */}
      {hasSearched && (
        <>
          {personId ? (
            <RegistrarExamPermit personId={personId} />
          ) : (
            <Typography color="error">
              Invalid Applicant Number
            </Typography>
          )}
        </>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.type} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ApplicantProfile;
