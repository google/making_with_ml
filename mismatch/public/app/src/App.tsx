import React from 'react';
import './App.css';
import './components/MatchScreen';
import { ScreenContainer } from './components/ScreenContainer';
import { FullScreen, useFullScreenHandle } from "react-full-screen";

export default function App() {
  const handle = useFullScreenHandle();
  return (
    <ScreenContainer userid="alovelace"/>
  );
}