package eklstructs

/* IG API User Timeline Structs */
type IGAPITimeline struct {
	Data IGAPITimelineData `json:"data"`
}

type IGAPITimelineData struct {
	User IGAPITimelineUser `json:"user"`
}

type IGAPITimelineUser struct {
	Media IGAPITimelineMedia `json:"edge_owner_to_timeline_media"`
}

type IGAPITimelineMedia struct {
	Count    int                        `json:"count"`
	Edges    []IGAPITimelineMediaEdge   `json:"edges"`
	PageInfo IGAPITimelineMediaPageInfo `json:"page_info"`
}

type IGAPITimelineMediaPageInfo struct {
	HasNextPage bool   `json:"has_next_page"`
	EndCursor   string `json:"end_cursor"`
}

type IGAPITimelineMediaEdge struct {
	Node IGAPITimelineMediaEdgeNode `json:"node"`
}

type IGAPITimelineMediaEdgeNode struct {
	Shortcode string `json:"shortcode"`
}

/* IGAPI User Metadata Structs */
type IGAPIUserMetadata struct {
	GraphQL IGAPIUserGraphQL `json:"graphql"`
}

type IGAPIUserGraphQL struct {
	User IGAPIUser `json:"user"`
}

type IGAPIUser struct {
	ID string `json:"id"`
}

/* IGAPI Media Structs */
type IGAPIMediaDetail struct {
	GraphQL IGAPIMediaGraphQL `json:"graphql"`
}

type IGAPIMediaGraphQL struct {
	Media IGAPIMediaShortcode `json:"shortcode_media"`
}

type IGAPIMediaShortcode struct {
	ID             string                          `json:"id"`
	Shortcode      string                          `json:"shortcode"`
	DisplayURL     string                          `json:"display_url"`
	Timestamp      int                             `json:"taken_at_timestamp"`
	Location       IGAPIMediaShortcodeLocation     `json:"location"`
	EdgesToCaption IGAPIMediaCaptionEdgesToCaption `json:"edge_media_to_caption"`
}

type IGAPIMediaShortcodeLocation struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type IGAPIMediaCaptionEdgesToCaption struct {
	Edges []IGAPIMediaCaptionEdges `json:"edges"`
}

type IGAPIMediaCaptionEdges struct {
	Node IGAPIMediaCaptionEdgeNode `json:"node"`
}

type IGAPIMediaCaptionEdgeNode struct {
	Text string `json:"text"`
}
