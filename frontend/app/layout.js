import "@/app/globals.css";
import { AuthProvider } from "@/providers/AuthContext";
import ToastProvider from "@/app/components/ToastProvider";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider />
          <div className="flex">
            <Sidebar />
            <main className="flex-1">
              <Header />
              <div className="p-6">{children}</div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
