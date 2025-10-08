import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Header.css";
export default function SearchBar(){
    function handleSubmit(e){
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

    }
    return(
        <>
        <form className="search" onSubmit={handleSubmit}>
                <input 
                    type="text"
                    aria-label="Search"
                    placeholder="Search"
                    name = "searchText"
                />
            </form>
        </>
    )
}