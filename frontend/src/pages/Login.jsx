import React from 'react';
import  "./Login.css";
import { useState } from 'react';
import {Link} from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Popup from "../components/Popup";

const Login = () => {
  const Navigate= useNavigate()
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [successpopup, setsuccesspopup] = useState(false);

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
    setsuccesspopup(true)
  }
  else{
    alert("invalid email or password")
  }
};

  return (
    
    <div className='login'>
<div class="snowflakes" aria-hidden="true">
  <div class="snowflake">
    <div class="inner">❅</div>
  </div>
  <div class="snowflake">
    <div class="inner">❅</div>
  </div>
  <div class="snowflake">
    <div class="inner">❅</div>
  </div>
  <div class="snowflake">
    <div class="inner">❅</div>
  </div>
  <div class="snowflake">
    <div class="inner">❅</div>
  </div>
  <div class="snowflake">
    <div class="inner">❅</div>
  </div>
  <div class="snowflake">
    <div class="inner">❅</div>
  </div>
  <div class="snowflake">
    <div class="inner">❅</div>
  </div>
  <div class="snowflake">
    <div class="inner">❅</div>
  </div>
  <div class="snowflake">
    <div class="inner">❅</div>
  </div>
  <div class="snowflake">
    <div class="inner">❅</div>
  </div>
  <div class="snowflake">
    <div class="inner">❅</div>
  </div>
</div>
    {successpopup && <Popup message="you are logged in successfully !!" onclose={()=>{Navigate("/Createjoin")}} />}
        <div className="box1">
            <img src="Gemini_Generated_Image_snitxcsnitxcsnit.png" alt="image" />
        </div>
        <div className="box2">
            <div className="headinglogin">
                <img src="colorful-theatrical-masks-representing-comedy-and-drama-symbolizing-the-dual-expressions-in-performing-arts-vibrant-and-artistic-design-png.png" alt="logo" width="100px"/>
                <h3 className='corinthia-bold'>Couple Theatre</h3>
            </div>
            <br/>
            <div className="headinglogin2">
                <h2 className='corinthia-bold'>Welcome Back, Love!</h2>
                 <p className='corinthia-regular'>your partner is waiting...</p>
            </div>
            <form onSubmit={handlesubmit}>
                <div className="inputs">
                <input className='corinthia-regular' type="email" placeholder='Enter Email ' value={email} onChange={(e)=>{setEmail(e.target.value)}} required/><br />
                
                <input className='corinthia-regular' type="password" placeholder="Enter password" value={password} onChange={(e)=>{setPassword(e.target.value)}} required minLength={9} maxLength={12} />
            </div>
            <button className='start corinthia-regular' type='submit'>start watching</button>
            </form>
            <a href="" className='corinthia-regular'>forgot password?</a>
            <br />
            <Link to='/signup' className='corinthia-regular'>create account</Link>
            
        </div>
    </div>
  )
}

export default Login
