import React, { useState } from 'react'
import  "./SignUp.css"
import { useFormState } from 'react-dom';
import {Link} from 'react-router-dom'
import Popup from '../components/Popup';
import { useNavigate } from 'react-router-dom';
const SignUp = () => {
  const Navigate = useNavigate()
const [rpopup,setrpopup]=useState(false)
const [username ,setusername]=useState("")
const [email ,setEmail] =useState("");
const [password,setPassword] =useState("");
const [Confirmpassword,setConfirmpassword] =useState("");
  
const handlesubmit = async (e) => {
  e.preventDefault();

  const res = await fetch("http://127.0.0.1:5000/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username,
      email,
      password
    })
  });

  const data = await res.json();
  console.log(data);

  if (res.ok) {
    alert("you are registered successfully!!")
    setrpopup(true)
  }
  else{
    alert("already have a user")
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
      {rpopup && <Popup message={"you are registered successfully!!"} onclose={()=>{Navigate("/Login")}}/>}
        <div className="box1">
            <img src="Ghibli_Cozy_Screen_Couple.png" alt="image" />
        </div>
        <div className="box2">
            <div className="headinglogin">
                <img src="colorful-theatrical-masks-representing-comedy-and-drama-symbolizing-the-dual-expressions-in-performing-arts-vibrant-and-artistic-design-png.png" alt="logo" width="100px"/>
                <h3 className='corinthia-bold'>Couple Theatre</h3>
            </div>
            <br />
            <div className="headinglogin2">
                <h2 className='corinthia-bold'>Create New Account </h2>
                    <p></p>
            </div>
            <form onSubmit={handlesubmit}>
              <div className="inputs">
              <input className='corinthia-regular' type="username" placeholder='Enter username' value={username} onChange={(e)=>{setusername(e.target.value)}} required/>

                <input className='corinthia-regular'type="email" placeholder='Enter Email ' value={email} onChange={(e)=>{setEmail(e.target.value)}} required/>

                <input className='corinthia-regular' type="password" placeholder="Enter password" value={password} onChange={(e)=>{setPassword(e.target.value)}} required/>
                 <input className='corinthia-regular' type="password" placeholder="Confirm password" value={Confirmpassword} onChange={(e)=>{setConfirmpassword(e.target.value)}}  required minLength={9} maxLength={12}/>

            </div>
            <button className='corinthia-regular start' type='submit' >Submit & Proceed</button>
            <br /><Link to="/login" className='corinthia-regular'> Already a user ?</Link>
            </form>
            <br />
            
        </div>
    </div>
  )
}

export default SignUp
