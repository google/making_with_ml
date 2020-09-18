import React, { useEffect } from "react";
import { db } from "../firebase";
import { makeStyles, Chip, GridList, GridListTile } from "@material-ui/core";
import { Check } from "@material-ui/icons";

interface FirestoreClosetItem {
  name: string;
  url: string;
  type: string;
}

const useStyles = makeStyles((theme) => ({
  closetScreen: {

  },
  chipBar: {
    display: "flex",
    justifyContent: "flex-start",
    "& > *": {
      margin: theme.spacing(0.5),
      borderRadius: 11,
    },
    width: "100%",
    overflow: "auto",
    padding: "10px 0"
  },
  gridList: {
      width: "100%"
  },
  itemTile: {},
  itemTileImage: {}
}));

export const ClosetScreen = ({ userid }: { userid: string }) => {
  const [items, setItems] = React.useState<FirestoreClosetItem[]>([]);
  const [labels, setLabels] = React.useState<{ [key: string]: boolean }>({});

  const classes = useStyles();

  useEffect(() => {
    let closet = db.collection("users").doc(userid).collection("closet");
    let fsItems: FirestoreClosetItem[] = [];
    closet.get().then((snapshot) => {
      snapshot.forEach((doc) => {
        let fsItem = doc.data() as FirestoreClosetItem;
        fsItems.push(fsItem);
      });
      setItems(fsItems);

      const labels: { [key: string]: boolean } = {};
      fsItems.forEach((item) => {
        labels[item.type] = false;
      });
      labels['jacket'] = true;
      setLabels(labels);
    });
  }, [userid]);

  const selectLabel = (label: string) => {
    setLabels({ ...labels, [label]: !labels[label] });
  };

  return (
    <div className={classes.closetScreen}>
      <div className={classes.chipBar}>
        {Object.keys(labels).map((label) => (
          <Chip
            key={label}
            color={labels[label] ? "primary" : "default"}
            variant={labels[label] ? "default" : "outlined"}
            size="medium"
            label={label}
            icon={labels[label] ? <Check /> : <></>}
            onClick={() => selectLabel(label)}
          />
        ))}
      </div>
      <GridList cols={3} className={classes.gridList}>
        {items.map((item, _) => (
                labels[item.type] ? 
                <GridListTile className={classes.itemTile}>
                    <img
                    className={classes.itemTileImage}
                    key={item.name}
                    alt={item.name}
                    src={item.url}
                    />
                </GridListTile> : <></>
        ))}
      </GridList>
    </div>
  );
};