package main

import (
	"errors"
	"fmt"
)

// Server listens on a TCP port.
type Server struct {
	Port int
	Name string
}

var ErrClosed = errors.New("server closed")

func (s *Server) Start(retries int) error {
	for i := 0; i < retries; i++ {
		fmt.Printf("starting %s on :%d\n", s.Name, s.Port)
	}
	return ErrClosed
}
