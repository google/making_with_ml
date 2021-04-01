/* eslint-disable jsx-a11y/alt-text */
import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import firebase from "firebase/app";
import "firebase/storage";

const useStyles = makeStyles({
    diaryEntry: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        marginBottom: 25,
        padding: 12,
        borderRadius: 3,
        boxShadow: "0 1px 6px 0 rgb(0 0 0 / 20%)",
    },
    image: {
        width: "100%",
    },
    eventText: {
        margin: 0,
        padding: 0
    }
  });
  
function DiaryEntry(props) {
    const classes = useStyles();

    const {imgId, userId} = props;
    const [imgUrl, setImgUrl] = useState();
  
    useEffect(() => {
      var storage = firebase.storage();
      storage.ref(`users/${userId}/${imgId}`).getDownloadURL().then((url) => {
          setImgUrl(url);
      });
    }, [imgId, userId]);
  
    const events = props.eventData;

    return (
        <div className={classes.diaryEntry}>
           {imgUrl && <img className={classes.image} src={imgUrl} />}
           <h3>
               {new Date(props.dateTime).toLocaleString("en-US")}
           </h3>
           <h4>Events:</h4>
           {events.map((event, i) => {
               return (<p className={classes.eventText} key={i}>{event.eventType}</p>);
           })}
        </div>
    );
}

export default DiaryEntry;