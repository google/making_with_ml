/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/accessible-emoji */
import React, { useEffect, useState } from "react";
import "./MatchScreen.css";
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
  nextFn: any;
  backFn: any;
}

const useStyles = makeStyles((theme) => ({
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
}));

const MatchCard = (props: MatchCardProps) => {
  const classes = useStyles();
  return (
    <>
      <div className="featuredImg">
        <img className="featuredImg" src={props.srcUrl} alt="Fashion pic" />
      </div>
      <div className="matchBar">
        <Typography color="primary" variant="h6">
          {props.matches.length} matching items found!
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
        >
          Favorite
        </Button>
      </div>
      <div className={classes.closetContainer}>
        <GridList cellHeight={180} className={classes.gridList}>
          {props.matches.map((match, i) => (
            <GridListTile>
                <img
                key={match.image}
                alt="match"
                src={match.imageUrl}
                />
            </GridListTile>
          ))}
        </GridList>
      </div>
    </>
  );
};

export const MatchScreen = ({ userid }: { userid: string }) => {
  const [pages, setPages] = useState<FirestoreMatchCard[]>([]);
  const [index, setIndex] = useState(0);

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

  let thisPage = pages.length ? pages[index] : null;
  console.log(`Page had score ${thisPage?.score}`);
  return (
    <div className="matchScreen">
      {thisPage ? (
        <MatchCard
          source="closet"
          backFn={() => {
            setIndex((index > 0 ? index - 1 : pages.length - 1) % pages.length);
          }}
          nextFn={() => {
            setIndex((index + 1) % pages.length);
          }}
          favorite={true}
          {...thisPage}
        />
      ) : (
        <CircularProgress />
      )}
    </div>
  );
};
