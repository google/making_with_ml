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
import { FavoriteBorderOutlined } from "@material-ui/icons";
import logo from "../logo.gif";

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
};

export const ScreenContainer = (props: ScreenContainerProps) => {
  const classes = useStyles();
  return (
    <>
      <AppBar color="transparent" position="static" className={classes.appBar}>
        <Toolbar>
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="menu"
          >
            <MenuIcon />
          </IconButton>
          <div className={classes.title}>
            <img src={logo} alt="android logo" className={classes.logo}></img>
            <Typography variant="h6">AiStylist</Typography>
          </div>
        </Toolbar>
      </AppBar>
      <div className={classes.screen}>
        <MatchScreen userid={props.userid} />
      </div>
      <BottomNavigation showLabels>
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
      </BottomNavigation>
    </>
  );
};
