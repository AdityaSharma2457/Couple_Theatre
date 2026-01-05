import { useState } from 'react'
import './App.css'
import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Createjoin from './pages/Createjoin'
import Protectedrout from './protectedrout'
import {Route,Routes,BrowserRouter} from "react-router-dom"
function App() {

  return (
    
    <>
    <BrowserRouter>
    <Navbar/>
    
      <Routes>
        <Route path="/Createjoin" element={ <Protectedrout><Createjoin/></Protectedrout>}></Route>
        <Route path="/" element={<Hero />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App
