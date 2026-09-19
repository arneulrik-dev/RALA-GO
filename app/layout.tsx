import "./globals.css";
import PwaRegister from "./pwa-register";
export const metadata={title:"RALA GO",description:"Proffhandel gjort enkelt",manifest:"/manifest.webmanifest",themeColor:"#10263b",appleWebApp:{capable:true,statusBarStyle:"default",title:"RALA GO"},icons:{icon:"/icon.svg",apple:"/icon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="no"><body>{children}<PwaRegister/></body></html>}