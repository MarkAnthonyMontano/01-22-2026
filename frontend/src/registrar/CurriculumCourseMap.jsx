import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import API_BASE_URL from "../apiConfig";
import { Box, Typography, Button, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import LoadingOverlay from "../components/LoadingOverlay";

const CurriculumCourseMap = () => {
  const settings = useContext(SettingsContext);
  const [titleColor, setTitleColor] = useState("#000000");
  const [subtitleColor, setSubtitleColor] = useState("#555555");
  const [borderColor, setBorderColor] = useState("#000000");
  const [mainButtonColor, setMainButtonColor] = useState("#1976d2");
  const [subButtonColor, setSubButtonColor] = useState("#ffffff");   // ✅ NEW
  const [stepperColor, setStepperColor] = useState("#000000");       // ✅ NEW

  const [fetchedLogo, setFetchedLogo] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [shortTerm, setShortTerm] = useState("");
  const [campusAddress, setCampusAddress] = useState("");

  const [selectedYearLevel, setSelectedYearLevel] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");

  const [filteredPrograms, setFilteredPrograms] = useState([]);

  useEffect(() => {
    if (!settings) return;

    // 🎨 Colors
    if (settings.title_color) setTitleColor(settings.title_color);
    if (settings.subtitle_color) setSubtitleColor(settings.subtitle_color);
    if (settings.border_color) setBorderColor(settings.border_color);
    if (settings.main_button_color) setMainButtonColor(settings.main_button_color);
    if (settings.sub_button_color) setSubButtonColor(settings.sub_button_color);   // ✅ NEW
    if (settings.stepper_color) setStepperColor(settings.stepper_color);           // ✅ NEW

    // 🏫 Logo
    if (settings.logo_url) {
      setFetchedLogo(`${API_BASE_URL}${settings.logo_url}`);
    } else {
      setFetchedLogo(EaristLogo);
    }

    // 🏷️ School Information
    if (settings.company_name) setCompanyName(settings.company_name);
    if (settings.short_term) setShortTerm(settings.short_term);
    if (settings.campus_address) setCampusAddress(settings.campus_address);

  }, [settings]);

  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const pageId = 111;

  const [employeeID, setEmployeeID] = useState("");

  useEffect(() => {

    const storedUser = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    const storedID = localStorage.getItem("person_id");
    const storedEmployeeID = localStorage.getItem("employee_id");

    if (storedUser && storedRole && storedID) {
      setUser(storedUser);
      setUserRole(storedRole);
      setUserID(storedID);
      setEmployeeID(storedEmployeeID);

      if (storedRole === "registrar") {
        checkAccess(storedEmployeeID);
      } else {
        window.location.href = "/login";
      }
    } else {
      window.location.href = "/login";
    }
  }, []);

  const checkAccess = async (employeeID) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/page_access/${employeeID}/${pageId}`);
      if (response.data && response.data.page_privilege === 1) {
        setHasAccess(true);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
      if (error.response && error.response.data.message) {
        console.log(error.response.data.message);
      } else {
        console.log("An unexpected error occurred.");
      }
      setLoading(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const [curriculumList, setCurriculumList] = useState([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [taggedPrograms, setTaggedPrograms] = useState([]);

  // 🆕 local editable fees
  const [editedFees, setEditedFees] = useState({});

  useEffect(() => {
    fetchCurriculum();
    fetchTaggedPrograms();
  }, []);

  const fetchCurriculum = async () => {
    const res = await axios.get(`${API_BASE_URL}/get_active_curriculum`);
    setCurriculumList(res.data);
  };

  const fetchTaggedPrograms = async () => {
    const res = await axios.get(`${API_BASE_URL}/prgram_tagging_list`);
    setTaggedPrograms(res.data);
  };

  // 🧠 Group by Year → Semester
  const groupedData = () => {
    const result = {};

    taggedPrograms
      .filter(p => p.curriculum_id == selectedCurriculum)
      .forEach(p => {
        if (!result[p.year_level_description]) {
          result[p.year_level_description] = {};
        }
        if (!result[p.year_level_description][p.semester_description]) {
          result[p.year_level_description][p.semester_description] = [];
        }
        result[p.year_level_description][p.semester_description].push(p);
      });

    return result;
  };

  const data = groupedData();

  // 🖊 handle input change
  const handleFeeChange = (id, field, value) => {
    setEditedFees(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value === "" ? "" : Number(value)
      }
    }));
  };

  const handleSaveSemester = async (courses) => {
    try {
      for (const course of courses) {
        const updates = editedFees[course.program_tagging_id];
        if (!updates) continue;

        await axios.put(
          `${API_BASE_URL}/program_tagging/${course.program_tagging_id}`,
          {
            ...course,
            lec_fee: updates.lec_fee ?? course.lec_fee,
            lab_fee: updates.lab_fee ?? course.lab_fee,
          }
        );
      }

      setSnackbar({
        open: true,
        message: "Fees saved successfully!",
        severity: "success",
      });

      setEditedFees({});
      fetchTaggedPrograms();
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Error saving fees",
        severity: "error",
      });
    }
  };

  const headerStyle = {
    backgroundColor: settings?.header_color || "#1976d2",
    border: `2px solid ${borderColor}`,
    color: "white",
    textAlign: "center",
    padding: "8px",
  };

  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Loading..." />;
  }

  if (!hasAccess) {
    return <Unauthorized />;
  }


  const cellStyle = {
    border: `2px solid ${borderColor}`,
    padding: "8px",
  };

  return (
    <Box
      sx={{
        height: "calc(100vh - 150px)",
        overflowY: "auto",
        paddingRight: 1,
        backgroundColor: "transparent",
        mt: 1,
        p: 2,
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            color: titleColor,
            fontSize: "36px",
          }}
        >
          CURRICULUM PAYMENT
        </Typography>
      </Box>

      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <br />

      <Typography fontWeight={500}>Select Curriculum:</Typography>
      <FormControl sx={{ minWidth: 400, mb: 4 }}>
        <InputLabel>Choose Curriculum</InputLabel>
        <Select
          value={selectedCurriculum}
          label="Choose Curriculum"
          onChange={(e) => setSelectedCurriculum(e.target.value)}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {curriculumList.map((c) => (
            <MenuItem key={c.curriculum_id} value={c.curriculum_id}>
              {c.program_description} {c.major}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ mt: 2, mb: 4 }}>
        <hr
          style={{
            border: "none",
            borderTop: `3px solid ${borderColor}`,
            opacity: 0.5,
          }}
        />
      </Box>


      {/* YEARS */}
      {Object.keys(data).map((year) => (
        <Box key={year} sx={{ mb: 6 }}>
          {/* YEAR TITLE */}
          <Typography
            variant="h3"
            sx={{
              fontWeight: "bold",
              color: titleColor,
              mb: 3,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            {year}
          </Typography>

          {/* SEMESTERS GRID */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 3,
            }}
          >
            {Object.keys(data[year]).map((sem) => {
              const semesterCourses = data[year][sem];

              return (
                <Box
                  key={sem}
                  sx={{
                    border: `2px solid ${borderColor}`,
                    p: 2,
                    minHeight: 300,
                    position: "relative",
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {sem}
                  </Typography>

                  <Box sx={{ position: "relative", pb: 7 }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                      }}
                    >
                      <thead>
                        <tr>
                          <th style={headerStyle}>COURSE</th>
                          <th style={headerStyle}>LEC FEE</th>
                          <th style={headerStyle}>LAB FEE</th>
                        </tr>
                      </thead>

                      <tbody>
                        {semesterCourses.map((course) => {
                          const edit =
                            editedFees[course.program_tagging_id] || {};

                          return (
                            <tr key={course.program_tagging_id}>
                              <td style={cellStyle}>
                                {course.course_description}
                              </td>

                              <td
                                style={{
                                  ...cellStyle,
                                  textAlign: "right",
                                }}
                              >
                                <input
                                  type="number"
                                  value={
                                    edit.lec_fee !== undefined
                                      ? edit.lec_fee
                                      : course.lec_fee || 0
                                  }
                                  onChange={(e) =>
                                    handleFeeChange(
                                      course.program_tagging_id,
                                      "lec_fee",
                                      e.target.value
                                    )
                                  }
                                  style={{
                                    width: "90px",
                                    padding: "6px",
                                    border: "1px solid #ccc",
                                    borderRadius: 4,
                                    textAlign: "right",
                                  }}
                                />
                              </td>

                              <td
                                style={{
                                  ...cellStyle,
                                  textAlign: "right",
                                }}
                              >
                                <input
                                  type="number"
                                  value={
                                    edit.lab_fee !== undefined
                                      ? edit.lab_fee
                                      : course.lab_fee || 0
                                  }
                                  onChange={(e) =>
                                    handleFeeChange(
                                      course.program_tagging_id,
                                      "lab_fee",
                                      e.target.value
                                    )
                                  }
                                  style={{
                                    width: "90px",
                                    padding: "6px",
                                    border: "1px solid #ccc",
                                    borderRadius: 4,
                                    textAlign: "right",
                                  }}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* SAVE BUTTON */}
                    <button
                      onClick={() =>
                        handleSaveSemester(semesterCourses)
                      }
                      style={{
                        position: "absolute",
                        bottom: 10,
                        right: 10,
                        padding: "8px 16px",
                        background: "#1976d2",
                        color: "#fff",
                        border: "none",
                        borderRadius: 5,
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* YEAR DIVIDER */}
          <Box sx={{ mt: 5 }}>
            <hr
              style={{
                border: "none",
                borderTop: `3px solid ${borderColor}`,
                opacity: 0.5,
              }}
            />
          </Box>
        </Box>
      ))}

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );

};

export default CurriculumCourseMap;
