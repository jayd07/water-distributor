import { Paper, Typography } from "@mui/material"

const toneMap = {
  ocean: {
    background: "linear-gradient(145deg, #0f5fa8 0%, #123f6a 100%)",
    color: "#fffaf4"
  },
  sun: {
    background: "linear-gradient(145deg, #cf6b2c 0%, #a14d18 100%)",
    color: "#fffaf4"
  },
  sage: {
    background: "linear-gradient(145deg, #2f7d5c 0%, #255a45 100%)",
    color: "#fffaf4"
  },
  night: {
    background: "linear-gradient(145deg, #21394d 0%, #132433 100%)",
    color: "#fffaf4"
  }
}

function MetricCard({ label, value, note, tone = "ocean" }) {
  const style = toneMap[tone] || toneMap.ocean

  return (
    <Paper className="metric-card reveal" elevation={0} sx={style}>
      <Typography className="metric-label">{label}</Typography>
      <Typography className="metric-value">{value}</Typography>
      <Typography className="metric-note">{note}</Typography>
    </Paper>
  )
}

export default MetricCard
