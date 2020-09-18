import React from 'react';
import './App.css';
import './components/MatchScreen';
import { makeStyles } from '@material-ui/core/styles';
import { ScreenContainer } from './components/ScreenContainer';
import { MenuScreen } from './components/MenuScreen';

const useStyles = makeStyles((theme) => ({
}));

export default function App(){
  const classes = useStyles();
  return (
    <ScreenContainer userid="alovelace"/>
  );
}