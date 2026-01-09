import React from 'react'
import "./popup.css"

const Popupform = ({setkey,onclose}) => {
  return (
    <div>
        <div className="overlay">
      <div className="modal">
        <h2 className='corinthia-bold'>Enter partner's room ID</h2>
        <input type="text" className='corinthia-regular' placeholder='Enter key here'  onChange={(e)=>{setkey(e.target.value)}} />
        <button className="start color" onClick={onclose}>Continue</button>
      </div>
    </div>
    </div>
  )
}

export default Popupform
