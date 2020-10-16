import React, { useEffect } from "react";
import {
  BottomNavigationAction,
  BottomNavigation,
  SvgIcon,
} from "@material-ui/core";
import TuneIcon from '@material-ui/icons/Tune';
import { makeStyles } from "@material-ui/core/styles";
import { MatchScreen } from "./MatchScreen";
import { ClosetScreen } from "./ClosetScreen";
import { ReactComponent as Hanger } from "../hanger.svg";
// import { ReactComponent as SettingsSvg } from "../settings.svg";
import { FavoriteBorderOutlined } from "@material-ui/icons";
import { MenuScreen } from "./MenuScreen";

const useStyles = makeStyles((theme) => ({
  "@global": {
    body: {
      background: "#FAFAFA",
    },
  },
  appBar: {},
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
  },
  innerRoot: {
    flexDirection: "column",
    display: "flex",
    position: "relative",
    maxWidth: 460,
    maxHeight: 800,
    width: "100%",
    height: "100%",
    background: "#FFF",
    boxShadow: theme.shadows[4],
    overflow: "hidden",
  },
  thisScreen: {
    flex: 1,
    overflow: "auto",
    paddingBottom: 56,
  },
  bottomNav: {
    position: "absolute",
    width: "100%",
    bottom: 0,
    left: 0,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
}));

interface ScreenContainerProps {
  userid: string;
}

export const ScreenContainer = (props: ScreenContainerProps) => {
  const [currentScreen, setCurrentScreen] = React.useState(0);
  const [windowHeight, setWindowHeight] = React.useState(0);

  useEffect(() => {
    const getWindowHeight = () => {
      setWindowHeight(window.innerHeight);
    };
    getWindowHeight();

    window.addEventListener("resize", getWindowHeight);
    window.addEventListener("orientationchange", getWindowHeight);

    return () => {
      window.removeEventListener("resize", getWindowHeight);
      window.removeEventListener("orientationchange", getWindowHeight);
    };
  }, []);

  const classes = useStyles();
  return (
    <div className={classes.root} style={{ height: windowHeight }}>
      <div className={classes.innerRoot}>
        <div className={classes.thisScreen}>
          {
            [
              <MatchScreen userid={props.userid} />,
              <ClosetScreen userid={props.userid} />,
              <MenuScreen userid={props.userid} />,
            ][currentScreen]
          }
        </div>
        <BottomNavigation
          showLabels
          className={classes.bottomNav}
          value={currentScreen}
          onChange={(_, newValue) => {
            setCurrentScreen(newValue);
          }}
        >
          <BottomNavigationAction
            label="Matches"
            icon={<FavoriteBorderOutlined />}
          ></BottomNavigationAction>
          <BottomNavigationAction
            label="Closet"
            icon={
              <SvgIcon>
                <Hanger />
              </SvgIcon>
            }
          ></BottomNavigationAction>
          <BottomNavigationAction
            label="Settings"
            icon={<TuneIcon />}
          ></BottomNavigationAction>
        </BottomNavigation>
      </div>
    </div>
  );
};
