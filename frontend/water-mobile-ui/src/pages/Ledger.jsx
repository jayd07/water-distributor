import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded"
import { Alert, Box, Button, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import EmptyState from "../components/EmptyState"
import MetricCard from "../components/MetricCard"
import SectionCard from "../components/SectionCard"
import { useAppData } from "../context/AppDataContext"
import { getErrorMessage, getLedger } from "../services/api"
import { formatCurrency, formatDateTime, formatNumber, getActiveItemCount } from "../utils/formatters"

function Ledger() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { customers } = useAppData()
  const [selectedCustomerId, setSelectedCustomerId] = useState(id || "")
  const [entries, setEntries] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showingCachedData, setShowingCachedData] = useState(false)

  useEffect(() => {
    if (id) {
      setSelectedCustomerId(id)
      return
    }

    if (!selectedCustomerId && customers.length) {
      setSelectedCustomerId(String(customers[0].customerId))
    }
  }, [customers, id, selectedCustomerId])

  useEffect(() => {
    if (!selectedCustomerId) {
      return undefined
    }

    let active = true

    const loadLedger = async (showLoader = false) => {
      if (showLoader) {
        setIsLoading(true)
      }

      const result = await getLedger(selectedCustomerId)

      if (!active) {
        return
      }

      setEntries(result.data)
      setShowingCachedData(result.fromCache && result.data.length > 0)
      setError(
        result.error && result.data.length === 0
          ? getErrorMessage(result.error, "Unable to load the customer ledger.")
          : ""
      )
      setIsLoading(false)
    }

    loadLedger(true)
    const interval = setInterval(() => loadLedger(false), 8000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [selectedCustomerId])

  const selectedCustomer = customers.find(
    (customer) => String(customer.customerId) === String(selectedCustomerId)
  )

  const totalAmount = entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0)

  const handleCustomerChange = (event) => {
    const nextId = event.target.value
    setSelectedCustomerId(nextId)
    navigate(`/ledger/${nextId}`)
  }

  const refreshLedger = async () => {
    if (!selectedCustomerId) {
      return
    }

    setIsLoading(true)
    const result = await getLedger(selectedCustomerId)
    setEntries(result.data)
    setShowingCachedData(result.fromCache && result.data.length > 0)
    setError(
      result.error && result.data.length === 0
        ? getErrorMessage(result.error, "Unable to refresh the ledger.")
        : ""
    )
    setIsLoading(false)
  }

  return (
    <Stack spacing={2.5}>
      <Box className="dashboard-grid">
        <MetricCard
          label="Entries"
          value={formatNumber(entries.length)}
          note="Transactions recorded for this customer"
          tone="ocean"
        />
        <MetricCard
          label="Ledger value"
          value={formatCurrency(totalAmount)}
          note="Charges remain positive and refunds remain negative"
          tone="sun"
        />
        <MetricCard
          label="Active items"
          value={formatNumber(getActiveItemCount(selectedCustomer))}
          note="Current jar and cooler count together"
          tone="sage"
        />
      </Box>

      <SectionCard
        eyebrow="Ledger view"
        title="Customer activity timeline"
        description="Switch customers, refresh on demand, and keep a live eye on borrows, refills, and returns."
        action={
          <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={refreshLedger}>
            Refresh
          </Button>
        }
      >
        <Stack spacing={2}>
          <TextField
            select
            label="Choose customer"
            value={selectedCustomerId}
            onChange={handleCustomerChange}
            disabled={!customers.length}
          >
            {customers.map((customer) => (
              <MenuItem key={customer.customerId} value={String(customer.customerId)}>
                {customer.name}
              </MenuItem>
            ))}
          </TextField>

          {selectedCustomer && (
            <Box className="status-row">
              <Chip label={`${formatNumber(selectedCustomer.activeJars)} jars`} />
              <Chip label={`${formatNumber(selectedCustomer.activeCoolers)} coolers`} />
              <Chip label={`Deposit ${formatCurrency(selectedCustomer.depositBalance)}`} />
            </Box>
          )}

          {isLoading && <Alert severity="info">Loading ledger...</Alert>}
          {error && <Alert severity="warning">{error}</Alert>}
          {showingCachedData && !error && (
            <Alert severity="info">Showing saved ledger entries while the backend reconnects.</Alert>
          )}

          {!selectedCustomerId && (
            <EmptyState
              title="No customer selected"
              description="Choose a customer to inspect their full activity timeline."
            />
          )}

          {selectedCustomerId && !entries.length && !isLoading && !error && (
            <EmptyState
              title="No ledger entries yet"
              description="Once borrows, refills, or returns are recorded, they will appear here."
            />
          )}

          {entries.length > 0 && (
            <Box className="timeline">
              {entries.map((entry) => (
                <Box key={entry.ledgerId} className="mini-card timeline-entry">
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    gap={1}
                  >
                    <Box>
                      <Typography variant="h6">{entry.transactionType}</Typography>
                      <Typography color="text.secondary">{entry.description}</Typography>
                    </Box>
                    <Stack alignItems={{ xs: "flex-start", sm: "flex-end" }}>
                      <Typography variant="body2">Qty: {formatNumber(entry.quantity)}</Typography>
                      <Typography variant="body2">{formatCurrency(entry.amount)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(entry.createdAt)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Box>
          )}
        </Stack>
      </SectionCard>
    </Stack>
  )
}

export default Ledger
