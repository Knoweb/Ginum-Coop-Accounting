import Swal from "sweetalert2";
import "./Alert.css";
const Alert = {
  // Success Alert
  success: (message) => {
    Swal.fire({
      position: "top-end", // Position at the top-right corner
      icon: "success",
      title: message,
      showConfirmButton: false,
      timer: 3000, // Auto-close after 3 seconds
      toast: true, // Enable toast mode
      customClass: {
        popup: "custom-alert", // Add custom class for styling
      },
    });
  },

  // Error Alert
  error: (message) => {
    Swal.fire({
      position: "top-end", // Position at the top-right corner
      icon: "error",
      title: message,
      showConfirmButton: false,
      timer: 3000, // Auto-close after 3 seconds
      toast: true, // Enable toast mode
      customClass: {
        popup: "custom-alert", // Add custom class for styling
      },
    });
  },

  // Warning Alert
  warning: (message) => {
    Swal.fire({
      position: "top-end", // Position at the top-right corner
      icon: "warning",
      title: message,
      showConfirmButton: false,
      timer: 3000, // Auto-close after 3 seconds
      toast: true, // Enable toast mode
      customClass: {
        popup: "custom-alert", // Add custom class for styling
      },
    });
  },

  // Info Alert
  info: (message) => {
    Swal.fire({
      position: "top-end", // Position at the top-right corner
      icon: "info",
      title: message,
      showConfirmButton: false,
      timer: 3000, // Auto-close after 3 seconds
      toast: true, // Enable toast mode
      customClass: {
        popup: "custom-alert", // Add custom class for styling
      },
    });
  },
  // Confirmation Dialog (Yes/No or Delete/Cancel)
  confirm: (message, confirmButtonText = "Yes", cancelButtonText = "Cancel") => {
    return Swal.fire({
      title: "Are you sure?",
      text: message,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
      customClass: {
        popup: "custom-alert",
      },
    });
  },
};

//example usage
// Alert.success("This is a success message");
// Alert.error("This is an error message");
// Alert.warning("This is a warning message");
// Alert.info("This is an info message");

// const result = await Alert.confirm(
//     "Are you sure you want to delete this item?",
//     "Delete",
//     "Cancel"
//   );

  


export default Alert;