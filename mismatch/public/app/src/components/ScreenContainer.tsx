import React, {  } from "react";
import {
  BottomNavigationAction,
  BottomNavigation,
  SvgIcon,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { MatchScreen } from "./MatchScreen";
import { ClosetScreen } from "./ClosetScreen";
import { ReactComponent as Hanger } from "../hanger.svg";
import { ReactComponent as SettingsSvg } from "../settings_icon.svg";
import { FavoriteBorderOutlined } from "@material-ui/icons";
import { MenuScreen } from "./MenuScreen";

const useStyles = makeStyles((theme) => ({
  appBar: {},
  root: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  thisScreen: {
    flex: "1",
    overflow: "auto"
  },
  bottomNav: {
    position: "fixed",
    width: "100%",
    bottom: 0
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    display: "flex",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 64,
    color: theme.palette.primary.main,
  },
  logo: {
    height: 35,
    marginRight: 5,
  },
}));

interface ScreenContainerProps {
  userid: string;
}

export const ScreenContainer = (props: ScreenContainerProps) => {
  const [currentScreen, setCurrentScreen] = React.useState(1);

  const classes = useStyles();
  return (
    <div className={classes.root}>
      <div className={classes.thisScreen}>
        {
          [
            <MatchScreen userid={props.userid} />,
            <ClosetScreen userid={props.userid} />,
            <MenuScreen userid={props.userid} />
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
          icon={
            <SvgIcon>
              <SettingsSvg />
            </SvgIcon>
          }
        ></BottomNavigationAction>
      </BottomNavigation>
    </div>
  );
};
