import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";
import "./Header.css";
import NavBar from "./NavBar";
import SearhBar from "./SearchBar";

export default function Header() {
    return (
        <header>
            <img className="logo" src={logo} alt="Logo"/>
            <div className="nav-search-wrap">
            <NavBar />
            {/*<SearhBar />*/}
            </div>
        </header>
    );
}