import React from 'react'
import "./popup.css"
const Popup = ({message,onclose}) => {
  return (
      <div className="overlay">
      <div className="modal">
        <h2 className='corinthia-bold'>✅ Success</h2>
        <p className='corinthia-regular'>{message}</p>
        <button className="start color" onClick={onclose}>Continue</button>
      </div>
    </div>
  )
}

export default Popup
