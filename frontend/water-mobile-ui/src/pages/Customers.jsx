import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded"
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded"
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import EmptyState from "../components/EmptyState"
import SectionCard from "../components/SectionCard"
import { useAppData } from "../context/AppDataContext"
import { createCustomer, getErrorMessage } from "../services/api"
import { formatCurrency, formatNumber, getActiveItemCount } from "../utils/formatters"

const initialForm = {
  name: "",
  phone: "",
  address: ""
}

function Customers() {
  const navigate = useNavigate()
  const { customers, customersState, refreshCustomers } = useAppData()
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ type: "", text: "" })

  const updateField = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value
    }))
  }

  const submitCustomer = async () => {
    if (!form.name.trim()) {
      setFeedback({ type: "error", text: "Customer name is required." })
      return
    }

    setIsSubmitting(true)
    setFeedback({ type: "", text: "" })

    try {
      await createCustomer({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim()
      })
      await refreshCustomers()
      setForm(initialForm)
      setFeedback({ type: "success", text: "Customer added successfully." })
    } catch (error) {
      setFeedback({
        type: "error",
        text: getErrorMessage(error, "Unable to add the customer right now.")
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box className="split-grid">
      <SectionCard
        eyebrow="Onboarding"
        title="Create a customer profile"
        description="Capture the essentials so the team can start borrowing, refilling, returning, and tracking balances from one record."
      >
        <Stack spacing={2}>
          {feedback.text && <Alert severity={feedback.type || "info"}>{feedback.text}</Alert>}

          <TextField label="Customer name" value={form.name} onChange={updateField("name")} />
          <TextField label="Phone number" value={form.phone} onChange={updateField("phone")} />
          <TextField
            label="Address"
            value={form.address}
            onChange={updateField("address")}
            multiline
            minRows={3}
          />

          <Button
            variant="contained"
            startIcon={<AddCircleRoundedIcon />}
            onClick={submitCustomer}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Add customer"}
          </Button>
        </Stack>
      </SectionCard>

      <SectionCard
        eyebrow="Client book"
        title="Customer roster"
        description="Tap into each account to see activity, item balances, and remaining deposit exposure."
      >
        {customersState.error && <Alert severity="warning">{customersState.error}</Alert>}
        {customersState.showingCachedData && !customersState.error && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Showing saved customers while the backend reconnects.
          </Alert>
        )}

        {customers.length ? (
          <Box className="list-grid">
            {customers.map((customer) => (
              <Box key={customer.customerId} className="mini-card">
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.5}>
                  <Box>
                    <Typography variant="h6">{customer.name}</Typography>
                    <Typography color="text.secondary">{customer.phone || "Phone not added"}</Typography>
                    <Typography color="text.secondary">
                      {customer.address || "Address not added"}
                    </Typography>
                  </Box>

                  <Stack alignItems={{ xs: "flex-start", md: "flex-end" }} spacing={1}>
                    <Typography variant="body2">
                      {formatNumber(getActiveItemCount(customer))} active items
                    </Typography>
                    <Typography variant="body2">
                      Jars: {formatNumber(customer.activeJars)} | Coolers: {formatNumber(customer.activeCoolers)}
                    </Typography>
                    <Typography variant="body2">
                      Deposit: {formatCurrency(customer.depositBalance)}
                    </Typography>
                    <Button
                      variant="text"
                      startIcon={<ReceiptLongRoundedIcon />}
                      onClick={() => navigate(`/ledger/${customer.customerId}`)}
                    >
                      View ledger
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Box>
        ) : (
          <EmptyState
            title="No customers yet"
            description="The roster will appear here as soon as you add the first customer."
          />
        )}
      </SectionCard>
    </Box>
  )
}

export default Customers
