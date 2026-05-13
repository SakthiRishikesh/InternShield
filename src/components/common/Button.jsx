export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
}) {
  const variants = {
    primary:
      "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.6)]",
    secondary:
      "bg-purple-500 text-black hover:bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.6)]",
    outline:
      "border border-cyan-400 text-cyan-400 hover:bg-cyan-500/10",
    danger:
      "bg-red-500 text-black hover:bg-red-400 shadow-[0_0_10px_rgba(255,0,0,0.6)]",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`w-full py-3 rounded-lg font-semibold transition duration-300 
      ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}