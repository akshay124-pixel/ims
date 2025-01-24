import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import OutStockDashboard from "./components/OutStockDashboard";
import StockDashboard from "./components/StockDashboard";
import "./App.css";
import Navbar from "./components/Navbar";
import Login from "./auth/Login";
import SignUp from "./auth/Signup";
import Production from "./components/Production";
import FinishedGoods from "./components/FinshGood";
import OutFinshGood from "./components/OutFinshGood";

function App() {
  return (
    <Router>
      <ConditionalNavbar />
      <Routes>
        {/* Default route to redirect to login */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/production" element={<Production />} />
        <Route path="/finsh" element={<FinishedGoods />} />
        <Route path="/outfinsh" element={<OutFinshGood />} />
        <Route path="/outdashboard" element={<OutStockDashboard />} />
        <Route path="/stockdashboard" element={<StockDashboard />} />
      </Routes>
    </Router>
  );
}

// Component to conditionally render the Navbar only on specific routes
const ConditionalNavbar = () => {
  const location = useLocation();

  // Determine if the current path is for authentication pages
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  return !isAuthPage ? <Navbar /> : null;
};

export default App;
