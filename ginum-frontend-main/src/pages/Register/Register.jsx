import React, { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { apiUrl } from "../../utils/api";
import api from "../../utils/api";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/Alert/Alert"; 

const COMPANY_CATEGORIES = [
  { value: "EDUCATION_AND_EDTECH", label: "Education and EdTech" },
  { value: "FINANCE", label: "Finance" },
  { value: "CREATIVE_AND_DESIGN", label: "Creative and Design" },
  { value: "REAL_ESTATE_AND_PROPERTY_MANAGEMENT", label: "Real Estate and Property Management" },
  { value: "CONSTRUCTION_AND_ENGINEERING", label: "Construction and Engineering" },
  { value: "HOSPITALITY_AND_TOURISM", label: "Hospitality and Tourism" },
  { value: "IT_AND_TECHNOLOGY", label: "IT and Technology" },
  { value: "MARKETING_AND_E_COMMERCE", label: "Marketing and E-Commerce" },
  { value: "MANUFACTURING_AND_LOGISTICS", label: "Manufacturing and Logistics" },
  { value: "HEALTHCARE_AND_LIFE_SCIENCES", label: "Healthcare and Life Sciences" },
  { value: "PROFESSIONAL_SERVICES", label: "Professional Services" }
];

const Register = () => {
  const navigate = useNavigate();
  const [currencies, setCurrencies] = useState([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [currencyError, setCurrencyError] = useState(null);
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [countryError, setCountryError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVatRegistered, setIsVatRegistered] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    companyLogo: null,
    companyCategory: "",
    registrationNo: "",
    tinNo: "",
    vatNo: "",
    phoneNo: "",
    mobileNo: "",
    registeredAddress: "",
    factoryAddress: "",
    countryId: "",
    currencyId: "",
    email: "",
    website: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.companyName)
      newErrors.companyName = "Company Name is required";
    if (!formData.companyCategory)
      newErrors.companyCategory = "Company Category is required";
    if (isVatRegistered && !formData.vatNo)
      newErrors.vatNo = "VAT No. is required";
    if (!formData.phoneNo) newErrors.phoneNo = "Phone No. is required";
    if (!formData.registeredAddress)
      newErrors.registeredAddress = "Registered Address is required";
    if (!formData.countryId) newErrors.country = "Country is required";
    if (!formData.currencyId) newErrors.currency = "Currency is required";
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email address is invalid";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm Password is required";
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();

      formDataToSend.append("companyName", formData.companyName);
      formDataToSend.append("companyCategory", formData.companyCategory);
      formDataToSend.append("phoneNo", formData.phoneNo);
      formDataToSend.append("companyRegisteredAddress", formData.registeredAddress);
      formDataToSend.append("countryId", formData.countryId);
      formDataToSend.append("currencyId", formData.currencyId);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("dateJoined", new Date().toISOString().split("T")[0]);
      formDataToSend.append("isVatRegistered", isVatRegistered);

      if (formData.registrationNo) formDataToSend.append("companyRegNo", formData.registrationNo);
      if (formData.tinNo) formDataToSend.append("tinNo", formData.tinNo);
      if (isVatRegistered && formData.vatNo) formDataToSend.append("vatNo", formData.vatNo);
      if (formData.mobileNo) formDataToSend.append("mobileNo", formData.mobileNo);
      if (formData.factoryAddress) formDataToSend.append("companyFactoryAddress", formData.factoryAddress);
      if (formData.website) formDataToSend.append("websiteUrl", formData.website);

      if (formData.companyLogo) {
        formDataToSend.append("companyLogo", formData.companyLogo);
      }

      const response = await axios.post(`${apiUrl}/api/companies/register`, formDataToSend);

      Alert.success("Registration successful! Please log in.");
      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      console.error("Registration error:", error);
      setSubmitError(
        error.response?.data?.message || error.response?.data || "Registration failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleVatRegistrationChange = (e) => {
    const isRegistered = e.target.value === "yes";
    setIsVatRegistered(isRegistered);
    if (!isRegistered) {
      setFormData((prev) => ({ ...prev, vatNo: "" }));
    }
  };

  const handleCountryChange = (e) => {
    const selectedCountryId = e.target.value;
    const selectedCountry = countries.find(c => c.id.toString() === selectedCountryId);

    setFormData((prev) => {
      let newCurrencyId = prev.currencyId;
      if (selectedCountry) {
          if (selectedCountry.defaultCurrencyId) {
              newCurrencyId = selectedCountry.defaultCurrencyId.toString();
          } else {
              const fallbackMap = {
                  "Sri Lanka": "LKR",
                  "United States": "USD",
                  "United Kingdom": "GBP",
                  "Australia": "AUD"
              };
              const fallbackCode = fallbackMap[selectedCountry.name];
              if (fallbackCode) {
                  const fallbackCurrency = currencies.find(c => c.code === fallbackCode);
                  if (fallbackCurrency) {
                      newCurrencyId = fallbackCurrency.id.toString();
                  }
              }
          }
      }
      return {
          ...prev,
          countryId: selectedCountryId,
          currencyId: newCurrencyId
      };
    });
  };
  
  // Fetch countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoadingCountries(true);
        setCountryError(null);

        const response = await api.get("/api/countries");
        let countriesData = [];

        if (Array.isArray(response)) {
          countriesData = response;
        } else if (Array.isArray(response.data)) {
          countriesData = response.data;
        } else if (response?.data?.data && Array.isArray(response.data.data)) {
          countriesData = response.data.data;
        }

        if (!Array.isArray(countriesData) || countriesData.length === 0) {
          throw new Error("Invalid countries data format");
        }

        setCountries(countriesData);
      } catch (error) {
        console.error("Country fetch error:", error);
        setCountryError(error.message);
        setCountries([
          { id: 1, name: "United States" },
          { id: 2, name: "Canada" },
          { id: 3, name: "United Kingdom" },
        ]);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);
  // Fetch currencies on component mount
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        setLoadingCurrencies(true);
        setCurrencyError(null);

        const response = await api.get("/api/currencies");
        // console.log("Full API response:", response);
        // Handle different response structures
        let currenciesData = [];

        if (Array.isArray(response)) {
          // If response is already the array
          currenciesData = response;
        } else if (Array.isArray(response.data)) {
          // Standard Axios response structure
          currenciesData = response.data;
        } else if (response?.data?.data && Array.isArray(response.data.data)) {
          // Nested data property
          currenciesData = response.data.data;
        }

        // console.log("Processed currencies:", currenciesData);

        if (!Array.isArray(currenciesData) || currenciesData.length === 0) {
          throw new Error("Invalid currencies data format");
        }

        setCurrencies(currenciesData);
      } catch (error) {
        console.error("Currency fetch error:", error);
        setCurrencyError(error.message);

        // Fallback to default currencies
        setCurrencies([
          { id: 1, code: "USD", name: "US Dollar" },
          { id: 2, code: "EUR", name: "Euro" },
          { id: 3, code: "GBP", name: "British Pound" },
        ]);
      } finally {
        setLoadingCurrencies(false);
      }
    };

    fetchCurrencies();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
          Company Registration
        </h2>
        {submitError && (
          <div className="w-full p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
            {submitError}
          </div>
        )}
        <form className="space-y-4 w-full" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-700">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter company name"
              value={formData.companyName}
              onChange={handleChange}
            />
            {errors.companyName && (
              <p className="text-red-500 text-sm">{errors.companyName}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Company Logo</label>
            <input
              type="file"
              name="companyLogo"
              className="w-full px-4 py-2 border rounded-lg"
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-gray-700">
              Company Category <span className="text-red-500">*</span>
            </label>
            <select
              name="companyCategory"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.companyCategory}
              onChange={handleChange}
            >
              <option value="">Select Category</option>
  {COMPANY_CATEGORIES.map((category) => (
    <option key={category.value} value={category.value}>
      {category.label}
    </option>
  ))}
            </select>
            {errors.companyCategory && (
              <p className="text-red-500 text-sm">{errors.companyCategory}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700">Registration No.</label>
              <input
                type="text"
                name="registrationNo"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-gray-700">TIN No.</label>
              <input
                type="text"
                name="tinNo"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-gray-700">
                VAT Registered? <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="vatRegistered"
                    value="yes"
                    checked={isVatRegistered}
                    onChange={handleVatRegistrationChange}
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="vatRegistered"
                    value="no"
                    checked={!isVatRegistered}
                    onChange={handleVatRegistrationChange}
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>
          </div>
          {isVatRegistered && (
            <div>
              <label className="block text-gray-700">
                VAT No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="vatNo"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.vatNo}
                onChange={handleChange}
              />
              {errors.vatNo && (
                <p className="text-red-500 text-sm">{errors.vatNo}</p>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">
                Phone No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phoneNo"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.phoneNo}
                onChange={handleChange}
              />
              {errors.phoneNo && (
                <p className="text-red-500 text-sm">{errors.phoneNo}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700">Mobile No.</label>
              <input
                type="text"
                name="mobileNo"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">
                Registered Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="registeredAddress"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.registeredAddress}
                onChange={handleChange}
              />
              {errors.registeredAddress && (
                <p className="text-red-500 text-sm">
                  {errors.registeredAddress}
                </p>
              )}
            </div>
            <div>
              <label className="block text-gray-700">Factory Address</label>
              <input
                type="text"
                name="factoryAddress"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.factoryAddress}
                onChange={handleChange}
              />
              {errors.factoryAddress && (
                <p className="text-red-500 text-sm">{errors.factoryAddress}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">
                Country <span className="text-red-500">*</span>
              </label>
              {loadingCountries ? (
                <div className="w-full px-4 py-2 border rounded-lg bg-gray-100 animate-pulse">
                  Loading countries...
                </div>
              ) : countryError ? (
                <div className="text-red-500 text-sm">{countryError}</div>
              ) : (
                <select
                  name="countryId"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.countryId}
                  onChange={handleCountryChange}
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.country && (
                <p className="text-red-500 text-sm">{errors.country}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700">
                Currency <span className="text-red-500">*</span>
              </label>

              {loadingCurrencies ? (
                <div className="w-full px-4 py-2 border rounded-lg bg-gray-100 animate-pulse">
                  Loading currencies...
                </div>
              ) : currencyError ? (
                <div className="text-red-500 text-sm">{currencyError}</div>
              ) : (
                <select
                  name="currencyId"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.currencyId}
                  onChange={handleChange}
                >
                  <option value="">Select Currency</option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
              )}

              {errors.currency && (
                <p className="text-red-500 text-sm">{errors.currency}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700">Website</label>
              <input
                type="text"
                name="website"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
              )}
            </div>
          </div>
          <button
            type="submit"
            className={`w-full bg-blue-500 px-4 py-2 text-white font-semibold hover:bg-blue-700 ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Registering..." : "Sign Up"}
          </button>
        </form>
        <p className="text-gray-600 text-center mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
