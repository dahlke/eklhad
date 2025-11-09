package workers

import (
	"testing"
)

func TestIsCellEmptyOrNotConfirmed(t *testing.T) {
	tests := []struct {
		name     string
		cellValue interface{}
		expected bool
	}{
		{
			name:      "nil value",
			cellValue: nil,
			expected:  true,
		},
		{
			name:      "empty string",
			cellValue: "",
			expected:  true,
		},
		{
			name:      "space string",
			cellValue: " ",
			expected:  true,
		},
		{
			name:      "FALSE string",
			cellValue: "FALSE",
			expected:  true,
		},
		{
			name:      "TRUE string",
			cellValue: "TRUE",
			expected:  false,
		},
		{
			name:      "non-empty string",
			cellValue: "some value",
			expected:  false,
		},
		{
			name:      "number",
			cellValue: 123,
			expected:  false,
		},
		{
			name:      "boolean true",
			cellValue: true,
			expected:  false,
		},
		{
			name:      "boolean false",
			cellValue: false,
			expected:  false, // Note: boolean false is not the same as "FALSE" string
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isCellEmptyOrNotConfirmed(tt.cellValue)
			if result != tt.expected {
				t.Errorf("isCellEmptyOrNotConfirmed(%v) = %v, expected %v", tt.cellValue, result, tt.expected)
			}
		})
	}
}

func TestGetStringValue(t *testing.T) {
	tests := []struct {
		name     string
		row      []interface{}
		index    int
		expected string
	}{
		{
			name:     "valid string at index",
			row:      []interface{}{"value1", "value2", "value3"},
			index:    1,
			expected: "value2",
		},
		{
			name:     "index out of bounds",
			row:      []interface{}{"value1", "value2"},
			index:    5,
			expected: "",
		},
		{
			name:     "nil value at index",
			row:      []interface{}{"value1", nil, "value3"},
			index:    1,
			expected: "",
		},
		{
			name:     "number converted to string",
			row:      []interface{}{123, "value2"},
			index:    0,
			expected: "123",
		},
		{
			name:     "boolean converted to string",
			row:      []interface{}{true, "value2"},
			index:    0,
			expected: "true",
		},
		{
			name:     "empty row",
			row:      []interface{}{},
			index:    0,
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := getStringValue(tt.row, tt.index)
			if result != tt.expected {
				t.Errorf("getStringValue(%v, %d) = %v, expected %v", tt.row, tt.index, result, tt.expected)
			}
		})
	}
}

