import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import API_BASE_URL from "../apiConfig";
import {
    Box,
    Typography,
    Snackbar,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import LoadingOverlay from "../components/LoadingOverlay";
import Unauthorized from "../components/Unauthorized";

const CoursePanelMap = () => {
    const settings = useContext(SettingsContext);

    const [titleColor, setTitleColor] = useState("#000");
    const [borderColor, setBorderColor] = useState("#000");

    const [curriculumList, setCurriculumList] = useState([]);
    const [selectedCurriculum, setSelectedCurriculum] = useState("");
    const [taggedPrograms, setTaggedPrograms] = useState([]);

    // editable prereqs
    const [editedPrereq, setEditedPrereq] = useState({});

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const [hasAccess, setHasAccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const pageId = 112; // 🔁 change if needed

    /* ===================== SETTINGS ===================== */
    useEffect(() => {
        if (!settings) return;
        if (settings.title_color) setTitleColor(settings.title_color);
        if (settings.border_color) setBorderColor(settings.border_color);
    }, [settings]);

    /* ===================== AUTH ===================== */
    useEffect(() => {
        const role = localStorage.getItem("role");
        const employeeID = localStorage.getItem("employee_id");

        if (role !== "registrar") {
            window.location.href = "/login";
            return;
        }

        checkAccess(employeeID);
    }, []);

    const checkAccess = async (employeeID) => {
        try {
            const res = await axios.get(
                `${API_BASE_URL}/api/page_access/${employeeID}/${pageId}`
            );
            setHasAccess(res.data?.page_privilege === 1);
        } catch {
            setHasAccess(false);
        }
    };

    /* ===================== DATA ===================== */
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

    /* ===================== GROUP YEAR → SEM ===================== */
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

    /* ===================== HANDLERS ===================== */
    const handlePrereqChange = (id, value) => {
        setEditedPrereq(prev => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleSaveSemester = async (courses) => {
        try {
            for (const course of courses) {
                if (editedPrereq[course.program_tagging_id] === undefined) continue;

                await axios.put(
                    `${API_BASE_URL}/update_course/${course.course_id}`,
                    {
                        prereq: editedPrereq[course.program_tagging_id],
                    }
                );
            }

            setSnackbar({
                open: true,
                message: "Prerequisites saved successfully!",
                severity: "success",
            });

            setEditedPrereq({});
            fetchTaggedPrograms();
        } catch (err) {
            setSnackbar({
                open: true,
                message: "Failed to save prerequisites",
                severity: "error",
            });
        }
    };

    if (loading || hasAccess === null) {
        return <LoadingOverlay open={true} message="Loading..." />;
    }

    if (!hasAccess) {
        return <Unauthorized />;
    }

    const headerStyle = {
        backgroundColor: settings?.header_color || "#1976d2",
        color: "#fff",
        border: `2px solid ${borderColor}`,
        padding: "8px",
        textAlign: "center",
    };

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
                    flexWrap: "wrap",
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
                    COURSE PANEL PREREQUISITE
                </Typography>
            </Box>

            <hr style={{ border: "1px solid #ccc", width: "100%" }} />
            <br />

            {/* CURRICULUM SELECT */}
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
                                                    <th style={headerStyle}>CODE</th>
                                                    <th style={headerStyle}>COURSE</th>
                                                    <th style={headerStyle}>PREREQUISITE</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {semesterCourses.map((course) => (
                                                    <tr key={course.program_tagging_id}>
                                                        <td style={cellStyle}>{course.course_code}</td>
                                                        <td style={cellStyle}>{course.course_description}</td>
                                                        <td style={cellStyle}>
                                                            <input
                                                                type="text"
                                                                value={
                                                                    editedPrereq[course.program_tagging_id] ??
                                                                    course.prereq ??
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    handlePrereqChange(
                                                                        course.program_tagging_id,
                                                                        e.target.value
                                                                    )
                                                                }
                                                                style={{
                                                                    width: "100%",
                                                                    padding: "8px",
                                                                    border: "1px solid #ccc",
                                                                    borderRadius: 4,
                                                                }}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        <button
                                            onClick={() => handleSaveSemester(semesterCourses)}
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
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );

};

export default CoursePanelMap;
