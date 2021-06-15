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

import "./App.css";
import withFirebaseAuth from "react-with-firebase-auth";
import firebase from "firebase/app";
import "firebase/auth";
import DiaryPage from "./components/DiaryPage.js";
import firebaseConfig from "./firebaseConfig";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";
import { IconButton, Link, Menu, MenuItem } from "@material-ui/core";
import { AccountCircle } from "@material-ui/icons";
import CameraEnhanceIcon from "@material-ui/icons/CameraEnhance";

firebase.initializeApp(firebaseConfig);

// Enable Google-based auth login
const firebaseAppAuth = firebase.auth();
const providers = {
  googleProvider: new firebase.auth.GoogleAuthProvider(),
};

const useStyles = makeStyles((theme) => ({
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  appContainer: {
    display: "flex",
    justifyContent: "center",
  },
  bottomNav: {
    width: "100%",
    position: "fixed",
    bottom: 0,
  },
}));

function App(props) {
  const { user, signOut, signInWithGoogle } = props;
  const classes = useStyles();

  // For handling the profile menu
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleLoginClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    setAnchorEl(null);
    signOut();
  };

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" className={classes.title}>
            Pet Cam
          </Typography>
          {user ? (
            <>
              <Link href={process.env.PUBLIC_URL + "/camera.html"} target="_blank" rel="noreferrer" color="inherit">
                <IconButton
                  edge="end"
                  aria-controls="simple-menu"
                  aria-haspopup="true"
                  color="inherit"
                >
                  <CameraEnhanceIcon />
                </IconButton>
              </Link>
              <IconButton
                edge="end"
                aria-controls="simple-menu"
                aria-haspopup="true"
                onClick={handleLoginClick}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
              <Menu
                id="simple-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <Button color="inherit" onClick={signInWithGoogle}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <div className={classes.appContainer}>
        {user && <DiaryPage user={user} camera={1} />}
      </div>
    </div>
  );
}

export default withFirebaseAuth({
  providers,
  firebaseAppAuth,
})(App);
