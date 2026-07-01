import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="border-b-2 border-ink px-5 py-4 text-center">
      <Link to="/" className="font-sans text-2xl font-semibold tracking-tight">
        voicemeup
      </Link>
    </header>
  );
}
