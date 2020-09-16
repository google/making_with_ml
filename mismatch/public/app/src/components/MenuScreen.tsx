import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  AppBar,
  Toolbar,
  IconButton,
  makeStyles,
  Typography,
  Tabs,
  Tab,
  Box,
} from "@material-ui/core";
import { Close } from "@material-ui/icons";
import { StoresList } from "./StoresList";
import { SocialStreamList } from "./SocialStreamList";

const useStyles = makeStyles((theme) => ({}));

interface TabPanelProps {
  children: React.ReactNode;
  index: number;
  value: number;
}
function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`scrollable-auto-tabpanel-${index}`}
      aria-labelledby={`scrollable-auto-tab-${index}`}
    >
      {value === index && props.children}
    </div>
  );
}

export const MenuScreen = ({ userid }: { userid: string }) => {
  const classes = useStyles();
  const stores = [
    { name: "bloomingdales", logo: "link" },
    { name: "macys", logo: "link" },
  ];
  const socials = [{ name: "codergirl_", logo: "link" }];

  const [tab, setTab] = React.useState(0);

  return (
    <>
      <AppBar position="static" color="transparent">
        <Toolbar>
          <IconButton edge="start">
            <Close />
            <Typography variant="h6">Content Settings</Typography>
          </IconButton>
        </Toolbar>
      </AppBar>
      <Tabs
        variant="fullWidth"
        indicatorColor="primary"
        onChange={(_, newTab) => setTab(newTab)}
        value={tab}
      >
        <Tab label="Brands & Stores"></Tab>
        <Tab label="Instagram Accounts"></Tab>
      </Tabs>
      <TabPanel value={tab} index={0}>
        <StoresList stores={stores} />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <SocialStreamList socials={socials} />
      </TabPanel>
    </>
  );
};
