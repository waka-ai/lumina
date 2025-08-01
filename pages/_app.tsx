import type { AppProps } from "next/app";
import '../styles/styles.css';
import '../styles/Login.css';
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/toaster";

function MyApp({ Component, pageProps }: AppProps) {
  console.log("Rendering page:", Component.name, pageProps);
  return (
    <AuthProvider>
      <Component {...pageProps} />
      <Toaster />
    </AuthProvider>
  );
}

export default MyApp;