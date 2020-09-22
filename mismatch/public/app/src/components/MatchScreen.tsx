/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/accessible-emoji */
import React, { useEffect, useState } from "react";
import { db, toFbThumbUrl } from "../firebase";
import {
  CircularProgress,
  Typography,
  makeStyles,
  GridListTile,
  SvgIcon,
} from "@material-ui/core";
import { ReactComponent as Hanger } from "../hanger.svg";
import GridList from "@material-ui/core/GridList";
import SwipeableViews from "react-swipeable-views";
import { useColor } from "color-thief-react";
import logo from "../logo.png";
import { ReactComponent as Ailogo } from "../ailogo.svg";

interface ProductMatch {
  image: string;
  imageUrl: string;
  label: string;
  name: string;
  score: number;
}

interface FirestoreMatchCard {
  matches: ProductMatch[];
  score: number;
  srcId: string;
  srcUri: string;
  srcUrl: string;
  favorite?: boolean;
}
interface MatchCardProps extends FirestoreMatchCard {
  source: string;
  toggleSavedFn: () => void;
}

const useStyles = makeStyles((theme) => ({
  logoImage: {
    width: 42,
    marginLeft: 16,
    marginTop: 10,
    position: "absolute",
    zIndex: 1
  },
  matchCard: {
    padding: 20,
    minHeight: "calc(100vh - 56px)",
  },
  gridList: {
    width: 500,
  },
  closetContainer: {
    width: "100%",
    display: "flex",
    flexWrap: "wrap",
    overflow: "hidden",
    justifyContent: "space-around",
  },
  featuredImgCard: {
    position: "relative",
    borderRadius: 5,
    overflow: "hidden",
    boxShadow: theme.shadows[4],
    marginBottom: 10,
  },
  featuredImg: {
    width: "100%",
    display: "block",
    zIndex: -1,
  },
  matchBar: {
    padding: "10px 10px",
    width: "100%",
    textAlign: "center",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    filter: "drop-shadow(0 0 3px rgba(0, 0, 0, 0.5))",
    color: theme.palette.primary.contrastText,
  },
  matchTile: {
    "& .MuiGridListTile-tile": {
      borderRadius: 5,
      overflow: "hidden",
    },
  },
  matchTileImage: {
    display: "block",
    width: "100%",
  },
  favorite: {
    width: 100,
  },
  saveAnimation: {
    animation: "$hanger-save-animation 400ms linear 1",
    transformOrigin: "top center",
  },
  "@keyframes hanger-save-animation": {
    "0%, 100%": {
      transform: "rotate(0deg)",
    },
    "25%, 75%": {
      transform: "rotate(-15deg)",
    },
    "50%": {
      transform: "rotate(15deg)",
    },
  },
}));

const ClosetImage = ({ url }: { url: string }) => {
  const classes = useStyles();
  const [thumbUrl, setThumbUrl] = React.useState<string>("");

  useEffect(() => {
    toFbThumbUrl(url).then((thumbUrl: string) => {
      setThumbUrl(thumbUrl);
    });
  }, [url]);

  return thumbUrl.length ? (
    <img
      className={classes.matchTileImage}
      key={url}
      alt="match"
      src={thumbUrl}
    />
  ) : (
    <CircularProgress />
  );
};
declare const window: any;
const MatchCard = (props: MatchCardProps) => {
  const [fbFtImage, setFbFtImage] = React.useState<string>("");
  const classes = useStyles();

  useEffect(() => {
    /* First, get the (smol) image url from Firebase */
    toFbThumbUrl(props.srcUrl).then((url) => {
      setFbFtImage(url || "");
    });
  }, [props.srcUrl]);

  const { data, loading, error } = useColor(fbFtImage, "hex", {
    crossOrigin: "Anonymous",
  });
  return (
    <div
      className={classes.matchCard}
      style={{ backgroundColor: loading || error ? "0" : data }}
    >
      <div className={classes.featuredImgCard} >
        <Ailogo className={classes.logoImage}></Ailogo>
        <img
          className={classes.featuredImg}
          alt="featured style"
          src={props.srcUrl}
        />
        <div className={classes.matchBar}>
          <Typography variant="h6">
            {props.matches.length} Matches found!
          </Typography>
          <div className={classes.favorite} onClick={props.toggleSavedFn}>
            <SvgIcon
              viewBox="0 0 100 64.941"
              className={props.favorite ? classes.saveAnimation : ""}
              htmlColor={props.favorite ? "#eddd09" : ""}
              component={Hanger}
            ></SvgIcon>
            <Typography>{props.favorite ? "Saved!" : "Save look"}</Typography>
          </div>
        </div>
      </div>
      <div className={classes.closetContainer}>
        <GridList spacing={10} cellHeight={180} className={classes.gridList}>
          {props.matches.map((match, i) => (
            <GridListTile key={match.imageUrl} className={classes.matchTile}>
              <ClosetImage url={match.imageUrl} />
            </GridListTile>
          ))}
        </GridList>
      </div>
    </div>
  );
};

export const MatchScreen = ({ userid }: { userid: string }) => {
  const [pages, setPages] = useState<FirestoreMatchCard[]>([]);
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});

  const toggleSavedFn = (srcId: string) => {
    setFavorites({ ...favorites, [srcId]: !favorites[srcId] });
  };

  useEffect(() => {
    let pages = db
      .collection("users")
      .doc(userid)
      .collection("outfitsv5")
      .orderBy("daleScore", "asc")
      // .orderBy("score2", "desc")
      .limit(30);
    let matchCards: FirestoreMatchCard[] = [];
    pages.get().then((snapshot) => {
      snapshot.forEach((doc) => {
        let fsMatchCardProps = doc.data() as FirestoreMatchCard;
        matchCards.push(fsMatchCardProps);
      });
      setPages(matchCards);
    });
  }, [userid]);

  let thisPage = pages.length ? pages[0] : null;
  return (
    <div>
      {thisPage ? (
        <SwipeableViews enableMouseEvents>
          {pages.map((page, i) => (
            <MatchCard
              key={page.srcId}
              source="closet"
              favorite={favorites[page.srcId] as boolean}
              toggleSavedFn={() => toggleSavedFn(page.srcId)}
              {...page}
            />
          ))}
        </SwipeableViews>
      ) : (
        <CircularProgress />
      )}
    </div>
  );
};
