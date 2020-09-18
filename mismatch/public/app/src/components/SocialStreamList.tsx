import React, {  } from "react";
import { List, ListItem, ListItemText } from "@material-ui/core";


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