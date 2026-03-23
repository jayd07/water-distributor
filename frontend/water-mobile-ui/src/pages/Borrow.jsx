import { useState } from "react"
import { borrowJar } from "../services/api"

function Borrow() {
  const [qty, setQty] = useState("1")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async () => {
    const quantity = Number(qty)

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setSuccess("")
      setError("Enter a valid quantity greater than zero.")
      return
    }

    setIsSubmitting(true)
    setError("")
    setSuccess("")

    try {
      await borrowJar("jar", quantity)
      setSuccess("Borrow recorded successfully.")
      setQty("1")
    } catch (requestError) {
      const message =
        requestError.response?.data?.message || "Could not record the borrow. Check the backend and inventory data."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ padding: 20, paddingBottom: 96 }}>
      <h2>Borrow Jar</h2>

      <input
        type="number"
        min="1"
        step="1"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        style={{ padding: 10, width: "100%" }}
      />

      {error && <div style={errorText}>{error}</div>}
      {success && <div style={successText}>{success}</div>}

      <button style={btn} onClick={submit} disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Borrow"}
      </button>
    </div>
  )
}

const btn = { width: "100%", padding: 15, marginTop: 20 }

const errorText = {
  marginTop: 12,
  color: "#c62828"
}

const successText = {
  marginTop: 12,
  color: "#2e7d32"
}

export default Borrow
