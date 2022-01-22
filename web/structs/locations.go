package structs

// EklhadLocation is the clean structure to be used to give location data back to the frontend
type EklhadLocation struct {
	ID                  string  `json:"id"`
	City                string  `json:"city"`
	StateProvinceRegion string  `json:"stateprovinceregion"`
	Country             string  `json:"country"`
	Current             bool    `json:"current"`
	Layover             bool    `json:"layover"`
	Lat                 float64 `json:"lat"`
	Lng                 float64 `json:"lng"`
}
