import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded"
import PaidRoundedIcon from "@mui/icons-material/PaidRounded"
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded"
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded"
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded"
import { Alert, Box, Button, Chip, Stack, Typography } from "@mui/material"
import { useNavigate } from "react-router-dom"
import EmptyState from "../components/EmptyState"
import SectionCard from "../components/SectionCard"
import { useAppData } from "../context/AppDataContext"
import { formatCurrency, formatNumber, getActiveItemCount } from "../utils/formatters"

function Dashboard() {
  const navigate = useNavigate()
  const { customers, customersState, inventory, inventoryState } = useAppData()

  const totalActiveItems = customers.reduce((sum, customer) => sum + getActiveItemCount(customer), 0)
  const totalDeposit = customers.reduce((sum, customer) => sum + Number(customer.depositBalance || 0), 0)
  const totalAvailable = inventory.reduce((sum, item) => sum + Number(item.availableStock || 0), 0)

  const focusCustomers = [...customers]
    .sort((left, right) => getActiveItemCount(right) - getActiveItemCount(left))
    .slice(0, 4)

  return (
    <Stack spacing={2.5}>
      {(customersState.showingCachedData || inventoryState.showingCachedData) && (
        <Alert severity="info" className="reveal">
          Showing saved data because the backend is temporarily unavailable.
        </Alert>
      )}

      <Box className="content-grid">
        <SectionCard
          eyebrow="Quick actions"
          title="Run Krishna RO smoothly"
          description="Keep the day moving with the main actions you use most often."
        >
          <Box className="button-cluster">
            <Button
              variant="contained"
              startIcon={<PersonAddAlt1RoundedIcon />}
              onClick={() => navigate("/customers")}
            >
              Add customer
            </Button>
            <Button
              variant="outlined"
              startIcon={<Inventory2RoundedIcon />}
              onClick={() => navigate("/inventory")}
            >
              Add inventory
            </Button>
            <Button
              variant="outlined"
              startIcon={<SwapHorizRoundedIcon />}
              onClick={() => navigate("/operations")}
            >
              Process ops
            </Button>
            <Button
              variant="text"
              startIcon={<ReceiptLongRoundedIcon />}
              onClick={() => navigate("/ledger")}
            >
              Open ledger
            </Button>
            <Button
              variant="text"
              startIcon={<PaidRoundedIcon />}
              onClick={() => navigate("/earnings")}
            >
              View earnings
            </Button>
          </Box>
        </SectionCard>

        <SectionCard
          eyebrow="Today's snapshot"
          title="Business summary"
          description="A simple read on customers, active stock, and running balance."
        >
          <Box className="list-grid">
            <Box className="mini-card">
              <Typography variant="h6">{formatNumber(customers.length)} customers</Typography>
              <Typography color="text.secondary">Registered with Krishna RO</Typography>
            </Box>
            <Box className="mini-card">
              <Typography variant="h6">{formatNumber(totalActiveItems)} active items</Typography>
              <Typography color="text.secondary">Currently out with customers</Typography>
            </Box>
            <Box className="mini-card">
              <Typography variant="h6">{formatNumber(totalAvailable)} stock ready</Typography>
              <Typography color="text.secondary">Available for the next delivery</Typography>
            </Box>
            <Box className="mini-card">
              <Typography variant="h6">{formatCurrency(totalDeposit)}</Typography>
              <Typography color="text.secondary">Current running customer balance</Typography>
            </Box>
          </Box>
        </SectionCard>
      </Box>

      <SectionCard
        eyebrow="Customer watch"
        title="Accounts to check first"
        description="These customers currently hold the most active items, so they are the quickest place to review balances and ledgers."
      >
        {focusCustomers.length ? (
          <Box className="list-grid">
            {focusCustomers.map((customer) => (
              <Box key={customer.customerId} className="mini-card">
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5}>
                  <Box>
                    <Typography variant="h6">{customer.name}</Typography>
                    <Typography color="text.secondary">
                      {customer.phone || "Phone not added"} | {customer.address || "Address not added"}
                    </Typography>
                  </Box>
                  <Box className="status-row">
                    <Chip label={`${formatNumber(customer.activeJars)} jars`} color="secondary" />
                    <Chip label={`${formatNumber(customer.activeCoolers)} coolers`} color="secondary" />
                    <Chip label={formatCurrency(customer.depositBalance)} variant="outlined" />
                  </Box>
                </Stack>
              </Box>
            ))}
          </Box>
        ) : (
          <EmptyState
            title="No customers yet"
            description="Create your first customer profile to unlock operations and ledger views."
            actionLabel="Create customer"
            onAction={() => navigate("/customers")}
          />
        )}
      </SectionCard>
    </Stack>
  )
}

export default Dashboard
