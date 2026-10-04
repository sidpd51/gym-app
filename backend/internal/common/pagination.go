package common

import (
	"net/http"
	"strconv"
)

const (
	defaultPage     = 1
	defaultPageSize = 20
	maxPageSize     = 100
)

// PageQuery captures the common query parameters used by paginated list
// endpoints. Services pass this through to repositories; the SQL offset is
// `(Page - 1) * PageSize`.
type PageQuery struct {
	Page     int    `json:"page"`
	PageSize int    `json:"pageSize"`
	Search   string `json:"search,omitempty"`
	Status   string `json:"status,omitempty"`
	FromDate string `json:"fromDate,omitempty"`
	ToDate   string `json:"toDate,omitempty"`
}

func (q PageQuery) Offset() int { return (q.Page - 1) * q.PageSize }
func (q PageQuery) Limit() int  { return q.PageSize }

// PageMeta is the metadata block returned alongside paginated results.
type PageMeta struct {
	Page       int   `json:"page"`
	PageSize   int   `json:"pageSize"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"totalPages"`
}

// PageResponse is the generic wrapper over a paginated result set. Matches
// the response shape documented in 08-cross-cutting-concerns.md.
type PageResponse[T any] struct {
	Data []T      `json:"data"`
	Meta PageMeta `json:"meta"`
}

// NewPage builds a PageResponse from a fetched slice and a total count.
func NewPage[T any](data []T, page, pageSize int, total int64) PageResponse[T] {
	if data == nil {
		data = []T{}
	}
	totalPages := 0
	if pageSize > 0 {
		totalPages = int((total + int64(pageSize) - 1) / int64(pageSize))
	}
	return PageResponse[T]{
		Data: data,
		Meta: PageMeta{Page: page, PageSize: pageSize, Total: total, TotalPages: totalPages},
	}
}

// ParsePageQuery reads page/pageSize/search/status/fromDate/toDate from the
// request's URL query. Page defaults to 1; pageSize defaults to 20 and is
// clamped to [1, 100].
func ParsePageQuery(r *http.Request) PageQuery {
	q := r.URL.Query()
	page := atoiOr(q.Get("page"), defaultPage)
	if page < 1 {
		page = 1
	}
	size := atoiOr(q.Get("pageSize"), defaultPageSize)
	switch {
	case size < 1:
		size = 1
	case size > maxPageSize:
		size = maxPageSize
	}
	return PageQuery{
		Page:     page,
		PageSize: size,
		Search:   q.Get("search"),
		Status:   q.Get("status"),
		FromDate: q.Get("fromDate"),
		ToDate:   q.Get("toDate"),
	}
}

func atoiOr(s string, def int) int {
	if s == "" {
		return def
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return n
}
