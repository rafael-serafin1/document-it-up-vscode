#!/bin/make

all:
	python package.py "pack"

pub:
	python package.py "pub"

basic:
	vsce package