import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";
import DiaryEntry from "./DiaryEntry";

const useStyles = makeStyles({
  diaryPage: {
    width: "100vw",
    maxWidth: 600,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    padding: 30,
  },
});

function DiaryPage(props) {
  const { user } = props;
  const classes = useStyles();
  const [diaryList, setDiaryList] = useState([]);

  useEffect(() => {
    const db = firebase.firestore();
    //TODO: Filter by camera
    db.collection("users").doc(user.uid).collection("events").onSnapshot((snapshot) => {
        let data = [];
        snapshot.forEach((doc) => {
            data.push(doc.data());
        });
        data = data.sort((a, b) => b.dateTime - a.dateTime);
        setDiaryList(data);
    }, (err) => {
        console.log(`Err: ${err}`)
    });
  }, [user, setDiaryList]);

  return (
    <div className={classes.diaryPage}>
      {diaryList &&
        diaryList.map((row) => (
          <DiaryEntry
            key={row.dateTime}
            {...row}
            userId={user.uid}
          ></DiaryEntry>
        ))}
    </div>
  );
}

export default DiaryPage;
