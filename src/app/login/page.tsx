import Image from "next/image"
import { GalleryVerticalEnd } from "lucide-react"
import townhomesImage from './assets/ahc-townhomes.png'
import ahcLogo from './assets/ahc-logo.png'


import { LoginForm } from "@/components/login-form"

export default async function LoginPage() {
  return(
    <div className="h-screen w-full">
      <Image src={ahcLogo} width={100} height={100} alt="AHC Logo" className="fixed mb-10 ml-6 mt-4" />
      <div className="w-full flex flex-col items-center justify-center h-screen">
        <LoginForm />
      </div>
    </div>
  )
}
// export default async function LoginPage() {
//   return(
//     <div className="flex flex-col items-center justify-center h-screen w-full">
//       <div className="flex flex-col items-center justify-center w-full mb-10">
//         <Image src={ahcLogo} width={150} height={100} alt="AHC Logo" />
//       </div>
//       <div className="w-full max-w-xs">
//         <LoginForm />
//       </div>
//     </div>
//   )
// }

