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
} from "@material-ui/core";
import { StarBorderOutlined, Star } from "@material-ui/icons";
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
  saveMatchFn: (matchId: string) => void;
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
          <Button
            variant={"outlined"}
            color="primary"
            startIcon={
              props.favorite ? (
                <Star style={{ color: yellow[700] }} />
              ) : (
                <StarBorderOutlined />
              )
            }
            onClick={() => { props.saveMatchFn(props.srcId)}}
          >
            Favorite
          </Button>
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

  const saveMatchFn = (matchId: string) => {
    alert("Saved match");
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
  }, [userid]);

  let thisPage = pages.length ? pages[0] : null;
  console.log(`Page had score ${thisPage?.score}`);

  return (
    <div>
      {thisPage ? (
        <SwipeableViews enableMouseEvents>
            {
                pages.map((page, i) => (
                    <MatchCard
                    source="closet"
                    favorite={page.favorite}
                    saveMatchFn={saveMatchFn}
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
