import React, {Component, useEffect, useState} from "react";
import AdminNavBar from "../components/AdminNavBar";
import Head from 'next/head'
import {Box, Button, TextareaAutosize, TextField} from "@mui/material";
import {getAuth, signInWithEmailAndPassword} from 'firebase/auth';
import firebaseApp from "../helpers/firebase";
import {useRouter} from 'next/router'
import { collection, query, where, getDocs, getFirestore } from "firebase/firestore";
import {readRemoteFile, jsonToCSV} from "react-papaparse";
import { addDoc } from "firebase/firestore"; 



const LoadMembersPage = () => {

    

    const [adminConfirmed, setAdminConfirmed] = useState(false);



    const [googleSheetURL, setSheetId] = useState('https://docs.google.com/spreadsheets/d/1eMMkaZPDnYvdCXVUvtI4P1QEDBlYmoMzZL3XOKJqaWE');
    const [nameColumn, setNameColumn] = useState('B');
    const [formerMemberColumn, setFormerMemberColumn] = useState('N');
    const [appliedPastColumn, setAppliedPastColumn] = useState('P');
    const [essayResponseColumn, setEssayResponseColumn] = useState('["AK", "AL"]');
    const [projectPreferenceColumn, setProjectPreferenceColumn] = useState('["I", "J", "K", "L", "M"]');
    const [semesterName, setSemesterName] = useState("Fall 2023");

    const auth = getAuth(firebaseApp);
    const router = useRouter();

    
    
    const db = getFirestore(firebaseApp);
    

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

    const loadMembers = () => {
        // https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={sheet_name}
        // https://docs.google.com/spreadsheets/d/1eMMkaZPDnYvdCXVUvtI4P1QEDBlYmoMzZL3XOKJqaWE/edit#gid=641919817
    
        //get the sheetID from edit link
        const startIndex = googleSheetURL.indexOf("/d/") + 3;
        const endIndex = googleSheetURL.indexOf("/", startIndex);
        const sheetId = googleSheetURL.substring(startIndex, endIndex !== -1 ? endIndex : googleSheetURL.length);
        
        //get the sheet name- might need to change later!!
        const sheetName = "Form Responses 1"

        const csvURL = `https://docs.google.com/spreadsheets/d/${encodeURI(sheetId)}/gviz/tq?tqx=out:csv&sheet=${encodeURI(sheetName)}`;
        readRemoteFile(csvURL, {
            complete: (results) => {
                try {
                    // get indices for essay responses
                    let essayResponseColumnIdxs = [];
                    const essayColumnsParsed = JSON.parse(essayResponseColumn);
                    for (let i = 0; i < essayColumnsParsed.length; i++) {
                        essayResponseColumnIdxs.push(excelSheetColumnNumber(essayColumnsParsed[i]));
                    }

                    // get index for name response
                    const nameColumnIdx = excelSheetColumnNumber(nameColumn);

                    // get index for nth project choice response
                    // const nthProjectChoiceColumn = JSON
                    //     .parse(projectPreferenceColumn)[parseInt(`${projectPreferenceColumn}`) - 1];
                    // console.log(nthProjectChoiceColumn);
                    // const nthProjectChoiceColumnIdx = excelSheetColumnNumber(nthProjectChoiceColumn);

                    // get indices for project preferences
                    let projectPreferenceColumnIdx = [];
                    const projectColumnsParsed = JSON.parse(projectPreferenceColumn);
                    for (let i = 0; i < projectColumnsParsed.length; i++) {
                        projectPreferenceColumnIdx.push(excelSheetColumnNumber(projectColumnsParsed[i]));
                    }

                    // get index for former applicant response
                    const formerApplicantIdx = excelSheetColumnNumber(appliedPastColumn);

                    // get index for former member response
                    const formerMemberIdx = excelSheetColumnNumber(formerMemberColumn);

            

                    // go through entire sheet and store all applicant info
                    const applicants = [];
                    const data = results?.data;
        
                    


                    for (let rowIdx = 1; rowIdx < data.length; rowIdx++) {
                        let projects = [];
                        const sheetRow = data[rowIdx];
                        const name = sheetRow[nameColumnIdx];
                        for (let i = 0; i < projectPreferenceColumnIdx.length; i++) {
                            projects.push(sheetRow[projectPreferenceColumnIdx[i]] || "");
                        }
                        const essayResponses = [];
                        for (let i = 0; i < essayResponseColumnIdxs.length; i++) {
                            essayResponses.push(sheetRow[essayResponseColumnIdxs[i]] || "");
                        }
                        const isFormerApplicant = sheetRow[formerApplicantIdx].toLowerCase().trim() === "yes";
                        const isFormerMember = sheetRow[formerMemberIdx].toLowerCase().trim() === "yes";
                        const applicant = {
                            name,
                            projects,
                            essayResponses,
                            isFormerApplicant,
                            isFormerMember
                        }
                        applicants.push(applicant);

                        const addApplicantsToFirestore = async () => {
                            const applicantsCollection = collection(db, 'applicants');
                        
                            for (const applicant of applicants) {
                                try {
                                    await addDoc(applicantsCollection, applicant);
                                    console.log('Applicant added successfully:', applicant);
                                } catch (error) {
                                    console.error('Error adding applicant:', error);
                                }
                            }
                        };

                        if (rowIdx == 1) {
                            addApplicantsToFirestore();
                        }
                        
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
                                    <h1 style={{textAlign: "center", fontSize: '60px'}}>Load Members From Google Sheets</h1>
                                    <Box sx={{display: 'flex', flexDirection: 'column', width: "70%", maxWidth: "600px", alignItems: "center", rowGap: "10px"}}>

                                        {
                                
                                            <>
                                                
                                                <TextField id="outlined-basic" label="Form Responses URL (Google Sheet)" variant="outlined" type="text"
                                                           name="sheet-id" fullWidth={true} value={googleSheetURL} onChange={(event) => {
                                                    setSheetId(event.target.value)
                                                }} style={{
                                                    textcolor: 'white',
                                                }}
                                                />
                                                
                                                <TextField id="outlined-basic" label="Name Column" variant="outlined" type="text"
                                                           name="sheet-name" fullWidth={true} value={nameColumn} onChange={(event) => {
                                                    setNameColumn(event.target.value)
                                                }}
                                                />
                                                
                                                <TextField id="outlined-basic" label="Was Former Member Column" variant="outlined" type="text"
                                                           name="name" fullWidth={true} value={formerMemberColumn} onChange={(event) => {
                                                    setFormerMemberColumn(event.target.value)
                                                }}
                                                />
                                              
                                                <TextField id="outlined-basic" label="Applied to Project in Past Column" variant="outlined" type="text"
                                                           name="project-preference" fullWidth={true} value={appliedPastColumn} onChange={(event) => {
                                                    setAppliedPastColumn(event.target.value)
                                                }}
                                                />
                                               
                                                <TextField id="outlined-basic" label="Essay Responses Columns" variant="outlined" type="text"
                                                           name="former-member" fullWidth={true} value={essayResponseColumn} onChange={(event) => {
                                                    setEssayResponseColumn(event.target.value)
                                                }}
                                                />
                                                
                                    
                                                
                                                <TextField id="outlined-basic" label="Project Preferences Column" variant="outlined" type="text"
                                                           name="essay-columns" fullWidth={true} value={projectPreferenceColumn} onChange={(event) => {
                                                           setProjectPreferenceColumn(event.target.value)
                                                }}
                                                />
                                               
                                                <TextField id="outlined-basic" label="Semester Name" variant="outlined" type="text"
                                                           name="project-columns" fullWidth={true} value={semesterName} onChange={(event) => {
                                                           setSemesterName(event.target.value)
                                                }}
                                                />

                                              


                                                <Button fullWidth={true} onClick={() => {
                            
                                                    loadMembers();
                                                }} variant="contained"> Load Members from Google Sheet Into Database! </Button>


<Button fullWidth={true} onClick={() => {
                                                }} variant="contained"> Back </Button>
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

export default LoadMembersPage;
