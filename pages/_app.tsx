import type { AppProps } from "next/app"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
// import "@/styles/globals.css"



function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="font-inter">

      <AuthProvider>
        <Component {...pageProps} />
        <Toaster />
      </AuthProvider>
    </div>
  )
}

export default MyApp
