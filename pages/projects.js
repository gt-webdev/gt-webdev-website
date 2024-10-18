import React, {useState} from "react";
import NavBar from "../components/NavBar";
import BottomBar from "../components/BottomBar";
import Head from 'next/head'
import {Grid, Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button} from "@mui/material";

import {currentData,previousData} from '../data/projectData.js';

const Projects = () => {

    const [selectedProject, setSelectedProject] = useState(null);
    const [isModalOpen, setModalOpen] = useState(false);

    const commonStyles = {
        bgcolor: '#202022',
        m: 1,
        width: '15rem',
        height: '15rem',
      };

    const handleProjectClick = (project) => {
        setSelectedProject(project);
        setModalOpen(true);
    };

    const handleClose = () => {
        setModalOpen(false);
        setSelectedProject(null);
    };

    return(
        <div>
            <Head>
                <title>Projects | GT WebDev</title>
            </Head>
            <NavBar />

            {/* Current Semster Project List */}
            <Typography variant="h3" className="projectSectionTitle">
                {currentData[0]['semester']}
            </Typography>
            <Grid container columnGap={2} className="projectSectionPadding">
                {currentData[0]['projects'].map((cur, ind) => {
                    return(
                       <Box
                            key={ind}
                            sx={{ ...commonStyles, borderRadius: 5 }}
                            className="projectBoxInfo projectBoxTxt"
                            onClick={() => handleProjectClick(cur)}
                        >
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
                                    <Box
                                    key={ind}
                                    sx={{ ...commonStyles, borderRadius: 5 }}
                                    className="projectBoxInfo projectBoxTxt"
                                    onClick={() => handleProjectClick(cur)}
                                >
                                    {cur['name']}
                                    </Box>
                                )
                            })}
                        </Grid>
                    </div>
                )
            })}
            
            {/* Modal for Project Details */}
            <Dialog open={isModalOpen} onClose={handleClose}>
                {selectedProject && (
                    <>
                        <DialogTitle>{selectedProject.name}</DialogTitle>
                        <DialogContent>
                            <Typography variant="body1">
                                {selectedProject.description}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                <strong>Manager:</strong> {selectedProject.manager}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                <strong>Members:</strong> {selectedProject.members.length > 0 ? selectedProject.members.join(", ") : "No members available"}
                            </Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleClose} color="primary">
                                Close
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
            <BottomBar />
        </div>
    )
}

export default Projects
