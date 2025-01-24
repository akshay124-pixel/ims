import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Row, Col, Modal, Table } from "react-bootstrap";
import { Link } from "react-router-dom";

import { FaEye } from "react-icons/fa";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
function OutStockDashboard() {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [outStocks, setOutStocks] = useState([]);
  const [filteredOutStocks, setFilteredOutStocks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false); // For modal visibility
  const [stockName, setStockName] = useState("");

  const [recipientName, setRecipientName] = useState("");
  const [targetTeam, setTargetTeam] = useState("");
  const [purpose, setPurpose] = useState("");
  const [dateOfIssue, setDateOfIssue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [stockData, setStockData] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [quantity, setQuantity] = useState(selectedEntry?.quantity || "");
  const [remarks, setRemarks] = useState(selectedEntry?.remarks || "");
  const [assemblyStatus, setAssemblyStatus] = useState(
    selectedEntry?.assemblyStatus || ""
  );

  const [stockId, setStockId] = useState(selectedEntry?.stockId || "");
  // New Action

  useEffect(() => {
    if (selectedEntry) {
      setQuantity(selectedEntry.quantity || "");
      setRemarks(selectedEntry.remarks || "");
      setAssemblyStatus(selectedEntry.assemblyStatus || "");
      setStockId(selectedEntry.stockId || "");
    }
  }, [selectedEntry]);

  // Handle stock update
  const handleUpdate = async () => {
    if (!selectedEntry || !selectedEntry._id) {
      alert("Stock ID is missing");
      return;
    }

    try {
      const response = await axios.put(
        `https://imserver.onrender.com/api/update-out/${selectedEntry._id}`,
        { quantity, remarks, assemblyStatus }
      );

      if (response.status === 200) {
        toast.success("Stock updated successfully");

        const updatedStock = response.data;

        setFilteredOutStocks((prevStocks) =>
          prevStocks.map((stock) =>
            stock._id === updatedStock._id ? updatedStock : stock
          )
        );

        // Clear the inputs
        setRemarks("");
        setQuantity("");
        setAssemblyStatus("");

        // Close the modal
        handleClosed();
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Error updating stock");
    }
  };
  // End Action
  // Export
  const handleExport = async () => {
    try {
      const response = await axios.get(
        "https://imserver.onrender.com/api/outexport",
        {
          responseType: "arraybuffer", // Get the response as binary data
        }
      );

      // Convert the response data to a workbook using XLSX
      const wb = XLSX.read(response.data, { type: "array" });

      // Convert the workbook to a binary string
      const xlsxData = XLSX.write(wb, { bookType: "xlsx", type: "binary" });

      // Convert binary string to a Blob
      const blob = new Blob([s2ab(xlsxData)], {
        type: "application/octet-stream",
      });

      // Create a temporary download link and trigger the download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "outstock_items.xlsx"; // Set the file name
      link.click();

      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting stock items:", error);
      alert("An error occurred while exporting stock items.");
    }
  };

  // Helper function to convert a string to an array buffer
  function s2ab(s) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
    return buf;
  }

  // Export End
  // Fetch stock data from the backend
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const response = await axios.get(
          "https://imserver.onrender.com/api/stocks"
        );
        setStockData(response.data);
      } catch (error) {
        toast.error("Failed to load stock data.");
        setErrorMessage("Failed to load stock data.");
      }
    };

    fetchStockData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const stock = stockData.find((item) => item.stockName === stockName);

    if (!stock) {
      setErrorMessage("Stock not found.");
      toast.error("Stock not found.");
      return;
    }

    if (parseInt(quantity) > stock.quantity) {
      setErrorMessage("Cannot issue more stock than available.");
      toast.error("Cannot issue more stock than available.");
      return;
    }

    try {
      setErrorMessage(""); // Clear any previous error messages

      // Send request to backend
      const response = await axios.post(
        "https://imserver.onrender.com/api/out",
        {
          stockName,
          quantity,
          recipientName,
          targetTeam,
          purpose,
          dateOfIssue,
        }
      );

      if (response.data.message === "Stock issued successfully") {
        setSuccessMessage(response.data.message);
        window.location.reload();
        toast.success("Stock issued successfully!");
      }
    } catch (error) {
      setErrorMessage("Error occurred while processing the request.");
      toast.error("Error occurred while processing the request.");
    } finally {
      // Reset form fields
      setStockName("");
      setQuantity("");
      setRecipientName("");
      setTargetTeam("");
      setPurpose("");
      setDateOfIssue("");
      setShowModal(false);
    }
  };

  // Filter stocks based on selected category and supplier
  useEffect(() => {
    console.log(
      "Applying Filters - Category:",
      categoryFilter,
      "Supplier:",
      supplierFilter
    );

    let filtered = outStocks;

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter((stock) =>
        stock.stockName
          .toLowerCase()
          .includes(categoryFilter.toLowerCase().trim())
      );
    }

    // Apply supplier filter
    if (supplierFilter) {
      filtered = filtered.filter((stock) =>
        stock.recipientName
          .toLowerCase()
          .includes(supplierFilter.toLowerCase().trim())
      );
    }

    setFilteredOutStocks(filtered); // Update filteredStocks state
    console.log("Filtered Stocks:", filtered); // Debugging
  }, [categoryFilter, supplierFilter, outStocks]);

  // Handle scroll event to show/hide filters
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setShowFilters(true); // Show filters when scrolling down
      } else {
        setShowFilters(false); // Hide filters when on top
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Fetch Out Stock Data from Backend
  useEffect(() => {
    const fetchOutStocks = async () => {
      try {
        const response = await axios.get(
          "https://imserver.onrender.com/api/outstock"
        ); // Adjust API endpoint as needed
        setOutStocks(response.data);
        setFilteredOutStocks(response.data);
        setLoading(false);
      } catch (error) {
        setError("Out stock data not available. Please try again later.");
        toast.error("Out stock data not available. Please try again later.");
        setLoading(false);
      }
    };

    fetchOutStocks();
  }, []);

  const [stockDetails, setStockDetails] = useState([]); // Renamed from stocks to stockDetails

  // Fetch stock data from the server on component mount
  useEffect(() => {
    // Adjust the URL to your API endpoint that fetches stock data
    axios
      .get("https://imserver.onrender.com/api/out")
      .then((response) => {
        setStockDetails(response.data); // Set fetched data to the stockDetails state
      })
      .catch((error) => {
        console.error("Error fetching stock data:", error);
      });
  }, []);

  const handleClose = () => setShowDetailsModal(false);
  const handleClosed = () => setShowActionModal(false);
  // Open the modal and set the selected stock entry
  const handleShow = (entry) => {
    setSelectedEntry(entry); // Set the selected inventory entry
    setShowDetailsModal(true); // Open the modal
  };
  // Search functionality for filtering out stocks
  useEffect(() => {
    const filtered = outStocks.filter((stock) =>
      stock.stockName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredOutStocks(filtered);
  }, [searchQuery, outStocks]);

  // If loading or error, show loading/error message
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <>
          <>
            <div className="loading-wave">
              <div className="loading-bar" />
              <div className="loading-bar" />
              <div className="loading-bar" />
              <div className="loading-bar" />
            </div>
          </>
        </>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "40px 20px",
          background: "#f9fbfd",
          minHeight: "100vh",
          fontFamily: "'Roboto', sans-serif",
        }}
      >
        <h1
          style={{
            background: "linear-gradient(90deg, #6a11cb, #2575fc)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            display: "flex",
            justifyContent: "center",
            textShadow: "2px 2px 8px rgba(0, 0, 0, 0.3)",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: "bold",
          }}
        >
          Out Stock Dashboard
        </h1>
        {/* OutStock */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => setShowModal(true)}
            className="button mx-3"
            style={{
              padding: "12px 20px",
              background: "linear-gradient(90deg, #6a11cb, #2575fc)",
              color: "white",
              borderRadius: "12px",
              cursor: "pointer",
              width: "200px",
              fontWeight: "bold",
              border: "none",
              fontSize: "1rem",
              marginTop: "10px",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0px 6px 12px rgba(0, 0, 0, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
            }}
          >
            Out Stock
          </button>
        </div>
        {showModal && (
          <div
            style={{
              position: "fixed",
              top: 60,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            onClick={() => setShowModal(false)} // Close modal when clicked outside
          >
            <div
              onClick={(e) => e.stopPropagation()} // Prevent closing on form click
              style={{
                backgroundColor: "#fff",
                padding: "20px",
                borderRadius: "10px",
                maxWidth: "500px",
                width: "100%",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h2
                style={{
                  background: "linear-gradient(90deg, #6a11cb, #2575fc)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  display: "flex",
                  justifyContent: "center",
                  textShadow: "2px 2px 8px rgba(0, 0, 0, 0.3)",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: "bold",
                }}
              >
                Out Stock Form
              </h2>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "15px" }}>
                  <label htmlFor="stockName" style={{ fontWeight: "bold" }}>
                    Stock Name
                  </label>
                  <select
                    id="stockName"
                    value={stockName}
                    onChange={(e) => setStockName(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      marginTop: "8px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "1rem",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <option value="">Select Stock</option>
                    {stockData.map((item) => (
                      <option key={item._id} value={item.stockName}>
                        {item.stockName}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <label htmlFor="quantity" style={{ fontWeight: "bold" }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      marginTop: "8px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <label htmlFor="recipientName" style={{ fontWeight: "bold" }}>
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      marginTop: "8px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                    }}
                  />
                </div>
                {/* Target Team Dropdown */}
                <div style={{ marginBottom: "15px" }}>
                  <label htmlFor="targetTeam" style={{ fontWeight: "bold" }}>
                    Target Team
                  </label>
                  <select
                    id="targetTeam"
                    value={targetTeam}
                    onChange={(e) => setTargetTeam(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      marginTop: "8px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                    }}
                  >
                    <option value="">Select Target Team</option>
                    <option value="Production">Production Team</option>
                    <option value="Individual">Individual</option>
                  </select>
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <label htmlFor="purpose" style={{ fontWeight: "bold" }}>
                    Purpose
                  </label>
                  <input
                    type="text"
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      marginTop: "8px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <label htmlFor="dateOfIssue" style={{ fontWeight: "bold" }}>
                    Date of Issue
                  </label>
                  <input
                    type="date"
                    id="dateOfIssue"
                    value={dateOfIssue}
                    onChange={(e) => setDateOfIssue(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      marginTop: "8px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    padding: "14px 30px", // Increased padding for a more prominent button
                    background: "linear-gradient(135deg, #2575fc, #6a11cb)", // Gradient for a dynamic feel
                    color: "#fff", // White text for good contrast
                    border: "none", // Remove default border
                    borderRadius: "50px", // Rounded edges for a more modern appearance
                    fontSize: "1.2rem", // Slightly larger text for readability
                    fontWeight: "bold", // Bold text to make it stand out
                    cursor: "pointer", // Pointer cursor on hover
                    transition:
                      "all 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease", // Smooth transitions
                    display: "block", // Center the button
                    margin: "20px auto", // Center it on the page with margin
                    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)", // Elevated shadow for depth
                  }}
                  onMouseEnter={
                    (e) => (e.target.style.transform = "scale(1.05)") // Slight scale-up on hover for interactivity
                  }
                  onMouseLeave={
                    (e) => (e.target.style.transform = "scale(1)") // Reset scale on hover leave
                  }
                  onMouseDown={
                    (e) =>
                      (e.target.style.boxShadow =
                        "0 4px 10px rgba(0, 0, 0, 0.15)") // Deeper shadow on click
                  }
                  onMouseUp={
                    (e) =>
                      (e.target.style.boxShadow =
                        "0 8px 20px rgba(0, 0, 0, 0.15)") // Reset shadow on release
                  }
                >
                  Submit
                </button>
              </form>
            </div>
          </div>
        )}
        <div
          style={{
            textAlign: "center",
            marginTop: "50px",
            fontSize: "1.5rem",
            color: "#e74c3c",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "40px 20px",
        background: "#f9fbfd",
        minHeight: "100vh",
        fontFamily: "'Roboto', sans-serif",
      }}
    >
      <h1
        style={{
          background: "linear-gradient(90deg, #6a11cb, #2575fc)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          display: "flex",
          justifyContent: "center",
          textShadow: "2px 2px 8px rgba(0, 0, 0, 0.3)",
          fontFamily: "'Poppins', sans-serif",
          fontWeight: "bold",
        }}
      >
        Out Stock Dashboard
      </h1>
      <h2
        style={{
          fontSize: "0.9rem",
          color: "#6c757d",
          marginTop: "10px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Track Your Stock Movements In Real-Time
      </h2>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between", // Ensure equal spacing between buttons
          padding: "20px 50px", // Add padding for spacing
        }}
      >
        {/* Stock Button - Left */}
        <Link
          to="/stockdashboard"
          style={{
            textDecoration: "none",
          }}
        >
          <Button
            className="button"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #6a11cb, #2575fc)",
              color: "white",
              marginLeft: "350px",
              padding: "10px 20px",
              borderRadius: "30px",
              border: "none",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s ease-in-out",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0px 6px 12px rgba(0, 0, 0, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
            }}
          >
            {" "}
            <i
              className="bi bi-arrow-left"
              style={{
                marginRight: "10px",
                fontSize: "1.2rem",
              }}
            ></i>
            Stock
          </Button>
        </Link>

        {/* Out Stock Button - Center */}
        <button
          onClick={() => setShowModal(true)}
          className="button mx-3"
          style={{
            padding: "12px 20px",
            background: "linear-gradient(90deg, #6a11cb, #2575fc)",
            color: "white",
            width: "180px",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "bold",
            border: "none",
            fontSize: "1rem",
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0px 6px 12px rgba(0, 0, 0, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
          }}
        >
          Out Stock
        </button>

        {/* Export Button - Right */}
        <button
          className="button "
          onClick={handleExport}
          style={{
            padding: "12px 20px",
            background: "linear-gradient(90deg, #6a11cb, #2575fc)",
            color: "white",
            marginRight: "350px",
            borderRadius: "30px",
            cursor: "pointer",
            fontWeight: "bold",
            border: "none",
            fontSize: "1rem",
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0px 6px 12px rgba(0, 0, 0, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
          }}
        >
          Excel
          <i
            className="bi bi-arrow-right"
            style={{
              marginLeft: "10px",
              fontSize: "1.2rem",
            }}
          ></i>
        </button>
      </div>

      {/* Modal Content */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 60,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 3,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "10px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
              animation: showModal
                ? "fadeInScaleSmooth 0.1s ease-in-out"
                : "fadeOutScaleSmooth 0.1s ease-in-out",
              opacity: showModal ? 1 : 0,
              transform: showModal ? "scale(1)" : "scale(0.95)",
              transition:
                "opacity 0.3s ease-in-out, transform 0.3s ease-in-out",
            }}
          >
            <h2
              style={{
                background: "linear-gradient(90deg, #6a11cb, #2575fc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "flex",
                justifyContent: "center",
                textShadow: "2px 2px 8px rgba(0, 0, 0, 0.3)",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: "bold",
              }}
            >
              Out Stock
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "15px" }}>
                <label htmlFor="stockName" style={{ fontWeight: "bold" }}>
                  Stock Name
                </label>
                <select
                  id="stockName"
                  value={stockName}
                  onChange={(e) => setStockName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "8px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "1rem",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <option value="">Select Stock</option>
                  {stockData.map((item) => (
                    <option key={item._id} value={item.stockName}>
                      {item.stockName}{" "}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label htmlFor="quantity" style={{ fontWeight: "bold" }}>
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "8px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label htmlFor="recipientName" style={{ fontWeight: "bold" }}>
                  Recipient Name
                </label>
                <input
                  type="text"
                  id="recipientName"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "8px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>{" "}
              {/* Target Team Dropdown */}
              <div style={{ marginBottom: "15px" }}>
                <label htmlFor="targetTeam" style={{ fontWeight: "bold" }}>
                  Target Team
                </label>
                <select
                  id="targetTeam"
                  value={targetTeam}
                  onChange={(e) => setTargetTeam(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "8px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                  }}
                >
                  <option value="">Select Target Team</option>
                  <option value="Production">Production Team</option>
                  <option value="Individual">Individual</option>
                </select>
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label htmlFor="purpose" style={{ fontWeight: "bold" }}>
                  Purpose
                </label>
                <input
                  type="text"
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "8px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label htmlFor="dateOfIssue" style={{ fontWeight: "bold" }}>
                  Date of Issue
                </label>
                <input
                  type="date"
                  id="dateOfIssue"
                  value={dateOfIssue}
                  onChange={(e) => setDateOfIssue(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "8px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: "14px 30px", // Increased padding for a more prominent button
                  background: "linear-gradient(135deg, #2575fc, #6a11cb)", // Gradient for a dynamic feel
                  color: "#fff", // White text for good contrast
                  border: "none", // Remove default border
                  borderRadius: "50px", // Rounded edges for a more modern appearance
                  fontSize: "1.2rem", // Slightly larger text for readability
                  fontWeight: "bold", // Bold text to make it stand out
                  cursor: "pointer", // Pointer cursor on hover
                  transition:
                    "all 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease", // Smooth transitions
                  display: "block", // Center the button
                  margin: "20px auto", // Center it on the page with margin
                  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)", // Elevated shadow for depth
                }}
                onMouseEnter={
                  (e) => (e.target.style.transform = "scale(1.05)") // Slight scale-up on hover for interactivity
                }
                onMouseLeave={
                  (e) => (e.target.style.transform = "scale(1)") // Reset scale on hover leave
                }
                onMouseDown={
                  (e) =>
                    (e.target.style.boxShadow =
                      "0 4px 10px rgba(0, 0, 0, 0.15)") // Deeper shadow on click
                }
                onMouseUp={
                  (e) =>
                    (e.target.style.boxShadow =
                      "0 8px 20px rgba(0, 0, 0, 0.15)") // Reset shadow on release
                }
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* End Out Stock */}

      {/* Search Filter */}
      {showFilters && (
        <div
          style={{
            marginBottom: "30px",
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            flexWrap: "wrap",
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            zIndex: "10",
            background: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(8px)",
            padding: "10px 0",
            borderBottom: "1px solid #ddd",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "20px",
              width: "100%",
              maxWidth: "1200px",
              paddingTop: "5px",
              margin: "0 auto",
            }}
          >
            <input
              type="text"
              placeholder="Search by Item"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: "12px 20px",
                borderRadius: "50px",
                border: "1px solid #ddd",
                fontSize: "1rem",
                width: "50%",
                transition: "all 0.3s ease",
                outline: "none",
                background: "rgba(255, 255, 255, 0.6)",
              }}
            />
            <input
              type="text"
              placeholder="Search by Recipient"
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              style={{
                padding: "12px 20px",
                borderRadius: "50px",
                border: "1px solid #ddd",
                fontSize: "1rem",
                width: "50%",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
                outline: "none",
                background: "rgba(255, 255, 255, 0.6)",
              }}
            />
          </div>
        </div>
      )}

      {/* Out Stock Table */}
      <div>
        <div
          className="text-center mt-5"
          style={{
            width: "75%", // Set width to 100% for responsiveness
            margin: "0 auto", // Center the table container
            overflowX: "hidden", // Disable horizontal scrolling
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.1)", // Optional: Keep shadow for aesthetics
            borderRadius: "15px", // Adjusted for consistent border radius
            marginTop: "20px", // Add margin for spacing from top
            display: "block", // Ensures the table body scrolls
            overflowY: "auto", // Adds vertical scroll
            maxHeight: "450px", // Set a fixed height for scrolling
            maxWidth: "100%", // Make sure it fits within the container
            height: "auto", // Adjusts based on content but doesn't exceed maxHeight
          }}
        >
          <Table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "center",
            }}
            striped
            bordered
            hover
          >
            <thead
              style={{
                background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                color: "white",
                fontSize: "1.1rem",
                padding: "15px 20px",
                textAlign: "center",
                position: "sticky",
                top: 0,
                zIndex: 2,
              }}
            >
              <tr>
                <th
                  style={{
                    padding: "15px 20px",
                    textAlign: "center",
                    backgroundColor: "transparent",
                    color: "white",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  Item Name
                </th>
                <th
                  style={{
                    padding: "15px 20px",
                    textAlign: "center",
                    backgroundColor: "transparent",
                    color: "white",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  Category
                </th>
                <th
                  style={{
                    padding: "15px 20px",
                    textAlign: "center",
                    backgroundColor: "transparent",
                    color: "white",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  Recipient
                </th>
                <th
                  style={{
                    padding: "15px 20px",
                    textAlign: "center",
                    backgroundColor: "transparent",
                    color: "white",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  Date Out
                </th>
                <th
                  style={{
                    padding: "15px 20px",
                    textAlign: "center",
                    backgroundColor: "transparent",
                    color: "white",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  Quantity
                </th>
                <th
                  style={{
                    padding: "15px 20px",
                    textAlign: "center",
                    backgroundColor: "transparent",
                    color: "white",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOutStocks.map((stock) => (
                <tr
                  key={stock._id} // Assuming 'stock._id' is available in the response
                  style={{
                    backgroundColor: "white",
                  }}
                >
                  <td style={{ padding: "15px", fontWeight: "500" }}>
                    {stock.stockName}
                  </td>
                  <td style={{ padding: "15px" }}>{stock.category}</td>
                  <td style={{ padding: "15px" }}>{stock.recipientName}</td>
                  <td style={{ padding: "15px" }}>
                    {new Date(stock.dateOfIssue).toLocaleDateString()}
                  </td>

                  <td
                    style={{
                      padding: "15px",
                      color: stock.quantity <= 5 ? "#e74c3c" : "#2ecc71",
                      fontWeight: "600",
                    }}
                  >
                    {stock.quantity}
                  </td>
                  <td style={{ padding: "15px" }}>
                    <Row>
                      {/* View Details  */}{" "}
                      <Col className="d-flex justify-content-center">
                        <Button
                          variant="primary"
                          className="mx"
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "22px",
                          }}
                          onClick={() => {
                            setSelectedEntry(stock); // Set the selected entry when button is clicked
                            setShowDetailsModal(true); // Open the modal
                          }}
                        >
                          <FaEye style={{ marginBottom: "3px" }} />
                        </Button>{" "}
                        {/* Action */}
                        <button
                          className="editBtn mx-2"
                          onClick={() => {
                            setSelectedEntry(stock); // Set the selected entry when button is clicked
                            setShowActionModal(true); // Open the modal
                          }}
                        >
                          <svg height="1em" viewBox="0 0 512 512">
                            <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path>
                          </svg>
                        </button>
                        {/* Action End */}
                      </Col>
                    </Row>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
      {/* Modal to show selected entry details */}
      {selectedEntry && (
        <Modal show={showDetailsModal} onHide={handleClose} centered>
          <Modal.Header
            closeButton
            style={{
              background: "linear-gradient(135deg, #2575fc, #6a11cb)",
              color: "white",
              fontSize: "1.1rem",
            }}
          >
            <Modal.Title
              className="text-center w-100"
              style={{ fontWeight: "bold" }}
            >
              Out Stock Entry Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="inventory-details">
              <div className="modal-info">
                <div
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    color: "#444",
                    animation: "fadeIn 0.5s ease-in-out",
                  }}
                >
                  {[
                    {
                      label: "Stock Name",
                      value:
                        selectedEntry.stockId?.stockName || "Not Available",
                      icon: "📦",
                    },
                    {
                      label: "Quantity Issued",
                      value: selectedEntry.quantity || "Not Available",
                      icon: "🔢",
                    },
                    {
                      label: "Recipient Name",
                      value: selectedEntry.recipientName || "Not Available",
                      icon: "👤",
                    },
                    {
                      label: "Purpose",
                      value: selectedEntry.purpose || "Not Available",
                      icon: "📜",
                    },
                    {
                      label: "Assembly Status",
                      value: selectedEntry.assemblyStatus || "Not Available",
                      icon: "🔧",
                    },
                    {
                      label: "Remarks",
                      value: selectedEntry.remarks || "Not Available",
                      icon: "🗒️",
                    },
                    {
                      label: "Date of Issue",
                      value: new Date(
                        selectedEntry.dateOfIssue
                      ).toLocaleDateString(),
                      icon: "📅",
                    },
                    {
                      label: "Date of Entry",
                      value: new Date(
                        selectedEntry.dateOfEntry
                      ).toLocaleDateString(),
                      icon: "🕒",
                    },
                  ].map(({ label, value, icon }, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "15px",
                        marginBottom: "15px",
                        padding: "10px",
                        backgroundColor: "#f7f8fa",
                        borderRadius: "10px",
                        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.03)";
                        e.currentTarget.style.boxShadow =
                          "0px 6px 12px rgba(0, 0, 0, 0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow =
                          "0px 4px 6px rgba(0, 0, 0, 0.1)";
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          fontSize: "1.8rem",
                          color: "#2575fc",
                          background: "#e3f2fd",
                          padding: "10px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        {icon}
                      </div>

                      {/* Content */}
                      <div>
                        <p
                          style={{
                            margin: "0",
                            fontSize: "1rem",
                            fontWeight: "bold",
                            color: "#333",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {label}:
                        </p>
                        <p
                          style={{
                            margin: "5px 0 0",
                            fontSize: "0.95rem",
                            color: "#555",
                          }}
                        >
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer
            className="justify-content"
            // style={{
            //   background: "linear-gradient(135deg, #2575fc, #6a11cb)",
            //   color: "white",
            //   fontSize: "1.1rem",
            // }}
          >
            <Button
              variant="danger"
              style={{
                background: "linear-gradient(135deg, #FF5252, #D50000)", // Red gradient
                color: "#fff", // White text
                padding: "10px 20px", // Comfortable padding
                borderRadius: "25px", // Rounded edges
                border: "none", // No border
                fontSize: "1rem", // Readable font size
                fontWeight: "bold", // Bold text
                cursor: "pointer", // Pointer cursor on hover
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)", // Subtle shadow for depth
                transition: "transform 0.2s ease, box-shadow 0.2s ease", // Smooth animations
              }}
              onMouseEnter={
                (e) => (e.target.style.transform = "scale(1.05)") // Slight scale-up on hover
              }
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)"; // Reset scale on leave
                e.target.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.2)"; // Reset shadow
              }}
              onMouseDown={
                (e) =>
                  (e.target.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)") // Pressed effect
              }
              onMouseUp={
                (e) =>
                  (e.target.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.2)") // Reset on release
              }
              onClick={handleClose}
            >
              Close
            </Button>
          </Modal.Footer>
          {/* Animation Style */}
          <style>
            {`
      @keyframes fadeIn {
        0% {
          opacity: 0;
          transform: translateY(-20px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `}
          </style>
        </Modal>
      )}
      {/* New MOdaL */}
      <div>
        {" "}
        {selectedEntry && (
          <Modal show={showActionModal} onHide={handleClosed} centered>
            <Modal.Header
              closeButton
              style={{
                background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                color: "white",
                fontSize: "1.2rem",
                fontWeight: "bold",
                borderBottom: "2px solid white",
                textAlign: "center",
                letterSpacing: "1.2px",
              }}
            >
              <Modal.Title
                className="text-center w-100"
                style={{
                  fontWeight: "bold",

                  fontSize: "1.5rem",
                  letterSpacing: "2px",
                }}
              >
                Update OutStock Details
              </Modal.Title>
            </Modal.Header>
            <Modal.Body
              style={{
                padding: "20px",
                borderRadius: "10px",
                color: "#333",
                fontSize: "1rem",
                fontWeight: "500",
              }}
            >
              <div className="inventory-details">
                <div
                  className="modal-info"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: "20px",
                    padding: "10px",
                    fontFamily: "'Poppins', sans-serif",
                    color: "#444",
                  }}
                >
                  {/* Quantity Field */}
                  <div style={{ position: "relative" }}>
                    <label
                      htmlFor="quantity"
                      style={{
                        fontWeight: "bold",
                        color: "#2575fc",
                        fontSize: "1.1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span role="img" aria-label="quantity">
                        🔢
                      </span>{" "}
                      Quantity
                    </label>
                    <input
                      id="quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      style={{
                        background: "#f7f8fa",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "10px 15px",
                        fontSize: "1rem",
                        color: "#333",
                        boxShadow: "inset 0px 2px 4px rgba(0, 0, 0, 0.1)",
                        width: "100%", // Makes the input responsive
                        maxWidth: "440px", // Optional: limits the width for large screens
                      }}
                      placeholder="Enter quantity"
                    />
                  </div>

                  {/* Assembly Status Field */}
                  <div style={{ position: "relative" }}>
                    <label
                      htmlFor="assemblyStatus"
                      style={{
                        fontWeight: "bold",
                        color: "#2575fc",
                        fontSize: "1.1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span role="img" aria-label="assembly-status">
                        ⚙️
                      </span>{" "}
                      Assembly Status
                    </label>
                    <select
                      id="assemblyStatus"
                      value={assemblyStatus}
                      onChange={(e) => setAssemblyStatus(e.target.value)}
                      style={{
                        background: "#f7f8fa",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "10px 15px",
                        fontSize: "1rem",
                        color: "#333",
                        boxShadow: "inset 0px 2px 4px rgba(0, 0, 0, 0.1)",
                        width: "100%", // Makes the select box responsive
                        maxWidth: "440px", // Optional: limits the width for large screens
                      }}
                    >
                      <option value="">Select Status</option>
                      <option value="Assembled">Assembled</option>
                      <option value="Not Assembled">Not Assembled</option>
                    </select>
                  </div>

                  {/* Remarks Field */}
                  <div style={{ position: "relative" }}>
                    <label
                      htmlFor="remarks"
                      style={{
                        fontWeight: "bold",
                        color: "#2575fc",
                        fontSize: "1.1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span role="img" aria-label="remarks">
                        📝
                      </span>{" "}
                      Remarks
                    </label>
                    <textarea
                      id="remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter remarks..."
                      style={{
                        background: "#f7f8fa",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "10px 15px",
                        fontSize: "1rem",
                        color: "#333",
                        boxShadow: "inset 0px 2px 4px rgba(0, 0, 0, 0.1)",
                        minHeight: "80px",
                        width: "100%", // Makes the textarea responsive
                        maxWidth: "440px", // Optional: limits the width for large screens
                      }}
                    ></textarea>
                  </div>
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer
              className="justify-content"
              style={{
                // background: "linear-gradient(135deg, #2575fc, #6a11cb)",

                textAlign: "center",
                fontSize: "1.1rem",
                fontWeight: "bold",
              }}
            >
              <button
                onClick={handleUpdate}
                style={{
                  background: "linear-gradient(135deg, #4CAF50, #8BC34A)",
                  color: "#fff",
                  padding: "12px 25px",
                  borderRadius: "25px",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
              >
                Update
              </button>
              <Button
                variant="danger"
                style={{
                  background: "linear-gradient(135deg, #FF5252, #D50000)",
                  color: "#fff",
                  padding: "12px 25px",
                  borderRadius: "25px",
                  border: "none",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                onClick={handleClosed}
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        )}
      </div>
    </div>
  );
}

export default OutStockDashboard;
