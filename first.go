// The most surprising thing I have found about Go is that you can return multiple values in functions, and I think it was interesting to see structs and receivers as I am not used to them.
// I also think pointers are cool.
package main

import (
	"net/http"
)

type person struct {
	name string
	age  int
}

func newPerson(name string) *person {
	p := person{}
	p.name = name
	p.age = 42
	return &p
}

func main() {
	mux := http.NewServeMux()

}
