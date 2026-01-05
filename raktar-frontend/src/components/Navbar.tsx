import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav>
      <Link to="/">-  Termékek  -</Link>
      <Link to="/add">-  Új termék  -</Link>
      <Link to="/grid">-  Raktár áttekintése  -</Link>
    </nav>
  );
}

export default Navbar;
