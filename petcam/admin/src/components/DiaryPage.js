/**
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
