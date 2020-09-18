import React, { useEffect } from "react";
import { db, toFbThumbUrl } from "../firebase";
import { makeStyles, Chip, GridList, GridListTile, CircularProgress } from "@material-ui/core";
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
  itemTileImage: {
      height: "100%",
      objectFit: "cover"
  }
}));

/* This component is redundant... move when we figure out
a better fix for the image resizing thing */
const ClosetImage = ({item}: { item: FirestoreClosetItem}) => {
    const classes = useStyles();
    const [thumbUrl, setThumbUrl] = React.useState<string>("");
  
    useEffect(() => {
      toFbThumbUrl(item.url).then((thumbUrl: string) => {
        setThumbUrl(thumbUrl);
      });
    }, [item]);
    
    return (
      thumbUrl.length ? 
      <img 
        className={classes.itemTileImage}
        key={item.name}
        alt={item.name}
        src={thumbUrl}
      /> : <CircularProgress />
    );
  
  }

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
      // TODO: remove
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
                    <ClosetImage item={item}/>
                </GridListTile> : <></>
        ))}
      </GridList>
    </div>
  );
};