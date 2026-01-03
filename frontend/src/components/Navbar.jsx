import React from 'react'
import "./Navbar.css"
import { useNavigate } from 'react-router-dom'
const Navbar = () => {
  const Navigate=useNavigate()
  return (
    <nav><div className='box'>
      <div className='logo-name'><img src="colorful-theatrical-masks-representing-comedy-and-drama-symbolizing-the-dual-expressions-in-performing-arts-vibrant-and-artistic-design-png.png" alt="logo" width="100px"/>
      <h3 className='corinthia-bold'>Couple Theatre</h3></div>
      <ul>
        <li><button className='home corinthia-regular' onClick={()=>{Navigate('/')}}>Home</button></li>
        <li><button className='Login corinthia-regular' onClick={()=>{Navigate('/login')}}>Login</button></li>
          <li><button className='SignUp corinthia-regular' onClick={()=>{Navigate('/signup')}}>Sign Up</button></li>

      </ul>
    </div></nav>
  )
}

export default Navbar
