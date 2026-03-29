import WaterDropRoundedIcon from "@mui/icons-material/WaterDropRounded"
import { Box, Chip, Stack, Typography } from "@mui/material"
import { useLocation } from "react-router-dom"
import { useAppData } from "../context/AppDataContext"
import { formatNumber } from "../utils/formatters"
import BottomNav from "./BottomNav"

const routeMeta = [
  {
    matches: (pathname) => pathname === "/",
    title: "Krishna RO operations",
    description:
      "Run the day from one clean desk for customers, stock, refills, returns, and earnings."
  },
  {
    matches: (pathname) => pathname.startsWith("/customers"),
    title: "Customers",
    description: "Add families, keep balances clear, and open each account quickly when needed."
  },
  {
    matches: (pathname) => pathname.startsWith("/inventory"),
    title: "Stock",
    description: "Check available jars and coolers, then top up stock when needed."
  },
  {
    matches: (pathname) => pathname.startsWith("/operations") || pathname.startsWith("/borrow"),
    title: "Daily operations",
    description: "Record borrows, refills, and returns without losing track of balance or stock."
  },
  {
    matches: (pathname) => pathname.startsWith("/earnings"),
    title: "Earnings and settlement",
    description:
      "Check refill income, add misc collections, and settle customer dues in one place."
  },
  {
    matches: (pathname) => pathname.startsWith("/ledger"),
    title: "Ledger",
    description: "See each customer's full activity clearly, from borrow to refill to settlement."
  }
]

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "long"
})

function AppShell({ children }) {
  const location = useLocation()
  const { customers, inventory } = useAppData()

  const meta = routeMeta.find((item) => item.matches(location.pathname)) || routeMeta[0]
  const availableUnits = inventory.reduce((sum, item) => sum + Number(item.availableStock || 0), 0)

  return (
    <div className="app-shell">
      <div className="shell-inner">
        <div className="hero-banner reveal">
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={3}>
            <Box sx={{ maxWidth: 620, position: "relative", zIndex: 1 }}>
              <Chip
                icon={<WaterDropRoundedIcon />}
                label="Krishna RO"
                sx={{
                  bgcolor: "rgba(255, 250, 244, 0.16)",
                  color: "inherit",
                  borderRadius: 999,
                  border: "1px solid rgba(255, 250, 244, 0.18)"
                }}
              />
              <Typography variant="h3" sx={{ mt: 2, fontSize: { xs: "2rem", md: "3rem" } }}>
                {meta.title}
              </Typography>
              <Typography sx={{ mt: 1.25, color: "rgba(255, 250, 244, 0.82)", maxWidth: 560 }}>
                {meta.description}
              </Typography>
              <Box className="status-row" sx={{ mt: 2.5 }}>
                <Chip
                  label={`${formatNumber(customers.length)} customers`}
                  sx={{ bgcolor: "rgba(255, 250, 244, 0.12)", color: "inherit" }}
                />
                <Chip
                  label={`${formatNumber(availableUnits)} ready in stock`}
                  sx={{ bgcolor: "rgba(255, 250, 244, 0.12)", color: "inherit" }}
                />
              </Box>
            </Box>

            <Box sx={{ minWidth: { md: 260 }, position: "relative", zIndex: 1 }}>
              <Typography variant="overline" sx={{ color: "rgba(255, 250, 244, 0.72)" }}>
                Krishna RO
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.75 }}>
                {dateFormatter.format(new Date())}
              </Typography>
              <Typography sx={{ mt: 1.25, color: "rgba(255, 250, 244, 0.78)" }}>
                Simple mobile-first control for daily water delivery work.
              </Typography>
            </Box>
          </Stack>
        </div>

        <div className="page-stack">{children}</div>
      </div>

      <BottomNav />
    </div>
  )
}

export default AppShell
