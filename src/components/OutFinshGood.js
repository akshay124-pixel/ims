import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, Row, Col, Modal } from "react-bootstrap";
import { Box, CircularProgress } from "@mui/material";
import { FaEye } from "react-icons/fa";
import { Link } from "react-router-dom";
function OutFinshGood() {
  const [outFinishedGoods, setOutFinishedGoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch data from the backend
  useEffect(() => {
    const fetchOutFinishedGoods = async () => {
      try {
        const response = await axios.get(
          "https://imserver.onrender.com/api/fetchoutFinishedGoods"
        );
        setOutFinishedGoods(response.data);
      } catch (error) {
        console.error("Error fetching out finished goods:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOutFinishedGoods();
  }, []);
  // Handle modal close
  const handleClose = () => setShowModal(false);

  // Handle modal show with selected item
  const handleShow = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  // Out Finished Goods Expot to Excel
  // Export
  const handleExport = async () => {
    try {
      // Send request using Axios to export stock data
      const response = await axios.get(
        "https://imserver.onrender.com/api/out-finished-goods-export",
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
      link.download = "outfinshGood.xlsx"; // Set the default filename
      link.click();

      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting Out FinshGood data:", error);
      alert("An error occurred while exporting stock data.");
    }
  };

  return (
    <>
      {" "}
      <div>
        <h1
          className="text-center my-5"
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
          Out Finished Goods
        </h1>
        <p
          className="text-center"
          style={{
            marginTop: "-35px",
            fontSize: "1rem",
            color: "#555",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          Explore your out finished goods efficiently.
        </p>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "start",
          marginLeft: "150px",
        }}
      >
        <Link to="/finsh" style={{ textDecoration: "none" }}>
          {" "}
          <Button
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
            >
              {" "}
              Back
            </i>
          </Button>
        </Link>
        <Button
          onClick={handleExport}
          style={{
            display: "flex",
            marginLeft: "66%",
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
          Export to Excel
          <i
            className="bi bi-arrow-right"
            style={{
              marginLeft: "10px",
              fontSize: "1.2rem",
            }}
          ></i>
        </Button>
      </div>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
          <CircularProgress />
        </Box>
      ) : outFinishedGoods.length > 0 ? (
        <div
          className="table-container my-5"
          style={{
            width: "100%",
            margin: "0 auto",
            overflowX: "hidden",
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.1)",
            borderRadius: "15px",
            marginTop: "20px",
            display: "block",
            overflowY: "auto",
            maxHeight: "450px",
            maxWidth: "80%",
            height: "auto",
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
                {[
                  "Product Name",
                  "Quantity",
                  "Address",
                  "Price",
                  "Recipient Name",
                  "Date of Issue",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
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
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody
              style={{
                backgroundColor: "white",
                overflowY: "auto",
                maxHeight: "calc(450px - 45px)",
              }}
            >
              {outFinishedGoods.map((item) => (
                <tr key={item._id}>
                  <td style={{ padding: "15px 20px", textAlign: "center" }}>
                    {item.productName}
                  </td>
                  <td style={{ padding: "15px 20px", textAlign: "center" }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: "15px 20px", textAlign: "center" }}>
                    {item.address}
                  </td>
                  <td style={{ padding: "15px 20px", textAlign: "center" }}>
                    {item.price}
                  </td>
                  <td style={{ padding: "15px 20px", textAlign: "center" }}>
                    {item.recipientName}
                  </td>
                  <td style={{ padding: "15px 20px", textAlign: "center" }}>
                    {new Date(item.dateOfIssue).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "15px 20px" }}>
                    <Row>
                      <Col className="d-flex justify-content-center">
                        <Button
                          variant="primary"
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            transition: "transform 0.2s",
                          }}
                          onClick={() => handleShow(item)}
                          onMouseOver={(e) =>
                            (e.target.style.transform = "scale(1.1)")
                          }
                          onMouseOut={(e) =>
                            (e.target.style.transform = "scale(1)")
                          }
                        >
                          <FaEye style={{ marginBottom: "3px" }} />
                        </Button>
                      </Col>
                    </Row>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Modal for Viewing Details */}
          <Modal show={showModal} onHide={handleClose} centered>
            {/* Modal Header */}
            <Modal.Header
              closeButton
              style={{
                background: "linear-gradient(135deg, #6a11cb, #2575fc)",
                color: "white",
                borderBottom: "3px solid #2575fc",
                textShadow: "1px 1px 2px rgba(0, 0, 0, 0.5)",
                padding: "15px 20px",
              }}
            >
              <Modal.Title
                className="text-center w-100"
                style={{
                  fontWeight: "bold",
                  fontSize: "1.6rem",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                }}
              >
                <i className="bi bi-eye-fill me-2"></i> View Details
              </Modal.Title>
            </Modal.Header>

            {/* Modal Body */}
            <Modal.Body>
              {selectedItem ? (
                <div
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    color: "#444",
                    fontSize: "1.1rem",
                    lineHeight: "1.8",
                    animation: "fadeIn 0.5s ease-in-out",
                    backgroundColor: "#f9f9f9",
                    borderRadius: "10px",

                    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {[
                    {
                      label: "Product Name",
                      value: selectedItem.productName || "Not Available",
                      icon: "bi-box2-fill",
                      color: "text-primary",
                    },
                    {
                      label: "Quantity",
                      value: selectedItem.quantity || "Not Available",
                      icon: "bi-stack",
                      color: "text-success",
                    },
                    {
                      label: "Address",
                      value: selectedItem.address || "Not Available",
                      icon: "bi-geo-alt-fill",
                      color: "text-danger",
                    },
                    {
                      label: "Price",
                      value: selectedItem.price || "Not Available",
                      icon: "bi-currency-dollar",
                      color: "text-warning",
                    },
                    {
                      label: "Recipient Name",
                      value: selectedItem.recipientName || "Not Available",
                      icon: "bi-person-circle",
                      color: "text-info",
                    },
                    {
                      label: "Date of Issue",
                      value:
                        new Date(
                          selectedItem.dateOfIssue
                        ).toLocaleDateString() || "Not Available",
                      icon: "bi-calendar-date-fill",
                      color: "text-secondary",
                    },
                  ].map(({ label, value, icon, color }, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "15px",
                        marginBottom: "15px",
                        padding: "10px",
                        borderRadius: "10px",
                        background: "#ffffff",
                        boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.1)",
                        transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.03)";
                        e.currentTarget.style.boxShadow =
                          "0px 6px 12px rgba(0, 0, 0, 0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow =
                          "0px 2px 6px rgba(0, 0, 0, 0.1)";
                      }}
                    >
                      <i
                        className={`bi ${icon} ${color}`}
                        style={{
                          fontSize: "1.8rem",
                          display: "flex",
                          alignItems: "center",
                          width: "11%",
                          backgroundColor: "#f0f0f0",
                          padding: "10px",
                          borderRadius: "50%",
                          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                        }}
                      ></i>
                      <div>
                        <p
                          style={{
                            margin: "0",
                            fontSize: "1rem",
                            fontWeight: "bold",
                            color: "#333",
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
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#aaa",
                    animation: "fadeIn 0.5s ease-in-out",
                  }}
                >
                  <i className="bi bi-hourglass-split fs-3"></i>
                  <p>Loading details...</p>
                </div>
              )}
            </Modal.Body>

            {/* Modal Footer */}
            <Modal.Footer
              style={{
                color: "white",

                padding: "15px 20px",
              }}
            >
              <Button
                variant="secondary"
                onClick={handleClose}
                style={{
                  background: "linear-gradient(135deg, #FF5252, #D50000)",
                  color: "#fff",
                  padding: "12px 30px",
                  borderRadius: "25px",
                  fontWeight: "bold",
                  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.3)",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.transform = "scale(1.1) translateY(-5px)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.transform = "scale(1) translateY(0)")
                }
              >
                <i className="bi bi-x-circle-fill me-2"></i> Close
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
        </div>
      ) : (
        <Box sx={{ textAlign: "center", marginTop: 4 }}>
          <p style={{ fontSize: "16px", fontStyle: "italic", color: "gray" }}>
            No finished goods available.
          </p>
        </Box>
      )}
    </>
  );
}

export default OutFinshGood;
