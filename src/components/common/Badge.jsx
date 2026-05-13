export default function Badge({ text, type = "default" }) {
  const styles = {
    success: "bg-green-500/20 text-green-400 border-green-400",
    warning: "bg-yellow-500/20 text-yellow-400 border-yellow-400",
    danger: "bg-red-500/20 text-red-400 border-red-400",
    info: "bg-cyan-500/20 text-cyan-400 border-cyan-400",
    default: "bg-gray-500/20 text-gray-300 border-gray-400",
  };

  return (
    <span
      className={`px-3 py-1 text-sm rounded-full border backdrop-blur-md 
      ${styles[type]} 
      shadow-[0_0_10px_rgba(0,255,255,0.3)]`}
    >
      {text}
    </span>
  );
}