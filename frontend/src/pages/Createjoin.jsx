import React, { useState } from 'react'
import './Createjoin.css'
import Popup from "../components/Popup";
import { useNavigate } from 'react-router-dom'
import Popupform from '../components/Popupform'
import Upload from '../components/uplaod';
import { useEffect } from "react";
const Createjoin = () => {
  const [uploadtrue, setuploadtrue] = useState(false)
  const [uploadsuccess, setuploadsuccess] = useState(false)
  const [success, setsuccess] = useState(false)
  const Navigate = useNavigate()
  const [key, setkey] = useState("")
  const [popform, setpopform] = useState(false)
  const [code, setcode] = useState("")

  const createtheatre = async (e) => {
    e.preventDefault()
    let token = localStorage.getItem("accessToken")
    let res = await fetch("https://couple-theatre.onrender.com/api/room/create", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
    let data = await res.json()
    if (res.ok) {
      setcode(data.roomCode)
      setuploadtrue(true)
    }
    else {
      console.log("Error in room creation")
    }
    useEffect(() => {
      if (uploadsuccess && code) {
        Navigate(`/Theatre?code=${code}`)
      }
    }, [uploadsuccess, code])

  }
  const jointheatre = async (e) => {
    e.preventDefault()
    let token = localStorage.getItem("accessToken")
    let res = await fetch("https://couple-theatre.onrender.com/api/room/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        roomCode: key.trim().toUpperCase()
      })
    })
    const data = await res.json()
    if (res.ok) {
      Navigate(`/Theatre?code=${data.roomCode}`)
    }
    else {
      console.log("room does'nt exists")
      setpopform(!Popupform)
      setsuccess(!success)
    }
  }
  return (

    <div className='createjoin corinthia-bold'>
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
      <h1>create and join rooms with your dearest ones</h1>
      <div className='dibba'>
        <div className='dibba1'>
          <p className='corinthia-regular'>start a new movie session</p>
          <button className='create' onClick={(e) => { createtheatre(e) }}>Create session</button>
        </div>
        <div className='dibba2'>
          <p className='corinthia-regular'>join a created movie session</p>
          <button className='join' onClick={() => { setpopform(prev => !prev) }}>Join session</button>

        </div>
      </div>
      {popform && <Popupform setkey={setkey} onclose={(e) => { jointheatre(e) }} />}
      {success && <Popup cover={"❌ Failed"} message={"room does'nt exists"} onclose={() => { setsuccess(!success) }} />}
      {uploadtrue && <Upload code={code} />}
    </div>

  )
}

export default Createjoin
