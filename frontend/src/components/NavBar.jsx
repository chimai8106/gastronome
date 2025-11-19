import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Header.css";
import { useAuth } from "../contexts/authContext";
import Create from "../pages/Create/Create"

export default function NavBar(){
    const { userLoggedIn, isSigningIn, userName } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };
    
    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            {/* Desktop Navigation */}
            <nav>
                <ul>
                    <li>
                        <Link to="/">Home</Link>
                    </li>
                    <li>
                        <Link to="/dashboard">Dashboard</Link>
                    </li>
                    <li>
                        <Link to="/recipe-search">Kitchen Remix</Link>
                    </li>
                    
                    {!userLoggedIn && (
                        <>
                            <li>
                                <Link to="/login">Login</Link>
                            </li>
                            <li>
                                <Link to="/register">Register</Link>
                            </li>
                        </>
                    )}
                    
                    {userLoggedIn && (
                        <li className="greeting"> 
                            <Link to="/user">{userName}</Link>
                        </li>
                    )}
                    
                    <li> 
                        <Create />
                    </li>
                </ul>
            </nav>

            {/* Mobile Menu Toggle */}
            <button 
                className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={toggleMobileMenu}
                aria-label="Toggle mobile menu"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            {/* Mobile Navigation */}
            <nav className={`mobile-nav ${isMobileMenuOpen ? 'active' : ''}`}>
                <ul>
                    <li>
                        <Link to="/" onClick={closeMobileMenu}>Home</Link>
                    </li>
                    <li>
                        <Link to="/dashboard" onClick={closeMobileMenu}>Dashboard</Link>
                    </li>
                    <li>
                        <Link to="/recipe-search" onClick={closeMobileMenu}>Kitchen Remix</Link>
                    </li>
                    
                    {!userLoggedIn && (
                        <>
                            <li>
                                <Link to="/login" onClick={closeMobileMenu}>Login</Link>
                            </li>
                            <li>
                                <Link to="/register" onClick={closeMobileMenu}>Register</Link>
                            </li>
                        </>
                    )}
                    
                    {userLoggedIn && (
                        <li className="greeting">
                            <Link to="/user" onClick={closeMobileMenu}>{userName}</Link>
                        </li>
                    )}
                    
                    <li onClick={closeMobileMenu}> 
                        <Create />
                    </li>
                </ul>
            </nav>
        </>
    );
}