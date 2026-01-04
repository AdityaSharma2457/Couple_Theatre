import React from 'react'
import { Navigate } from 'react-router-dom'
const Protectedrout = ({children}) => {


 if(!localStorage.getItem("accessToken")){
    return <Navigate to="/login" replace/>
 }
 else{
    return children
 }


}

export default Protectedrout
