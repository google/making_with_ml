import React, { useEffect, useState } from "react";
import { makeStyles, List, ListItem, ListItemText } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({

}));

interface StoreItem {
    name: string;
    logo: string;
};

interface StoresListProps {
     stores: StoreItem[];
};

export const StoresList = (props: StoresListProps) => {
    return (
        <List>
            {
                props.stores.map((store: StoreItem) => (
                    <ListItem>
                        <ListItemText primary={store.name} />
                    </ListItem>
                ))
            }
        </List>
    );
}