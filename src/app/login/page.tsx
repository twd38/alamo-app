import Image from "next/image"
import { GalleryVerticalEnd } from "lucide-react"
import townhomesImage from './assets/ahc-townhomes.png'
import ahcLogo from './assets/ahc-logo.png'


import { LoginForm } from "src/components/login-form"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
        <a href="#" className="flex items-center gap-2 font-medium">
            <Image
              src={ahcLogo}
              alt="AHC Logo"
              width={120}
              height={40}
            />
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <Image
          src={townhomesImage}
          alt="Townhomes"
          fill
          className="object-cover dark:brightness-[0.2] dark:grayscale"
          priority
        />
      </div>
    </div>
  )
}

