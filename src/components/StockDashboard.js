import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { Button, Row, Col, Modal, Form, Table } from "react-bootstrap";
import { FaEye } from "react-icons/fa";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
function StockDashboard() {
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [newStock, setNewStock] = useState({
    stockName: "",
    category: "",
    supplierName: "",
    quantity: "",
    dateOfEntry: new Date().toISOString().split("T")[0],
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [productCounts, setProductCounts] = useState([]);
  const [stockData, setStockData] = useState({});
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [updatedQuantity, setUpdatedQuantity] = useState("");
  const [updatedDescription, setUpdatedDescription] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Export
  const handleExport = async () => {
    try {
      // Send request using Axios to export stock data
      const response = await axios.get(
        "https://imserver.onrender.com/api/export",
        {
          responseType: "arraybuffer", // Receive the response as a binary array
        }
      );

      // Create a Blob from the received array buffer
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Create a temporary download link and trigger the download
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = "stocks.xlsx"; // Set the default filename
      link.click();

      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting stock data:", error);
      alert("An error occurred while exporting stock data.");
    }
  };
  //Exports Ends
  // Fetch stocks from the backend
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await axios.get(
          "https://imserver.onrender.com/api/stocks"
        );
        setStocks(response.data);
        setFilteredStocks(response.data); // Initialize filteredStocks with all stocks
      } catch (error) {
        console.error("Error fetching stock data:", error);
      }
    };

    fetchStocks();
  }, []);

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

  // Filter stocks based on selected category and supplier
  useEffect(() => {
    let filtered = stocks;

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
        stock.category
          .toLowerCase()
          .includes(supplierFilter.toLowerCase().trim())
      );
    }

    setFilteredStocks(filtered); // Update filteredStocks state
  }, [categoryFilter, supplierFilter, stocks]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  // Handle modal visibility for stock update
  const handleCardModalToggle = () => {
    setShowModal((prevState) => !prevState);
  };

  // Handle close for "Update Stock Entry Details" Modal
  const handleCloseUpdateModal = () => setShowUpdateModal(false);
  const handleCloseModal = () => setShowDetailsModal(false);

  // Handle stock update
  const handleUpdate = async () => {
    const updatedData = {
      quantity: updatedQuantity,
      description: updatedDescription,
    };

    try {
      const response = await axios.put(
        `https://imserver.onrender.com/api/stock/${selectedEntry._id}`,
        updatedData
      );

      // Toast notification for success
      toast.success("Stock updated successfully!");

      // Update local state to reflect changes in UI
      setStocks((prevStocks) =>
        prevStocks.map((stock) =>
          stock._id === selectedEntry._id
            ? { ...stock, ...response.data } // Merge updated data
            : stock
        )
      );

      handleCloseUpdateModal(); // Close modal after successful update
    } catch (error) {
      console.error("Error updating stock:", error.message);
      toast.error("Error updating stock");
    }
  };

  // Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(worksheet);

        // Map and validate data
        const newStocks = parsedData.map((item) => {
          const dateOfEntry = item.dateOfEntry
            ? new Date(item.dateOfEntry)
            : new Date(); // Default to current date if not provided

          return {
            stockName: item.stockName?.trim(),
            description: item.description?.trim(),
            quantity: parseInt(item.quantity, 10),
            supplierName: item.supplierName?.trim(),
            category: item.category?.trim(),
            pricePerUnit: parseFloat(item.pricePerUnit),
            dateOfEntry: !isNaN(dateOfEntry)
              ? dateOfEntry.toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
          };
        });

        // Validate stock data
        const validStocks = newStocks.filter(
          (stock) =>
            stock.stockName &&
            stock.description &&
            stock.quantity > 0 &&
            stock.supplierName &&
            stock.category &&
            !isNaN(stock.pricePerUnit) &&
            stock.pricePerUnit > 0
        );

        if (validStocks.length === 0) {
          toast.error("All records are invalid or incomplete.");
          return;
        }

        // Send valid stocks to the backend
        const response = await axios.post(
          "https://imserver.onrender.com/api/bulk-upload",
          validStocks,
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
          }
        );

        if (response.status === 200 || response.status === 201) {
          toast.success("Stocks uploaded successfully!");
          setStocks((prevStocks) => [...prevStocks, ...validStocks]);
        } else {
          toast.error(`Unexpected response: ${response.statusText}`);
        }
      } catch (error) {
        console.error("Error uploading stocks:", error.message);
        toast.error("Failed to upload stocks to the database.");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Handle new stock input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStock({ ...newStock, [name]: value });
  };

  // Handle new stock form submission
  const handleAddStock = async (e) => {
    e.preventDefault();

    if (newStock.quantity <= 0) {
      setMessage("Quantity must be greater than 0");
      setMessageType("error");
      return;
    }

    setLoading(true); // Start loading before the request

    try {
      const response = await axios.post(
        "https://imserver.onrender.com/api/add",
        newStock,
        {
          withCredentials: true,
        }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("Stock added successfully!");

        // Fetch the updated list of stocks after adding the new stock
        const updatedResponse = await axios.get(
          "https://imserver.onrender.com/api/stocks",
          {
            withCredentials: true,
          }
        );

        if (updatedResponse.status === 200) {
          // Update the stocks and filteredStocks states with the updated data
          setStocks(updatedResponse.data);
          setFilteredStocks(updatedResponse.data);

          // Reset the form and message
          setNewStock({
            stockName: "",
            description: "",
            quantity: "",
            supplierName: "",
            category: "",
            pricePerUnit: "",
          });

          setShowModal(false);
          setMessage("");
          setMessageType("");
        } else {
          setMessage(
            `Unexpected Response: ${
              updatedResponse.statusText || "Unknown issue"
            }`
          );
          setMessageType("error");
        }
      } else {
        setMessage(
          `Unexpected Response: ${response.statusText || "Unknown issue"}`
        );
        setMessageType("error");
      }
    } catch (error) {
      if (error.response) {
        setMessage(
          `Server Error: ${error.response.data.message || "An error occurred"}`
        );
      } else if (error.request) {
        setMessage("Request Error: No response from server.");
      } else {
        setMessage(`Unexpected Error: ${error.message}`);
      }
      setMessageType("error");
    } finally {
      setLoading(false); // Stop loading once the request is completed (success or failure)
    }
  };

  // lOGIC
  const products = [
    {
      name: "IFPD",
      partsRequired: {
        PowerBoard: 1,
        MainBoard: 1,
        Accessoriesbox: 1,
      },
      models: [
        {
          name: "BUNKA (65)",
          partsRequireds: {
            PowerBoard: 1,
            MainBoard: 1,
            Accessoriesbox: 1,
          },
        },
        {
          name: "HKC (75)",
          partsRequireds: {
            PowerBoard: 1,
            MainBoard: 1,
          },
        },
        {
          name: "SKYWORTH (75)",
          partsRequireds: {
            PowerBoard: 1,
            MainBoard: 1,
            Accessoriesbox: 1,
          },
        },
        {
          name: "SKYWORTH (86)",
          partsRequireds: {
            PowerBoard: 1,
            MainBoard: 1,
            Accessoriesbox: 1,
          },
        },
        {
          name: "OK VIEW (65)",
          partsRequireds: {
            PowerBoard: 1,
            MainBoard: 1,
          },
        },
        {
          name: "OK VIEW (75)",
          partsRequireds: {
            PowerBoard: 1,
            MainBoard: 1,
          },
        },
        {
          name: "OK VIEW (86)",
          partsRequireds: {
            PowerBoard: 1,
            MainBoard: 1,
          },
        },
      ],
    },

    {
      name: "Kiosk",
      partsRequired: {
        "touch 43'' kisok body": 1,
        "LOWER BASE 43 INCH": 1,
        "43 INCH LED TV with IR": 1,
        "RJ45 Male to Female Extension Cable": 1,
        "USB CABLE A TO A": 1,
        "USB CABLE M TO F": 1,
        "WIRELESS MOUSE": 1,
        "POWER EXTENSION BOARD": 1,
        "Rj 45 LAN": 1,
        "HDMI CONNECTER F TO F": 1,
        "USB 2.0 F TO F": 1,
        "ON /OFF SWITCH FOR DIGITAL KIOSK": 1,
        "OPS adapter With power cable": 1,
        "socket power adaptor": 1,
      },
      models: [
        // { name: "Model X (Small)", count: 4 },
        // { name: "Model Y (Large)", count: 6 },
      ],
    },
    {
      name: "Podium",
      partsRequired: {
        "Digital podium metal body": 1,
        "Amplifier -mixer (DPA 570M, Ahuja)": 1,
        "Ceiling mount speakers (CSD-6303T, Ahuja)": 2,
        "Table stand (GMB-6C, Ahuja)": 1,
        "Gooseneck mic 23'' (GM615M, Ahuja)": 1,
        "Microphone single (AWM-495V1, Ahuja)": 1,
        "AOC touch monitor 21.5''": 1,
        "Wireless keyboard mouse (DELL/LAPCARE)": 1,
        "LAN cable (2MTR, Dlink)": 1,
        "HDMI cable 4k (3MTRS)": 3,
        "USB A to A (3.0, 3MTRS)": 2,
        "LAN switch 5 ports (DES-100C 5 PORT, Dlink)": 1,
        "XLR M to F cable (3MTRS)": 1,
        "VGA cable (3MTRS)": 2,
        "AUX to 3.5 MM cable (3MTRS)": 2,
        "RJ45 LAN cable (3MTRS, Dlink)": 3,
        "Actuator with adaptor (80MM Stroke Length)": 1,
        "Multimedia controller": 1,
        "RJ45 Male to Female Extension Cable (300mm)": 1,
      },
      models: [
        // { name: "Standard Model", count: 3 }
      ],
    },
    {
      name: "Product D",
      count: 10,
      models: [
        // { name: "Model Basic", count: 10 }
      ],
    },
    {
      name: "Product E",
      count: 3,
      models: [
        // { name: "Basic Unit", count: 3 }
      ],
    },
    {
      name: "Product F",
      count: 5,
      models: [
        // { name: "Default", count: 5 }
      ],
    },
  ];

  // Fetch stock data from MongoDB
  const fetchStockData = async () => {
    try {
      const response = await axios.get(
        "https://imserver.onrender.com/api/stocks"
      );
      const stock = response.data;

      // Create stock data object (map stock name to quantity)
      const stockObj = stock.reduce((acc, item) => {
        acc[item.stockName] = item.quantity;
        return acc;
      }, {});
      setLoading(false);

      setStockData(stockObj);
    } catch (error) {
      setLoading(false);
      console.error("Error fetching stock data:", error);
    }
  };

  // Calculate product counts based on available parts
  const calculateProductCount = (product) => {
    if (product.count) {
      return product.count;
    }

    const requiredParts = product.partsRequired;
    const availableParts = stockData;

    let minCount = Infinity;

    // Calculate the available count for each part based on stock data
    for (const part in requiredParts) {
      if (
        availableParts[part] === undefined ||
        availableParts[part] < requiredParts[part]
      ) {
        return 0; // Not enough stock to produce this product
      }
      const partCount = Math.floor(availableParts[part] / requiredParts[part]);
      minCount = Math.min(minCount, partCount);
    }

    return minCount;
  };

  // Calculate model counts based on available parts for each model inside a product
  const calculateModelCount = (model, availableParts) => {
    const requiredParts = model.partsRequireds;

    let minCount = Infinity;

    // Calculate the available count for each part based on stock data
    for (const part in requiredParts) {
      if (
        availableParts[part] === undefined ||
        availableParts[part] < requiredParts[part]
      ) {
        return 0; // Not enough stock to produce this model
      }
      const partCount = Math.floor(availableParts[part] / requiredParts[part]);
      minCount = Math.min(minCount, partCount);
    }

    return minCount;
  };

  // Update product and model counts when stock data changes
  useEffect(() => {
    if (Object.keys(stockData).length > 0) {
      const updatedProducts = products.map((product) => {
        // Calculate product count
        const productCount = calculateProductCount(product);

        // Calculate model counts for each model within the product
        const updatedModels = product.models.map((model) => ({
          ...model,
          count: calculateModelCount(model, stockData),
        }));

        return {
          ...product,
          count: productCount,
          models: updatedModels,
        };
      });

      setProductCounts(updatedProducts);
    }
  }, [stockData]);

  // Fetch stock data when component mounts
  useEffect(() => {
    fetchStockData();
  }, []);

  // Toggle dropdown for products (optional)
  const toggleDropdown = (productName) => {
    setExpandedProduct(expandedProduct === productName ? null : productName);
  };
  // lOGIC ENDS

  // Extra Logic
  const [remainingParts, setRemainingParts] = useState({});
  const calculateRemainingParts = (products, stockData) => {
    // Create a copy of the stock data
    const remainingParts = { ...stockData };

    products.forEach((product) => {
      const requiredParts = product.partsRequired || {};
      const productCount = product.count || calculateProductCount(product);

      // Deduct parts used for this product
      for (const part in requiredParts) {
        if (remainingParts[part] !== undefined) {
          remainingParts[part] -= requiredParts[part] * productCount;
        }
      }

      // Deduct parts for models under this product
      product.models.forEach((model) => {
        const modelRequiredParts = model.partsRequired || {};
        const modelCount = model.count || calculateModelCount(model, stockData);

        for (const part in modelRequiredParts) {
          if (remainingParts[part] !== undefined) {
            remainingParts[part] -= modelRequiredParts[part] * modelCount;
          }
        }
      });
    });

    // Set negative values to zero
    Object.keys(remainingParts).forEach((part) => {
      if (remainingParts[part] < 0) {
        remainingParts[part] = 0;
      }
    });

    return remainingParts;
  };

  useEffect(() => {
    if (Object.keys(stockData).length > 0 && products.length > 0) {
      const updatedRemainingParts = calculateRemainingParts(
        products,
        stockData
      );
      setRemainingParts((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(updatedRemainingParts)) {
          return updatedRemainingParts;
        }
        return prev;
      });
    }
  }, [stockData, products]);
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

  return (
    <>
      <div
        style={{
          padding: "40px 20px",
          background: "#f7f8fa",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: "'Poppins', sans-serif",
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
          Stock Dashboard
        </h1>
        <h2
          style={{
            fontSize: "0.9rem",
            color: "#6c757d",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          Track Your Stock Movements In Real-Time
        </h2>
        {/* DashBoard */}
        <table
          style={{
            width: "64%",
            marginBottom: "20px",
            borderCollapse: "collapse",
            background: "linear-gradient(135deg, #6a11cb, #2575fc)",
            color: "#fff",
            fontFamily: "'Roboto', sans-serif",
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow: "0px 10px 40px rgba(0, 0, 0, 0.1)",
          }}
        >
          <thead>
            <tr
              style={{
                background: "linear-gradient(135deg, #6a11cb, #2575fc)",
                color: "#fff",
                textAlign: "center",
              }}
            >
              <th
                style={{
                  padding: "15px",
                  fontSize: "1.4rem",
                  fontWeight: "900",
                }}
              >
                Product Name
              </th>
              <th
                style={{
                  padding: "15px",
                  fontSize: "1.4rem",
                  fontWeight: "800",
                }}
              >
                Product Count
              </th>
            </tr>
          </thead>
          <tbody>
            {productCounts.map((product, index) => (
              <React.Fragment key={index}>
                <tr
                  style={{
                    transition: "background-color 0.3s ease",
                    cursor: "pointer",
                  }}
                  onClick={() => toggleDropdown(product.name)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.2)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <td
                    style={{
                      padding: "15px",
                      fontSize: "1rem",
                      fontWeight: "600",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
                      textTransform: "capitalize",
                      textAlign: "center",
                    }}
                  >
                    {product.name}
                  </td>
                  <td
                    style={{
                      padding: "15px",
                      fontSize: "1rem",
                      fontWeight: "700",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
                      textAlign: "center",
                    }}
                  >
                    {product.count}
                  </td>
                </tr>
                {expandedProduct === product.name &&
                  product.models?.map((model, idx) => (
                    <tr
                      key={idx}
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <td
                        style={{
                          padding: "15px",
                          fontSize: "0.9rem",
                          fontWeight: "500",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
                          textAlign: "center",
                          textTransform: "capitalize",
                        }}
                      >
                        {model.name}
                      </td>
                      <td
                        style={{
                          padding: "15px",
                          fontSize: "0.9rem",
                          fontWeight: "600",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
                          textAlign: "center",
                        }}
                      >
                        {model.count}
                      </td>
                    </tr>
                  ))}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="2" style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: "0.9rem",
                    marginTop: "10px",
                    marginLeft: "15px",
                    color: "#dcdcdc",
                    textAlign: "center",
                    fontFamily: "'Roboto', sans-serif",
                    maxWidth: "900px",
                    lineHeight: "1",
                  }}
                >
                  This dashboard shows available stock and calculates how many
                  finished goods can be produced, helping you plan production
                  efficiently.
                </p>
              </td>
            </tr>
          </tfoot>
        </table>
        {/* DashBoard End */}
        {/* Filters (visible only when scroll position is greater than 50px) */}
        {showFilters && (
          <div
            style={{
              marginBottom: "30px",
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              flexWrap: "wrap",
              position: "fixed", // Fixed to top
              top: "0",
              left: "0",
              width: "100%", // Ensure it spans the full width
              zIndex: "10",
              background: "rgba(255, 255, 255, 0.7)", // Background with opacity
              backdropFilter: "blur(8px)", // Glass effect
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
                  width: "50%", // Adjust width to half
                  transition: "all 0.3s ease",
                  outline: "none",
                  background: "rgba(255, 255, 255, 0.6)",
                }}
              />
              <input
                type="text"
                placeholder="Search by Category"
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                style={{
                  padding: "12px 20px",
                  borderRadius: "50px",
                  border: "1px solid #ddd",
                  fontSize: "1rem",
                  width: "50%", // Adjust width to half
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
                  outline: "none",
                  background: "rgba(255, 255, 255, 0.6)",
                }}
              />
            </div>
          </div>
        )}
        {/* Add New stock */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "20px",
          }}
        ></div>
        {showModal && (
          <>
            <div
              onClick={() => setShowModal(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0, 0, 0, 0.5)",
                zIndex: 99,
              }}
            ></div>
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: showModal
                  ? "translate(-50%, -50%) scale(1)"
                  : "translate(-50%, -50%) scale(0.9)",
                background: "white",
                padding: "30px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                borderRadius: "12px",
                zIndex: 1000,
                width: "90%",
                maxWidth: "500px",
                animation: showModal
                  ? "fadeInScaleHighEnd 0.6s cubic-bezier(0.23, 1, 0.32, 1)"
                  : "fadeOutScaleHighEnd 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
                opacity: showModal ? 1 : 0,
                transition:
                  "opacity 0.6s cubic-bezier(0.23, 1, 0.32, 1), transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
              }}
            >
              <h2
                style={{
                  background: "linear-gradient(90deg, #6a11cb, #2575fc)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textAlign: "center",
                  marginBottom: "20px",
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "1.8rem",
                  fontWeight: "bold",
                  textShadow: "2px 4px 6px rgba(0, 0, 0, 0.2)",
                }}
              >
                Add New Stock
              </h2>

              <form onSubmit={handleAddStock}>
                {[
                  { name: "stockName", placeholder: "Stock Name" },
                  { name: "description", placeholder: "Description" },
                  {
                    name: "quantity",
                    placeholder: "Quantity",
                    type: "number",
                    min: 1,
                  },
                  { name: "supplierName", placeholder: "Supplier Name" },
                  { name: "category", placeholder: "Category" },
                  {
                    name: "pricePerUnit",
                    placeholder: "Price per Unit",
                    type: "number",
                  },
                  {
                    name: "dateOfEntry",
                    placeholder: "Date of Entry",
                    type: "date",
                  },
                ].map((field) => (
                  <input
                    key={field.name}
                    type={field.type || "text"}
                    name={field.name}
                    placeholder={field.placeholder}
                    value={newStock[field.name]}
                    onChange={handleInputChange}
                    style={{
                      marginBottom: "12px",
                      padding: "12px",
                      width: "100%",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      fontSize: "1rem",
                      boxShadow: "inset 0px 2px 4px rgba(0, 0, 0, 0.05)",
                      transition: "border-color 0.2s ease",
                    }}
                    min={field.min}
                    required
                    onFocus={(e) => (e.target.style.borderColor = "#2575fc")}
                    onBlur={(e) => (e.target.style.borderColor = "#ddd")}
                  />
                ))}
                <button
                  type="submit"
                  style={{
                    background: "linear-gradient(90deg, #6a11cb, #2575fc)",
                    color: "white",
                    padding: "12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    width: "100%",
                    fontSize: "1rem",
                    border: "none",
                    marginTop: "10px",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "scale(1.02)";
                    e.target.style.boxShadow =
                      "0px 8px 16px rgba(0, 0, 0, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "scale(1)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  Add Stock
                </button>
              </form>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  marginTop: "12px",
                  background: "linear-gradient(90deg, #e53e3e, #f56565)", // Gradient from one shade of red to another
                  color: "white",
                  padding: "14px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  width: "100%",
                  fontSize: "1.1rem",
                  border: "none",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background =
                    "linear-gradient(90deg, #c53030, #e53e3e)"; // Darker gradient on hover
                  e.target.style.transform = "scale(1.05)";
                  e.target.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background =
                    "linear-gradient(90deg, #e53e3e, #f56565)"; // Reset gradient on mouse leave
                  e.target.style.transform = "scale(1)";
                  e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
                }}
              >
                Close
              </button>
            </div>
          </>
        )}
        {/* Stock Table */}
        <div
          style={{
            width: "80%",
            maxWidth: "1000px",
            marginBottom: "40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Bulk Upload */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap", // Wrap buttons to next line if necessary
              justifyContent: "center", // Center align horizontally
              alignItems: "center", // Center align vertically
              gap: "20px", // Space between buttons
              padding: "20px", // Add padding to the container
            }}
          >
            <Link to="/outdashboard">
              <Button
                className="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #6a11cb, #2575fc)",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "30px",
                  border: "none",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.3s ease-in-out",
                  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
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
                <i
                  className="bi bi-arrow-left"
                  style={{
                    marginRight: "10px",
                    fontSize: "1.2rem",
                  }}
                ></i>
                Out
              </Button>
            </Link>

            <label
              style={{
                padding: "12px 20px",
                background: "linear-gradient(90deg, #6a11cb, #2575fc)",
                color: "white",
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
              Bulk Upload via Excel
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </label>

            <button
              onClick={() => setShowModal(true)}
              className="button"
              style={{
                padding: "12px 20px",
                background: "linear-gradient(90deg, #6a11cb, #2575fc)",
                color: "white",
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
              Add New Stock
            </button>

            <button
              className="button"
              onClick={handleExport}
              style={{
                padding: "12px 20px",
                background: "linear-gradient(90deg, #6a11cb, #2575fc)",
                color: "white",
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

            <p
              style={{
                fontSize: "0.9rem",
                color: "#6c757d",
              }}
            >
              Upload a valid Excel file with columns:{" "}
              <strong>
                Stock Name, Description, Quantity, Supplier, Category, Price Per
                Unit, Date of Entry
              </strong>
            </p>
          </div>
          {/* Table Start */}
          <div
            className="table-container"
            style={{
              width: "100%", // Set width to 100% for responsiveness
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
                    Supplier
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
                    Leftover
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
                    LastUpdated
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
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      style={{ textAlign: "center", height: "100px" }}
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredStocks.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      style={{
                        textAlign: "center",
                        height: "100px",
                      }}
                    >
                      No matching results found.
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stock) => (
                    <tr key={stock.id} style={{ backgroundColor: "#fff" }}>
                      <td
                        style={{
                          padding: "15px 20px",
                          textAlign: "center",
                        }}
                      >
                        {stock.stockName}
                      </td>
                      <td style={{ padding: "15px 20px", textAlign: "center" }}>
                        {stock.category}
                      </td>
                      <td style={{ padding: "15px 20px", textAlign: "center" }}>
                        {stock.supplierName}
                      </td>
                      <td
                        style={{
                          padding: "15px 20px",
                          textAlign: "center",
                          color: stock.quantity <= 10 ? "#e53e3e" : "#28a745",
                        }}
                      >
                        {stock.quantity}
                      </td>
                      <td
                        style={{
                          padding: "15px 20px",
                          textAlign: "center",
                          color:
                            remainingParts[stock.stockName] > 0
                              ? "#28a745"
                              : "#e53e3e",
                        }}
                      >
                        {(() => {
                          if (remainingParts[stock.stockName] !== undefined) {
                            const remaining = remainingParts[stock.stockName];
                            return remaining > 0
                              ? remaining
                              : "Not Enough Stock";
                          }
                          return "Stock Data Missing";
                        })()}
                      </td>
                      <td style={{ padding: "15px 20px", textAlign: "center" }}>
                        {new Date(stock.updatedAt).toLocaleDateString("en-GB")}
                      </td>
                      <td>
                        <Row>
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
                                setSelectedEntry(stock);
                                setShowDetailsModal(true);
                              }}
                            >
                              <FaEye style={{ marginBottom: "3px" }} />
                            </Button>
                            <button
                              className="editBtn mx-2"
                              onClick={() => {
                                if (stock) {
                                  setSelectedEntry(stock);
                                  setUpdatedDescription(stock.description);
                                  setUpdatedQuantity(stock.quantity);
                                  setShowUpdateModal(true);
                                }
                              }}
                            >
                              <svg height="1em" viewBox="0 0 512 512">
                                <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path>
                              </svg>
                            </button>
                          </Col>
                        </Row>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </div>{" "}
        {/* Modal to show selected entry details */}
        {selectedEntry && (
          <Modal show={showDetailsModal} onHide={handleCloseModal} centered>
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
                Inventory Entry Details
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
                        value: selectedEntry.stockName || "Not Available",
                        icon: "📦",
                      },
                      {
                        label: "Description",
                        value: selectedEntry.description || "Not Available",
                        icon: "📝",
                      },
                      {
                        label: "Quantity",
                        value: selectedEntry.quantity || "Not Available",
                        icon: "🔢",
                      },
                      {
                        label: "Supplier Name",
                        value: selectedEntry.supplierName || "Not Available",
                        icon: "👷",
                      },
                      {
                        label: "Category",
                        value: selectedEntry.category || "Not Available",
                        icon: "📋",
                      },
                      {
                        label: "Price Per Unit",
                        value: `INR ${selectedEntry.pricePerUnit.toFixed(2)}`,
                        icon: "💰",
                      },
                      {
                        label: "Date of Entry",
                        value: new Date(
                          selectedEntry.dateOfEntry
                        ).toLocaleDateString(),
                        icon: "📅",
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
                          transition:
                            "transform 0.2s ease, box-shadow 0.2s ease",
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
                onClick={handleCloseModal}
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
        <div>
          {/* Update Modal */}
          {selectedEntry && (
            <Modal
              show={showUpdateModal}
              onHide={handleCloseUpdateModal}
              centered
            >
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
                  Update Stock Entry Details
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form
                  style={{ fontFamily: "'Poppins', sans-serif", color: "#444" }}
                >
                  <div
                    className="modal-info"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: "20px",
                      padding: "10px",
                    }}
                  >
                    {/* Stock Name Field */}
                    <Form.Group
                      controlId="formStockName"
                      style={{ position: "relative" }}
                    >
                      <Form.Label
                        style={{
                          fontWeight: "bold",
                          color: "#2575fc",
                          fontSize: "1.1rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span role="img" aria-label="stock">
                          📦
                        </span>{" "}
                        Stock Name
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={selectedEntry?.stockName || ""}
                        disabled
                        style={{
                          background: "#f7f8fa",
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                          padding: "10px 15px",
                          fontSize: "1rem",
                          color: "#333",
                          boxShadow: "inset 0px 2px 4px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                    </Form.Group>

                    {/* Description Field */}
                    <Form.Group
                      controlId="formDescription"
                      style={{ position: "relative" }}
                    >
                      <Form.Label
                        style={{
                          fontWeight: "bold",
                          color: "#2575fc",
                          fontSize: "1.1rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span role="img" aria-label="description">
                          📝
                        </span>{" "}
                        Description
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={updatedDescription}
                        onChange={(e) => setUpdatedDescription(e.target.value)}
                        style={{
                          background: "#f7f8fa",
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                          padding: "10px 15px",
                          fontSize: "1rem",
                          color: "#333",
                          boxShadow: "inset 0px 2px 4px rgba(0, 0, 0, 0.1)",
                        }}
                        placeholder="Enter updated description"
                      />
                    </Form.Group>

                    {/* Quantity Field */}
                    <Form.Group
                      controlId="formQuantity"
                      style={{ position: "relative" }}
                    >
                      <Form.Label
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
                      </Form.Label>
                      <Form.Control
                        type="number"
                        value={updatedQuantity}
                        onChange={(e) => setUpdatedQuantity(e.target.value)}
                        style={{
                          background: "#f7f8fa",
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                          padding: "10px 15px",
                          fontSize: "1rem",
                          color: "#333",
                          boxShadow: "inset 0px 2px 4px rgba(0, 0, 0, 0.1)",
                        }}
                        placeholder="Enter updated quantity"
                      />
                    </Form.Group>
                  </div>
                </Form>
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
                  onClick={handleCloseUpdateModal}
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
                      (e.target.style.boxShadow =
                        "0 2px 5px rgba(0, 0, 0, 0.2)") // Pressed effect
                  }
                  onMouseUp={
                    (e) =>
                      (e.target.style.boxShadow =
                        "0 4px 10px rgba(0, 0, 0, 0.2)") // Reset on release
                  }
                >
                  Close
                </Button>

                <Button
                  variant="primary"
                  onClick={handleUpdate}
                  style={{
                    background: "linear-gradient(135deg, #4CAF50, #2E7D32)", // Smooth gradient
                    color: "#fff", // White text
                    padding: "10px 20px", // Spacious padding
                    borderRadius: "25px", // Rounded edges
                    border: "none", // No border
                    fontSize: "1rem", // Readable font size
                    fontWeight: "bold", // Bold text
                    cursor: "pointer", // Pointer cursor on hover
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)", // Soft shadow
                    transition: "transform 0.2s ease, box-shadow 0.2s ease", // Smooth animations
                  }}
                  onMouseEnter={
                    (e) => (e.target.style.transform = "scale(1.05)") // Slight scale up on hover
                  }
                  onMouseLeave={(e) => {
                    e.target.style.transform = "scale(1)"; // Reset scale on leave
                    e.target.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.2)"; // Reset shadow
                  }}
                  onMouseDown={
                    (e) =>
                      (e.target.style.boxShadow =
                        "0 2px 5px rgba(0, 0, 0, 0.2)") // Pressed effect
                  }
                  onMouseUp={
                    (e) =>
                      (e.target.style.boxShadow =
                        "0 4px 10px rgba(0, 0, 0, 0.2)") // Reset on release
                  }
                >
                  Update
                </Button>
              </Modal.Footer>
            </Modal>
          )}
        </div>
      </div>
    </>
  );
}

export default StockDashboard;
