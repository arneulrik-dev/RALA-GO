"use client";
import {useEffect} from "react";
export default function PwaRegister(){useEffect(()=>{if(!("serviceWorker" in navigator))return;const cleanup=async()=>{try{const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()));const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)));}catch{}};cleanup()},[]);return null;}
