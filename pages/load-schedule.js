import React, { useState, useEffect } from 'react';
import AdminNavBar from '../components/AdminNavBar';
import Head from 'next/head';
import { Box, Button, TextField } from '@mui/material';
import { getAuth } from 'firebase/auth';
import firebaseApp from '../helpers/firebase';
import { getFirestore, setDoc, getDoc, deleteDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/router';

const LoadSchedule = () => {
    const [adminConfirmed, setAdminConfirmed] = useState(false);
    const [sheetId, setSheetId] = useState('');
    const [sheetName, setSheetName] = useState('');
    const auth = getAuth(firebaseApp);
    const db = getFirestore(firebaseApp);
    const router = useRouter();

    // Authentication check
    useEffect(() => {
        if (auth) {
            auth.onAuthStateChanged((user) => {
                if (user) {
                    user.getIdTokenResult().then((idTokenResult) => {
                        const isAdmin = idTokenResult?.claims?.admin === true;
                        if (isAdmin) {
                            setAdminConfirmed(true);
                        } else {
                            router.push('/login');
                        }
                    });
                } else {
                    router.push('/login');
                }
            });
        }
    }, [auth, router]);

    const handleLinkSubmission = async () => {
        if (!sheetId || !sheetName) {
            alert('Please enter valid Sheet ID and Sheet Name.');
            return;
        }

        try {
            const scheduleRef = doc(db, "sheets-schedule", "currentSchedule");

            // Check if 'currentSchedule' already exists. If so, delete it.
            const existingSchedule = await getDoc(scheduleRef);
            if (existingSchedule.exists()) {
                if (existingSchedule.data().sheetId === sheetId && existingSchedule.data().sheetName === sheetName) {
                    alert('Schedule already in use');
                    return;
                }
                await deleteDoc(scheduleRef);
                console.log('Existing schedule deleted.');
            }

            // Save the new schedule
            await setDoc(scheduleRef, {
                sheetId: sheetId,
                sheetName: sheetName,
            });

            alert('New schedule loaded successfully!');
        } catch (error) {
            console.error("Error storing schedule:", error);
            alert('Error saving schedule data.');
        }
    };

    return (
        <div style={{ backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>
            {!adminConfirmed ? (
                <>
                    <Head>
                        <title>Load Schedule Page | GT WebDev</title>
                    </Head>
                    <AdminNavBar />
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', maxWidth: '500px', rowGap: '10px' }}>
                            <h2 style={{ textAlign: 'center' }}>Verifying authentication...</h2>
                        </Box>
                    </div>
                </>
            ) : (
                <>
                    <Head>
                        <title>Load Schedule Page | GT WebDev</title>
                    </Head>
                    <AdminNavBar />
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                width: '100%',
                                maxWidth: '600px',
                                rowGap: '10px',
                                color: 'black',
                            }}
                        >
                            <h1 style={{ textAlign: 'center', color: 'black' }}>Admin Schedule Page</h1>
                            <h4>
                                Tool to sync the schedule page with the Google Sheets schedule for the current semester. Ensure the Google Sheet is viewable by anyone with the link.
                            </h4>
                            
                            {/* Sheet ID Section */}
                            <p style={{  margin: 0, wordBreak: 'break-all', width: '100%' }}>
                                {`"Sheet ID" can be found from the URL of the Google Sheet (https://docs.google.com/spreadsheets/d/{Sheet ID})`}
                            </p>
                            <TextField
                                id="sheet-id"
                                label="Sheet ID"
                                variant="outlined"
                                fullWidth
                                value={sheetId}
                                onChange={(e) => setSheetId(e.target.value)}
                                sx={{ input: { color: 'black' }, label: { color: 'black' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'black' } } }}
                            />
    
                            {/* Sheet Name Section */}
                            <p style={{ margin: '10px 0px 0px 0px', width: '100%' }}>
                                "Sheet Name" is the name of the tab you are on (found at the bottom of Google Sheets)
                            </p>
                            <TextField
                                id="sheet-name"
                                label="Sheet Name"
                                variant="outlined"
                                fullWidth
                                value={sheetName}
                                onChange={(e) => setSheetName(e.target.value)}
                                sx={{ input: { color: 'black' }, label: { color: 'black' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'black' } } }}
                            />
    
                            <Button 
                                variant="contained" 
                                fullWidth 
                                onClick={handleLinkSubmission}
                                sx={{
                                    backgroundColor: '#9c27b0',
                                    color: 'white',
                                    '&:hover': { backgroundColor: '#7d0b91' },
                                    marginTop: '25px'
                                }}
                            >
                                Load Schedule From Google Sheet
                            </Button>
                        </Box>
                    </div>
                </>
            )}
        </div>
    );
};

export default LoadSchedule;