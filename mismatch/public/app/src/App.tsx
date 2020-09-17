import React from 'react';
import './App.css';
import './components/MatchScreen';
import { makeStyles } from '@material-ui/core/styles';
import { ScreenContainer } from './components/ScreenContainer';
import { MenuScreen } from './components/MenuScreen';

const useStyles = makeStyles((theme) => ({
  app: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    width: "100vw"
  },
}));

export default function App(){
  const classes = useStyles();
  return (
    <div className={classes.app}>
      <ScreenContainer userid="alovelace"/>
    </div>
  );
}