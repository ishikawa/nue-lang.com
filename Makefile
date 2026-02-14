.PHONY: check check-site check-examples build-site

check: check-site check-examples

check-site:
	cd site && npm run check

check-examples:
	cd site && npm run check:examples

build-site:
	cd site && npm run build
