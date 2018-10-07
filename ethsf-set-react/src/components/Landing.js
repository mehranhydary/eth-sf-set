import React, { Component } from "react";
import { PageHeader } from 'react-bootstrap';

export default class Landing extends Component {
    componentWillMount(){
    }
    render() {
        return (  
            <PageHeader>
                Welcome to GetSetGo! <small>This is a website to create, buy, and sell Sets</small>
            </PageHeader>
        );
    }
}