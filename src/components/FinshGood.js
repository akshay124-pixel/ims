import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Row, Col, Modal, Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
function FinishedGoods() {
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [loading, setLoading] = useState(false);
  // State Variables
  const [show, setShow] = useState(false);
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");

  const [dateOfIssue, setDateOfIssue] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const fetchFinishedGoods = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          "http://localhost:4000/api/finished-goods"
        );
        setFinishedGoods(response.data);
      } catch (error) {
        console.error("Error fetching finished goods:", error);
        alert("Failed to fetch finished goods. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFinishedGoods();
  }, []);
  // Modal Logic
  // Open and Close Modal
  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    setError("");
  };

  // Validation Logic
  const validateForm = () => {
    if (!productName || !quantity || !recipientName || !dateOfIssue) {
      return "All fields are required.";
    }
    if (quantity <= 0) {
      return "Quantity must be greater than zero.";
    }
    if (new Date(dateOfIssue) > new Date()) {
      return "Date of issue cannot be a future date.";
    }
    return "";
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Prepare Payload
    const payload = {
      productName,
      quantity,
      address,
      price,
      recipientName,
      dateOfIssue,
    };

    try {
      await axios.post("http://localhost:4000/api/outFinishedGoods", payload);

      console.log("Submitting Data:", payload);
      toast.success("Form submitted successfully!");

      // Reset form fields
      setProductName("");
      setQuantity("");
      setRecipientName("");
      setDateOfIssue("");
      setError("");
      setShow(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit form. Please try again.");
    }
  };
  // Modal Logic end

  return (
    <>
      <Box sx={{ padding: 3, backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
        <Typography
          variant="h4"
          style={{
            background: "linear-gradient(90deg, #6a11cb, #2575fc)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            display: "flex",
            justifyContent: "center",
            textShadow: "2px 2px 8px rgba(0, 0, 0, 0.3)",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: "bold",
            marginTop: "20px",
          }}
        >
          Finished Goods
        </Typography>

        <Typography
          variant="subtitle1"
          style={{
            fontSize: "0.9rem",
            color: "#6c757d",
            marginTop: "10px",
            textAlign: "center",
          }}
        >
          Manage and Track Your Completed Products
        </Typography>
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 20 }}
        >
          <Link to="/outfinsh" style={{ textDecoration: "none" }}>
            <button
              className="button mx-1"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px", // Space between text and sticker
                padding: "12px 20px",
                background: "linear-gradient(90deg, #6a11cb, #2575fc)",
                color: "white",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "bold",
                border: "none",
                fontSize: "1.1rem",
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
              {/* Sticker/Icon */}
              <img
                src="https://cdn-icons-png.flaticon.com/512/190/190411.png" // Replace with your sticker URL
                alt="Sticker"
                style={{
                  width: "25px",
                  height: "25px",
                }}
              />
              {/* Button Text */}
              Out Finish Goods
            </button>
          </Link>
        </div>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper
            sx={{
              borderRadius: 4,
              overflow: "hidden",
              width: "80%",
              margin: "20px auto",
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Table>
              <TableHead
                sx={{
                  background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                  color: "#ffffff",
                }}
              >
                <TableRow>
                  <TableCell
                    sx={{
                      color: "#ffffff",
                      fontWeight: "bold",
                      padding: "16px",
                      fontSize: "16px",
                      textAlign: "center",
                    }}
                  >
                    Product Name
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "#ffffff",
                      fontWeight: "bold",
                      fontSize: "16px",
                      textAlign: "center",
                    }}
                  >
                    Quantity
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "#ffffff",
                      fontWeight: "bold",
                      fontSize: "16px",
                      textAlign: "center",
                    }}
                  >
                    Date
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "#ffffff",
                      fontWeight: "bold",
                      fontSize: "16px",
                      textAlign: "right",
                      paddingRight: "16px",
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "8px",
                      paddingRight: "16px",
                      marginRight: "60px",
                      textAlign: "center",
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {finishedGoods.length > 0 ? (
                  finishedGoods.map((product) => (
                    <TableRow
                      key={product._id.$oid}
                      hover
                      sx={{
                        "&:hover": {
                          backgroundColor: "rgba(245, 245, 245, 0.8)",
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          padding: "16px",

                          textAlign: "center",
                          fontSize: "14px",
                        }}
                      >
                        {product.productName}
                      </TableCell>
                      <TableCell sx={{ fontSize: "14px", textAlign: "center" }}>
                        {product.quantity}
                      </TableCell>
                      <TableCell sx={{ fontSize: "14px", textAlign: "center" }}>
                        {new Date(product.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "8px",
                          paddingRight: "12px",
                          marginRight: "50px",
                        }}
                      >
                        <Row>
                          <Col
                            className="d-flex justify-content-center"
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: "8px",
                              paddingRight: "16px",
                              marginRight: "10px",
                            }}
                          >
                            <button
                              className="editBtn mx-2"
                              onClick={handleShow}
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
                      colSpan={4}
                      align="center"
                      sx={{
                        padding: "20px",
                        fontSize: "16px",
                        fontStyle: "italic",
                        color: "gray",
                      }}
                    >
                      No finished goods available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>
      {/* Modal */}
      <Modal
        show={show}
        onHide={handleClose}
        centered
        style={{
          borderRadius: "10px",
          overflow: "hidden",
          background: "rgba(0, 0, 0, 0.2)",
        }}
      >
        <Modal.Header
          closeButton
          style={{
            background: "linear-gradient(90deg, #6a11cb, #2575fc)",
            color: "#fff",
          }}
        >
          <Modal.Title
            className="text-center w-100"
            style={{ fontWeight: "bold" }}
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/190/190411.png"
              alt="Sticker"
              style={{
                width: "40px",
                height: "40px",
                marginRight: "10px",
              }}
            />
            Out Stock Form
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}
        >
          {error && (
            <div
              style={{
                color: "#ff4d4d",
                marginBottom: "15px",
                backgroundColor: "#ffe6e6",
                padding: "10px",
                borderRadius: "5px",
              }}
            >
              {error}
            </div>
          )}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="stockName">
              <Form.Label style={{ fontWeight: "bold" }}>
                Product Name
              </Form.Label>
              <Form.Select
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
                style={{
                  borderRadius: "5px",
                  borderColor: "#ddd",
                  padding: "10px",
                  fontSize: "14px",
                }}
                placeholder="Select Stock"
              >
                <option value="">Select Stock</option>
                {finishedGoods.map((item) => (
                  <option key={item._id} value={item.productName}>
                    {item.productName}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="quantity">
              <Form.Label style={{ fontWeight: "bold" }}>Quantity</Form.Label>
              <Form.Control
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                style={{
                  borderRadius: "5px",
                  borderColor: "#ddd",
                  padding: "10px",
                  fontSize: "14px",
                }}
                placeholder="Enter Quantity"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="recipientName">
              <Form.Label style={{ fontWeight: "bold" }}>
                Recipient Name
              </Form.Label>
              <Form.Control
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
                style={{
                  borderRadius: "5px",
                  borderColor: "#ddd",
                  padding: "10px",
                  fontSize: "14px",
                }}
                placeholder="Enter Recipient Name"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="dateOfIssue">
              <Form.Label style={{ fontWeight: "bold" }}>
                Date of Issue
              </Form.Label>
              <Form.Control
                type="date"
                value={dateOfIssue}
                onChange={(e) => setDateOfIssue(e.target.value)}
                required
                style={{
                  borderRadius: "5px",
                  borderColor: "#ddd",
                  padding: "10px",
                  fontSize: "14px",
                }}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="address">
              <Form.Label style={{ fontWeight: "bold" }}>Address</Form.Label>
              <Form.Control
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                style={{
                  borderRadius: "5px",
                  borderColor: "#ddd",
                  padding: "10px",
                  fontSize: "14px",
                }}
                placeholder="Enter Address"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="price">
              <Form.Label style={{ fontWeight: "bold" }}>Price</Form.Label>
              <Form.Control
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                style={{
                  borderRadius: "5px",
                  borderColor: "#ddd",
                  padding: "10px",
                  fontSize: "14px",
                }}
                placeholder="Enter Price"
              />
            </Form.Group>

            <Button
              type="submit"
              style={{
                width: "100%",
                background: "linear-gradient(90deg, #6a11cb, #2575fc)",
                border: "none",
                padding: "10px",
                fontWeight: "bold",
                color: "#fff",
                borderRadius: "5px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background =
                  "linear-gradient(90deg, #2575fc, #6a11cb)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background =
                  "linear-gradient(90deg, #6a11cb, #2575fc)";
              }}
            >
              Submit
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
      ;{/* Modal End */}
    </>
  );
}

export default FinishedGoods;
