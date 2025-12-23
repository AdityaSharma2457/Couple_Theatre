import { useState } from 'react'
import './App.css'
import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import Login from './pages/Login'
import SignUp from './pages/SignUp'

import {Route,Routes,BrowserRouter} from "react-router-dom"
function App() {

  return (
    
    <>
    <BrowserRouter>
    <Navbar/>

      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App
