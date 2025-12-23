import React, { useState } from 'react'
import  "./SignUp.css"
import { useFormState } from 'react-dom';
import {Link} from 'react-router-dom'

const SignUp = () => {
const [email ,setEmail] =useState("");
const [password,setPassword] =useState("");
const [Confirmpassword,setConfirmpassword] =useState("");
  
const handlesubmit=(e)=>{
  e.preventDefault()
  if( Confirmpassword===password){
    pass

  }
  else{
    pass
    
  }
}
  return (
    <div className='login'>
        <div className="box1">
            <img src="Ghibli_Cozy_Screen_Couple.png" alt="image" />
        </div>
        <div className="box2">
            <div className="headinglogin">
                <img src="colorful-theatrical-masks-representing-comedy-and-drama-symbolizing-the-dual-expressions-in-performing-arts-vibrant-and-artistic-design-png.png" alt="logo" width="100px"/>
                <h3>Couple Theatre</h3>
            </div>
            <br />
            <div className="headinglogin2">
                <h2>Create New Account </h2>
                    <p></p>
            </div>
            <form onSubmit={handlesubmit}>
              <div className="inputs">
                <input type="email" placeholder='Enter Email ' value={email} onChange={(e)=>{setEmail(e.target.value)}} required/><br />

                <input type="password" placeholder="Enter password" value={password} onChange={(e)=>{setPassword(e.target.value)}} required/>
                 <input type="password" placeholder="Confirm password" value={Confirmpassword} onChange={(e)=>{setConfirmpassword(e.target.value)}}  required minLength={9} maxLength={12}/>

            </div>
            <button className='start' type='submit' >Submit & Proceed</button>
            <br /><Link to="/login"> Already a user ?</Link>
            </form>
            <br />
            
        </div>
    </div>
  )
}

export default SignUp
