/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/accessible-emoji */
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  CircularProgress,
  Typography,
  Button,
  makeStyles,
  GridListTile,
  SvgIcon,
} from "@material-ui/core";
import { StarBorderOutlined, Star } from "@material-ui/icons";
import { ReactComponent as Hanger } from "../hanger.svg";
import yellow from "@material-ui/core/colors/yellow";
import GridList from "@material-ui/core/GridList";
import SwipeableViews from 'react-swipeable-views';

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
    backgroundColor: theme.palette.background.paper,
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
    zIndex: -1
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
    filter: "drop-shadow(0 0 5px rgba(0, 0, 0, 0.3))",
    color: theme.palette.primary.contrastText
  },
  matchTile: {
    "& .MuiGridListTile-tile": {
      borderRadius: 5,
      overflow: "hidden",
    }
  },
  matchTileImage: {
    display: "block",
    width: "100%",
  },
  favorite: {
    width: 100
  }
  
}));

const MatchCard = (props: MatchCardProps) => {

  const classes = useStyles();
  return (
    <div className={classes.matchCard}>
      <div className={classes.featuredImgCard}>
        <img className={classes.featuredImg} alt="featured style" src={props.srcUrl}/>
        <div className={classes.matchBar}>
          <Typography variant="h6">
            {props.matches.length} Matches found!
          </Typography>
          <div className={classes.favorite} onClick={props.toggleSavedFn}>
            <SvgIcon htmlColor={props.favorite ? "#eddd09" : ""}>
              <Hanger />
            </SvgIcon>
            <Typography>{props.favorite ? "Saved" : "Save look"}</Typography>
          </div>
        </div>
      </div>
      <div className={classes.closetContainer}>
        <GridList spacing={10} cellHeight={180} className={classes.gridList}>
          {props.matches.map((match, i) => (
            <GridListTile className={classes.matchTile}>
                  <img 
                  className={classes.matchTileImage}
                  key={match.image}
                  alt="match"
                  src={match.imageUrl}
                  />
            </GridListTile>
          ))}
        </GridList>
      </div>
    </div>
  );
};

export const MatchScreen = ({ userid }: { userid: string}) => {

  const [pages, setPages] = useState<FirestoreMatchCard[]>([]);
  const [favorites, setFavorites] = useState<{[key: string]: boolean}>({});

  const toggleSavedFn = (srcId: string) => {
    setFavorites({...favorites, [srcId]: !favorites[srcId]});
  }

  useEffect(() => {
    let pages = db
      .collection("users")
      .doc(userid)
      .collection("outfits")
      .orderBy("score", "desc")
      .limit(10);
    let matchCards: FirestoreMatchCard[] = [];
    pages.get().then((snapshot) => {
      snapshot.forEach((doc) => {
        let fsMatchCardProps = doc.data() as FirestoreMatchCard;
        matchCards.push(fsMatchCardProps);
      });
      setPages(matchCards);
    });
    console.log("Ran use effect and favorites is ");
    console.log(favorites[0])
  }, [userid]);

  let thisPage = pages.length ? pages[0] : null;
  console.log(`Page had score ${thisPage?.score}`);
  console.log(`Favorites is `, favorites);
  return (
    <div>
      {thisPage ? (
        <SwipeableViews enableMouseEvents>
            {
                pages.map((page, i) => (
                    <MatchCard
                    key={page.srcId}
                    source="closet"
                    favorite={favorites[page.srcId] as boolean}
                    toggleSavedFn={() => toggleSavedFn(page.srcId)}
                    {...page}
                    />
                ))
            }
        </SwipeableViews>
      ) : (
        <CircularProgress />
      )}
    </div>
  );
};
