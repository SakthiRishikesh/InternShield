export function Card({ title, value }) {
  return (
    <div className="bg-gray-800 p-4 rounded-xl shadow hover:shadow-cyan-500/20 hover:scale-[1.02] transition">
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-gray-300">{value}</p>
    </div>
  );
}