import React from "react";
import {
    Routes,
    Route,
    Link,
    Outlet,
} from "react-router-dom";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Register from "./pages/Register/Register";
import Header from "./components/Header";
import RecipeSearch from "./services/RecipeSearch"
import Logout from "./pages/Logout/Logout"
import ProtectedRoute from "./components/ProtectedRoute";
import Create from "./pages/Create/Create";
import User from "./pages/User/User";
import { Toaster } from "react-hot-toast";
import Collection from "./pages/Collection/Collection"
import RecipeCard from "./components/RecipeCard";
import SearchResult from "./pages/SearchResult/SearchResult"


function App() {
    return (
        <>
            <Header />
            <Routes>
                <Route element={<ProtectedRoute />}>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="add" element={<Create/>} />
                </Route>
                <Route path="/" element={<Home />} />
                <Route path="/recipe-search" element={<RecipeSearch />}></Route>
                <Route path="/login" element={<Login />}></Route>
                <Route path="/register" element={<Register/>}></Route>
                <Route path="/signout" element ={<Logout />}></Route>
                <Route path="/user" element ={<User />}></Route>
                <Route path="/collections/:id" element={<Collection />} />
                <Route path="/recipe/:id" element={<RecipeCard />} />
                <Route path="/search" element={<SearchResult />} />
            </Routes>
            <Toaster position="top-center" />
        </>
    );
}

export default App;