import React, {  } from "react";
import { List, ListItem, ListItemText } from "@material-ui/core";


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