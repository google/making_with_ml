import { makeStyles } from "@material-ui/core";
import React from "react";

const useStyles = makeStyles((theme) => ({
  iframe: {
    width: "100%",
    height: "100vh",
  },
}));

function CameraPage(props) {
  const classes = useStyles();
  return (
    <iframe
      title={"Pet Camera"}
      className={classes.iframe}
      src={process.env.PUBLIC_URL + "/camera.html"}
    />
  );
}

export default CameraPage;
