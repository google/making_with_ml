import React from 'react';
import './App.css';
import './components/MatchScreen';
import { MatchScreen } from './components/MatchScreen';
import { AppBar, Toolbar, IconButton, Typography, BottomNavigation, BottomNavigationAction, SvgIcon } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import MenuIcon from '@material-ui/icons/Menu';
import logo from './logo.gif';
import { ReactComponent as Hanger } from './hanger.svg';
import { FavoriteBorderOutlined } from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  app: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    width: "100vw"
  },
  appBar: {
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
  screen: {
    overflow: "auto",
    flex: 1,
  },
  logo: {
    height: 35,
    marginRight: 5
  }
}));

export default function App(){
  const classes = useStyles();

  return (
    <div className={classes.app}>
      <AppBar color="transparent" position="static" className={classes.appBar}>
        <Toolbar>
            <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
              <MenuIcon/>
            </IconButton>
            <div className={classes.title}>
              <img src={logo} alt="android logo" className={classes.logo}></img>
              <Typography variant="h6">
                AiStylist
              </Typography>
            </div>
        </Toolbar>
      </AppBar>
      <div className={classes.screen}>
        <MatchScreen userid="alovelace"/>
      </div>
      <BottomNavigation showLabels>
        <BottomNavigationAction label="Matches" icon={<FavoriteBorderOutlined/ >}></BottomNavigationAction>
        <BottomNavigationAction label="Closet" icon={
            <SvgIcon>
              <Hanger/>
            </SvgIcon>
        }></BottomNavigationAction>
      </BottomNavigation>
    </div>
  );
}