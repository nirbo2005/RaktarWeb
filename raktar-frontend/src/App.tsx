import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProductList from "./components/ProductList";
import ProductAdd from "./components/ProductAdd";
import ProductModify from "./components/ProductModify";
import ProductGridView from "./components/ProductGridView";
import Login from "./components/Login";
import Register from "./components/Register";
import ProductDetails from "./components/ProductDetails";
import Profile from "./components/Profile";
import SearchResults from "./components/SearchResults";
import ScannerView from "./components/ScannerView";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
          <Navbar />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<ProductList />} />
              <Route path="/add" element={<ProductAdd />} />
              <Route path="/modify/:id" element={<ProductModify />} />
              <Route path="/grid" element={<ProductGridView />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/scanner" element={<ScannerView />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/product/:id" element={<ProductDetails />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;