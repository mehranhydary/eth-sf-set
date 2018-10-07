import React, { Component } from "react";
import Landing from './Landing';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import CreateMain from './create/CreateMain';
import SellMain from './sell/SellMain';
import BuyMain from './buy/BuyMain';
import ZeroXMain from './zero-x/ZeroXMain';

export default class Navigation extends Component {

    render() {
        return (  
            <BrowserRouter>
                <Switch>
                    <Route
                    path="/home" exact component={Landing}
                    />
                    <Route
                    path="/create" exact component={CreateMain}
                    />                    
                    <Route
                    path="/buy" exact component={BuyMain}
                    />                                        
                    <Route
                    path="/sell" exact component={SellMain}
                    />
                    <Route
                    path="/x" exact component={ZeroXMain}
                    />                    
                </Switch>
            </BrowserRouter>

        );
    }
}