export default function Input({
  type = "text",
  placeholder,
  value,
  onChange,
  name,
  className = "",
}) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full p-3 bg-transparent border border-cyan-500/40 
      rounded-lg text-white placeholder-gray-500 
      focus:outline-none focus:ring-2 focus:ring-cyan-400 
      focus:shadow-[0_0_10px_rgba(0,255,255,0.6)] 
      transition duration-300 ${className}`}
    />
  );
}