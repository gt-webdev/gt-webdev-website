import React, {Component, useEffect, useState} from "react";
import AdminNavBar from "../components/AdminNavBar";
import Head from 'next/head'
import {Box, Button, TextareaAutosize, TextField} from "@mui/material";
import {getAuth, signInWithEmailAndPassword} from 'firebase/auth';
import firebaseApp from "../helpers/firebase";
import {useRouter} from 'next/router'
import {readRemoteFile, jsonToCSV} from "react-papaparse";
import { CSVLink } from "react-csv";

const AdminDashboard = () => {
    const [adminConfirmed, setAdminConfirmed] = useState(false);

    // auto-sorting tool
    const [pointsForFormerApplicant, setPointsForFormerApplicant] = useState(1000);
    const [pointsForFormerMember, setPointsForFormerMember] = useState(800);
    const [pointsPerWord, setPointsPerWord] = useState(1);

    const [sheetId, setSheetId] = useState('1eMMkaZPDnYvdCXVUvtI4P1QEDBlYmoMzZL3XOKJqaWE');
    const [sheetName, setSheetName] = useState('Form Responses 1');
    const [nameColumn, setNameColumn] = useState('B');
    const [projectPreferenceNumber, setProjectPreferenceNumber] = useState(1);
    const [formerMemberColumn, setFormerMemberColumn] = useState('N');
    const [repeatedApplicationColumn, setRepeatedApplicationsColumn] = useState('P');
    const [projectColumns, setProjectColumns] = useState('["I", "J", "K", "L", "M"]');
    const [essayColumns, setEssayColumns] = useState('["AK", "AL"]');
    const [csvData, setCSVData] = useState(undefined);

    const auth = getAuth(firebaseApp);
    const router = useRouter();

    // check if user is admin - if they are not, then kick them out from this page
    useEffect(() => {
        if (auth) {
            auth.onAuthStateChanged((user) => {
                if (user) {
                    user.getIdTokenResult()
                        .then((idTokenResult) => {
                            const isAdmin = idTokenResult?.claims?.admin === true;
                            if (isAdmin) {
                                setAdminConfirmed(true);
                            } else {
                                router.push('/login');
                            }
                        })
                        .catch((error) => {
                            console.log('Error verifying user information', error);
                            alert('Error verifying user information');
                        });
                } else if (!user) {
                    router.push('/login');
                }
            });
        }
    }, []);

    const excelSheetColumnNumber = function(columnTitle) {
        // source: https://leetcode.com/problems/excel-sheet-column-number/solutions/1717232/simple-javascript-solution/?q=javascript&orderBy=most_relevant
        let output = 0;
        for (let i = 0; i < columnTitle.length; i++) {
            output += (columnTitle.charCodeAt(columnTitle.length - 1 - i) - 64) * 26**i;
        }
        return output - 1;
    };

    function countWords(str) {
        if (str) {
            return str.trim().split(/\s+/).length;
        }
        return 0;
    }

    const sortApplicants = () => {
        // https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={sheet_name}
        const csvURL = `https://docs.google.com/spreadsheets/d/${encodeURI(sheetId)}/gviz/tq?tqx=out:csv&sheet=${encodeURI(sheetName)}`;
        readRemoteFile(csvURL, {
            complete: (results) => {
                try {
                    // get indices for essay responses
                    let essayResponseColumnIdxs = [];
                    const essayColumnsParsed = JSON.parse(essayColumns);
                    for (let i = 0; i < essayColumnsParsed.length; i++) {
                        essayResponseColumnIdxs.push(excelSheetColumnNumber(essayColumnsParsed[i]));
                    }

                    // get index for name response
                    const nameColumnIdx = excelSheetColumnNumber(nameColumn);

                    // get index for nth project choice response
                    const nthProjectChoiceColumn = JSON
                        .parse(projectColumns)[parseInt(`${projectPreferenceNumber}`) - 1];
                    const nthProjectChoiceColumnIdx
                        = excelSheetColumnNumber(nthProjectChoiceColumn);

                    // get index for former applicant response
                    const formerApplicantIdx = excelSheetColumnNumber(repeatedApplicationColumn);

                    // get index for former member response
                    const formerMemberIdx = excelSheetColumnNumber(formerMemberColumn);

                    // keep track of projects being offered
                    let projects = new Set();

                    // go through entire sheet and store all applicant info
                    const applicants = [];
                    const data = results?.data;
                    console.log("admin data" + data);
                    for (let rowIdx = 1; rowIdx < data.length; rowIdx++) {
                        const sheetRow = data[rowIdx];
                        const name = sheetRow[nameColumnIdx];
                        const nthProjectChoice = sheetRow[nthProjectChoiceColumnIdx];
                        projects.add(nthProjectChoice);
                        const essayResponses = [];
                        for (let i = 0; i < essayResponseColumnIdxs.length; i++) {
                            essayResponses.push(sheetRow[essayResponseColumnIdxs[i]] || "");
                        }
                        const isFormerApplicant = sheetRow[formerApplicantIdx].toLowerCase().trim() === "yes";
                        const isFormerMember = sheetRow[formerMemberIdx].toLowerCase().trim() === "yes";
                        const applicant = {
                            name,
                            nthProjectChoice,
                            essayResponses,
                            isFormerApplicant,
                            isFormerMember
                        }
                        applicants.push(applicant);
                    }

                    // convert from set to list for projects
                    projects = Array.from(projects);

                    // go through applicants and group them under project while assigning point values
                    for (let applicantIdx = 0; applicantIdx < applicants.length; applicantIdx++) {
                        const applicant = applicants[applicantIdx];
                        applicant.points = 0;

                        if (applicant.isFormerApplicant) {
                            applicant.points += pointsForFormerApplicant;
                        }

                        if (applicant.isFormerMember) {
                            applicant.points += pointsForFormerMember;
                        }

                        for (let i = 0; i < applicant.essayResponses.length; i++) {
                            applicant.points += countWords(applicant.essayResponses[i]) * pointsPerWord;
                        }

                        applicants[applicantIdx] = applicant;
                    }

                    // sort applicants by points
                    applicants.sort(function(first, second) {
                        return second.points - first.points;
                    });

                    console.debug("projects", projects);
                    console.debug("applicants", applicants);

                    // categorize applicants by projects and keep them sorted by points
                    const teamPlacements = {};
                    let mostAmountOfPeopleInGrouping = 0;
                    for (let i = 0; i < projects.length; i++) {
                        const projectName = projects[i];
                        if (!teamPlacements[projectName]) {
                            teamPlacements[projectName] = [];
                        }
                        for (let j = 0; j < applicants.length; j++) {
                            const applicant = applicants[j];
                            if (applicant.nthProjectChoice === projectName) {
                                teamPlacements[projectName].push(applicant.name);
                                mostAmountOfPeopleInGrouping = Math.max(mostAmountOfPeopleInGrouping,
                                    teamPlacements[projectName].length);
                            }
                        }
                    }

                    console.debug("team placements", teamPlacements);

                    let csvData = [];
                    for (let i = 0; i < projects.length; i++) {
                        const projectName = projects[i];
                        csvData.push(teamPlacements[projectName]);
                    }

                    console.debug("csv data", csvData);
                    csvData = csvData[0].map((_, colIndex) => csvData.map(row => row[colIndex]));
                    console.debug("csv data transposed", csvData);

                    const csv = jsonToCSV({
                        "fields": projects,
                        "data": csvData
                    });

                    console.debug("csv", csv);

                    if (csv) {
                        setCSVData(csv);
                    } else {
                        alert("Unable to convert final calculated result to CSV");
                    }
                } catch (e) {
                    console.error("Error parsing applicant data: ", e);
                    alert("Error parsing applicant data. Refer to console logs");
                }
            },
            error(error, _) {
                // unable to fetch data of Google Sheet
                console.error(`Unable to download CSV file`, csvURL, error);
                alert(`ERROR! Ensure Google Sheet can be viewed by anyone. Unable to download CSV file ${csvURL}`);
            }
        });
    }

    return (
        <div>
            {
                adminConfirmed === false ?
                    (
                        <>
                            <Head>
                                <title>Contact | GT WebDev</title>
                            </Head>
                            <AdminNavBar/>
                            <div className="main" style={{display: "flex", width: "100%", justifyContent: "center"}}>
                                <Box sx={{display: 'flex', flexDirection: 'column', maxWidth: '500px', rowGap: '10px'}}>
                                    <h2 style={{textAlign: "center"}}>Verifying authentication...</h2>
                                </Box>
                            </div>
                        </>
                    )
                    : (
                        <>
                            <Head>
                                <title>Contact | GT WebDev</title>
                            </Head>
                            <AdminNavBar/>
                            <div className="main" style={{display: "flex", width: "100%", justifyContent: "center"}}>
                                <Box sx={{display: 'flex', flexDirection: 'column', width: "100%", rowGap: '10px', alignItems: "center"}}>
                                    <h1 style={{textAlign: "center"}}>Admin Dashboard</h1>
                                    <Box sx={{display: 'flex', flexDirection: 'column', width: "70%", maxWidth: "600px", alignItems: "center", rowGap: "10px"}}>
                                        <h2>Applicant Auto-Sorter</h2>
                                        <p style={{marginTop: "0px"}}>
                                            Tool to help sort project applicants into teams (applications should still be manually reviewed!).
                                            Ensure the Google Sheet is viewable by anyone with the link.
                                        </p>
                                        {
                                            (csvData !== undefined) ?
                                            <CSVLink
                                                data={csvData}
                                                onClick={() => {
                                                    setCSVData(undefined);
                                                }}
                                                style={{
                                                    backgroundColor: "#222220",
                                                    color: "white",
                                                    width: "200px",
                                                    height: "50px",
                                                    display: "flex",
                                                    alignContent: "center",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    borderRadius: "10px"
                                                }}
                                            >
                                                <span>Download CSV</span>
                                            </CSVLink> :
                                            <>
                                                <p style={{marginTop: "0px", wordBreak: "break-all", width: "100%"}}>
                                                    {`"Sheet ID" can be found from the URL of the Google Sheet (https://docs.google.com/spreadsheets/d/{Sheet ID})`}
                                                </p>
                                                <TextField id="outlined-basic" label="Sheet ID" variant="outlined" type="text"
                                                           name="sheet-id" fullWidth={true} value={sheetId} onChange={(event) => {
                                                    setSheetId(event.target.value)
                                                }}
                                                />
                                                <p style={{marginTop: "0px", width: "100%"}}>
                                                    {`"Sheet Name" is the name of the tab you are on (found at the bottom of Google Sheets)`}
                                                </p>
                                                <TextField id="outlined-basic" label="Sheet Name" variant="outlined" type="text"
                                                           name="sheet-name" fullWidth={true} value={sheetName} onChange={(event) => {
                                                    setSheetName(event.target.value)
                                                }}
                                                />
                                                <p style={{marginTop: "0px", width: "100%"}}>
                                                    Name column refers to the column in the Google Sheet that references the preferred name of an applicant
                                                </p>
                                                <TextField id="outlined-basic" label="Name Column" variant="outlined" type="text"
                                                           name="name" fullWidth={true} value={nameColumn} onChange={(event) => {
                                                    setNameColumn(event.target.value)
                                                }}
                                                />
                                                <p style={{marginTop: "0px", width: "100%"}}>
                                                    {`Project preference, 1 means group people by their top choice`}
                                                </p>
                                                <TextField id="outlined-basic" label="Project Preference" variant="outlined" type="number"
                                                           name="project-preference" fullWidth={true} value={projectPreferenceNumber} onChange={(event) => {
                                                    setProjectPreferenceNumber(parseInt(event.target.value))
                                                }}
                                                />
                                                <p style={{marginTop: "0px", width: "100%"}}>
                                                    Column of the Google Sheet that refers to whether someone was a former member
                                                </p>
                                                <TextField id="outlined-basic" label="Former Member Column" variant="outlined" type="text"
                                                           name="former-member" fullWidth={true} value={formerMemberColumn} onChange={(event) => {
                                                    setFormerMemberColumn(event.target.value)
                                                }}
                                                />
                                                <p style={{marginTop: "0px", width: "100%"}}>
                                                    Column of the Google Sheet that refers to whether someone has applied to a project in the past
                                                </p>
                                                <TextField id="outlined-basic" label="Applied Before Column" variant="outlined" type="text"
                                                           name="applied-before" fullWidth={true} value={repeatedApplicationColumn} onChange={(event) => {
                                                    setRepeatedApplicationsColumn(event.target.value)
                                                }}
                                                />
                                                <p style={{marginTop: "0px", width: "100%"}}>
                                                    Columns of the Google Sheet that refer to essay questions
                                                </p>
                                                <TextField id="outlined-basic" label="Essay Questions Columns" variant="outlined" type="text"
                                                           name="essay-columns" fullWidth={true} value={essayColumns} onChange={(event) => {
                                                           setEssayColumns(event.target.value)
                                                }}
                                                />
                                                <p style={{marginTop: "0px", width: "100%"}}>
                                                    Columns of the Google Sheet that refer to project preferences
                                                </p>
                                                <TextField id="outlined-basic" label="Project Columns" variant="outlined" type="text"
                                                           name="project-columns" fullWidth={true} value={projectColumns} onChange={(event) => {
                                                           setProjectColumns(event.target.value)
                                                }}
                                                />

                                                <p style={{marginTop: "0px", width: "100%"}}>
                                                    {`Points per word`}
                                                </p>
                                                <TextField id="outlined-basic" label="Points Per Word" variant="outlined" type="number"
                                                           name="ppw" fullWidth={true} value={pointsPerWord} onChange={(event) => {
                                                    setPointsPerWord(parseInt(event.target.value))
                                                }}
                                                />

                                                <p style={{marginTop: "0px", width: "100%"}}>
                                                    {`Points for former applicants`}
                                                </p>
                                                <TextField id="outlined-basic" label="Points for Former Applicants" variant="outlined" type="number"
                                                           name="pffa" fullWidth={true} value={pointsForFormerApplicant} onChange={(event) => {
                                                    setPointsForFormerApplicant(parseInt(event.target.value))
                                                }}
                                                />

                                                <p style={{marginTop: "0px", width: "100%"}}>
                                                    {`Points for former members`}
                                                </p>
                                                <TextField id="outlined-basic" label="Points for Former Members" variant="outlined" type="number"
                                                           name="pffm" fullWidth={true} value={pointsForFormerMember} onChange={(event) => {
                                                    setPointsForFormerMember(parseInt(event.target.value))
                                                }}
                                                />

                                                <Button fullWidth={true} onClick={() => {
                                                    sortApplicants();
                                                }} variant="contained">✨Sort ✨</Button>
                                            </>
                                        }
                                    </Box>
                                </Box>
                            </div>
                        </>
                    )
            }
        </div>
    );
}

export default AdminDashboard;
