const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2
})

const numberFormatter = new Intl.NumberFormat("en-IN")

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit"
})

export const formatCurrency = (amount = 0) => currencyFormatter.format(Number(amount || 0))

export const formatNumber = (value = 0) => numberFormatter.format(Number(value || 0))

export const formatDateTime = (value) => {
  if (!value) {
    return "Just now"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Just now"
  }

  return dateTimeFormatter.format(date)
}

export const formatItemType = (value = "") =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "Item"

export const getActiveItemCount = (customer = {}) =>
  Number(customer.activeJars || 0) + Number(customer.activeCoolers || 0)
