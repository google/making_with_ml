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
import { BrandsList } from "./BrandsList";
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

interface FirestoreSocialAcct {
  name: string;
  logo: string;
}

interface FirestoreBrand {
    name: string;
    logo: string;
}

export const MenuScreen = ({ userid }: { userid: string }) => {
  const classes = useStyles();
  const [socials, setSocials] = useState<FirestoreSocialAcct[]>([]);
  const [brands, setBrands] = useState<FirestoreBrand[]>([]);

  useEffect(() => {
    /* Load social accounts from db */
    let fsSocials: FirestoreSocialAcct[] = [];
    let fsSocialDb = db.collection("users").doc(userid).collection("socials");
    fsSocialDb.get().then((snapshot) => {
      snapshot.forEach((doc) => {
        let socialAcct = doc.data() as FirestoreSocialAcct;
        fsSocials.push(socialAcct);
      });
      setSocials(fsSocials);
    });

    /* Load brands from db */
    let fsBrands: FirestoreBrand[] = [];
    let fsBrandsDb = db.collection("users").doc(userid).collection("brands");
    fsBrandsDb.get().then((snapshot) => {
      snapshot.forEach((doc) => {
        let brand = doc.data() as FirestoreBrand;
        fsBrands.push(brand);
      });
      setBrands(fsBrands);
    });

  }, [userid]);

  const [tab, setTab] = React.useState(0);

  return (
    <>
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
        <BrandsList brands={brands} />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <SocialStreamList socials={socials} />
      </TabPanel>
    </>
  );
};
