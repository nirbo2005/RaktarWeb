import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProductList from "./components/ProductList";
import ProductAdd from "./components/ProductAdd";
import ProductModify from "./components/ProductModify";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<ProductList />} />
        <Route path="/add" element={<ProductAdd />} />
        <Route path="/modify/:id" element={<ProductModify />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
