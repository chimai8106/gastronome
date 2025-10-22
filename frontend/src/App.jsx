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

// About Page Component 
const About = () => (
    <div>
        <h2>About Page</h2>
        <nav>
            <ul>
                <li>
                    <Link to="team">Our Team</Link>
                </li>
                <li>
                    <Link to="company">Our Company</Link>
                </li>
            </ul>
        </nav>
        <Outlet />
    </div>
);
const Team = () => <h2>Team Page</h2>;
const Company = () => <h2>Company Page</h2>;

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
                <Route path="/about" element={<About />}>
                    <Route path="team" element={<Team />} />
                    <Route path="company" element={<Company />} />
                </Route>
                <Route path="/login" element={<Login />}></Route>
                <Route path="/register" element={<Register/>}></Route>
                <Route path="/signout" element ={<Logout />}></Route>
                <Route path="/user" element ={<User />}></Route>
                <Route path="/collections/:id" element={<Collection />} />
                <Route path="/recipe/:id" element={<RecipeCard />} />
            </Routes>
            <Toaster position="top-center" />
        </>
    );
}

export default App;