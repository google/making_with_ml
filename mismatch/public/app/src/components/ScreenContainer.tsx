import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  BottomNavigationAction,
  BottomNavigation,
  SvgIcon,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import MenuIcon from "@material-ui/icons/Menu";
import { MatchScreen } from "./MatchScreen";
import { ReactComponent as Hanger } from "../hanger.svg";
import { ReactComponent as SettingsSvg } from "../settings_icon.svg";
import { FavoriteBorderOutlined } from "@material-ui/icons";
import logo from "../logo.gif";
import { MenuScreen } from "./MenuScreen";

const useStyles = makeStyles((theme) => ({
  appBar: {},
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
  screen: {
    overflow: "auto",
    flex: 1,
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
  const [currentScreen, setCurrentScreen] = React.useState(0);

  const classes = useStyles();
  return (
    <>
      <div className={classes.screen}>
        {
          [
            <MatchScreen userid={props.userid} />,
            <MatchScreen userid={props.userid} />,
            <MenuScreen userid={props.userid} />
          ][currentScreen]
        }
      </div>
      <BottomNavigation
        showLabels
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
    </>
  );
};
