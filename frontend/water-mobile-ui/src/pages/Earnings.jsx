import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded"
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded"
import TodayRoundedIcon from "@mui/icons-material/TodayRounded"
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material"
import { useEffect, useState } from "react"
import EmptyState from "../components/EmptyState"
import MetricCard from "../components/MetricCard"
import SectionCard from "../components/SectionCard"
import { useAppData } from "../context/AppDataContext"
import {
  createMiscEarning,
  createSettlement,
  getEarnings,
  getErrorMessage,
  getMiscEarnings
} from "../services/api"
import { formatCurrency, formatDateTime, formatNumber } from "../utils/formatters"

const toDateTimeInputValue = (value) => {
  const date = value ? new Date(value) : new Date()

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

const getTodayStartValue = () => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return toDateTimeInputValue(now)
}

const initialSummary = {
  refillTotal: 0,
  miscTotal: 0,
  totalEarnings: 0,
  refillCount: 0,
  miscCount: 0
}

function Earnings() {
  const { customers, applySettlementLocally, refreshCustomers, financialActivityVersion } = useAppData()
  const [settlementForm, setSettlementForm] = useState({
    customerId: "",
    amount: "",
    note: ""
  })
  const [miscForm, setMiscForm] = useState({
    amount: "",
    note: ""
  })
  const [rangeForm, setRangeForm] = useState({
    from: getTodayStartValue(),
    to: toDateTimeInputValue(new Date())
  })
  const [summary, setSummary] = useState(initialSummary)
  const [miscEntries, setMiscEntries] = useState([])
  const [isLoadingSummary, setIsLoadingSummary] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState({
    settlement: false,
    misc: false
  })
  const [feedback, setFeedback] = useState({
    settlement: { type: "", text: "" },
    misc: { type: "", text: "" },
    summary: { type: "", text: "" }
  })

  useEffect(() => {
    if (!customers.length) {
      return
    }

    setSettlementForm((current) =>
      current.customerId ? current : { ...current, customerId: String(customers[0].customerId) }
    )
  }, [customers])

  useEffect(() => {
    loadSummary(rangeForm)
  }, [financialActivityVersion])

  const selectedCustomer = customers.find(
    (customer) => String(customer.customerId) === settlementForm.customerId
  )

  const setMessage = (key, type, text) => {
    setFeedback((current) => ({
      ...current,
      [key]: { type, text }
    }))
  }

  const loadSummary = async (range = rangeForm) => {
    setIsLoadingSummary(true)
    setMessage("summary", "", "")

    try {
      const [earningsSummary, miscList] = await Promise.all([
        getEarnings(range),
        getMiscEarnings(range)
      ])
      setSummary({
        refillTotal: Number(earningsSummary.refillTotal || 0),
        miscTotal: Number(earningsSummary.miscTotal || 0),
        totalEarnings: Number(earningsSummary.totalEarnings || 0),
        refillCount: Number(earningsSummary.refillCount || 0),
        miscCount: Number(earningsSummary.miscCount || 0)
      })
      setMiscEntries(miscList)
    } catch (error) {
      setMessage("summary", "error", getErrorMessage(error, "Unable to load earnings summary."))
    } finally {
      setIsLoadingSummary(false)
    }
  }

  const submitSettlement = async () => {
    const amount = Number(settlementForm.amount)

    if (!settlementForm.customerId) {
      setMessage("settlement", "error", "Choose a customer first.")
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("settlement", "error", "Settlement amount must be greater than zero.")
      return
    }

    setIsSubmitting((current) => ({ ...current, settlement: true }))
    setMessage("settlement", "", "")

    try {
      await createSettlement(settlementForm)
      applySettlementLocally(settlementForm)
      await refreshCustomers()
      setSettlementForm((current) => ({
        ...current,
        amount: "",
        note: ""
      }))
      setMessage("settlement", "success", "Customer balance settled successfully.")
    } catch (error) {
      setMessage("settlement", "error", getErrorMessage(error, "Unable to settle customer balance."))
    } finally {
      setIsSubmitting((current) => ({ ...current, settlement: false }))
    }
  }

  const submitMiscEarning = async () => {
    const amount = Number(miscForm.amount)

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("misc", "error", "Misc earning amount must be greater than zero.")
      return
    }

    setIsSubmitting((current) => ({ ...current, misc: true }))
    setMessage("misc", "", "")

    try {
      await createMiscEarning(miscForm)
      setMiscForm({
        amount: "",
        note: ""
      })
      await loadSummary()
      setMessage("misc", "success", "Misc earnings added for this period.")
    } catch (error) {
      setMessage("misc", "error", getErrorMessage(error, "Unable to save misc earnings."))
    } finally {
      setIsSubmitting((current) => ({ ...current, misc: false }))
    }
  }

  const handleRangeRefresh = async () => {
    if (!rangeForm.from || !rangeForm.to) {
      setMessage("summary", "error", "Choose both from and to times.")
      return
    }

    if (new Date(rangeForm.from) > new Date(rangeForm.to)) {
      setMessage("summary", "error", "The from time must be earlier than the to time.")
      return
    }

    await loadSummary(rangeForm)
  }

  const balanceTone =
    Number(selectedCustomer?.depositBalance || 0) < 0 ? "error.main" : "success.main"

  return (
    <Stack spacing={2.5}>
      <Box className="dashboard-grid">
        <MetricCard
          label="Refill earnings"
          value={formatCurrency(summary.refillTotal)}
          note={`${formatNumber(summary.refillCount)} refill entries in range`}
          tone="ocean"
        />
        <MetricCard
          label="Misc earnings"
          value={formatCurrency(summary.miscTotal)}
          note={`${formatNumber(summary.miscCount)} manual entries in range`}
          tone="sun"
        />
        <MetricCard
          label="Total earnings"
          value={formatCurrency(summary.totalEarnings)}
          note="Combined refill charges and misc collections"
          tone="sage"
        />
      </Box>

      <Box className="content-grid">
        <Stack spacing={2}>
          <SectionCard
            eyebrow="Balance settlement"
            title="Clear or reduce what a customer owes"
            description="When a customer pays toward a negative balance, record it here. The amount is added back to their running balance and also written to the ledger."
          >
            {!customers.length ? (
              <EmptyState
                title="Customers are required first"
                description="Create a customer before recording settlement payments."
              />
            ) : (
              <Stack spacing={2}>
                {feedback.settlement.text && (
                  <Alert severity={feedback.settlement.type || "info"}>
                    {feedback.settlement.text}
                  </Alert>
                )}
                <TextField
                  select
                  label="Customer"
                  value={settlementForm.customerId}
                  onChange={(event) =>
                    setSettlementForm((current) => ({ ...current, customerId: event.target.value }))
                  }
                >
                  {customers.map((customer) => (
                    <MenuItem key={customer.customerId} value={String(customer.customerId)}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Settlement amount"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={settlementForm.amount}
                  onChange={(event) =>
                    setSettlementForm((current) => ({ ...current, amount: event.target.value }))
                  }
                />
                <TextField
                  label="Note"
                  placeholder="Cash received, UPI payment, part settlement"
                  value={settlementForm.note}
                  onChange={(event) =>
                    setSettlementForm((current) => ({ ...current, note: event.target.value }))
                  }
                />
                {selectedCustomer && (
                  <Box className="mini-card">
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5}>
                      <Box>
                        <Typography variant="h6">{selectedCustomer.name}</Typography>
                        <Typography color="text.secondary">
                          Current running balance after refills and deposits
                        </Typography>
                      </Box>
                      <Chip
                        icon={<PaymentsRoundedIcon />}
                        label={formatCurrency(selectedCustomer.depositBalance)}
                        sx={{ color: balanceTone, borderColor: "currentColor" }}
                        variant="outlined"
                      />
                    </Stack>
                    <Typography sx={{ mt: 1.5, color: "text.secondary" }}>
                      Negative means the customer owes the client. Positive means deposit is still available.
                    </Typography>
                  </Box>
                )}
                <Button
                  variant="contained"
                  onClick={submitSettlement}
                  disabled={isSubmitting.settlement}
                >
                  {isSubmitting.settlement ? "Saving..." : "Record settlement"}
                </Button>
              </Stack>
            )}
          </SectionCard>

          <SectionCard
            eyebrow="Misc collection"
            title="Add end-of-day misc earnings"
            description="Use this for payments that are outside the normal customer deposit flow, like water filled into the customer's own jar and collected as a daily lump sum."
          >
            <Stack spacing={2}>
              {feedback.misc.text && (
                <Alert severity={feedback.misc.type || "info"}>{feedback.misc.text}</Alert>
              )}
              <TextField
                label="Amount"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={miscForm.amount}
                onChange={(event) =>
                  setMiscForm((current) => ({ ...current, amount: event.target.value }))
                }
              />
              <TextField
                label="Note"
                placeholder="Own jar filling collections, walk-in sales, cash top-up"
                value={miscForm.note}
                onChange={(event) =>
                  setMiscForm((current) => ({ ...current, note: event.target.value }))
                }
              />
              <Button variant="contained" onClick={submitMiscEarning} disabled={isSubmitting.misc}>
                {isSubmitting.misc ? "Saving..." : "Add misc earnings"}
              </Button>
            </Stack>
          </SectionCard>
        </Stack>

        <Stack spacing={2}>
          <SectionCard
            eyebrow="Range summary"
            title="See earnings by time limit"
            description="Pick any start and end time to see what came in from refills, what was manually added as misc income, and the combined total."
            action={
              <Button
                variant="outlined"
                startIcon={<QueryStatsRoundedIcon />}
                onClick={handleRangeRefresh}
                disabled={isLoadingSummary}
              >
                {isLoadingSummary ? "Loading..." : "Refresh"}
              </Button>
            }
          >
            <Stack spacing={2}>
              {feedback.summary.text && (
                <Alert severity={feedback.summary.type || "info"}>{feedback.summary.text}</Alert>
              )}
              <TextField
                label="From"
                type="datetime-local"
                value={rangeForm.from}
                onChange={(event) =>
                  setRangeForm((current) => ({ ...current, from: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="To"
                type="datetime-local"
                value={rangeForm.to}
                onChange={(event) =>
                  setRangeForm((current) => ({ ...current, to: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
              <Box className="status-row">
                <Chip icon={<TodayRoundedIcon />} label="Today by default" variant="outlined" />
                <Chip label="Supports custom date and time ranges" variant="outlined" />
              </Box>
            </Stack>
          </SectionCard>

          <SectionCard
            eyebrow="Manual income trail"
            title="Misc earnings in the selected range"
            description="A quick timeline of the manual income entries that feed into the misc earnings total."
          >
            {miscEntries.length ? (
              <Stack className="timeline">
                {miscEntries.map((entry) => (
                  <Box key={entry.miscEarningId} className="mini-card timeline-entry">
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      gap={1.5}
                    >
                      <Box>
                        <Typography variant="h6">{formatCurrency(entry.amount)}</Typography>
                        <Typography color="text.secondary">
                          {entry.note || "Misc earnings entry"}
                        </Typography>
                      </Box>
                      <Typography color="text.secondary">{formatDateTime(entry.date)}</Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : (
              <EmptyState
                title="No misc earnings in this range"
                description="Add a manual earnings entry or widen the time range to see more history."
              />
            )}
          </SectionCard>
        </Stack>
      </Box>
    </Stack>
  )
}

export default Earnings
