import React, { useEffect, useState } from "react";
import { makeStyles, List, ListItem, ListItemText } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({

}));

interface SocialFeed {
    name: string;
    logo: string;
};

interface SocialStreamListProps {
     socials: SocialFeed[];
};

export const SocialStreamList = (props: SocialStreamListProps) => {
    
    return (
        <List>
            {
                props.socials.map((social: SocialFeed) => (
                    <ListItem>
                        <ListItemText primary={social.name} />
                    </ListItem>
                ))
            }
        </List>
    );
}