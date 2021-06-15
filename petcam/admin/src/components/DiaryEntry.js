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

    const {userId, img} = props;
    const [imgUrl, setImgUrl] = useState();
  
    useEffect(() => {
      var storage = firebase.storage();
      storage.ref(img).getDownloadURL().then((url) => {
          setImgUrl(url);
      }).catch((error) => {
        console.log(error);
      });
    }, [img, userId]);
  
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