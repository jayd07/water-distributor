import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import { Autocomplete, InputAdornment, TextField, Typography } from "@mui/material"

function CustomerSearch({
  customers,
  selectedCustomerId,
  onSelect,
  label = "Search customer",
  placeholder = "Search by name, phone, or address"
}) {
  const selectedCustomer =
    customers.find((customer) => String(customer.customerId) === String(selectedCustomerId)) || null

  return (
    <Autocomplete
      fullWidth
      options={customers}
      value={selectedCustomer}
      onChange={(_, nextCustomer) => onSelect(nextCustomer ? String(nextCustomer.customerId) : "")}
      getOptionLabel={(option) => option?.name || ""}
      isOptionEqualToValue={(option, value) => option.customerId === value.customerId}
      filterOptions={(options, state) => {
        const query = state.inputValue.trim().toLowerCase()

        if (!query) {
          return options
        }

        return options.filter((customer) =>
          [customer.name, customer.phone, customer.address]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query))
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            )
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.customerId}>
          <div>
            <Typography fontWeight={700}>{option.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {[option.phone, option.address].filter(Boolean).join(" | ") || "No phone or address"}
            </Typography>
          </div>
        </li>
      )}
      noOptionsText="No matching customer found"
    />
  )
}

export default CustomerSearch
