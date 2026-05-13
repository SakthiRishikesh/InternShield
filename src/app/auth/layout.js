import CyberBackground from "@/components/common/CyberBackground";

export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <CyberBackground />
      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}