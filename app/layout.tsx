import "./globals.css";
import PwaRegister from "./pwa-register";
export const metadata={title:"NORDIC GO",description:"Proffhandel gjort enkelt",manifest:"/manifest.webmanifest",themeColor:"#10263b",appleWebApp:{capable:true,statusBarStyle:"default",title:"NORDIC GO"},icons:{icon:"/icon.svg",apple:"/icon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="no"><body>{children}<PwaRegister/></body></html>}