import React, { Component } from 'react';
import Board from 'react-ui-kanban';
import AdminNavBar from "../components/AdminNavBar";
import Head from 'next/head'
import { Select, MenuItem, FormControl, InputLabel } from "@mui/material";

function sortMembersPage() {

    const data = {
        lanes: [
            {
                id: 'lane1',
                title: 'Project 1',
                style: { display: "flex" },
                cards: [
                    {id: 'card1', title: 'Applicant 1', description: '...', label: '...'},
                    {id: 'card2', title: 'Applicant 2', description: '...', label: '...'}
                ]
            },
            {
                id: 'lane2',
                title: 'Project 2',
                style: { display: "flex" },
                cards: [
                    {id: 'card3', title: 'Applicant 3', description: '...', label: '...'},
                    {id: 'card4', title: 'Applicant 4', description: '...', label: '...'}
                ]
            },
            {
                id: 'lane3',
                title: 'Project 3',
                style: { display: "flex" },
                cards: [
                    {id: 'card3', title: 'Applicant 3', description: '...', label: '...'},
                    {id: 'card4', title: 'Applicant 4', description: '...', label: '...'}
                ]
            },
            {
                id: 'lane4',
                title: 'Rejected',
                style: { backgroundColor: '#F08080', display: "flex" },
                cards: [
                    {id: 'card5', title: 'Applicant 5', description: '...', label: '...'},
                    {id: 'card6', title: 'Applicant 6', description: '...', label: '...'}
                ]
            }
        ]
    }

    return (
        <div>
            <Head>
                <title>Sort Members Page</title>
            </Head>
            <AdminNavBar />
            <h1 style={{margin: '10px'}}>Sort Members</h1>
            <div style={{display: 'relative', width: '90%', margin: 'auto'}}>
                <FormControl>
                    <InputLabel id="select-label">Semester</InputLabel>
                    <Select labelId="select-label" label="Semester" style={{marginBottom: '10px', width: "200px"}}>
                        <MenuItem>Fall 2023</MenuItem>
                        <MenuItem>Spring 2023</MenuItem>
                    </Select>
                </FormControl>
                <div>
                    <Board data={data} draggable="true" style={{width: "100%", display: "flex", flexWrap: "wrap", backgroundColor: 'gray'}}></Board>
                </div>
            </div>
        </div>
    )
}

export default sortMembersPage;