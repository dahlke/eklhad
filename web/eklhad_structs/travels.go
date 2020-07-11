package eklhad_structs

// Eklhad Location App Structs
type EklhadLocation struct {
	ID                  string  `json:"id"`
	City                string  `json:"city"`
	StateProvinceRegion string  `json:"stateprovinceregion"`
	Country             string  `json:"country"`
	Current             bool    `json:"current"`
	Lat                 float64 `json:"lat"`
	Lng                 float64 `json:"lng"`
}
