import React, { useEffect, useState } from "react";
import { makeStyles, List, ListItem, ListItemText } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({

}));

interface BrandItem {
    name: string;
    logo: string;
};

interface BrandListProps {
     brands: BrandItem[];
};

export const BrandsList = (props: BrandListProps) => {
    return (
        <List>
            {
                props.brands.map((brand: BrandItem) => (
                    <ListItem>
                        <ListItemText primary={brand.name} />
                    </ListItem>
                ))
            }
        </List>
    );
}