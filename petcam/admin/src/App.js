import "./App.css";
import withFirebaseAuth from "react-with-firebase-auth";
import firebase from "firebase/app";
import "firebase/auth";
import DiaryPage from "./DiaryPage.js";
import firebaseConfig from "./firebaseConfig";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core/styles";

console.log("Initializing");
firebase.initializeApp(firebaseConfig);
console.log("Done");

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
}));

function App(props) {
  const { user, signOut, signInWithGoogle } = props;
  const classes = useStyles();

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h11" className={classes.title}>
            {user ? user.uid : ""}
          </Typography>
          <Typography variant="h6" className={classes.title}>
            Pet Cam
          </Typography>
          <Button color="inherit" onClick={user ? signOut : signInWithGoogle}>
            {user ? "Logout" : "Login"}
          </Button>
        </Toolbar>
      </AppBar>
      <div className={classes.appContainer}>
        {user ? <DiaryPage user={user} camera={1} /> : <></>}
      </div>
    </div>
  );
}

export default withFirebaseAuth({
  providers,
  firebaseAppAuth,
})(App);
