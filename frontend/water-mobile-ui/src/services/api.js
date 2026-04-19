import axios from "axios"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "/api" : "https://water-distributor.onrender.com")

const APP_CACHE_VERSION = "v2"
const CACHE_NAMESPACE = `krishna-ro:${APP_CACHE_VERSION}:${API_BASE_URL}`
const LEGACY_CACHE_KEYS = ["customers", "inventory"]

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
})

const getScopedCacheKey = (key) => `${CACHE_NAMESPACE}:${key}`

const clearLegacyCache = () => {
  try {
    const lastNamespace = localStorage.getItem("krishna-ro:last-cache-namespace")

    if (lastNamespace !== CACHE_NAMESPACE) {
      Object.keys(localStorage).forEach((key) => {
        if (
          key.startsWith("krishna-ro:") ||
          LEGACY_CACHE_KEYS.includes(key) ||
          key.startsWith("ledger:")
        ) {
          localStorage.removeItem(key)
        }
      })

      localStorage.setItem("krishna-ro:last-cache-namespace", CACHE_NAMESPACE)
    }
  } catch {
    // Ignore localStorage cleanup issues and continue with live requests.
  }
}

clearLegacyCache()

const readCache = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(getScopedCacheKey(key)) || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

const writeCache = (key, value) => {
  localStorage.setItem(getScopedCacheKey(key), JSON.stringify(value))
}

const fetchWithCache = async (cacheKey, request, fallback = []) => {
  try {
    const response = await request()
    writeCache(cacheKey, response.data)
    return {
      data: response.data,
      fromCache: false,
      error: null
    }
  } catch (error) {
    return {
      data: readCache(cacheKey, fallback),
      fromCache: true,
      error
    }
  }
}

const normalizeItemType = (value) => value.trim().toLowerCase()

export const getErrorMessage = (error, fallback = "Something went wrong.") => {
  const serverMessage =
    typeof error?.response?.data?.message === "string"
      ? error.response.data.message
      : typeof error?.response?.data === "string"
        ? error.response.data
        : ""

  if (serverMessage.trim()) {
    return serverMessage
  }

  if (error?.message === "Network Error") {
    return "The backend is not reachable right now."
  }

  if (error?.code === "ECONNABORTED") {
    return "The backend is taking too long to respond. If it is hosted on Render, it may still be waking up."
  }

  return fallback
}

export const getCustomers = () => fetchWithCache("customers", () => API.get("/customers"))

export const createCustomer = async (payload) => {
  const response = await API.post("/customers", payload)
  return response.data
}

export const getInventory = () => fetchWithCache("inventory", () => API.get("/inventory"))

export const addInventory = async ({ itemType, quantity, refillPricePerUnit }) => {
  const response = await API.post("/inventory/add", null, {
    params: {
      itemType: normalizeItemType(itemType),
      quantity: Number(quantity),
      refillPricePerUnit: Number(refillPricePerUnit)
    }
  })

  return response.data
}

export const updateInventoryRefillPrice = async ({ itemType, refillPricePerUnit }) => {
  const response = await API.post(`/inventory/${normalizeItemType(itemType)}/refill-price`, null, {
    params: {
      refillPricePerUnit: Number(refillPricePerUnit)
    }
  })

  return response.data
}

export const createBorrow = async ({ customerId, itemType, quantity, depositPerUnit }) => {
  const response = await API.post("/borrow", null, {
    params: {
      customerId: Number(customerId),
      itemType: normalizeItemType(itemType),
      quantity: Number(quantity),
      deposit: Number(depositPerUnit)
    }
  })

  return response.data
}

export const createRefill = async ({ customerId, items }) => {
  const response = await API.post("/refill", {
    customerId: Number(customerId),
    items: items.map((item) => ({
      itemType: normalizeItemType(item.itemType),
      quantity: Number(item.quantity),
      pricePerUnit: Number(item.pricePerUnit)
    }))
  })

  return response.data
}

export const createReturn = async ({ customerId, itemType, quantity, depositRefunded }) => {
  const response = await API.post("/return", {
    customerId: Number(customerId),
    itemType: normalizeItemType(itemType),
    quantity: Number(quantity),
    depositRefunded: Number(depositRefunded)
  })

  return response.data
}

export const createSettlement = async ({ customerId, amount, note }) => {
  const response = await API.post("/settlements", {
    customerId: Number(customerId),
    amount: Number(amount),
    note: note?.trim() || ""
  })

  return response.data
}

export const createMiscEarning = async ({ amount, note }) => {
  const response = await API.post("/misc-earnings", {
    amount: Number(amount),
    note: note?.trim() || ""
  })

  return response.data
}

export const getMiscEarnings = async ({ from, to } = {}) => {
  const response = await API.get("/misc-earnings", {
    params: {
      ...(from ? { from } : {}),
      ...(to ? { to } : {})
    }
  })

  return response.data
}

export const getEarnings = async ({ from, to } = {}) => {
  const response = await API.get("/earnings", {
    params: {
      ...(from ? { from } : {}),
      ...(to ? { to } : {})
    }
  })

  return response.data
}

export const getLedger = (customerId) =>
  fetchWithCache(`ledger:${customerId}`, () => API.get(`/ledger/${customerId}`))

export { API_BASE_URL, getScopedCacheKey }
