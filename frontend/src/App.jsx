import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login.jsx';
import HomePage from './components/HomePage.jsx';
import Register from './components/Register.jsx';
import LandingPage from "./components/LandingPage";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/register" element={<Register />} />
            </Routes>
        </Router>
    );
}

export default App;