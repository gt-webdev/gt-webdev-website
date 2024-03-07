import React, {Component, useEffect, useState} from "react";
import NavBar from "../components/NavBar";
import BottomBar from "../components/BottomBar";
import Head from 'next/head'
import {Grid, Typography, Box} from "@mui/material";

import {currentData,previousData} from '../data/projectData.js';

// Import firebase database
import firebaseApp from "../helpers/firebase.js";
import { getFirestore, doc, collection, getDocs } from "firebase/firestore";

const db = getFirestore(firebaseApp);

const Projects = () => {

    const commonStyles = {
        bgcolor: '#202022',
        m: 1,
        width: '15rem',
        height: '15rem',
      };

    const [projects, setProjects] = useState([]);

    // When the application loads, get all projects from the database
    useEffect(async () => {
        const projectSnapshot = await getDocs(collection(db, "projects"));
        const projects = [];
        projectSnapshot.forEach(doc => {
            projects.push(doc.data());
        })
        setProjects(projects);
    }, []);

    return(
        <div>
            <Head>
                <title>Projects | GT WebDev</title>
            </Head>
            <NavBar />

            <Typography variant="p">Showing Projects from Database:</Typography>
            {projects.map(project => {
                return <p>{project['name']}</p>
            })}

            {/* Current Semster Project List */}
            <Typography variant="h3" className="projectSectionTitle">
                {currentData[0]['semester']}
            </Typography>
            <Grid container columnGap={2} className="projectSectionPadding">
                {currentData[0]['projects'].map((cur, ind) => {
                    return(
                        <Box sx={{ ...commonStyles, borderRadius: 5 }} className="projectBoxInfo projectBoxTxt">
                            {cur['name']}
                        </Box>
                    )
                })}
            </Grid>

            {/* List of previous semester projects */}
            {previousData.map((cur, ind) => {
                return (
                    <div>
                        <Typography variant="h3" className="projectSectionTitle">
                            {cur['semester']}
                        </Typography>
                        <Grid container columnGap={2} className="projectSectionPadding">
                            {cur['projects'].map((cur, ind) => {
                                return(
                                    <Box sx={{ ...commonStyles, borderRadius: 5 }} className="projectBoxInfo projectBoxTxt">
                                        {cur['name']}
                                    </Box>
                                )
                            })}
                        </Grid>
                    </div>
                )
            })}
            <BottomBar />
        </div>
    )
}

export default Projects
