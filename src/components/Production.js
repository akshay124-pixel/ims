import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Box,
  Snackbar,
  IconButton,
  Alert,
} from "@mui/material";
import { Button, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import Modal from "react-bootstrap/Modal";

const Production = () => {
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [activeStocks, setActiveStocks] = useState([]); // To track stocks assignable to production

  const [assemblyStatus, setAssemblyStatus] = useState("");
  const [remarks, setRemarks] = useState("");

  // Check list itms

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "https://imserver.onrender.com/api/production"
      );

      const filteredItems = response.data.filter(
        (item) =>
          item.assemblyStatus !== "Assembled" && item.assemblyStatus !== "Used"
      );
      setOutOfStockItems(filteredItems);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching out-of-stock items:", err);
      setError("Error fetching data. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleOpenModal = (item) => {
    setSelectedEntry(item);
    setShowActionModal(true);
  };

  const handleCloseModal = () => {
    setShowActionModal(false);
    setSelectedEntry(null);

    setAssemblyStatus("");
    setRemarks("");
  };

  const handleFormSubmit = async () => {
    if (!selectedEntry || !selectedEntry._id) {
      alert("Stock ID is missing");
      return;
    }

    try {
      const response = await axios.put(
        `https://imserver.onrender.com/api/update-out/${selectedEntry._id}`,
        { remarks, assemblyStatus }
      );

      if (response.status === 200) {
        toast.success("Stock updated successfully");
        fetchItems();
        const updatedStock = response.data;

        setOutOfStockItems((prevStocks) =>
          prevStocks.map((stock) =>
            stock._id === updatedStock._id ? updatedStock : stock
          )
        );

        // Clear the inputs
        setRemarks("");

        setAssemblyStatus("");

        // Close the modal
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Error updating stock");
    }
  };

  const [checkedItems, setCheckedItems] = useState([]); // Tracks checked items

  // Function to open modal with filtered stocks
  const handleOpenCheckModal = (targetStocks) => {
    const filteredStocks = outOfStockItems.filter((item) =>
      targetStocks.includes(item.stockId.stockName)
    );
    setActiveStocks(filteredStocks);
    setCheckedItems([]); // Reset checked items
    setIsModalOpen(true); // Open modal
  };

  // Function to handle checkbox toggle
  const handleCheckboxChange = (stockId) => {
    setCheckedItems((prev) =>
      prev.includes(stockId)
        ? prev.filter((id) => id !== stockId)
        : [...prev, stockId]
    );
  };

  // Function to handle modal submission
  const handleModalSubmit = async () => {
    if (checkedItems.length !== activeStocks.length) {
      alert("Please check all items before submitting.");
      return;
    }

    try {
      // Iterate through all active stocks to update their assembly status
      for (const stock of activeStocks) {
        const response = await axios.put(
          `https://imserver.onrender.com/api/update-out/${stock._id}`,
          { assemblyStatus: "Assembled" } // Update the assembly status
        );

        if (response.status === 200) {
          const updatedStock = response.data;

          // Update the stock in the UI
          setOutOfStockItems((prevStocks) =>
            prevStocks.map((s) =>
              s._id === updatedStock._id ? updatedStock : s
            )
          );
        }
      }

      // Show success toast
      toast.success("All items assembled successfully!");

      // Refresh the stock list
      fetchItems();

      // Close the modal
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating stocks:", error);
      toast.error("Failed to update stock status.");
    }
  };
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to close the modal
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      {/* Advanced High-End UI Bar with Gradient Background */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(90deg, #4e54c8, #8f94fb)", // Gradient background
          padding: "15px 25px",

          boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.2)",

          gap: "20px",
        }}
      >
        {/* Button - IFPD */}
        <Button
          className="flagship-button large"
          onClick={() => handleOpenCheckModal(["MainBoard", "PowerBoard"])}
          style={{
            padding: "14px 22px",
            background: "linear-gradient(135deg, #6a11cb, #2575fc)",
            color: "white",
            borderRadius: "20px",
            border: "none",
            fontSize: "1rem",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.3s ease-in-out",
            boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.2)",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-4px)";
            e.target.style.boxShadow = "0px 8px 16px rgba(0, 0, 0, 0.25)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0px 6px 12px rgba(0, 0, 0, 0.2)";
          }}
        >
          IFPD
        </Button>

        {/* Button - KIOSK */}
        <Button
          className="flagship-button large"
          onClick={() => handleOpenCheckModal(["Sensor", "Display"])}
          style={{
            padding: "14px 22px",
            background: "linear-gradient(135deg, #6a11cb, #2575fc)",
            color: "white",
            borderRadius: "20px",
            border: "none",
            fontSize: "1rem",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.3s ease-in-out",
            boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.2)",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-4px)";
            e.target.style.boxShadow = "0px 8px 16px rgba(0, 0, 0, 0.25)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0px 6px 12px rgba(0, 0, 0, 0.2)";
          }}
        >
          KIOSK
        </Button>

        {/* Button - Digital Podium */}
        <Button
          className="flagship-button large"
          onClick={() => handleOpenCheckModal(["Body", "PodiumDisplay"])}
          style={{
            padding: "14px 22px",
            background: "linear-gradient(135deg, #6a11cb, #2575fc)",
            color: "white",
            borderRadius: "20px",
            border: "none",
            fontSize: "1rem",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.3s ease-in-out",
            boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.2)",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-4px)";
            e.target.style.boxShadow = "0px 8px 16px rgba(0, 0, 0, 0.25)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0px 6px 12px rgba(0, 0, 0, 0.2)";
          }}
        >
          Digital Podium
        </Button>

        {/* Button - PTZ Camera */}
        <Button
          className="flagship-button large"
          onClick={() =>
            handleOpenCheckModal(["Camera Body", "Camera Motherboard"])
          }
          style={{
            padding: "14px 22px",
            background: "linear-gradient(135deg, #6a11cb, #2575fc)",
            color: "white",
            borderRadius: "20px",
            border: "none",
            fontSize: "1rem",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.3s ease-in-out",
            boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.2)",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-4px)";
            e.target.style.boxShadow = "0px 8px 16px rgba(0, 0, 0, 0.25)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0px 6px 12px rgba(0, 0, 0, 0.2)";
          }}
        >
          PTZ Camera
        </Button>
      </div>

      <div>
        {/* Modal for assembly checklist */}
        {isModalOpen && (
          <div className="unique-app-modal-overlay">
            <div className="unique-app-modal-content">
              <h2>Assembly Checklist</h2>
              <p className="unique-app-modal-subtitle">
                {activeStocks.length > 0
                  ? "Select the parts assembled:"
                  : "No Stock Found"}
              </p>
              <ul className="unique-app-checklist">
                {activeStocks.length > 0 &&
                  activeStocks.map((stock) => (
                    <li className="unique-app-checklist-item" key={stock._id}>
                      <span className="unique-app-part-name">
                        {stock.stockId.stockName}
                      </span>
                      <input
                        type="checkbox"
                        onChange={() => handleCheckboxChange(stock._id)}
                        checked={checkedItems.includes(stock._id)}
                      />
                    </li>
                  ))}
              </ul>
              {activeStocks.length > 0 && (
                <div className="unique-app-action-buttons">
                  <button
                    className="unique-app-submit-btn"
                    onClick={handleModalSubmit}
                  >
                    Submit Assembly
                  </button>
                  <button className="unique-app-close-btn" onClick={closeModal}>
                    Close
                  </button>
                </div>
              )}
              {activeStocks.length === 0 && (
                <button className="unique-app-close-btn" onClick={closeModal}>
                  Close
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {/* modal end */}
      <Box sx={{ padding: 3, marginTop: 3 }}>
        {/* <Typography
          variant="h4"
          gutterBottom
          style={{
            background: "linear-gradient(90deg, #6a11cb, #2575fc)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textAlign: "center",
            textShadow: "2px 2px 8px rgba(0, 0, 0, 0.3)",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: "bold",
          }}
        >
          Production Team - Out of Stock Items
        </Typography> */}

        {/* Checklist  End */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", marginTop: 5 }}>
            <CircularProgress size={60} sx={{ color: "#2575fc" }} />
          </Box>
        ) : error ? (
          <Snackbar open={true} autoHideDuration={6000}>
            <Alert severity="error">{error}</Alert>
          </Snackbar>
        ) : (
          <TableContainer
            component={Paper}
            style={{
              width: "70%", // Set width to 100% for responsiveness
              margin: "0 auto", // Center the table container
              overflowX: "hidden", // Disable horizontal scrolling
              boxShadow: "0 6px 18px rgba(0, 0, 0, 0.1)", // Optional: Keep shadow for aesthetics

              marginTop: "20px", // Add margin for spacing from top
              display: "block", // Ensures the table body scrolls
              overflowY: "auto", // Adds vertical scroll
              borderRadius: "10px",
              maxHeight: "500px", // Set a fixed height for scrolling
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
              aria-label="out of stock items"
            >
              <TableHead
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
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      color: "white",
                      fontSize: "1.2rem",
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    Item Name
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      color: "white",
                      fontSize: "1.2rem",
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    Quantity
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      color: "white",
                      fontSize: "1.2rem",
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    Out of Stock Date
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      color: "white",
                      fontSize: "1.2rem",
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {outOfStockItems.length > 0 ? (
                  outOfStockItems.map((stock) => (
                    <TableRow
                      key={stock._id}
                      sx={{
                        "&:hover": { backgroundColor: "#f5f5f5" },
                        "&:nth-of-type(even)": { backgroundColor: "#f9f9f9" },
                      }}
                    >
                      <TableCell align="center">
                        {stock.stockId.stockName}
                      </TableCell>{" "}
                      {/* Using stockName from populated stockId */}
                      <TableCell align="center">{stock.quantity}</TableCell>
                      <TableCell align="center">
                        {new Date(stock.dateOfIssue).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <Row>
                          <Col className="d-flex justify-content-center">
                            <button
                              className="editBtn mx-2"
                              onClick={() => handleOpenModal(stock)}
                            >
                              <svg height="1em" viewBox="0 0 512 512">
                                <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path>
                              </svg>
                            </button>
                          </Col>
                        </Row>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      align="center"
                      sx={{ padding: "20px" }}
                    >
                      No out-of-stock items found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Modal for updating out-of-stock details */}
        {selectedEntry && (
          <Modal show={showActionModal} onHide={handleCloseModal} centered>
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
              ></Modal.Title>
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
                      rows="4"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      style={{
                        background: "#f7f8fa",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "10px 15px",
                        fontSize: "1rem",
                        color: "#333",
                        boxShadow: "inset 0px 2px 4px rgba(0, 0, 0, 0.1)",
                        width: "100%", // Makes the textarea responsive
                        maxWidth: "440px", // Optional: limits the width for large screens
                      }}
                      placeholder="Enter remarks"
                    />
                  </div>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer
              style={{
                borderTop: "2px solid #ddd",
                paddingTop: "10px",
                paddingBottom: "10px",
              }}
            >
              <button
                onClick={handleFormSubmit}
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
                onClick={handleCloseModal}
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        )}
      </Box>
    </>
  );
};

export default Production;
