import axios from "axios"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "/api" : "http://localhost:8099")

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
})

const readCache = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

const writeCache = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
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

  return fallback
}

export const getCustomers = () => fetchWithCache("customers", () => API.get("/customers"))

export const createCustomer = async (payload) => {
  const response = await API.post("/customers", payload)
  return response.data
}

export const getInventory = () => fetchWithCache("inventory", () => API.get("/inventory"))

export const addInventory = async ({ itemType, quantity }) => {
  const response = await API.post("/inventory/add", null, {
    params: {
      itemType: normalizeItemType(itemType),
      quantity: Number(quantity)
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

export const createRefill = async ({ customerId, quantity, pricePerUnit }) => {
  const response = await API.post("/refill", {
    customerId: Number(customerId),
    quantity: Number(quantity),
    pricePerUnit: Number(pricePerUnit)
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
