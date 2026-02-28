import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <form className="search" onSubmit={handleSubmit}>
      <input
        type="text"
        aria-label="Search"
        placeholder="Search recipes..."
        name="searchText"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  );
}