import "../styles/globals.css";

export const metadata = {
  title: "InternShield | AI-Powered Internship Verification",
  description: "Secure your career path with our advanced internship verification engine. Detect scams and stay safe from fake opportunities.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen antialiased selection:bg-cyan-500/30">
        {children}
      </body>
    </html>
  );
}
