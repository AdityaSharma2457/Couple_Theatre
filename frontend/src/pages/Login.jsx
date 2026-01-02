import React from 'react'
import  "./Login.css"
import { useState } from 'react'
import {Link} from 'react-router-dom'
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handlesubmit = async (e) => {
  e.preventDefault();   // 🔥 THIS WAS MISSING

  const res = await fetch("http://127.0.0.1:5000/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  console.log(data);

  if (res.ok) {
    localStorage.setItem("accessToken", data.access_token);
    localStorage.setItem("refreshToken", data.refresh_token);
  }
};

  
  







  return (
    <div className='login'>
        <div className="box1">
            <img src="Gemini_Generated_Image_snitxcsnitxcsnit.png" alt="image" />
        </div>
        <div className="box2">
            <div className="headinglogin">
                <img src="colorful-theatrical-masks-representing-comedy-and-drama-symbolizing-the-dual-expressions-in-performing-arts-vibrant-and-artistic-design-png.png" alt="logo" width="100px"/>
                <h3>Couple Theatre</h3>
            </div>
            <br />
            <div className="headinglogin2">
                <h2>Welcome Back, Love!</h2>
                    <p>your partner is waiting...</p>
            </div>
            <form onSubmit={handlesubmit}>
                <div className="inputs">
                <input type="email" placeholder='Enter Email ' value={email} onChange={(e)=>{setEmail(e.target.value)}} required/><br />

                <input type="password" placeholder="Enter password" value={password} onChange={(e)=>{setPassword(e.target.value)}} required minLength={9} maxLength={12} />
            </div>
            <button className='start' type='submit'>start watching</button>
            </form>
            <a href="">forgot password?</a>
            <br />
            <Link to='/signup'>create account</Link>
            
        </div>
    </div>
  )
}

export default Login
