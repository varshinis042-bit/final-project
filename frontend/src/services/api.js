import axios from "axios"

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json"
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cardio_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid
      localStorage.removeItem("cardio_token")
    }

    // Normalize error.response.data.detail so it is ALWAYS a clean human-readable string and never a raw object/array
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail
      if (Array.isArray(detail)) {
        const msgs = detail
          .map((item) => {
            if (typeof item === "string") return item
            if (item && typeof item === "object") {
              const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : ""
              const msg = item.msg || item.message || "Invalid input"
              return field && field !== "body" ? `${field}: ${msg}` : msg
            }
            return String(item)
          })
          .filter(Boolean)
        error.response.data.detail = msgs.join(". ") || "Validation error"
      } else if (typeof detail === "object" && detail !== null) {
        error.response.data.detail = detail.msg || detail.message || JSON.stringify(detail)
      }
    }

    return Promise.reject(error)
  }
)

export default api