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
import CameraAltIcon from '@material-ui/icons/CameraAlt';
import { ReactComponent as Hanger } from "../hanger.svg";
import GridList from "@material-ui/core/GridList";
import SwipeableViews from "react-swipeable-views";
import { useColor } from "color-thief-react";

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
  matchCard: {
    padding: 20,
    transition: "background-color 200ms ease",
  },
  screenSpinner: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
  },
  gridList: {
    flexWrap: "nowrap",
    // Promote the list into his own layer on Chrome. This cost memory but helps keeping high FPS.
    transform: "translateZ(0)",
  },
  closetContainer: {
    width: "100%",
    display: "flex",
    flexWrap: "wrap",
    overflow: "auto",
    justifyContent: "space-around",
  },
  featuredImgCard: {
    position: "relative",
    borderRadius: 5,
    overflow: "hidden",
    boxShadow: theme.shadows[4],
    marginBottom: 10,
  },
  socialTag: {
    position: "absolute",
    display: "flex",
    alignItems: "center",
    zIndex: 1,
    paddingLeft: 17,
    paddingTop: 10,
    color: theme.palette.primary.contrastText,
    fontSize: 16,
    fontWeight: 500,
    letterSpacing: 0.8,
    filter: "drop-shadow(0 0 2px rgba(0, 0, 0, 0.8))",
    "& .MuiSvgIcon-root": {
      marginRight: 5
    },
  },
  featuredImg: {
    width: "100%",
    display: "block",
    zIndex: -1,
  },
  matchBar: {
    padding: 15,
    width: "100%",
    textAlign: "center",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    position: "absolute",
    bottom: 0,
    left: 0,
    filter: "drop-shadow(0 0 2px rgba(0, 0, 0, 0.8))",
    color: theme.palette.primary.contrastText,

    "& .MuiTypography-root": {
      fontSize: 16,
      fontWeight: 500,
      letterSpacing: 0.8,
    },
  },
  matchTile: {
    "& .MuiGridListTile-tile": {
      borderRadius: 5,
      overflow: "hidden",
    },
  },
  matchTileImage: {},
  favorite: {
    "& .MuiSvgIcon-root": {
      fontSize: 36,
    },
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

const ClosetImage = ({ url, style }: { url: string, style?: any }) => {
  const classes = useStyles();
  const [thumbUrl, setThumbUrl] = React.useState<string>("");

  useEffect(() => {
    toFbThumbUrl(url).then((thumbUrl: string) => {
      setThumbUrl(thumbUrl);
    });
  }, [url]);

  return (
    <GridListTile key={url} className={classes.matchTile} style={style}>
      {thumbUrl.length ? (
        <img
          className={classes.matchTileImage}
          key={url}
          alt="match"
          src={thumbUrl}
          draggable={false}
        />
      ) : (
        <CircularProgress />
      )}
    </GridListTile>
  );
};

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
      <div className={classes.socialTag}>
        <CameraAltIcon />
        <Typography variant="subtitle1">@codergirl_</Typography>
      </div>
      <div className={classes.featuredImgCard}>
        <img
          className={classes.featuredImg}
          alt="featured style"
          src={props.srcUrl}
          draggable={false}
        />
        <div className={classes.matchBar}>
          <Typography variant="subtitle1">
            {props.matches.length} Matches found!
          </Typography>
          <div className={classes.favorite} onClick={props.toggleSavedFn}>
            <SvgIcon
              viewBox="0 0 100 64.941"
              className={props.favorite ? classes.saveAnimation : ""}
              htmlColor={props.favorite ? "#eddd09" : ""}
              component={Hanger}
            ></SvgIcon>
            <Typography variant="subtitle1">{props.favorite ? "Saved!" : "Save look"}</Typography>
          </div>
        </div>
      </div>
      <div className={classes.closetContainer}>
        <GridList
          spacing={10}
          cellHeight={180}
          cols={props.matches.length > 2 ? 2.5 : 2}
          className={classes.gridList}
        >
          {props.matches.map((match, i) => (
            <ClosetImage url={match.imageUrl} />
          ))}
        </GridList>
      </div>
    </div>
  );
};

export const MatchScreen = ({ userid }: { userid: string }) => {
  const classes = useStyles()
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
        <div className={classes.screenSpinner}>
        <CircularProgress />
        </div>
      )}
    </div>
  );
};
