import React, {Component, useState, useEffect} from "react";
import NavBar from "../components/NavBar";
import BottomBar from "../components/BottomBar";
import Head from 'next/head';
import { VerticalTimeline, VerticalTimelineElement }  from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { FaDesktop, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import firebaseApp from '../helpers/firebase';
import {getFirestore, getDoc, doc } from 'firebase/firestore';

const Schedule = () => {
    const [scheduleData, setScheduleData] = useState([]);
    const defaultSheetId = "1Lj2CaL7vNqu3ZPXo0Gm6Ku8etHLUjv_XLsrVc1ziyBQ";
    const defaultSheetName = encodeURIComponent("Main");
    const db = getFirestore(firebaseApp)

    const fetchScheduleInfo = async () => {
        try {
            const scheduleDoc = await getDoc(doc(db, "sheets-schedule", "currentSchedule"));
            if (scheduleDoc.exists()) {
                const data = scheduleDoc.data();
                fillScheduleFromSheetInfo(data.sheetId, data.sheetName);
            } else {
                console.log("No such schedule!");
            }
        } catch (error) {
            console.error("Error fetching schedule data:", error);
        }
    };

    const fillScheduleFromSheetInfo = (sheetId, sheetName) => { //populates scheduleData based off csvText from Google Sheets
        const sheetURL = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
            fetch(sheetURL)
            .then(res => res.text())
            .then(csvText => fillScheduleFromCSV(csvText))
            .catch(err => console.log(err));
    }; 

    const fillScheduleFromCSV = (csvText) => {
        const schedule = []
        const rows = csvText.split('\n');
        for(let i=1; i<rows.length; i++){
            const values = getArrayFromRow(rows[i]);
            if(!values[2] || values[3] == "N/A" || values[4] == "N/A") //skip if no meeting
                continue;
            if(values[3].substring(values[3].length-3) == "EST")
                values[3] = values[3].substring(0, values[3].length-3);
            if(values[4].toUpperCase() == "TBD")
                values[4] = "Location: TBD";
            const eventObj = {
                "title": values[2],
                "datetime": values[1] + ": " + values[3],
                "location": values[4],
            }
            schedule.push(eventObj);
        }
        setScheduleData(schedule);
    };

    const getArrayFromRow = (row) => {
        const regex = /"(.*?)"/g; //regex to match values inside double quotes
        const matches = row.match(regex); //return array of matches
        return matches.map(value => value.replace(/^"(.*)"$/, '$1')); // Remove quotes around values
    };


    //fillScheduleFromSheetInfo(defaultSheetId, defaultSheetName);
    useEffect(() => {
        fetchScheduleInfo();
    }, [db]);

    return(
        <div>
            <Head>
                <title>Schedule | GT WebDev</title>
            </Head>
            <NavBar />
            <VerticalTimeline>
            {scheduleData.map((cur, ind) => {
                const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cur.location)}`;
                   return(
                    <VerticalTimelineElement
                        className="vertical-timeline-element--work"
                        contentStyle={{ background: '#f0cd42', color: '#222220' }}
                        contentArrowStyle={{ borderRight: '7px solid #f0cd42' }}
                        date=""
                        iconStyle={{ background: 'rgb(60, 60, 57)', color: '#fff' }}
                        icon = {< FaDesktop />}
                        >
                        <h3 className="vertical-timeline-element-title"> {cur.title} </h3>
                        <div className="vertical-timeline-element-subtitle" style={{marginTop: '12px'}}>  
                            <FaClock style={{ fontSize: '15px', marginRight: '6px' }} />
                            <span>{cur.datetime}</span>
                        </div>
                        <div className="vertical-timeline-element-subtitle" style={{marginTop: '3px'}}> 
                            <a href={googleMapsUrl} target="_blank">
                                <FaMapMarkerAlt style={{ fontSize: '17px', margin: '0 6 0 -1'}} />
                                <span>{cur.location}</span>
                            </a>
                        </div>
                        
                    </VerticalTimelineElement>
                   )
               })}

            </VerticalTimeline>
            
            <BottomBar />
        </div>
    )
}

export default Schedule;
