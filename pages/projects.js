import React, {Component} from "react";
import { useState } from "react";
import NavBar from "../components/NavBar";
import BottomBar from "../components/BottomBar";
import Head from 'next/head'
import ReactCardFlip from 'react-card-flip';
import {Grid, Typography, Box} from "@mui/material";

import {currentData,previousData} from '../data/projectData.js';

const Projects = () => {

    const commonStyles = {
        bgcolor: '#202022',
        m: 1,
        width: '15rem',
        height: '15rem',
      };

    /* 
    Flippable card as a box.
    Card with project title. Mouse hover to flip card and reveal project description
    Bugs:
    - Project description on the same side as title and only momentarily reveals when you first hover
    - Card flips multiple times when hovering over
    - Project title not in the middle of the card
    
    To implement: 
    - Click on anywhere on card except title to flip reveal description.
    - Click on title to open link to project/github
    */ 

    const FlippableBox = ({ project }) => {
        const [isFlipped, setIsFlipped] = useState(false);
        const handleTextClick = () => {
            if (project["link"]) {
                window.open(project["link"], '_blank');
            }
        };
        const handleBoxClick = () => {
            if (project["link"]) {
                window.open(project["link"], '_blank');
            }
        };
        // const handleBoxClick = () => {
        //     setIsFlipped(!isFlipped);
        // };
        const handleBoxHover = () => {
            setIsFlipped(true);
        };
        const handleBoxLeave = () => {
            setIsFlipped(false);
        }

        return (
            <Box
                sx={{
                    ...commonStyles,
                    borderRadius: 5,
                    cursor: 'pointer',
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.5s',
                    transform: isFlipped ? 'rotateY(180deg)' : 'none'
                }}
                className="projectBoxInfo projectBoxTxt"
                onMouseEnter={handleBoxHover}
                onMouseLeave={handleBoxLeave}
                onClick={handleBoxClick}
            >
                <Box
                    sx={{
                        ...commonStyles,
                        backfaceVisibility: 'hidden'
                    }}
                >
                    <Typography>{project['name']}</Typography>
                    {isFlipped && (
                        <Typography>{project['description']}</Typography>
                    )}
                </Box>
            </Box>
        );
    };

    return(
        <div>
            <Head>
                <title>Projects | GT WebDev</title>
            </Head>
            <NavBar />

            {/* Current Semster Project List */}
            {/* Testing flippableBox on current projects only*/}
            <Typography variant="h3" className="projectSectionTitle">
                {currentData[0]['semester']}
            </Typography>
            <Grid container columnGap={2} className="projectSectionPadding">
                {currentData[0]['projects'].map((cur, ind) => ( 
                    <FlippableBox key={ind} project={cur} />
                ))}
            </Grid>
 
            {/* List of previous semester projects */}
            {/* Instead of flippable box, click the card to open the project link.
                - To do:
                    - Implement project description reveal
                    - Implement Flippable Card from current semester*/}
            {previousData.map((cur, ind) => {
                return (
                    <div>
                        <Typography variant="h3" className="projectSectionTitle">
                            {cur['semester']}
                        </Typography>
                        <Grid container columnGap={2} className="projectSectionPadding">
                            {cur['projects'].map((cur, ind) => {
                                const onClickHandler = cur["link"] ? 
                                    () => window.open(cur["link"], '_blank') : 
                                    () => {};
                                return(
                                    <Box sx={{ ...commonStyles, borderRadius: 5, cursor: 'pointer'}} 
                                             className="projectBoxInfo projectBoxTxt"
                                             onClick={onClickHandler}
                                    >
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
